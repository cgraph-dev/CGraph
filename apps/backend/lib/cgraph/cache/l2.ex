defmodule CGraph.Cache.L2 do
  @moduledoc """
  L2 Cache tier — shared Cachex for cross-process caching.

  Provides millisecond-level lookups via the Cachex library.
  Also hosts pattern-matching key retrieval used by bulk operations.
  """

  @cachex_name :cgraph_cache

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc false
  def get(key) do
    case Cachex.get(@cachex_name, key) do
      {:ok, nil} -> {:error, :not_found}
      {:ok, value} -> {:ok, value}
      {:error, _} = error -> error
    end
  end

  @doc false
  def set(key, value, ttl) do
    opts = if ttl == :infinity, do: [], else: [ttl: ttl]

    case Cachex.put(@cachex_name, key, value, opts) do
      {:ok, true} -> :ok
      {:error, _} = error -> error
    end
  end

  @doc false
  def delete(key) do
    Cachex.del(@cachex_name, key)
    :ok
  end

  @doc false
  def clear do
    Cachex.clear(@cachex_name)
  end

  @doc false
  def size do
    case Cachex.size(@cachex_name) do
      {:ok, size} -> size
      _ -> 0
    end
  end

  @doc false
  def stats do
    case Cachex.stats(@cachex_name) do
      {:ok, stats} -> stats
      _ -> %{}
    end
  end

  @doc """
  Return all keys in the L2 cache matching a glob-style `pattern`.

  Pattern supports `*` wildcard (translated to `.*` regex).
  """
  def get_matching_keys(pattern) do
    regex =
      pattern
      |> String.replace("*", ".*")
      |> Regex.compile!()

    case Cachex.stream(@cachex_name, of: :key) do
      {:ok, stream} ->
        stream
        |> Enum.filter(fn key ->
          is_binary(key) and Regex.match?(regex, key)
        end)
        |> Enum.to_list()

      _ ->
        []
    end
  end
end
