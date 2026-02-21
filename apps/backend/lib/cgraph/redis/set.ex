defmodule CGraph.Redis.Set do
  @moduledoc """
  Set operations for Redis.

  Provides wrappers around Redis set commands: SADD, SMEMBERS, SISMEMBER, SREM.
  """

  alias CGraph.Redis

  @doc """
  Add members to a set.
  """
  def sadd(key, members) when is_list(members), do: Redis.command(["SADD", key | members])
  def sadd(key, member), do: sadd(key, [member])

  @doc """
  Get all set members.
  """
  def smembers(key), do: Redis.command(["SMEMBERS", key])

  @doc """
  Check if a member is in a set.
  """
  def sismember?(key, member) do
    case Redis.command(["SISMEMBER", key, member]) do
      {:ok, 1} -> true
      _ -> false
    end
  end

  @doc """
  Remove members from a set.
  """
  def srem(key, members) when is_list(members), do: Redis.command(["SREM", key | members])
  def srem(key, member), do: srem(key, [member])
end
