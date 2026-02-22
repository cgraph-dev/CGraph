defmodule CGraph.Redis.SortedSet do
  @moduledoc """
  Sorted set operations for Redis.

  Provides wrappers around Redis sorted set commands: ZADD, ZRANGE, ZRANK,
  ZSCORE, ZREVRANGE, ZREVRANK, ZREM, ZCARD, ZINCRBY.
  """

  alias CGraph.Redis

  @doc """
  Add members to a sorted set.
  """
  @spec zadd(String.t(), [{term(), term()}]) :: {:ok, term()} | {:error, term()}
  def zadd(key, score_members) when is_list(score_members) do
    args =
      Enum.flat_map(score_members, fn {score, member} ->
        [score, member]
      end)

    Redis.command(["ZADD", key | args])
  end

  @spec zadd(String.t(), term(), term()) :: {:ok, term()} | {:error, term()}
  def zadd(key, score, member), do: zadd(key, [{score, member}])

  @doc """
  Get range from sorted set by rank.
  """
  @spec zrange(String.t(), integer(), integer(), keyword()) :: {:ok, list()} | {:error, term()}
  def zrange(key, start, stop, opts \\ []) do
    args = ["ZRANGE", key, start, stop]
    args = if Keyword.get(opts, :withscores), do: args ++ ["WITHSCORES"], else: args
    Redis.command(args)
  end

  @doc """
  Get rank of a member in sorted set.
  """
  @spec zrank(String.t(), term()) :: {:ok, non_neg_integer() | nil} | {:error, term()}
  def zrank(key, member), do: Redis.command(["ZRANK", key, member])

  @doc """
  Get score of a member in sorted set.
  """
  @spec zscore(String.t(), term()) :: {:ok, String.t() | nil} | {:error, term()}
  def zscore(key, member), do: Redis.command(["ZSCORE", key, member])

  @doc """
  Get reverse range from sorted set (highest scores first).
  """
  @spec zrevrange(String.t(), integer(), integer(), keyword()) :: {:ok, list()} | {:error, term()}
  def zrevrange(key, start, stop, opts \\ []) do
    args = ["ZREVRANGE", key, start, stop]
    args = if Keyword.get(opts, :withscores), do: args ++ ["WITHSCORES"], else: args
    Redis.command(args)
  end

  @doc """
  Get reverse rank (0 = highest score).
  """
  @spec zrevrank(String.t(), term()) :: {:ok, non_neg_integer() | nil} | {:error, term()}
  def zrevrank(key, member), do: Redis.command(["ZREVRANK", key, member])

  @doc """
  Remove members from sorted set.
  """
  @spec zrem(String.t(), list()) :: {:ok, term()} | {:error, term()}
  def zrem(key, members) when is_list(members), do: Redis.command(["ZREM", key | members])
  @spec zrem(String.t(), term()) :: {:ok, term()} | {:error, term()}
  def zrem(key, member), do: zrem(key, [member])

  @doc """
  Get cardinality (number of members) of sorted set.
  """
  @spec zcard(String.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def zcard(key), do: Redis.command(["ZCARD", key])

  @doc """
  Increment score of a member in sorted set.
  Returns the new score.
  """
  @spec zincrby(String.t(), term(), term()) :: {:ok, String.t()} | {:error, term()}
  def zincrby(key, increment, member), do: Redis.command(["ZINCRBY", key, increment, member])
end
