defmodule CGraph.Redis.KeyValue do
  @moduledoc """
  Key-value convenience operations for Redis.

  Provides typed wrappers around basic Redis key-value commands
  including GET, SET, DEL, EXISTS, EXPIRE, TTL, and counter operations.
  """

  alias CGraph.Redis
  alias CGraph.Redis.Helpers

  @doc """
  Get a value.
  """
  @spec get(String.t()) :: {:ok, String.t() | nil} | {:error, term()}
  def get(key) do
    Redis.command(["GET", key])
  end

  @doc """
  Set a value with optional TTL.
  """
  @spec set(String.t(), term(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def set(key, value, opts \\ []) do
    ttl = Keyword.get(opts, :ttl)
    nx = Keyword.get(opts, :nx, false)
    xx = Keyword.get(opts, :xx, false)

    args = ["SET", key, Helpers.encode_value(value)]

    args = if ttl, do: args ++ ["EX", ttl], else: args
    args = if nx, do: args ++ ["NX"], else: args
    args = if xx, do: args ++ ["XX"], else: args

    Redis.command(args)
  end

  @doc """
  Delete one or more keys.
  """
  @spec del([String.t()] | String.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def del(keys) when is_list(keys), do: Redis.command(["DEL" | keys])
  def del(key), do: del([key])

  @doc """
  Check if a key exists.
  """
  @spec exists?(String.t()) :: boolean()
  def exists?(key) do
    case Redis.command(["EXISTS", key]) do
      {:ok, 1} -> true
      _ -> false
    end
  end

  @doc """
  Set expiration on a key.
  """
  @spec expire(String.t(), pos_integer()) :: {:ok, non_neg_integer()} | {:error, term()}
  def expire(key, seconds) do
    Redis.command(["EXPIRE", key, seconds])
  end

  @doc """
  Get remaining TTL of a key.
  """
  @spec ttl(String.t()) :: {:ok, integer()} | {:error, term()}
  def ttl(key) do
    Redis.command(["TTL", key])
  end

  @doc """
  Increment a counter.
  """
  @spec incr(String.t()) :: {:ok, integer()} | {:error, term()}
  def incr(key), do: Redis.command(["INCR", key])

  @spec incrby(String.t(), integer()) :: {:ok, integer()} | {:error, term()}
  def incrby(key, amount), do: Redis.command(["INCRBY", key, amount])

  @spec decr(String.t()) :: {:ok, integer()} | {:error, term()}
  def decr(key), do: Redis.command(["DECR", key])
end
