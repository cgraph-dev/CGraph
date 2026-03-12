defmodule CGraph.Sharding.ShardRouter do
  @moduledoc """
  Routes queries to the correct shard based on a table + partition key.

  Uses the consistent hash ring from `CGraph.Sharding.ConsistentHash`
  to determine which shard Repo a given key maps to. Supports read
  replica routing for read-heavy queries.

  ## Shard Configuration

  Each shard maps to a named Ecto Repo (e.g. `CGraph.Shard.Repo0`).
  The mapping is maintained by `CGraph.Sharding.ShardManager`.

  ## Usage

      # Route a message write to the correct shard
      {:ok, repo} = ShardRouter.route(:messages, conversation_id)
      repo.insert(changeset)

      # Route a read to a read replica
      {:ok, repo} = ShardRouter.route(:messages, conversation_id, :read)
      repo.all(query)

  """

  alias CGraph.Sharding.ConsistentHash

  @type table :: :messages | :posts | atom()
  @type route_mode :: :write | :read

  @doc """
  Route a query for `table` with `key` to the appropriate shard Repo.

  Returns `{:ok, repo_module}` on success or `{:error, reason}` on failure.

  ## Options
    - `mode` — `:write` (default) routes to primary shard repo,
               `:read` routes to read replica if available.
  """
  @spec route(table(), String.t(), route_mode()) :: {:ok, module()} | {:error, term()}
  def route(table, key, mode \\ :write) do
    composite_key = "#{table}:#{key}"

    with {:ok, ring} <- get_ring(table),
         {:ok, shard_id} <- ConsistentHash.get_node(ring, composite_key) do
      resolve_repo(shard_id, mode)
    end
  end

  @doc """
  Route with fallback — returns primary Repo when sharding is not
  configured for a table. Useful during migration from single-repo
  to sharded topology.
  """
  @spec route!(table(), String.t(), route_mode()) :: module()
  def route!(table, key, mode \\ :write) do
    case route(table, key, mode) do
      {:ok, repo} -> repo
      {:error, _} -> fallback_repo(mode)
    end
  end

  @doc """
  Return the shard key hash for a given table + key.

  Used by migration tools to determine which shard a row belongs to.
  Returns an integer in the range [0, shard_count).
  """
  @spec shard_key_hash(table(), String.t(), pos_integer()) :: non_neg_integer()
  def shard_key_hash(table, key, shard_count) do
    composite_key = "#{table}:#{key}"
    :erlang.phash2(composite_key, shard_count)
  end

  @doc """
  Get all shard repos for a table. Useful for scatter-gather queries.
  """
  @spec all_shards(table()) :: [module()]
  def all_shards(table) do
    case get_ring(table) do
      {:ok, ring} ->
        ring
        |> ConsistentHash.nodes()
        |> Enum.map(fn shard_id ->
          case resolve_repo(shard_id, :write) do
            {:ok, repo} -> repo
            _ -> nil
          end
        end)
        |> Enum.reject(&is_nil/1)
        |> Enum.uniq()

      {:error, _} ->
        [CGraph.Repo]
    end
  end

  # --- Private ---

  defp get_ring(table) do
    # Fetch the ring from the ShardManager process.
    # During startup or when sharding isn't configured, returns an error
    # so callers can fall back to the primary repo.
    try do
      CGraph.Sharding.ShardManager.get_ring(table)
    catch
      :exit, _ -> {:error, :shard_manager_unavailable}
    end
  end

  defp resolve_repo(shard_id, :read) do
    # Check if a read replica is configured for this shard
    topology = get_topology()
    shard_config = Map.get(topology, shard_id, %{})

    read_repo = Map.get(shard_config, :read_repo)

    if read_repo && Code.ensure_loaded?(read_repo) do
      {:ok, read_repo}
    else
      # Fall back to primary shard repo
      resolve_repo(shard_id, :write)
    end
  end

  defp resolve_repo(shard_id, :write) do
    topology = get_topology()
    shard_config = Map.get(topology, shard_id, %{})
    repo = Map.get(shard_config, :repo, CGraph.Repo)

    if Code.ensure_loaded?(repo) do
      {:ok, repo}
    else
      {:error, {:repo_not_loaded, repo}}
    end
  end

  defp get_topology do
    try do
      CGraph.Sharding.ShardManager.get_topology()
    catch
      :exit, _ -> %{}
    end
  end

  defp fallback_repo(:read) do
    if Code.ensure_loaded?(CGraph.ReadRepo), do: CGraph.ReadRepo, else: CGraph.Repo
  end

  defp fallback_repo(:write), do: CGraph.Repo
end
