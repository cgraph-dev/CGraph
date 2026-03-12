defmodule CGraph.Cache.MultiTierCache do
  @moduledoc """
  Multi-tier cache facade with per-tier TTL configuration.

  Extends the existing `CGraph.Cache.Tiered` system with:

  - Configurable per-tier TTLs (L1: 1min, L2: 15min, L3: permanent)
  - Standardised cache key convention: `{module}:{id}:{version}`
  - Telemetry on every hit/miss per tier
  - Namespace-aware operations built on top of L1/L2/L3

  ## Architecture

  This module does **not** replace the existing tiered cache. It wraps
  `CGraph.Cache.{L1, L2, L3}` with the key convention and TTL policy
  required by the infrastructure-scaling plan.

  ```
  Application  →  MultiTierCache.get/2
                       │
                       ├─ L1 (ETS, 1 min TTL)
                       ├─ L2 (Cachex, 15 min TTL)
                       └─ L3 (Redis, permanent / 24h)
  ```

  ## Key Convention

      iex> MultiTierCache.build_key("users", "abc-123", 1)
      "users:abc-123:1"

  ## Usage

      # Fetch with fallback (cache-aside)
      {:ok, user} = MultiTierCache.fetch("users", user_id, fn ->
        {:ok, Repo.get(User, user_id)}
      end)

      # Direct put across all tiers
      MultiTierCache.put("users", user_id, user_data)

      # Invalidate a single key
      MultiTierCache.invalidate("users", user_id)

      # Invalidate by pattern
      MultiTierCache.invalidate_pattern("users:*")
  """

  alias CGraph.Cache.{L1, L2, L3, Telemetry}
  require Logger

  # ── Per-tier TTL defaults (milliseconds) ────────────────────────────────────

  @l1_ttl :timer.minutes(1)
  @l2_ttl :timer.minutes(15)
  # L3 (Redis) uses 24 hours as "permanent-ish" to avoid unbounded growth
  @l3_ttl :timer.hours(24)

  @type key_part :: String.t() | atom() | integer()

  # ── Key helpers ─────────────────────────────────────────────────────────────

  @doc """
  Build a cache key following the `{module}:{id}:{version}` convention.

  Version defaults to 1 and can be bumped to force cache busting.
  """
  @spec build_key(key_part(), key_part(), key_part()) :: String.t()
  def build_key(module, id, version \\ 1) do
    "#{module}:#{id}:#{version}"
  end

  # ── Read path: L1 → L2 → L3 with promotion ────────────────────────────────

  @doc """
  Read through all tiers. Values found in lower tiers are promoted upward.

  Returns `{:ok, value}` on hit or `{:error, :not_found}` on full miss.
  """
  @spec get(String.t(), String.t()) :: {:ok, term()} | {:error, :not_found}
  def get(module, id) do
    key = build_key(module, id)
    get_by_key(key)
  end

  @doc """
  Same as `get/2` but accepts a pre-built key string.
  """
  @spec get_by_key(String.t()) :: {:ok, term()} | {:error, :not_found}
  def get_by_key(key) do
    case L1.get(key) do
      {:ok, value} ->
        Telemetry.emit_hit(:l1)
        {:ok, value}

      {:error, :not_found} ->
        try_l2(key)
    end
  end

  # ── Write path: fan-out to all tiers ───────────────────────────────────────

  @doc """
  Write a value to all three tiers using per-tier TTLs.

  ## Options

    * `:l1_ttl` — override L1 TTL (default #{@l1_ttl} ms)
    * `:l2_ttl` — override L2 TTL (default #{@l2_ttl} ms)
    * `:l3_ttl` — override L3 TTL (default #{@l3_ttl} ms)
  """
  @spec put(String.t(), String.t(), term(), keyword()) :: :ok
  def put(module, id, value, opts \\ []) do
    key = build_key(module, id)
    put_by_key(key, value, opts)
  end

  @doc """
  Write a value to all three tiers using a pre-built key.
  """
  @spec put_by_key(String.t(), term(), keyword()) :: :ok
  def put_by_key(key, value, opts \\ []) do
    l1 = Keyword.get(opts, :l1_ttl, @l1_ttl)
    l2 = Keyword.get(opts, :l2_ttl, @l2_ttl)
    l3 = Keyword.get(opts, :l3_ttl, @l3_ttl)

    L1.set(key, value, l1)
    L2.set(key, value, l2)
    L3.set(key, value, l3)

    :telemetry.execute([:cgraph, :cache, :multi_tier, :put], %{count: 1}, %{key: key})
    :ok
  end

  # ── Fetch with fallback (cache-aside) ──────────────────────────────────────

  @doc """
  Fetch a value, computing it via `fallback` on a full miss.

  The fallback function must return `{:ok, value}` or `{:error, reason}`.
  On success the value is written to all tiers.
  """
  @spec fetch(String.t(), String.t(), (-> {:ok, term()} | {:error, term()}), keyword()) ::
          {:ok, term()} | {:error, term()}
  def fetch(module, id, fallback, opts \\ []) when is_function(fallback, 0) do
    key = build_key(module, id)
    fetch_by_key(key, fallback, opts)
  end

  @doc """
  Fetch by pre-built key string.
  """
  @spec fetch_by_key(String.t(), (-> {:ok, term()} | {:error, term()}), keyword()) ::
          {:ok, term()} | {:error, term()}
  def fetch_by_key(key, fallback, opts \\ []) when is_function(fallback, 0) do
    case get_by_key(key) do
      {:ok, _value} = hit ->
        hit

      {:error, :not_found} ->
        case fallback.() do
          {:ok, value} ->
            put_by_key(key, value, opts)
            {:ok, value}

          {:error, _reason} = err ->
            err
        end
    end
  end

  # ── Invalidation ───────────────────────────────────────────────────────────

  @doc """
  Invalidate a single key across all tiers.
  """
  @spec invalidate(String.t(), String.t()) :: :ok
  def invalidate(module, id) do
    key = build_key(module, id)
    invalidate_key(key)
  end

  @doc """
  Invalidate a pre-built key across all tiers.
  """
  @spec invalidate_key(String.t()) :: :ok
  def invalidate_key(key) do
    L1.delete(key)
    L2.delete(key)
    L3.delete(key)

    :telemetry.execute([:cgraph, :cache, :multi_tier, :invalidate], %{count: 1}, %{key: key})
    :ok
  end

  @doc """
  Invalidate all keys matching a glob pattern (e.g. `"users:*"`).
  """
  @spec invalidate_pattern(String.t()) :: :ok
  def invalidate_pattern(pattern) do
    # L1: scan ETS — best effort
    L1.clear()

    # L2: Cachex supports pattern scanning
    matching_keys = L2.get_matching_keys(pattern)
    Enum.each(matching_keys, &L2.delete/1)

    # L3: Redis SCAN + DEL
    L3.delete_pattern(pattern)

    :telemetry.execute(
      [:cgraph, :cache, :multi_tier, :invalidate_pattern],
      %{count: 1},
      %{pattern: pattern}
    )

    :ok
  end

  # ── Bulk operations ────────────────────────────────────────────────────────

  @doc """
  Put multiple entries into all tiers.

  Accepts a list of `{module, id, value}` tuples.
  """
  @spec put_many([{String.t(), String.t(), term()}], keyword()) :: :ok
  def put_many(entries, opts \\ []) do
    Enum.each(entries, fn {mod, id, value} ->
      put(mod, id, value, opts)
    end)
  end

  @doc """
  Get multiple values. Returns a map of `key => value` for found entries.
  """
  @spec get_many(String.t(), [String.t()]) :: %{String.t() => term()}
  def get_many(module, ids) do
    Enum.reduce(ids, %{}, fn id, acc ->
      case get(module, id) do
        {:ok, value} -> Map.put(acc, id, value)
        _ -> acc
      end
    end)
  end

  # ── Stats ──────────────────────────────────────────────────────────────────

  @doc """
  Return stats from all three tiers.
  """
  @spec stats() :: map()
  def stats do
    %{
      l1: L1.stats(),
      l2: L2.stats(),
      l3: L3.stats(),
      ttls: %{l1: @l1_ttl, l2: @l2_ttl, l3: @l3_ttl}
    }
  end

  # ── Internal tier cascade ──────────────────────────────────────────────────

  defp try_l2(key) do
    case L2.get(key) do
      {:ok, value} ->
        Telemetry.emit_hit(:l2)
        # Promote to L1
        L1.set(key, value, @l1_ttl)
        {:ok, value}

      {:error, :not_found} ->
        try_l3(key)
    end
  end

  defp try_l3(key) do
    case L3.get(key) do
      {:ok, value} ->
        Telemetry.emit_hit(:l3)
        # Promote to L2 and L1
        L2.set(key, value, @l2_ttl)
        L1.set(key, value, @l1_ttl)
        {:ok, value}

      {:error, _} ->
        Telemetry.emit_miss()
        {:error, :not_found}
    end
  end
end
