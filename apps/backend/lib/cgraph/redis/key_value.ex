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
  def get(key) do
    Redis.command(["GET", key])
  end

  @doc """
  Set a value with optional TTL.
  """
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
  def del(keys) when is_list(keys), do: Redis.command(["DEL" | keys])
  def del(key), do: del([key])

  @doc """
  Check if a key exists.
  """
  def exists?(key) do
    case Redis.command(["EXISTS", key]) do
      {:ok, 1} -> true
      _ -> false
    end
  end

  @doc """
  Set expiration on a key.
  """
  def expire(key, seconds) do
    Redis.command(["EXPIRE", key, seconds])
  end

  @doc """
  Get remaining TTL of a key.
  """
  def ttl(key) do
    Redis.command(["TTL", key])
  end

  @doc """
  Increment a counter.
  """
  def incr(key), do: Redis.command(["INCR", key])
  def incrby(key, amount), do: Redis.command(["INCRBY", key, amount])
  def decr(key), do: Redis.command(["DECR", key])
end
