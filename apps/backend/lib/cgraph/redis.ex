defmodule CGraph.Redis do
  @moduledoc """
  Redis client wrapper with connection pooling, circuit breaker, and resilience.

  ## Submodules

  - `CGraph.Redis.KeyValue`  – GET, SET, DEL, EXISTS, EXPIRE, TTL, counters
  - `CGraph.Redis.Hash`      – HGET, HSET, HGETALL, HDEL
  - `CGraph.Redis.List`      – LPUSH, RPUSH, LRANGE, LLEN
  - `CGraph.Redis.Set`       – SADD, SMEMBERS, SISMEMBER, SREM
  - `CGraph.Redis.SortedSet` – ZADD, ZRANGE, ZRANK, ZSCORE, ZREVRANGE, etc.
  - `CGraph.Redis.Scan`      – SCAN-based key iteration and batch delete
  - `CGraph.Redis.Helpers`   – Shared value encoding utilities

  All submodule functions are re-exported via `defdelegate`.

  ## Configuration

      config :cgraph, CGraph.Redis,
        host: "localhost", port: 6379, password: nil,
        database: 0, pool_size: 10, ssl: false

  ## Telemetry

  - `[:cgraph, :redis, :command]` – Command execution
  - `[:cgraph, :redis, :pipeline]` – Pipeline execution
  - `[:cgraph, :redis, :error]` – Command errors
  """

  use GenServer
  require Logger

  # Pool name for future NimblePool integration
  # @pool_name :redis_pool
  @default_timeout 5000
  @fuse_name :redis_circuit_breaker
  @fuse_threshold 5
  @fuse_reset_timeout 30_000

  # ---------------------------------------------------------------------------
  # Public API – Core
  # ---------------------------------------------------------------------------

  @doc """
  Start the Redis client supervisor.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Execute a Redis command.

  ## Examples

      {:ok, "OK"} = Redis.command(["SET", "key", "value"])
      {:ok, nil} = Redis.command(["GET", "nonexistent"])
      {:ok, 1} = Redis.command(["DEL", "key"])
  """
  @spec command([String.t()], keyword()) :: {:ok, term()} | {:error, term()}
  def command(args, opts \\ []) when is_list(args) do
    timeout = Keyword.get(opts, :timeout, @default_timeout)

    start_time = System.monotonic_time(:microsecond)

    result = case :fuse.ask(@fuse_name, :sync) do
      :ok ->
        try do
          case GenServer.call(__MODULE__, {:command, args}, timeout) do
            {:ok, _} = success -> success
            {:error, _} = error ->
              :fuse.melt(@fuse_name)
              error
          end
        catch
          :exit, {:timeout, _} ->
            :fuse.melt(@fuse_name)
            {:error, :timeout}
          :exit, {:noproc, _} ->
            :fuse.melt(@fuse_name)
            {:error, :redis_not_running}
        end

      :blown ->
        Logger.warning("Redis circuit breaker open, rejecting command",
          command: List.first(args)
        )
        {:error, :circuit_open}

      {:error, :not_found} ->
        # Fuse not installed yet, execute without protection
        try do
          GenServer.call(__MODULE__, {:command, args}, timeout)
        catch
          :exit, {:timeout, _} -> {:error, :timeout}
          :exit, {:noproc, _} -> {:error, :redis_not_running}
        end
    end

    emit_command_telemetry(args, result, start_time)

    result
  end

  @doc """
  Execute a Redis command, raising on error.
  """
  @spec command!([String.t()], keyword()) :: term()
  def command!(args, opts \\ []) do
    case command(args, opts) do
      {:ok, result} -> result
      {:error, error} -> raise "Redis error: #{inspect(error)}"
    end
  end

  @doc """
  Execute multiple commands in a pipeline.

  More efficient than individual commands for bulk operations.

  ## Example

      results = Redis.pipeline([
        ["SET", "key1", "value1"],
        ["SET", "key2", "value2"],
        ["GET", "key1"],
        ["GET", "key2"]
      ])
      # => [{:ok, "OK"}, {:ok, "OK"}, {:ok, "value1"}, {:ok, "value2"}]
  """
  @spec pipeline([[String.t()]], keyword()) :: {:ok, [term()]} | {:error, term()}
  def pipeline(commands, opts \\ []) when is_list(commands) do
    timeout = Keyword.get(opts, :timeout, @default_timeout * length(commands))

    start_time = System.monotonic_time(:microsecond)

    result = try do
      GenServer.call(__MODULE__, {:pipeline, commands}, timeout)
    catch
      :exit, {:timeout, _} ->
        {:error, :timeout}
      :exit, {:noproc, _} ->
        {:error, :redis_not_running}
      :exit, _ ->
        {:error, :redis_unavailable}
    end

    emit_pipeline_telemetry(commands, result, start_time)

    result
  end

  @doc """
  Execute a transaction (MULTI/EXEC).

  All commands are executed atomically.
  """
  @spec transaction([[String.t()]], keyword()) :: {:ok, term()} | {:error, term()}
  def transaction(commands, opts \\ []) when is_list(commands) do
    full_pipeline = [["MULTI"]] ++ commands ++ [["EXEC"]]

    case pipeline(full_pipeline, opts) do
      {:ok, results} ->
        # Last result is the EXEC result containing actual results
        exec_result = List.last(results)
        {:ok, exec_result}
      error -> error
    end
  end

  @doc """
  Publish a message to a channel.
  """
  @spec publish(String.t(), term()) :: {:ok, term()} | {:error, term()}
  def publish(channel, message) do
    command(["PUBLISH", channel, encode_message(message)])
  end

  @doc """
  Get Redis server info.
  """
  @spec info(String.t() | nil) :: {:ok, map()} | {:error, term()}
  def info(section \\ nil) do
    cmd = if section, do: ["INFO", section], else: ["INFO"]

    case command(cmd) do
      {:ok, info} when is_binary(info) -> {:ok, parse_info(info)}
      error -> error
    end
  end

  @doc """
  Check if Redis is available.
  """
  @spec ping() :: :ok | :error
  def ping do
    case command(["PING"]) do
      {:ok, "PONG"} -> :ok
      _ -> :error
    end
  end

  @doc """
  Get pool statistics.
  """
  @spec pool_stats() :: map()
  def pool_stats do
    GenServer.call(__MODULE__, :pool_stats)
  end

  @doc """
  Get the current circuit breaker status.

  Returns `:ok` (closed), `:blown` (open), or `{:error, :not_found}`.
  """
  @spec circuit_status() :: :ok | :blown | {:error, :not_found}
  def circuit_status do
    :fuse.ask(@fuse_name, :sync)
  end

  @doc """
  Reset the Redis circuit breaker.

  Use this after a known recovery to immediately restore Redis access
  without waiting for the automatic reset timeout.
  """
  @spec reset_circuit() :: :ok
  def reset_circuit do
    :fuse.reset(@fuse_name)
  end

  # ---------------------------------------------------------------------------
  # Delegated – Key-Value
  # ---------------------------------------------------------------------------

  defdelegate get(key), to: CGraph.Redis.KeyValue
  defdelegate set(key, value), to: CGraph.Redis.KeyValue
  defdelegate set(key, value, opts), to: CGraph.Redis.KeyValue
  defdelegate del(key_or_keys), to: CGraph.Redis.KeyValue
  defdelegate exists?(key), to: CGraph.Redis.KeyValue
  defdelegate expire(key, seconds), to: CGraph.Redis.KeyValue
  defdelegate ttl(key), to: CGraph.Redis.KeyValue
  defdelegate incr(key), to: CGraph.Redis.KeyValue
  defdelegate incrby(key, amount), to: CGraph.Redis.KeyValue
  defdelegate decr(key), to: CGraph.Redis.KeyValue

  # ---------------------------------------------------------------------------
  # Delegated – Hash
  # ---------------------------------------------------------------------------

  defdelegate hget(key, field), to: CGraph.Redis.Hash
  defdelegate hset(key, field, value), to: CGraph.Redis.Hash
  defdelegate hgetall(key), to: CGraph.Redis.Hash
  defdelegate hdel(key, field_or_fields), to: CGraph.Redis.Hash

  # ---------------------------------------------------------------------------
  # Delegated – List
  # ---------------------------------------------------------------------------

  defdelegate lpush(key, value_or_values), to: CGraph.Redis.List
  defdelegate rpush(key, value_or_values), to: CGraph.Redis.List
  defdelegate lrange(key, start, stop), to: CGraph.Redis.List
  defdelegate llen(key), to: CGraph.Redis.List

  # ---------------------------------------------------------------------------
  # Delegated – Set
  # ---------------------------------------------------------------------------

  defdelegate sadd(key, member_or_members), to: CGraph.Redis.Set
  defdelegate smembers(key), to: CGraph.Redis.Set
  defdelegate sismember?(key, member), to: CGraph.Redis.Set
  defdelegate srem(key, member_or_members), to: CGraph.Redis.Set

  # ---------------------------------------------------------------------------
  # Delegated – Sorted Set
  # ---------------------------------------------------------------------------

  defdelegate zadd(key, score_members), to: CGraph.Redis.SortedSet
  defdelegate zadd(key, score, member), to: CGraph.Redis.SortedSet
  defdelegate zrange(key, start, stop), to: CGraph.Redis.SortedSet
  defdelegate zrange(key, start, stop, opts), to: CGraph.Redis.SortedSet
  defdelegate zrank(key, member), to: CGraph.Redis.SortedSet
  defdelegate zscore(key, member), to: CGraph.Redis.SortedSet
  defdelegate zrevrange(key, start, stop), to: CGraph.Redis.SortedSet
  defdelegate zrevrange(key, start, stop, opts), to: CGraph.Redis.SortedSet
  defdelegate zrevrank(key, member), to: CGraph.Redis.SortedSet
  defdelegate zrem(key, member_or_members), to: CGraph.Redis.SortedSet
  defdelegate zcard(key), to: CGraph.Redis.SortedSet
  defdelegate zincrby(key, increment, member), to: CGraph.Redis.SortedSet

  # ---------------------------------------------------------------------------
  # Delegated – Scan
  # ---------------------------------------------------------------------------

  defdelegate scan_keys(pattern), to: CGraph.Redis.Scan
  defdelegate scan_keys(pattern, opts), to: CGraph.Redis.Scan
  defdelegate scan_and_delete(pattern), to: CGraph.Redis.Scan
  defdelegate scan_and_delete(pattern, opts), to: CGraph.Redis.Scan
  defdelegate scan_and_process(pattern, process_fn), to: CGraph.Redis.Scan
  defdelegate scan_and_process(pattern, process_fn, opts), to: CGraph.Redis.Scan
  defdelegate pipeline_delete(keys), to: CGraph.Redis.Scan
  defdelegate pipeline_delete(keys, batch_size), to: CGraph.Redis.Scan

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @spec init(keyword()) :: {:ok, map()}
  @impl true
  def init(opts) do
    config = get_config(opts)

    # Install Fuse circuit breaker for Redis
    :fuse.install(@fuse_name, {
      {:standard, @fuse_threshold, @fuse_reset_timeout},
      {:reset, @fuse_reset_timeout}
    })
    Logger.info("Redis circuit breaker installed",
      threshold: @fuse_threshold,
      reset_timeout_ms: @fuse_reset_timeout
    )

    state = %{
      config: config,
      connections: [],
      pool_size: config[:pool_size],
      connection_index: 0
    }

    # Start connection pool
    case start_pool(config) do
      {:ok, connections} ->
        Logger.info("redis_pool_started_with_connections", connections_count: inspect(length(connections)))
        {:ok, %{state | connections: connections}}
      {:error, reason} ->
        Logger.error("failed_to_start_redis_pool", reason: inspect(reason))
        {:ok, state}
    end
  end

  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:command, args}, _from, state) do
    result = with_connection(state, fn conn ->
      Redix.command(conn, args)
    end)

    {:reply, result, state}
  end

  @impl true
  def handle_call({:pipeline, commands}, _from, state) do
    result = with_connection(state, fn conn ->
      Redix.pipeline(conn, commands)
    end)

    {:reply, result, state}
  end

  @impl true
  def handle_call(:pool_stats, _from, state) do
    stats = %{
      pool_size: state.pool_size,
      active_connections: length(state.connections),
      connection_index: state.connection_index
    }

    {:reply, stats, state}
  end

  # ---------------------------------------------------------------------------
  # Internal Functions
  # ---------------------------------------------------------------------------

  defp get_config(opts) do
    app_config = Application.get_env(:cgraph, CGraph.Redis, [])

    %{
      host: Keyword.get(opts, :host, Keyword.get(app_config, :host, "localhost")),
      port: Keyword.get(opts, :port, Keyword.get(app_config, :port, 6379)),
      password: Keyword.get(opts, :password, Keyword.get(app_config, :password)),
      database: Keyword.get(opts, :database, Keyword.get(app_config, :database, 0)),
      pool_size: Keyword.get(opts, :pool_size, Keyword.get(app_config, :pool_size, 5)),
      ssl: Keyword.get(opts, :ssl, Keyword.get(app_config, :ssl, false))
    }
  end

  defp start_pool(config) do
    opts = [
      host: config[:host],
      port: config[:port],
      database: config[:database]
    ]

    opts = if config[:password], do: Keyword.put(opts, :password, config[:password]), else: opts
    opts = if config[:ssl], do: Keyword.put(opts, :ssl, true), else: opts

    connections = for _i <- 1..config[:pool_size] do
      case Redix.start_link(opts) do
        {:ok, conn} -> conn
        {:error, reason} -> {:error, reason}
      end
    end

    errors = Enum.filter(connections, &match?({:error, _}, &1))

    if errors == [] do
      {:ok, connections}
    else
      {:error, :connection_failed}
    end
  end

  defp with_connection(%{connections: []}, _fun) do
    {:error, :no_connections}
  end

  defp with_connection(state, fun) do
    # Simple round-robin selection
    index = rem(state.connection_index, length(state.connections))
    conn = Enum.at(state.connections, index)

    try do
      fun.(conn)
    rescue
      e -> {:error, e}
    end
  end

  # ---------------------------------------------------------------------------
  # Encoding/Decoding (used only by this module)
  # ---------------------------------------------------------------------------

  defp encode_message(message) when is_binary(message), do: message
  defp encode_message(message), do: Jason.encode!(message)

  defp parse_info(info) do
    info
    |> String.split("\r\n")
    |> Enum.reject(&(String.starts_with?(&1, "#") or &1 == ""))
    |> Enum.map(fn line ->
      case String.split(line, ":", parts: 2) do
        [key, value] -> {key, value}
        _ -> nil
      end
    end)
    |> Enum.reject(&is_nil/1)
    |> Map.new()
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_command_telemetry(args, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    [command | _] = args

    status = case result do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end

    :telemetry.execute(
      [:cgraph, :redis, :command],
      %{duration: duration},
      %{command: command, status: status}
    )

    if status == :error do
      :telemetry.execute(
        [:cgraph, :redis, :error],
        %{count: 1},
        %{command: command, error: elem(result, 1)}
      )
    end
  end

  defp emit_pipeline_telemetry(commands, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time

    status = case result do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end

    :telemetry.execute(
      [:cgraph, :redis, :pipeline],
      %{duration: duration, command_count: length(commands)},
      %{status: status}
    )
  end
end
