defmodule CGraph.Animations.LottieCache do
  @moduledoc """
  Cachex-backed caching layer for Lottie animation metadata lookups.

  Uses the `:lottie_cache` Cachex instance (registered in `CGraph.CacheSupervisor`)
  with a default TTL of 24 hours. This prevents repeated CDN metadata lookups
  for frequently accessed emoji animation data.

  ## Usage

      LottieCache.get_or_fetch("1f600", fn ->
        LottieManifest.enrich_emoji(%{emoji: "😀", name: "grinning face"})
      end)
  """

  @cache_name :lottie_cache
  @ttl :timer.hours(24)

  @doc """
  Get a cached value by codepoint key, or compute and cache it.

  The `fetch_fn` is only called on cache miss. Results are cached
  with a 24-hour TTL.
  """
  @spec get_or_fetch(String.t(), (-> term())) :: term()
  def get_or_fetch(codepoint, fetch_fn) when is_function(fetch_fn, 0) do
    case Cachex.get(@cache_name, codepoint) do
      {:ok, nil} ->
        result = fetch_fn.()
        Cachex.put(@cache_name, codepoint, result, ttl: @ttl)
        result

      {:ok, cached} ->
        cached

      {:error, _} ->
        # Cache unavailable — fall through to direct fetch
        fetch_fn.()
    end
  end

  @doc "Invalidate a cached entry by codepoint."
  @spec invalidate(String.t()) :: {:ok, boolean()}
  def invalidate(codepoint) do
    Cachex.del(@cache_name, codepoint)
  end

  @doc """
  Warm the cache with a list of `{codepoint, value}` entries.

  Useful for pre-populating frequently accessed emoji animations
  at application startup.
  """
  @spec warm_cache([{String.t(), term()}]) :: :ok
  def warm_cache(entries) when is_list(entries) do
    Enum.each(entries, fn {key, value} ->
      Cachex.put(@cache_name, key, value, ttl: @ttl)
    end)
  end

  @doc "Returns cache statistics (hit/miss counts, size, etc.)."
  @spec stats() :: {:ok, map()} | {:error, term()}
  def stats do
    Cachex.stats(@cache_name)
  end
end
