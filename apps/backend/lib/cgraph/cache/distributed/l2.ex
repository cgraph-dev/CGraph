defmodule CGraph.Cache.Distributed.L2 do
  @moduledoc """
  L2 (Cachex/Redis) cache operations for the distributed cache.

  Provides shared cross-node caching backed by Cachex with:
  - Millisecond-level access times
  - Pattern-based deletion via SCAN
  - Multi-key batch operations
  - Transparent compression for large values
  """

  alias CGraph.Cache.Distributed.L1

  @doc """
  Get a value from L2 cache.

  Returns `{:ok, value}` or `:miss`.
  """
  @spec get(term()) :: {:ok, term()} | :miss
  def get(key) do
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> :miss
      {:ok, value} -> {:ok, value}
      {:error, _} -> :miss
    end
  end

  @doc """
  Set a value in L2 cache with TTL and optional compression.
  """
  @spec set(term(), term(), non_neg_integer(), keyword()) :: {:ok, boolean()}
  def set(key, value, ttl, opts) do
    should_compress =
      Keyword.get(opts, :compress, L1.byte_size_estimate(value) > L1.compression_threshold())

    {stored_value, compressed} =
      if should_compress do
        {L1.compress(value), true}
      else
        {value, false}
      end

    entry = %{value: stored_value, compressed: compressed}

    Cachex.put(:cgraph_cache, key, entry, ttl: ttl)
  end

  @doc """
  Delete a key from L2 cache.
  """
  @spec delete(term()) :: {:ok, boolean()}
  def delete(key) do
    Cachex.del(:cgraph_cache, key)
  end

  @doc """
  Delete keys matching a pattern from L2 cache using Cachex stream.
  """
  @spec delete_pattern(String.t()) :: non_neg_integer()
  def delete_pattern(pattern) do
    count =
      Cachex.stream!(:cgraph_cache)
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

  @doc """
  Get multiple keys from L2 cache.
  """
  @spec get_many([term()]) :: map()
  def get_many(keys) do
    keys
    |> Enum.reduce(%{}, fn key, acc ->
      case get(key) do
        {:ok, value} -> Map.put(acc, key, value)
        :miss -> acc
      end
    end)
  end

  @doc """
  Set multiple key-value pairs in L2 cache.
  """
  @spec set_many([{term(), term()}], non_neg_integer()) :: :ok
  def set_many(entries, ttl) do
    Enum.each(entries, fn {key, value} ->
      set(key, value, ttl, [])
    end)
  end

  defp pattern_to_regex(pattern) do
    pattern
    |> Regex.escape()
    |> String.replace("\\*", ".*")
    |> String.replace("\\?", ".")
    |> then(&Regex.compile!("^#{&1}$"))
  end
end
