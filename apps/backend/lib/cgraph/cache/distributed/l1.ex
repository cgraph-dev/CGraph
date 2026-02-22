defmodule CGraph.Cache.Distributed.L1 do
  @moduledoc """
  L1 (local ETS) cache operations for the distributed cache.

  Provides ultra-fast, process-local caching with:
  - Sub-microsecond reads via ETS
  - Size-limited entries with automatic eviction
  - Transparent compression for large values
  - Stale-while-revalidate support
  """

  @l1_max_size 10_000
  @stale_grace_period :timer.minutes(1)
  @compression_threshold 1024

  defmodule Entry do
    @moduledoc false
    defstruct [:value, :expires_at, :stale_at, :compressed]
  end

  @doc """
  Get a value from the L1 ETS cache.

  Returns `{:ok, value}` or `:miss`.
  """
  @spec get(term()) :: {:ok, term()} | :miss
  def get(key) do
    now = System.monotonic_time(:millisecond)

    case :ets.lookup(:cache_l1, key) do
      [{^key, %Entry{expires_at: exp, value: value, compressed: comp}}] when exp > now ->
        value = if comp, do: decompress(value), else: value
        {:ok, value}

      _ ->
        :miss
    end
  end

  @doc """
  Get a value with stale status from L1.

  Returns `{:ok, value, :fresh}`, `{:ok, value, :stale}`, or `:miss`.
  """
  @spec get_with_stale(term()) :: {:ok, term(), :fresh | :stale} | :miss
  def get_with_stale(key) do
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

  @doc """
  Set a value in the L1 ETS cache with the given TTL.
  """
  @spec set(term(), term(), non_neg_integer()) :: true
  def set(key, value, ttl) do
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

  @doc """
  Remove expired entries from L1 cache.
  """
  @spec cleanup_expired() :: nil
  def cleanup_expired do
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

  @doc """
  Enforce the L1 max size by evicting oldest entries.
  """
  @spec enforce_size_limit() :: non_neg_integer() | nil
  def enforce_size_limit do
    size = :ets.info(:cache_l1, :size)

    if size > @l1_max_size do
      to_evict = div(size, 10)
      evict_oldest_entries(to_evict)
    end
  end

  # Compression utilities (also used by L2)

  @doc """
  Compress a term using zlib.
  """
  @spec compress(term()) :: binary()
  def compress(value) do
    value
    |> :erlang.term_to_binary()
    |> :zlib.compress()
  end

  @doc """
  Decompress zlib-compressed data back to a term.
  """
  @spec decompress(binary()) :: term()
  def decompress(data) do
    data
    |> :zlib.uncompress()
    # Use :safe option to prevent arbitrary atom creation and code execution
    |> :erlang.binary_to_term([:safe])
  end

  @doc """
  Estimate the byte size of a term.
  """
  @spec byte_size_estimate(term()) :: non_neg_integer()
  def byte_size_estimate(value) do
    :erlang.external_size(value)
  end

  @doc """
  Return the compression threshold.
  """
  @spec compression_threshold() :: non_neg_integer()
  def compression_threshold, do: @compression_threshold

  # Private helpers

  defp maybe_compress(value) do
    if byte_size_estimate(value) > @compression_threshold do
      {compress(value), true}
    else
      {value, false}
    end
  end

  defp evict_oldest_entries(to_evict) do
    :ets.foldl(
      fn {key, _}, count ->
        maybe_evict_entry(key, count, to_evict)
      end,
      0,
      :cache_l1
    )
  end

  defp maybe_evict_entry(key, count, to_evict) when count < to_evict do
    :ets.delete(:cache_l1, key)
    count + 1
  end

  defp maybe_evict_entry(_key, count, _to_evict), do: count
end
