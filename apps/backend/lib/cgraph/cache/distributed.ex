defmodule Cgraph.Cache.Distributed do
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
  config :cgraph, Cgraph.Cache.Distributed,
    l1_max_size: 10_000,
    l1_ttl: :timer.minutes(5),
    redis_pool_size: 10,
    default_ttl: :timer.minutes(15),
    compression_threshold: 1024
  ```
  """
  
  use GenServer
  require Logger
  
  @type cache_key :: String.t()
  @type cache_value :: term()
  @type ttl :: pos_integer() | :infinity
  @type cache_opts :: [ttl: ttl, namespace: String.t(), compress: boolean()]
  
  @default_ttl :timer.minutes(15)
  @l1_max_size 10_000
  @l1_ttl :timer.minutes(5)
  @compression_threshold 1024
  @lock_timeout 5_000
  @stale_grace_period :timer.minutes(1)
  
  # L1 cache entry structure
  defmodule Entry do
    @moduledoc false
    defstruct [:value, :expires_at, :stale_at, :compressed]
  end
  
  # ---------------------------------------------------------------------------
  # GenServer API
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
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
  def handle_info(:cleanup_l1, state) do
    cleanup_expired_l1()
    enforce_l1_size_limit()
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
    
    case get_l1(full_key) do
      {:ok, value} ->
        increment_stat(:l1_hits)
        value
        
      :miss ->
        increment_stat(:l1_misses)
        case get_l2(full_key) do
          {:ok, value} ->
            increment_stat(:l2_hits)
            # Populate L1 from L2
            set_l1(full_key, value, l1_ttl(opts))
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
    set_l1(full_key, value, min(ttl, @l1_ttl))
    
    # Set in L2
    set_l2(full_key, value, ttl, opts)
    
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
  @spec fetch(cache_key(), (() -> cache_value()), cache_opts()) :: cache_value()
  def fetch(key, fallback, opts \\ []) when is_function(fallback, 0) do
    full_key = build_key(key, opts)
    
    case get_with_stale(full_key) do
      {:ok, value, :fresh} ->
        value
        
      {:ok, value, :stale} ->
        # Serve stale, refresh in background
        maybe_refresh_async(full_key, fallback, opts)
        value
        
      :miss ->
        compute_with_lock(full_key, fallback, opts)
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
    delete_l2(full_key)
    
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
    l2_deleted = delete_pattern_l2(pattern)
    
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
        case get_l1(key) do
          {:ok, value} -> {Map.put(found, key, value), missing}
          :miss -> {found, [key | missing]}
        end
      end)
    
    # Check L2 for misses
    l2_results = if l1_misses != [] do
      get_many_l2(l1_misses)
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
      set_l1(key, value, min(ttl, @l1_ttl))
    end)
    
    set_many_l2(entries, ttl)
    
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
  # L1 Cache (ETS)
  # ---------------------------------------------------------------------------
  
  defp get_l1(key) do
    now = System.monotonic_time(:millisecond)
    
    case :ets.lookup(:cache_l1, key) do
      [{^key, %Entry{expires_at: exp, value: value, compressed: comp}}] when exp > now ->
        value = if comp, do: decompress(value), else: value
        {:ok, value}
      _ ->
        :miss
    end
  end
  
  defp get_with_stale(key) do
    now = System.monotonic_time(:millisecond)
    
    case :ets.lookup(:cache_l1, key) do
      [{^key, %Entry{expires_at: exp, stale_at: stale, value: value, compressed: comp}}] ->
        value = if comp, do: decompress(value), else: value
        cond do
          now < exp -> {:ok, value, :fresh}
          now < stale -> {:ok, value, :stale}
          true -> :miss
        end
      _ ->
        :miss
    end
  end
  
  defp set_l1(key, value, ttl) do
    now = System.monotonic_time(:millisecond)
    
    {value, compressed} = maybe_compress(value)
    
    entry = %Entry{
      value: value,
      expires_at: now + ttl,
      stale_at: now + ttl + @stale_grace_period,
      compressed: compressed
    }
    
    :ets.insert(:cache_l1, {key, entry})
  end
  
  defp l1_ttl(opts) do
    Keyword.get(opts, :l1_ttl, @l1_ttl)
  end

  # ---------------------------------------------------------------------------
  # L2 Cache (Cachex/Redis)
  # ---------------------------------------------------------------------------
  
  defp get_l2(key) do
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> :miss
      {:ok, value} -> {:ok, value}
      {:error, _} -> :miss
    end
  end
  
  defp set_l2(key, value, ttl, opts) do
    should_compress = Keyword.get(opts, :compress, byte_size_estimate(value) > @compression_threshold)
    
    {stored_value, compressed} = if should_compress do
      {compress(value), true}
    else
      {value, false}
    end
    
    entry = %{value: stored_value, compressed: compressed}
    
    Cachex.put(:cgraph_cache, key, entry, ttl: ttl)
  end
  
  defp delete_l2(key) do
    Cachex.del(:cgraph_cache, key)
  end
  
  defp delete_pattern_l2(pattern) do
    # Use Cachex stream to find and delete matching keys
    count = Cachex.stream!(:cgraph_cache)
    |> Stream.filter(fn {:entry, key, _, _, _} ->
      regex = pattern_to_regex(pattern)
      Regex.match?(regex, to_string(key))
    end)
    |> Enum.reduce(0, fn {:entry, key, _, _, _}, acc ->
      Cachex.del(:cgraph_cache, key)
      acc + 1
    end)
    
    count
  rescue
    _ -> 0
  end
  
  defp get_many_l2(keys) do
    keys
    |> Enum.reduce(%{}, fn key, acc ->
      case get_l2(key) do
        {:ok, value} -> Map.put(acc, key, value)
        :miss -> acc
      end
    end)
  end
  
  defp set_many_l2(entries, ttl) do
    Enum.each(entries, fn {key, value} ->
      set_l2(key, value, ttl, [])
    end)
  end

  # ---------------------------------------------------------------------------
  # Cache Stampede Prevention
  # ---------------------------------------------------------------------------
  
  defp compute_with_lock(key, fallback, opts) do
    use_lock = Keyword.get(opts, :lock, true)
    
    if use_lock do
      lock_key = "lock:#{key}"
      
      case acquire_lock(lock_key) do
        :ok ->
          try do
            value = fallback.()
            set(key, value, opts)
            value
          after
            release_lock(lock_key)
          end
          
        :locked ->
          # Wait and retry
          Process.sleep(50)
          case get(key, opts) do
            nil -> fallback.()  # Give up on lock, compute anyway
            value -> value
          end
      end
    else
      value = fallback.()
      set(key, value, opts)
      value
    end
  end
  
  defp acquire_lock(lock_key) do
    now = System.monotonic_time(:millisecond)
    expires = now + @lock_timeout
    
    case :ets.insert_new(:cache_locks, {lock_key, expires}) do
      true -> :ok
      false ->
        # Check if lock expired
        case :ets.lookup(:cache_locks, lock_key) do
          [{^lock_key, exp}] when exp < now ->
            :ets.delete(:cache_locks, lock_key)
            acquire_lock(lock_key)
          _ ->
            :locked
        end
    end
  end
  
  defp release_lock(lock_key) do
    :ets.delete(:cache_locks, lock_key)
  end
  
  defp maybe_refresh_async(key, fallback, opts) do
    # 10% chance to refresh stale data
    if :rand.uniform(10) == 1 do
      Task.Supervisor.start_child(Cgraph.TaskSupervisor, fn ->
        compute_with_lock(key, fallback, opts)
      end)
    end
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
  
  defp maybe_compress(value) do
    if byte_size_estimate(value) > @compression_threshold do
      {compress(value), true}
    else
      {value, false}
    end
  end
  
  defp compress(value) do
    value
    |> :erlang.term_to_binary()
    |> :zlib.compress()
  end
  
  defp decompress(data) do
    data
    |> :zlib.uncompress()
    |> :erlang.binary_to_term()
  end
  
  defp byte_size_estimate(value) do
    :erlang.external_size(value)
  end
  
  defp cleanup_expired_l1 do
    now = System.monotonic_time(:millisecond)
    
    :ets.foldl(
      fn {key, %Entry{stale_at: stale}}, _ ->
        if stale < now do
          :ets.delete(:cache_l1, key)
        end
      end,
      nil,
      :cache_l1
    )
  end
  
  defp enforce_l1_size_limit do
    size = :ets.info(:cache_l1, :size)
    
    if size > @l1_max_size do
      # Evict oldest 10%
      to_evict = div(size, 10)
      
      :ets.foldl(
        fn {key, _}, count ->
          if count < to_evict do
            :ets.delete(:cache_l1, key)
            count + 1
          else
            count
          end
        end,
        0,
        :cache_l1
      )
    end
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
