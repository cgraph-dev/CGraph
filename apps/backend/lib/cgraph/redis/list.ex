defmodule CGraph.Redis.List do
  @moduledoc """
  List operations for Redis.

  Provides wrappers around Redis list commands: LPUSH, RPUSH, LRANGE, LLEN.
  """

  alias CGraph.Redis

  @doc """
  Push to the left of a list.
  """
  def lpush(key, values) when is_list(values), do: Redis.command(["LPUSH", key | values])
  def lpush(key, value), do: lpush(key, [value])

  @doc """
  Push to the right of a list.
  """
  def rpush(key, values) when is_list(values), do: Redis.command(["RPUSH", key | values])
  def rpush(key, value), do: rpush(key, [value])

  @doc """
  Get a range from a list.
  """
  def lrange(key, start, stop), do: Redis.command(["LRANGE", key, start, stop])

  @doc """
  Get list length.
  """
  def llen(key), do: Redis.command(["LLEN", key])
end
