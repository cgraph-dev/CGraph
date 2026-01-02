defmodule Cgraph.Cache.Unified do
  @moduledoc """
  Unified caching layer with support for multiple backends.
  
  ## Overview
  
  Provides a consistent caching interface that:
  
  - Supports local (ETS), distributed (Cachex), and external (Redis) backends
  - Implements cache-aside pattern with automatic refresh
  - Provides cache warming for frequently accessed data
  - Handles cache invalidation across nodes
  - Includes telemetry for cache hit/miss monitoring
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    UNIFIED CACHE SYSTEM                         │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Application ──► Cache Layer ──► Backend                        │
  │        │              │              │                          │
  │        │       ┌──────▼──────┐ ┌─────▼─────┐                   │
  │        │       │ Operations  │ │ Backends  │                   │
  │        │       │  ├── get    │ │  ├── L1   │ ← ETS (local)    │
  │        │       │  ├── put    │ │  ├── L2   │ ← Cachex (dist)  │
  │        │       │  ├── delete │ │  └── L3   │ ← Redis (ext)    │
  │        │       │  └── fetch  │ └───────────┘                   │
  │        │       └─────────────┘                                  │
  │        │                                                        │
  │        ▼                                                        │
  │  ┌─────────────────────────────────────────────────────────┐   │
  │  │                   Cache Namespaces                        │   │
  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │   │
  │  │  │ users  │ │messages│ │ groups │ │ feeds  │           │   │
  │  │  └────────┘ └────────┘ └────────┘ └────────┘           │   │
  │  └─────────────────────────────────────────────────────────┘   │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Cache Namespaces
  
  | Namespace | TTL | Description |
  |-----------|-----|-------------|
  | `:users` | 5min | User profiles and settings |
  | `:sessions` | 15min | Active sessions |
  | `:messages` | 1min | Recent message lookups |
  | `:groups` | 5min | Group metadata |
  | `:channels` | 5min | Channel information |
  | `:presence` | 30s | Online presence data |
  | `:feeds` | 2min | Forum/post feeds |
  | `:search` | 5min | Search results |
  | `:prekeys` | 10min | E2EE prekey bundles |
  
  ## Usage
  
      # Simple get/put
      Cache.put(:users, user_id, user_data)
      {:ok, user} = Cache.get(:users, user_id)
      
      # Fetch with fallback (cache-aside)
      {:ok, user} = Cache.fetch(:users, user_id, fn ->
        Accounts.get_user(user_id)
      end)
      
      # Delete/invalidate
      Cache.delete(:users, user_id)
      Cache.invalidate_pattern(:users, "user:*:profile")
      
      # Bulk operations
      Cache.put_many(:users, [{id1, data1}, {id2, data2}])
      {:ok, results} = Cache.get_many(:users, [id1, id2, id3])
  """
  
  use GenServer
  require Logger
  
  # Default TTLs by namespace (in milliseconds)
  @default_ttls %{
    users: :timer.minutes(5),
    sessions: :timer.minutes(15),
    messages: :timer.minutes(1),
    groups: :timer.minutes(5),
    channels: :timer.minutes(5),
    presence: :timer.seconds(30),
    feeds: :timer.minutes(2),
    search: :timer.minutes(5),
    prekeys: :timer.minutes(10),
    rate_limits: :timer.seconds(60),
    default: :timer.minutes(5)
  }
  
  @type namespace :: atom()
  @type key :: String.t() | atom()
  @type value :: term()
  @type ttl :: pos_integer()
  @type opts :: keyword()
  
  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Get a value from the cache.
  
  Returns `{:ok, value}` if found, `:error` if not found or expired.
  """
  @spec get(namespace(), key()) :: {:ok, value()} | :error
  def get(namespace, key) do
    full_key = build_key(namespace, key)
    
    case backend().get(full_key) do
      {:ok, value} ->
        emit_telemetry(:hit, namespace, key)
        {:ok, value}
      _ ->
        emit_telemetry(:miss, namespace, key)
        :error
    end
  end
  
  @doc """
  Put a value into the cache.
  
  ## Options
  
  - `:ttl` - Time-to-live in milliseconds (defaults to namespace TTL)
  """
  @spec put(namespace(), key(), value(), opts()) :: :ok
  def put(namespace, key, value, opts \\ []) do
    full_key = build_key(namespace, key)
    ttl = Keyword.get(opts, :ttl, get_ttl(namespace))
    
    backend().put(full_key, value, ttl: ttl)
    emit_telemetry(:put, namespace, key)
    :ok
  end
  
  @doc """
  Delete a value from the cache.
  """
  @spec delete(namespace(), key()) :: :ok
  def delete(namespace, key) do
    full_key = build_key(namespace, key)
    backend().delete(full_key)
    emit_telemetry(:delete, namespace, key)
    :ok
  end
  
  @doc """
  Fetch a value, computing it if not cached.
  
  This is the cache-aside pattern: check cache first, compute on miss,
  store result in cache.
  
  ## Options
  
  - `:ttl` - Time-to-live in milliseconds
  - `:fallback_ttl` - TTL to use if fallback returns error (default: 10s)
  """
  @spec fetch(namespace(), key(), (-> {:ok, value()} | {:error, term()}), opts()) :: 
    {:ok, value()} | {:error, term()}
  def fetch(namespace, key, fallback, opts \\ []) when is_function(fallback, 0) do
    case get(namespace, key) do
      {:ok, value} ->
        {:ok, value}
      
      :error ->
        case fallback.() do
          {:ok, value} ->
            put(namespace, key, value, opts)
            {:ok, value}
          
          error ->
            # Optionally cache errors briefly to prevent thundering herd
            if Keyword.get(opts, :cache_errors, false) do
              fallback_ttl = Keyword.get(opts, :fallback_ttl, :timer.seconds(10))
              put(namespace, key, error, ttl: fallback_ttl)
            end
            error
        end
    end
  end
  
  @doc """
  Get multiple values from cache.
  
  Returns a map of key => value for found entries.
  """
  @spec get_many(namespace(), [key()]) :: {:ok, map()}
  def get_many(namespace, keys) do
    results = Enum.reduce(keys, %{}, fn key, acc ->
      case get(namespace, key) do
        {:ok, value} -> Map.put(acc, key, value)
        :error -> acc
      end
    end)
    
    {:ok, results}
  end
  
  @doc """
  Put multiple values into cache.
  """
  @spec put_many(namespace(), [{key(), value()}], opts()) :: :ok
  def put_many(namespace, entries, opts \\ []) do
    Enum.each(entries, fn {key, value} ->
      put(namespace, key, value, opts)
    end)
    :ok
  end
  
  @doc """
  Delete all entries matching a pattern.
  
  Pattern supports wildcards: `user:*:profile`
  """
  @spec invalidate_pattern(namespace(), String.t()) :: :ok
  def invalidate_pattern(namespace, pattern) do
    full_pattern = build_key(namespace, pattern)
    backend().delete_pattern(full_pattern)
    emit_telemetry(:invalidate_pattern, namespace, pattern)
    :ok
  end
  
  @doc """
  Clear all entries in a namespace.
  """
  @spec clear(namespace()) :: :ok
  def clear(namespace) do
    invalidate_pattern(namespace, "*")
  end
  
  @doc """
  Warm cache with frequently accessed data.
  
  Call this on application startup or periodically.
  """
  @spec warm(namespace(), (-> [{key(), value()}])) :: :ok
  def warm(namespace, data_fn) when is_function(data_fn, 0) do
    Task.start(fn ->
      try do
        entries = data_fn.()
        put_many(namespace, entries)
        Logger.info("Cache warmed: namespace=#{namespace} entries=#{length(entries)}")
      rescue
        e ->
          Logger.warning("Cache warming failed: namespace=#{namespace} error=#{inspect(e)}")
      end
    end)
    :ok
  end
  
  @doc """
  Get cache statistics.
  """
  @spec stats() :: map()
  def stats do
    %{
      backend: backend(),
      namespaces: Map.keys(@default_ttls),
      # Backend-specific stats would go here
    }
  end
  
  # ---------------------------------------------------------------------------
  # Server Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(_opts) do
    # Initialize cache backend
    {:ok, %{}}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------
  
  defp build_key(namespace, key) do
    "#{namespace}:#{key}"
  end
  
  defp get_ttl(namespace) do
    Map.get(@default_ttls, namespace, @default_ttls.default)
  end
  
  defp backend do
    Application.get_env(:cgraph, :cache_backend, Cgraph.Cache.Backend.Cachex)
  end
  
  defp emit_telemetry(event, namespace, key) do
    :telemetry.execute(
      [:cgraph, :cache, event],
      %{},
      %{namespace: namespace, key: key}
    )
  end
end

defmodule Cgraph.Cache.Backend.Cachex do
  @moduledoc """
  Cachex-based cache backend (distributed within Elixir cluster).
  """
  
  @cache_name :cgraph_cache
  
  def child_spec(_opts) do
    %{
      id: __MODULE__,
      start: {Cachex, :start_link, [@cache_name, [
        stats: true,
        limit: 100_000
      ]]}
    }
  end
  
  def get(key) do
    case Cachex.get(@cache_name, key) do
      {:ok, nil} -> :error
      {:ok, value} -> {:ok, value}
      _ -> :error
    end
  end
  
  def put(key, value, opts) do
    ttl = Keyword.get(opts, :ttl)
    Cachex.put(@cache_name, key, value, ttl: ttl)
    :ok
  end
  
  def delete(key) do
    Cachex.del(@cache_name, key)
    :ok
  end
  
  def delete_pattern(pattern) do
    # Convert glob pattern to regex
    regex = pattern
      |> String.replace("*", ".*")
      |> Regex.compile!()
    
    case Cachex.stream(@cache_name) do
      {:ok, stream} ->
        stream
        |> Stream.filter(fn {:entry, key, _, _, _} -> Regex.match?(regex, key) end)
        |> Enum.each(fn {:entry, key, _, _, _} -> Cachex.del(@cache_name, key) end)
      _ ->
        :ok
    end
    
    :ok
  end
end

defmodule Cgraph.Cache.Backend.ETS do
  @moduledoc """
  ETS-based cache backend (local only, for development/testing).
  """
  
  @table :cgraph_cache_ets
  
  def init do
    :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
  end
  
  def get(key) do
    case :ets.lookup(@table, key) do
      [{^key, value, expires_at}] ->
        if expires_at > System.system_time(:millisecond) do
          {:ok, value}
        else
          :ets.delete(@table, key)
          :error
        end
      [] ->
        :error
    end
  end
  
  def put(key, value, opts) do
    ttl = Keyword.get(opts, :ttl, 300_000)
    expires_at = System.system_time(:millisecond) + ttl
    :ets.insert(@table, {key, value, expires_at})
    :ok
  end
  
  def delete(key) do
    :ets.delete(@table, key)
    :ok
  end
  
  def delete_pattern(pattern) do
    regex = pattern
      |> String.replace("*", ".*")
      |> Regex.compile!()
    
    :ets.tab2list(@table)
    |> Enum.filter(fn {key, _, _} -> Regex.match?(regex, key) end)
    |> Enum.each(fn {key, _, _} -> :ets.delete(@table, key) end)
    
    :ok
  end
end
