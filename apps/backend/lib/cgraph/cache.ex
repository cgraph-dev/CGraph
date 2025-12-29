defmodule Cgraph.Cache do
  @moduledoc """
  Unified caching layer with multi-tier architecture.
  
  ## Overview
  
  Provides a consistent interface for caching with:
  
  - **L1 Cache**: Process-local ETS for hot data (microseconds)
  - **L2 Cache**: Shared Cachex for cross-process (milliseconds)
  - **L3 Cache**: Redis for distributed caching (low milliseconds)
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     MULTI-TIER CACHE                            │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Request                                                        │
  │      │                                                           │
  │      ▼                                                           │
  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
  │   │  L1: ETS    │────►│ L2: Cachex  │────►│  L3: Redis  │       │
  │   │  (process)  │ miss│  (shared)   │ miss│ (distributed)│       │
  │   │   <1µs      │     │   <1ms      │     │   <5ms      │       │
  │   └─────────────┘     └─────────────┘     └─────────────┘       │
  │         │                   │                   │               │
  │         └───────────────────┴───────────────────┘               │
  │                     Write-Through                               │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Cache Strategies
  
  | Strategy | Description | Use Case |
  |----------|-------------|----------|
  | `:read_through` | Fetch from source on miss | User profiles |
  | `:write_through` | Write to cache and source | Settings |
  | `:write_behind` | Async write to source | Analytics |
  | `:refresh_ahead` | Pre-refresh before expiry | Hot data |
  
  ## Usage
  
      # Simple get/set
      Cache.set("user:123", user_data, ttl: :timer.minutes(5))
      {:ok, user} = Cache.get("user:123")
      
      # Fetch with fallback
      user = Cache.fetch("user:123", fn ->
        Repo.get(User, 123)
      end)
      
      # Pattern operations
      Cache.delete_pattern("user:123:*")
      
      # Multi-tier with tags
      Cache.set("post:456", post, 
        ttl: :timer.hours(1),
        tags: [:posts, {:user, user_id}]
      )
      Cache.delete_by_tag({:user, user_id})
  
  ## Telemetry
  
  - `[:cgraph, :cache, :get]` - Cache reads
  - `[:cgraph, :cache, :set]` - Cache writes
  - `[:cgraph, :cache, :delete]` - Cache deletes
  - `[:cgraph, :cache, :hit]` - Cache hits
  - `[:cgraph, :cache, :miss]` - Cache misses
  """
  
  require Logger
  
  @type key :: String.t() | atom()
  @type value :: term()
  @type ttl :: pos_integer() | :infinity
  @type tier :: :l1 | :l2 | :l3 | :all
  
  @cachex_name :cgraph_cache
  @l1_table :cgraph_l1_cache
  @default_ttl :timer.minutes(5)
  
  # ---------------------------------------------------------------------------
  # Public API - Basic Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Get a value from cache.
  
  Checks L1 → L2 → L3 in order, promoting found values to higher tiers.
  
  ## Options
  
  - `:tier` - Specific tier to check (:l1, :l2, :l3, :all)
  - `:promote` - Whether to promote to higher tiers (default: true)
  """
  def get(key, opts \\ []) do
    tier = Keyword.get(opts, :tier, :all)
    promote = Keyword.get(opts, :promote, true)
    
    start_time = System.monotonic_time(:microsecond)
    
    result = case tier do
      :l1 -> get_l1(key)
      :l2 -> get_l2(key)
      :l3 -> get_l3(key)
      :all -> get_all_tiers(key, promote)
    end
    
    emit_get_telemetry(key, result, start_time)
    
    result
  end
  
  @doc """
  Set a value in cache.
  
  ## Options
  
  - `:ttl` - Time to live in milliseconds (default: 5 minutes)
  - `:tier` - Tiers to write to (:l1, :l2, :l3, :all)
  - `:tags` - Tags for group invalidation
  """
  def set(key, value, opts \\ []) do
    ttl = Keyword.get(opts, :ttl, @default_ttl)
    tier = Keyword.get(opts, :tier, :all)
    tags = Keyword.get(opts, :tags, [])
    
    start_time = System.monotonic_time(:microsecond)
    
    result = case tier do
      :l1 -> set_l1(key, value, ttl)
      :l2 -> set_l2(key, value, ttl)
      :l3 -> set_l3(key, value, ttl)
      :all -> set_all_tiers(key, value, ttl)
    end
    
    # Store tag associations
    if tags != [] do
      store_tags(key, tags)
    end
    
    emit_set_telemetry(key, start_time)
    
    result
  end
  
  @doc """
  Delete a key from all cache tiers.
  """
  def delete(key) do
    delete_l1(key)
    delete_l2(key)
    delete_l3(key)
    
    emit_delete_telemetry(key)
    
    :ok
  end
  
  @doc """
  Delete all keys matching a pattern.
  
  Pattern supports `*` wildcard.
  """
  def delete_pattern(pattern) do
    # L2 - Use Cachex stream
    keys = get_matching_keys(pattern)
    Enum.each(keys, &delete/1)
    
    # L3 - Redis pattern delete
    delete_redis_pattern(pattern)
    
    :ok
  end
  
  @doc """
  Delete all keys with a specific tag.
  """
  def delete_by_tag(tag) do
    case get_tag_keys(tag) do
      {:ok, keys} ->
        Enum.each(keys, &delete/1)
        delete_tag(tag)
        {:ok, length(keys)}
      error -> error
    end
  end
  
  # ---------------------------------------------------------------------------
  # Public API - Fetch Operations
  # ---------------------------------------------------------------------------
  
  @doc """
  Fetch a value, computing it if not cached.
  
  This is the recommended way to interact with the cache as it handles
  the cache-aside pattern automatically.
  
  ## Options
  
  - `:ttl` - TTL for cached value
  - `:stale_ttl` - Serve stale data while refreshing
  - `:lock` - Use distributed lock for computation
  
  ## Example
  
      user = Cache.fetch("user:123", fn ->
        Repo.get(User, 123)
      end, ttl: :timer.hours(1))
  """
  def fetch(key, compute_fn, opts \\ []) when is_function(compute_fn, 0) do
    case get(key) do
      {:ok, value} ->
        value
        
      {:error, :not_found} ->
        # Check if we should use locking
        if Keyword.get(opts, :lock, false) do
          fetch_with_lock(key, compute_fn, opts)
        else
          compute_and_cache(key, compute_fn, opts)
        end
    end
  end
  
  @doc """
  Fetch with a fallback value on error.
  """
  def fetch_or_default(key, default, compute_fn, opts \\ []) do
    try do
      fetch(key, compute_fn, opts)
    rescue
      _ -> default
    end
  end
  
  @doc """
  Fetch multiple keys at once.
  
  Returns a map of key => value for found keys.
  """
  def fetch_many(keys, compute_fn, opts \\ []) when is_list(keys) do
    # First, try to get all from cache
    cached = keys
    |> Enum.map(fn key -> {key, get(key)} end)
    |> Enum.filter(fn {_, result} -> match?({:ok, _}, result) end)
    |> Enum.map(fn {key, {:ok, value}} -> {key, value} end)
    |> Map.new()
    
    # Find missing keys
    missing_keys = keys -- Map.keys(cached)
    
    # Compute missing values
    computed = if missing_keys != [] do
      missing_keys
      |> Enum.map(fn key ->
        value = compute_fn.(key)
        set(key, value, opts)
        {key, value}
      end)
      |> Map.new()
    else
      %{}
    end
    
    Map.merge(cached, computed)
  end
  
  # ---------------------------------------------------------------------------
  # Public API - Cache Control
  # ---------------------------------------------------------------------------
  
  @doc """
  Warm up cache with a list of keys and their compute functions.
  
  Useful for pre-loading cache on startup.
  """
  def warm_up(items, opts \\ []) when is_list(items) do
    concurrency = Keyword.get(opts, :concurrency, 5)
    
    items
    |> Task.async_stream(
      fn {key, compute_fn} ->
        value = compute_fn.()
        set(key, value, opts)
        key
      end,
      max_concurrency: concurrency,
      timeout: :timer.seconds(30)
    )
    |> Enum.map(fn {:ok, key} -> key end)
  end
  
  @doc """
  Clear all caches.
  """
  def clear_all do
    # L1
    if :ets.whereis(@l1_table) != :undefined do
      :ets.delete_all_objects(@l1_table)
    end
    
    # L2
    Cachex.clear(@cachex_name)
    
    # L3 would need selective deletion
    
    Logger.warning("All caches cleared")
    :ok
  end
  
  @doc """
  Get cache statistics.
  """
  def stats do
    l2_stats = case Cachex.stats(@cachex_name) do
      {:ok, stats} -> stats
      _ -> %{}
    end
    
    %{
      l1: l1_stats(),
      l2: l2_stats,
      l3: redis_stats()
    }
  end
  
  @doc """
  Get cache size across tiers.
  """
  def size do
    l1_size = if :ets.whereis(@l1_table) != :undefined do
      :ets.info(@l1_table, :size)
    else
      0
    end
    
    l2_size = case Cachex.size(@cachex_name) do
      {:ok, size} -> size
      _ -> 0
    end
    
    %{l1: l1_size, l2: l2_size}
  end
  
  # ---------------------------------------------------------------------------
  # L1 Cache (Process-local ETS)
  # ---------------------------------------------------------------------------
  
  defp get_l1(key) do
    table = ensure_l1_table()
    
    case :ets.lookup(table, key) do
      [{^key, value, expiry}] ->
        if expiry == :infinity or expiry > System.monotonic_time(:millisecond) do
          {:ok, value}
        else
          :ets.delete(table, key)
          {:error, :not_found}
        end
      [] ->
        {:error, :not_found}
    end
  end
  
  defp set_l1(key, value, ttl) do
    table = ensure_l1_table()
    
    expiry = if ttl == :infinity do
      :infinity
    else
      System.monotonic_time(:millisecond) + ttl
    end
    
    :ets.insert(table, {key, value, expiry})
    :ok
  end
  
  defp delete_l1(key) do
    table = ensure_l1_table()
    :ets.delete(table, key)
    :ok
  end
  
  defp ensure_l1_table do
    case :ets.whereis(@l1_table) do
      :undefined ->
        :ets.new(@l1_table, [:set, :public, :named_table, read_concurrency: true])
      table ->
        table
    end
  end
  
  defp l1_stats do
    if :ets.whereis(@l1_table) != :undefined do
      %{
        size: :ets.info(@l1_table, :size),
        memory_bytes: :ets.info(@l1_table, :memory) * :erlang.system_info(:wordsize)
      }
    else
      %{size: 0, memory_bytes: 0}
    end
  end
  
  # ---------------------------------------------------------------------------
  # L2 Cache (Cachex)
  # ---------------------------------------------------------------------------
  
  defp get_l2(key) do
    case Cachex.get(@cachex_name, key) do
      {:ok, nil} -> {:error, :not_found}
      {:ok, value} -> {:ok, value}
      {:error, _} = error -> error
    end
  end
  
  defp set_l2(key, value, ttl) do
    opts = if ttl == :infinity, do: [], else: [ttl: ttl]
    
    case Cachex.put(@cachex_name, key, value, opts) do
      {:ok, true} -> :ok
      {:error, _} = error -> error
    end
  end
  
  defp delete_l2(key) do
    Cachex.del(@cachex_name, key)
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # L3 Cache (Redis)
  # ---------------------------------------------------------------------------
  
  defp get_l3(key) do
    redis_key = "cache:#{key}"
    
    case Cgraph.Redis.command(["GET", redis_key]) do
      {:ok, nil} -> {:error, :not_found}
      {:ok, data} -> 
        {:ok, :erlang.binary_to_term(data)}
      {:error, _} = error -> error
    end
  rescue
    _ -> {:error, :redis_unavailable}
  end
  
  defp set_l3(key, value, ttl) do
    redis_key = "cache:#{key}"
    data = :erlang.term_to_binary(value)
    
    cmd = if ttl == :infinity do
      ["SET", redis_key, data]
    else
      ["SETEX", redis_key, div(ttl, 1000), data]
    end
    
    case Cgraph.Redis.command(cmd) do
      {:ok, _} -> :ok
      {:error, _} = error -> error
    end
  rescue
    _ -> {:error, :redis_unavailable}
  end
  
  defp delete_l3(key) do
    redis_key = "cache:#{key}"
    Cgraph.Redis.command(["DEL", redis_key])
    :ok
  rescue
    _ -> :ok
  end
  
  defp delete_redis_pattern(pattern) do
    redis_pattern = "cache:#{pattern}"
    
    case Cgraph.Redis.command(["KEYS", redis_pattern]) do
      {:ok, keys} when is_list(keys) ->
        Enum.each(keys, fn key ->
          Cgraph.Redis.command(["DEL", key])
        end)
      _ -> :ok
    end
  rescue
    _ -> :ok
  end
  
  defp redis_stats do
    case Cgraph.Redis.command(["INFO", "memory"]) do
      {:ok, info} -> parse_redis_info(info)
      _ -> %{}
    end
  rescue
    _ -> %{}
  end
  
  defp parse_redis_info(info) when is_binary(info) do
    info
    |> String.split("\r\n")
    |> Enum.filter(&String.contains?(&1, ":"))
    |> Enum.map(fn line ->
      [key, value] = String.split(line, ":", parts: 2)
      {key, value}
    end)
    |> Map.new()
  end
  defp parse_redis_info(_), do: %{}
  
  # ---------------------------------------------------------------------------
  # Multi-Tier Operations
  # ---------------------------------------------------------------------------
  
  defp get_all_tiers(key, promote) do
    # Try L1
    case get_l1(key) do
      {:ok, value} ->
        emit_hit(:l1)
        {:ok, value}
        
      {:error, :not_found} ->
        # Try L2
        case get_l2(key) do
          {:ok, value} ->
            emit_hit(:l2)
            if promote, do: set_l1(key, value, @default_ttl)
            {:ok, value}
            
          {:error, :not_found} ->
            # Try L3
            case get_l3(key) do
              {:ok, value} ->
                emit_hit(:l3)
                if promote do
                  set_l2(key, value, @default_ttl)
                  set_l1(key, value, @default_ttl)
                end
                {:ok, value}
                
              error ->
                emit_miss()
                error
            end
        end
    end
  end
  
  defp set_all_tiers(key, value, ttl) do
    set_l1(key, value, ttl)
    set_l2(key, value, ttl)
    set_l3(key, value, ttl)
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # Helper Functions
  # ---------------------------------------------------------------------------
  
  defp fetch_with_lock(key, compute_fn, opts) do
    lock_key = "lock:#{key}"
    
    case acquire_lock(lock_key) do
      :ok ->
        try do
          # Double-check if value was cached while waiting
          case get(key) do
            {:ok, value} -> value
            _ -> compute_and_cache(key, compute_fn, opts)
          end
        after
          release_lock(lock_key)
        end
        
      :locked ->
        # Wait and retry
        Process.sleep(50)
        
        case get(key) do
          {:ok, value} -> value
          _ -> compute_and_cache(key, compute_fn, opts)
        end
    end
  end
  
  defp compute_and_cache(key, compute_fn, opts) do
    value = compute_fn.()
    set(key, value, opts)
    value
  end
  
  defp acquire_lock(lock_key) do
    case Cgraph.Redis.command(["SET", lock_key, "1", "NX", "EX", "5"]) do
      {:ok, "OK"} -> :ok
      _ -> :locked
    end
  rescue
    _ -> :ok  # Proceed without lock if Redis unavailable
  end
  
  defp release_lock(lock_key) do
    Cgraph.Redis.command(["DEL", lock_key])
  rescue
    _ -> :ok
  end
  
  defp get_matching_keys(pattern) do
    # Convert pattern to regex
    regex = pattern
    |> String.replace("*", ".*")
    |> Regex.compile!()
    
    # Get keys from L2 cache that match
    case Cachex.stream(@cachex_name, of: :key) do
      {:ok, stream} ->
        stream
        |> Enum.filter(fn key -> 
          is_binary(key) and Regex.match?(regex, key)
        end)
        |> Enum.to_list()
      _ -> []
    end
  end
  
  # ---------------------------------------------------------------------------
  # Tag Management
  # ---------------------------------------------------------------------------
  
  defp store_tags(key, tags) do
    Enum.each(tags, fn tag ->
      tag_key = tag_storage_key(tag)
      
      case get_l2(tag_key) do
        {:ok, keys} -> set_l2(tag_key, [key | keys], :infinity)
        _ -> set_l2(tag_key, [key], :infinity)
      end
    end)
  end
  
  defp get_tag_keys(tag) do
    tag_key = tag_storage_key(tag)
    
    case get_l2(tag_key) do
      {:ok, keys} -> {:ok, keys}
      _ -> {:ok, []}
    end
  end
  
  defp delete_tag(tag) do
    tag_key = tag_storage_key(tag)
    delete_l2(tag_key)
  end
  
  defp tag_storage_key(tag) when is_atom(tag), do: "__tag:#{tag}"
  defp tag_storage_key({type, id}), do: "__tag:#{type}:#{id}"
  defp tag_storage_key(tag), do: "__tag:#{inspect(tag)}"
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_get_telemetry(key, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    status = if match?({:ok, _}, result), do: :hit, else: :miss
    
    :telemetry.execute(
      [:cgraph, :cache, :get],
      %{duration: duration},
      %{key: key, status: status}
    )
  end
  
  defp emit_set_telemetry(key, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    
    :telemetry.execute(
      [:cgraph, :cache, :set],
      %{duration: duration},
      %{key: key}
    )
  end
  
  defp emit_delete_telemetry(key) do
    :telemetry.execute(
      [:cgraph, :cache, :delete],
      %{count: 1},
      %{key: key}
    )
  end
  
  defp emit_hit(tier) do
    :telemetry.execute(
      [:cgraph, :cache, :hit],
      %{count: 1},
      %{tier: tier}
    )
  end
  
  defp emit_miss do
    :telemetry.execute(
      [:cgraph, :cache, :miss],
      %{count: 1},
      %{}
    )
  end
end
