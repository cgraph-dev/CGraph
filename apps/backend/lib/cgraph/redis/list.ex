defmodule CGraph.Redis.List do
  @moduledoc """
  List operations for Redis.

  Provides wrappers around Redis list commands: LPUSH, RPUSH, LRANGE, LLEN.
  """

  alias CGraph.Redis

  @doc """
  Push to the left of a list.
  """
  @spec lpush(String.t(), list() | term()) :: {:ok, integer()} | {:error, term()}
  def lpush(key, values) when is_list(values), do: Redis.command(["LPUSH", key | values])
  def lpush(key, value), do: lpush(key, [value])

  @doc """
  Push to the right of a list.
  """
  @spec rpush(String.t(), list() | term()) :: {:ok, integer()} | {:error, term()}
  def rpush(key, values) when is_list(values), do: Redis.command(["RPUSH", key | values])
  def rpush(key, value), do: rpush(key, [value])

  @doc """
  Get a range from a list.
  """
  @spec lrange(String.t(), integer(), integer()) :: {:ok, list()} | {:error, term()}
  def lrange(key, start, stop), do: Redis.command(["LRANGE", key, start, stop])

  @doc """
  Get list length.
  """
  @spec llen(String.t()) :: {:ok, integer()} | {:error, term()}
  def llen(key), do: Redis.command(["LLEN", key])
end
