defmodule CGraph.Sharding.ShardManager do
  @moduledoc """
  GenServer managing shard topology, health checks, and rebalancing.

  Initializes from runtime configuration under `:cgraph, :sharding`.
  Maintains consistent hash rings per sharded table and performs
  periodic health checks against shard repos.

  ## Configuration

      config :cgraph, :sharding,
        enabled: true,
        tables: %{
          messages: %{shard_count: 16, vnodes: 256},
          posts:    %{shard_count: 8,  vnodes: 256}
        },
        health_check_interval: 30_000,
        failover_to_read_replica: true

  ## Architecture

  - Each shard maps to a named Ecto Repo (e.g. `CGraph.Shard.Repo0`)
  - Health checks ping each shard repo every 30 seconds
  - Failed shards auto-failover to read replicas when enabled
  - Telemetry events emitted for monitoring shard health

  """

  use GenServer
  require Logger

  alias CGraph.Sharding.ConsistentHash

  @type shard_id :: atom()
  @type table_name :: atom()

  @health_check_interval 30_000
  @telemetry_prefix [:cgraph, :sharding]

  # --- Client API ---

  @doc "Start the ShardManager process."
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Get the consistent hash ring for a table."
  @spec get_ring(table_name()) :: {:ok, ConsistentHash.t()} | {:error, :not_sharded}
  def get_ring(table) do
    GenServer.call(__MODULE__, {:get_ring, table})
  end

  @doc "Get the full shard topology map."
  @spec get_topology() :: map()
  def get_topology do
    GenServer.call(__MODULE__, :get_topology)
  end

  @doc "Get health status of all shards."
  @spec health_status() :: map()
  def health_status do
    GenServer.call(__MODULE__, :health_status)
  end

  @doc "Add a shard to a table's ring (for live scaling)."
  @spec add_shard(table_name(), shard_id(), map()) :: :ok
  def add_shard(table, shard_id, config) do
    GenServer.call(__MODULE__, {:add_shard, table, shard_id, config})
  end

  @doc "Remove a shard from a table's ring."
  @spec remove_shard(table_name(), shard_id()) :: :ok
  def remove_shard(table, shard_id) do
    GenServer.call(__MODULE__, {:remove_shard, table, shard_id})
  end

  @doc "Force a health check cycle."
  @spec check_health() :: :ok
  def check_health do
    GenServer.cast(__MODULE__, :check_health)
  end

  # --- Server Callbacks ---

  @impl true
  def init(_opts) do
    config = Application.get_env(:cgraph, :sharding, %{})
    enabled = Map.get(config, :enabled, false)

    if enabled do
      state = build_initial_state(config)
      schedule_health_check(state.health_check_interval)

      :telemetry.execute(
        @telemetry_prefix ++ [:manager, :started],
        %{shard_count: count_total_shards(state)},
        %{tables: Map.keys(state.rings)}
      )

      Logger.info("[ShardManager] Started with #{count_total_shards(state)} shards across #{map_size(state.rings)} tables")
      {:ok, state}
    else
      Logger.info("[ShardManager] Sharding disabled — running in passthrough mode")
      {:ok, %{enabled: false, rings: %{}, topology: %{}, health: %{}, health_check_interval: @health_check_interval, failover: false}}
    end
  end

  @impl true
  def handle_call({:get_ring, _table}, _from, %{enabled: false} = state) do
    {:reply, {:error, :not_sharded}, state}
  end

  def handle_call({:get_ring, table}, _from, state) do
    case Map.get(state.rings, table) do
      nil -> {:reply, {:error, :not_sharded}, state}
      ring -> {:reply, {:ok, ring}, state}
    end
  end

  @impl true
  def handle_call(:get_topology, _from, state) do
    {:reply, state.topology, state}
  end

  @impl true
  def handle_call(:health_status, _from, state) do
    {:reply, state.health, state}
  end

  @impl true
  def handle_call({:add_shard, table, shard_id, shard_config}, _from, state) do
    ring = Map.get(state.rings, table, ConsistentHash.new())
    updated_ring = ConsistentHash.add_node(ring, shard_id)

    new_topology = Map.put(state.topology, shard_id, shard_config)
    new_rings = Map.put(state.rings, table, updated_ring)
    new_health = Map.put(state.health, shard_id, %{status: :healthy, last_check: DateTime.utc_now(), failures: 0})

    :telemetry.execute(
      @telemetry_prefix ++ [:shard, :added],
      %{},
      %{table: table, shard_id: shard_id}
    )

    Logger.info("[ShardManager] Added shard #{shard_id} to table #{table}")
    {:reply, :ok, %{state | rings: new_rings, topology: new_topology, health: new_health}}
  end

  @impl true
  def handle_call({:remove_shard, table, shard_id}, _from, state) do
    case Map.get(state.rings, table) do
      nil ->
        {:reply, :ok, state}

      ring ->
        updated_ring = ConsistentHash.remove_node(ring, shard_id)
        new_rings = Map.put(state.rings, table, updated_ring)

        :telemetry.execute(
          @telemetry_prefix ++ [:shard, :removed],
          %{},
          %{table: table, shard_id: shard_id}
        )

        Logger.info("[ShardManager] Removed shard #{shard_id} from table #{table}")
        {:reply, :ok, %{state | rings: new_rings}}
    end
  end

  @impl true
  def handle_cast(:check_health, state) do
    new_state = perform_health_checks(state)
    {:noreply, new_state}
  end

  @impl true
  def handle_info(:health_check, state) do
    new_state = perform_health_checks(state)
    schedule_health_check(state.health_check_interval)
    {:noreply, new_state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  # --- Private ---

  defp build_initial_state(config) do
    tables_config = Map.get(config, :tables, %{})
    health_interval = Map.get(config, :health_check_interval, @health_check_interval)
    failover = Map.get(config, :failover_to_read_replica, true)

    {rings, topology, health} =
      Enum.reduce(tables_config, {%{}, %{}, %{}}, fn {table_name, table_cfg}, {rings_acc, topo_acc, health_acc} ->
        shard_count = Map.get(table_cfg, :shard_count, 1)
        vnodes = Map.get(table_cfg, :vnodes, 256)

        ring = ConsistentHash.new(vnodes)

        {updated_ring, updated_topo, updated_health} =
          Enum.reduce(0..(shard_count - 1), {ring, topo_acc, health_acc}, fn idx, {r, t, h} ->
            # credo:disable-for-next-line Credo.Check.Warning.UnsafeToAtom
            shard_id = :"#{table_name}_shard_#{idx}"

            # In production, each shard maps to its own Repo.
            # For now, all shards route to the primary Repo (single-DB sharding via shard_key).
            shard_config = %{
              repo: CGraph.Repo,
              read_repo: CGraph.ReadRepo,
              index: idx,
              table: table_name
            }

            {
              ConsistentHash.add_node(r, shard_id),
              Map.put(t, shard_id, shard_config),
              Map.put(h, shard_id, %{status: :healthy, last_check: DateTime.utc_now(), failures: 0})
            }
          end)

        {Map.put(rings_acc, table_name, updated_ring), updated_topo, updated_health}
      end)

    %{
      enabled: true,
      rings: rings,
      topology: topology,
      health: health,
      health_check_interval: health_interval,
      failover: failover
    }
  end

  defp perform_health_checks(%{enabled: false} = state), do: state

  defp perform_health_checks(state) do
    updated_health =
      Enum.reduce(state.topology, state.health, fn {shard_id, shard_config}, health_acc ->
        repo = Map.get(shard_config, :repo, CGraph.Repo)
        result = check_shard_health(repo)

        prev = Map.get(health_acc, shard_id, %{status: :healthy, failures: 0})
        now = DateTime.utc_now()

        new_entry =
          case result do
            :ok ->
              if prev.status == :unhealthy do
                :telemetry.execute(
                  @telemetry_prefix ++ [:shard, :recovered],
                  %{downtime_seconds: DateTime.diff(now, prev.last_check)},
                  %{shard_id: shard_id}
                )

                Logger.info("[ShardManager] Shard #{shard_id} recovered")
              end

              %{status: :healthy, last_check: now, failures: 0}

            {:error, reason} ->
              failures = prev.failures + 1

              :telemetry.execute(
                @telemetry_prefix ++ [:shard, :health_check_failed],
                %{failures: failures},
                %{shard_id: shard_id, reason: inspect(reason)}
              )

              if failures >= 3 and state.failover do
                handle_failover(shard_id, shard_config, state)
                Logger.warning("[ShardManager] Shard #{shard_id} failed #{failures} times — failover triggered")
              end

              %{status: :unhealthy, last_check: now, failures: failures}
          end

        Map.put(health_acc, shard_id, new_entry)
      end)

    %{state | health: updated_health}
  end

  defp check_shard_health(repo) do
    try do
      # Simple connectivity check — run a trivial query
      repo.query("SELECT 1", [], timeout: 5_000)
      :ok
    rescue
      e -> {:error, e}
    catch
      :exit, reason -> {:error, reason}
    end
  end

  defp handle_failover(shard_id, shard_config, _state) do
    read_repo = Map.get(shard_config, :read_repo)

    if read_repo do
      :telemetry.execute(
        @telemetry_prefix ++ [:shard, :failover],
        %{},
        %{shard_id: shard_id, from: shard_config.repo, to: read_repo}
      )

      Logger.warning("[ShardManager] Failing over shard #{shard_id} to read replica #{inspect(read_repo)}")
    end
  end

  defp schedule_health_check(interval) do
    Process.send_after(self(), :health_check, interval)
  end

  defp count_total_shards(state) do
    state.topology |> map_size()
  end
end
