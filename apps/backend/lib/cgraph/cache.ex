defmodule CGraph.Cache do
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

  ## Submodules

  Implementation is split across focused submodules:

  - `CGraph.Cache.L1` — ETS (process-local) tier
  - `CGraph.Cache.L2` — Cachex (shared) tier
  - `CGraph.Cache.L3` — Redis (distributed) tier
  - `CGraph.Cache.Tiered` — multi-tier read/write orchestration
  - `CGraph.Cache.Stampede` — lock-based stampede prevention
  - `CGraph.Cache.Tags` — tag-based group invalidation
  - `CGraph.Cache.Telemetry` — telemetry event emission
  """

  require Logger

  alias CGraph.Cache.{L1, L2, L3, Tiered, Stampede, Tags, Telemetry}

  @type key :: String.t() | atom()
  @type value :: term()
  @type ttl :: pos_integer() | :infinity
  @type tier :: :l1 | :l2 | :l3 | :all

  @default_ttl :timer.minutes(5)

  # ---------------------------------------------------------------------------
  # Public API - Basic Operations
  # ---------------------------------------------------------------------------

  @doc """
  Put a value into cache (alias for set/3).

  This is provided for API compatibility with modules using `Cache.put/3`.
  Internally delegates to `set/3`.

  ## Parameters

  - `key` - Cache key
  - `value` - Value to cache
  - `ttl_or_opts` - TTL in milliseconds or keyword options

  ## Examples

      Cache.put("user:123", user_data, :timer.minutes(5))
      Cache.put("user:123", user_data, ttl: :timer.minutes(5))
  """
  @spec put(key(), value(), ttl() | keyword()) :: {:ok, value()} | {:error, term()}
  def put(key, value, ttl_or_opts \\ []) do
    opts = if is_integer(ttl_or_opts), do: [ttl: ttl_or_opts], else: ttl_or_opts
    set(key, value, opts)
  end

  @doc """
  Get a value from cache.

  Checks L1 → L2 → L3 in order, promoting found values to higher tiers.

  ## Options

  - `:tier` - Specific tier to check (:l1, :l2, :l3, :all)
  - `:promote` - Whether to promote to higher tiers (default: true)
  """
  @spec get(key(), keyword() | map()) :: {:ok, value()} | {:error, term()}
  def get(key, opts \\ []) do
    opts =
      cond do
        is_map(opts) -> Map.to_list(opts)
        is_list(opts) -> opts
        true -> []
      end

    tier = Keyword.get(opts, :tier, :all)
    promote = Keyword.get(opts, :promote, true)

    start_time = System.monotonic_time(:microsecond)

    result =
      case tier do
        :l1 -> L1.get(key)
        :l2 -> L2.get(key)
        :l3 -> L3.get(key)
        :all -> Tiered.get_all(key, promote)
      end

    Telemetry.emit_get(key, result, start_time)

    result
  end

  @doc """
  Set a value in cache.

  ## Options

  - `:ttl` - Time to live in milliseconds (default: 5 minutes)
  - `:tier` - Tiers to write to (:l1, :l2, :l3, :all)
  - `:tags` - Tags for group invalidation
  """
  @spec set(key(), value(), keyword() | map()) :: {:ok, value()} | {:error, term()}
  def set(key, value, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    ttl = Keyword.get(opts, :ttl, @default_ttl)
    tier = Keyword.get(opts, :tier, :all)
    tags = Keyword.get(opts, :tags, [])

    start_time = System.monotonic_time(:microsecond)

    result =
      case tier do
        :l1 -> L1.set(key, value, ttl)
        :l2 -> L2.set(key, value, ttl)
        :l3 -> L3.set(key, value, ttl)
        :all -> Tiered.set_all(key, value, ttl)
      end

    if tags != [] do
      Tags.store(key, tags)
    end

    Telemetry.emit_set(key, start_time)

    result
  end

  @doc """
  Delete a key from all cache tiers.
  """
  @spec delete(key()) :: :ok
  def delete(key) do
    L1.delete(key)
    L2.delete(key)
    L3.delete(key)

    Telemetry.emit_delete(key)

    :ok
  end

  @doc """
  Delete all keys matching a pattern.

  Pattern supports `*` wildcard.
  """
  @spec delete_pattern(String.t()) :: :ok
  def delete_pattern(pattern) do
    keys = L2.get_matching_keys(pattern)
    Enum.each(keys, &delete/1)

    L3.delete_pattern(pattern)

    :ok
  end

  @doc """
  Delete all keys with a specific tag.
  """
  @spec delete_by_tag(term()) :: {:ok, non_neg_integer()} | {:error, term()}
  def delete_by_tag(tag) do
    case Tags.get_keys(tag) do
      {:ok, keys} ->
        Enum.each(keys, &delete/1)
        Tags.delete(tag)
        {:ok, length(keys)}

      error ->
        error
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
  @spec fetch(key(), (() -> value()), keyword() | map() | integer()) :: value()
  def fetch(key, compute_fn, opts \\ []) when is_function(compute_fn, 0) do
    opts =
      cond do
        is_map(opts) -> Map.to_list(opts)
        is_integer(opts) -> [ttl: opts]
        is_list(opts) -> opts
        true -> []
      end

    case get(key) do
      {:ok, value} ->
        value

      {:error, _reason} ->
        use_lock = Keyword.get(opts, :lock, true)

        if use_lock do
          Stampede.fetch_with_lock(key, compute_fn, opts)
        else
          Stampede.compute_and_cache(key, compute_fn, opts)
        end
    end
  end

  @doc """
  Fetch with a fallback value on error.
  """
  @spec fetch_or_default(key(), value(), (() -> value()), keyword() | map()) :: value()
  def fetch_or_default(key, default, compute_fn, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    fetch(key, compute_fn, opts)
  rescue
    _ -> default
  end

  @doc """
  Fetch multiple keys at once.

  Returns a map of key => value for found keys.
  """
  @spec fetch_many([key()], (key() -> value()), keyword() | map()) :: %{key() => value()}
  def fetch_many(keys, compute_fn, opts \\ []) when is_list(keys) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts

    cached =
      keys
      |> Enum.map(fn key -> {key, get(key)} end)
      |> Enum.filter(fn {_, result} -> match?({:ok, _}, result) end)
      |> Enum.map(fn {key, {:ok, value}} -> {key, value} end)
      |> Map.new()

    missing_keys = keys -- Map.keys(cached)

    computed =
      if missing_keys != [] do
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
  @spec warm_up([{key(), (() -> value())}], keyword() | map()) :: [key()]
  def warm_up(items, opts \\ []) when is_list(items) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
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
  @spec clear_all() :: :ok
  def clear_all do
    L1.clear()
    L2.clear()
    # L3 would need selective deletion

    Logger.warning("All caches cleared")
    :ok
  end

  @doc """
  Get cache statistics.
  """
  @spec stats() :: map()
  def stats do
    %{
      l1: L1.stats(),
      l2: L2.stats(),
      l3: L3.stats()
    }
  end

  @doc """
  Get cache size across tiers.
  """
  @spec size() :: map()
  def size do
    %{l1: L1.size(), l2: L2.size()}
  end
end
