defmodule CGraph.Cache.Distributed do
  @moduledoc """
  Distributed caching layer with local + remote cache tiering.

  ## Design Philosophy

  This module implements a multi-tier caching strategy:

  1. **L1 Cache (Local ETS)**: Ultra-fast, process-local, limited size
  2. **L2 Cache (Distributed)**: Redis-backed, shared across nodes
  3. **Negative caching**: Cache misses to prevent repeated DB lookups
  4. **Cache stampede prevention**: Probabilistic early expiration

  ## Cache Tiers

  ```
  ┌─────────────────────────────────────────────────────────┐
  │                      Application                         │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │                   L1: Local ETS Cache                    │
  │              (< 1µs access, 10K entries max)            │
  └──────────────────────────┬──────────────────────────────┘
                             │ Miss
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │                   L2: Redis Cache                        │
  │            (< 1ms access, shared across nodes)          │
  └──────────────────────────┬──────────────────────────────┘
                             │ Miss
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │                      Data Source                         │
  │                   (Database, API, etc.)                  │
  └─────────────────────────────────────────────────────────┘
  ```

  ## Cache Stampede Prevention

  When a popular cache entry expires, many concurrent requests might try to
  regenerate it simultaneously (thundering herd). We prevent this with:

  1. **Probabilistic early recomputation**: Random chance of refresh before expiry
  2. **Locking**: Only one process regenerates, others wait or get stale data
  3. **Stale-while-revalidate**: Serve stale data while refreshing in background

  ## Usage Examples

  ```elixir
  # Simple get/set
  Cache.get("user:123")
  Cache.set("user:123", user, ttl: :timer.minutes(15))

  # Fetch with fallback
  Cache.fetch("user:123", fn ->
    Users.get_user!(123)
  end, ttl: :timer.minutes(15))

  # Namespace operations
  Cache.delete_pattern("user:123:*")
  Cache.invalidate_namespace("users")

  # Multi-key operations
  Cache.get_many(["user:1", "user:2", "user:3"])
  Cache.set_many(%{"user:1" => u1, "user:2" => u2}, ttl: :timer.hours(1))
  ```

  ## Configuration

  ```elixir
  config :cgraph, CGraph.Cache.Distributed,
    l1_max_size: 10_000,
    l1_ttl: :timer.minutes(5),
    redis_pool_size: 10,
    default_ttl: :timer.minutes(15),
    compression_threshold: 1024
  ```
  """

  use GenServer
  require Logger

  alias __MODULE__.{L1, L2, StampedePrevention}

  @type cache_key :: String.t()
  @type cache_value :: term()
  @type ttl :: pos_integer() | :infinity
  @type cache_opts :: [ttl: ttl, namespace: String.t(), compress: boolean()]

  @default_ttl :timer.minutes(15)
  @l1_ttl :timer.minutes(5)

  # ---------------------------------------------------------------------------
  # GenServer API
  # ---------------------------------------------------------------------------

  @doc "Starts the process and links it to the current process."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  @doc "Initializes the process state."
  @spec init(keyword()) :: {:ok, map()}
  def init(opts) do
    # Create L1 ETS cache
    :ets.new(:cache_l1, [:set, :named_table, :public, read_concurrency: true])
    :ets.new(:cache_locks, [:set, :named_table, :public])
    :ets.new(:cache_stats, [:set, :named_table, :public])

    # Initialize stats
    :ets.insert(:cache_stats, {:l1_hits, 0})
    :ets.insert(:cache_stats, {:l1_misses, 0})
    :ets.insert(:cache_stats, {:l2_hits, 0})
    :ets.insert(:cache_stats, {:l2_misses, 0})

    # Schedule L1 cleanup
    Process.send_after(self(), :cleanup_l1, :timer.minutes(1))

    {:ok, %{opts: opts}}
  end

  @impl true
  @doc "Handles generic messages."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  def handle_info(:cleanup_l1, state) do
    L1.cleanup_expired()
    L1.enforce_size_limit()
    Process.send_after(self(), :cleanup_l1, :timer.minutes(1))
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Get a value from cache.

  Checks L1 first, then L2. Returns nil if not found.
  """
  @spec get(cache_key(), cache_opts()) :: cache_value() | nil
  def get(key, opts \\ []) do
    full_key = build_key(key, opts)

    case L1.get(full_key) do
      {:ok, value} ->
        increment_stat(:l1_hits)
        value

      :miss ->
        increment_stat(:l1_misses)
        case L2.get(full_key) do
          {:ok, value} ->
            increment_stat(:l2_hits)
            # Populate L1 from L2
            L1.set(full_key, value, @l1_ttl)
            value

          :miss ->
            increment_stat(:l2_misses)
            nil
        end
    end
  end

  @doc """
  Set a value in cache.

  Writes to both L1 and L2 caches.
  """
  @spec set(cache_key(), cache_value(), cache_opts()) :: :ok
  def set(key, value, opts \\ []) do
    full_key = build_key(key, opts)
    ttl = Keyword.get(opts, :ttl, @default_ttl)

    # Set in L1
    L1.set(full_key, value, min(ttl, @l1_ttl))

    # Set in L2
    L2.set(full_key, value, ttl, opts)

    :ok
  end

  @doc """
  Get or compute a value.

  If the key exists in cache, return it. Otherwise, execute the fallback
  function and cache the result.

  ## Options

  - `:ttl` - Time to live in milliseconds
  - `:stale_ttl` - Additional time to serve stale data while recomputing
  - `:lock` - Prevent cache stampede with locking (default: true)

  ## Examples

      Cache.fetch("user:123", fn ->
        expensive_computation()
      end, ttl: :timer.minutes(15))
  """
  @doc "Fetches a value from the distributed cache."
  @spec fetch(cache_key(), (() -> cache_value()), cache_opts()) :: cache_value()
  def fetch(key, fallback, opts \\ []) when is_function(fallback, 0) do
    full_key = build_key(key, opts)

    case L1.get_with_stale(full_key) do
      {:ok, value, :fresh} ->
        value

      {:ok, value, :stale} ->
        # Serve stale, refresh in background
        StampedePrevention.maybe_refresh_async(full_key, fallback, opts)
        value

      :miss ->
        StampedePrevention.compute_with_lock(full_key, fallback, opts)
    end
  end

  @doc """
  Delete a key from cache.
  """
  @spec delete(cache_key(), cache_opts()) :: :ok
  def delete(key, opts \\ []) do
    full_key = build_key(key, opts)

    # Delete from L1
    :ets.delete(:cache_l1, full_key)

    # Delete from L2
    L2.delete(full_key)

    :ok
  end

  @doc """
  Delete all keys matching a pattern.

  Pattern uses Redis SCAN pattern matching (*, ?, [abc]).

  ## Examples

      Cache.delete_pattern("user:123:*")
      Cache.delete_pattern("session:*")
  """
  @spec delete_pattern(String.t()) :: {:ok, integer()}
  def delete_pattern(pattern) do
    # Clear matching L1 entries
    regex = pattern_to_regex(pattern)
    l1_deleted = :ets.foldl(
      fn {key, _}, count ->
        if Regex.match?(regex, key) do
          :ets.delete(:cache_l1, key)
          count + 1
        else
          count
        end
      end,
      0,
      :cache_l1
    )

    # Clear L2 entries using SCAN
    l2_deleted = L2.delete_pattern(pattern)

    {:ok, l1_deleted + l2_deleted}
  end

  @doc """
  Invalidate an entire namespace.

  Uses namespace versioning for efficient invalidation.
  """
  @spec invalidate_namespace(String.t()) :: :ok
  def invalidate_namespace(namespace) do
    version_key = "ns:#{namespace}:version"

    # Increment namespace version
    case Cachex.incr(:cgraph_cache, version_key) do
      {:ok, _} -> :ok
      {:error, _} -> Cachex.put(:cgraph_cache, version_key, 1)
    end

    # Clear L1 entries for namespace
    regex = ~r/^#{Regex.escape(namespace)}:/
    :ets.foldl(
      fn {key, _}, _ ->
        if Regex.match?(regex, key) do
          :ets.delete(:cache_l1, key)
        end
      end,
      nil,
      :cache_l1
    )

    :ok
  end

  @doc """
  Get multiple keys at once.
  """
  @spec get_many([cache_key()]) :: %{cache_key() => cache_value()}
  def get_many(keys) when is_list(keys) do
    # Check L1 first
    {l1_results, l1_misses} =
      Enum.reduce(keys, {%{}, []}, fn key, {found, missing} ->
        case L1.get(key) do
          {:ok, value} -> {Map.put(found, key, value), missing}
          :miss -> {found, [key | missing]}
        end
      end)

    # Check L2 for misses
    l2_results = if l1_misses != [] do
      L2.get_many(l1_misses)
    else
      %{}
    end

    Map.merge(l1_results, l2_results)
  end

  @doc """
  Set multiple keys at once.
  """
  @spec set_many(%{cache_key() => cache_value()}, cache_opts()) :: :ok
  def set_many(entries, opts \\ []) when is_map(entries) do
    ttl = Keyword.get(opts, :ttl, @default_ttl)

    Enum.each(entries, fn {key, value} ->
      L1.set(key, value, min(ttl, @l1_ttl))
    end)

    L2.set_many(entries, ttl)

    :ok
  end

  @doc """
  Get cache statistics.
  """
  @spec stats() :: map()
  def stats do
    l1_hits = get_stat(:l1_hits)
    l1_misses = get_stat(:l1_misses)
    l2_hits = get_stat(:l2_hits)
    l2_misses = get_stat(:l2_misses)

    l1_hit_rate = if l1_hits + l1_misses > 0 do
      Float.round(l1_hits / (l1_hits + l1_misses) * 100, 2)
    else
      0.0
    end

    total_requests = l1_hits + l1_misses
    total_hits = l1_hits + l2_hits
    overall_hit_rate = if total_requests > 0 do
      Float.round(total_hits / total_requests * 100, 2)
    else
      0.0
    end

    %{
      l1: %{
        hits: l1_hits,
        misses: l1_misses,
        hit_rate: l1_hit_rate,
        size: :ets.info(:cache_l1, :size)
      },
      l2: %{
        hits: l2_hits,
        misses: l2_misses
      },
      overall: %{
        requests: total_requests,
        hit_rate: overall_hit_rate
      }
    }
  end

  # ---------------------------------------------------------------------------
  # Utilities
  # ---------------------------------------------------------------------------

  defp build_key(key, opts) do
    namespace = Keyword.get(opts, :namespace)

    if namespace do
      version = get_namespace_version(namespace)
      "#{namespace}:v#{version}:#{key}"
    else
      key
    end
  end

  defp get_namespace_version(namespace) do
    case Cachex.get(:cgraph_cache, "ns:#{namespace}:version") do
      {:ok, nil} -> 1
      {:ok, version} -> version
      {:error, _} -> 1
    end
  end

  defp pattern_to_regex(pattern) do
    pattern
    |> Regex.escape()
    |> String.replace("\\*", ".*")
    |> String.replace("\\?", ".")
    |> then(&Regex.compile!("^#{&1}$"))
  end

  defp increment_stat(name) do
    :ets.update_counter(:cache_stats, name, 1, {name, 0})
  end

  defp get_stat(name) do
    case :ets.lookup(:cache_stats, name) do
      [{^name, value}] -> value
      [] -> 0
    end
  end
end
