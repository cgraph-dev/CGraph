defmodule CGraph.Redis.Hash do
  @moduledoc """
  Hash operations for Redis.

  Provides wrappers around Redis hash commands: HGET, HSET, HGETALL, HDEL.
  """

  alias CGraph.Redis
  alias CGraph.Redis.Helpers

  @doc """
  Get a hash field.
  """
  def hget(key, field), do: Redis.command(["HGET", key, field])

  @doc """
  Set a hash field.
  """
  def hset(key, field, value), do: Redis.command(["HSET", key, field, Helpers.encode_value(value)])

  @doc """
  Get all hash fields and values.
  """
  def hgetall(key) do
    case Redis.command(["HGETALL", key]) do
      {:ok, list} when is_list(list) -> {:ok, list_to_map(list)}
      result -> result
    end
  end

  @doc """
  Delete hash fields.
  """
  def hdel(key, fields) when is_list(fields), do: Redis.command(["HDEL", key | fields])
  def hdel(key, field), do: hdel(key, [field])

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp list_to_map(list) do
    list
    |> Enum.chunk_every(2)
    |> Enum.map(fn [k, v] -> {k, v} end)
    |> Map.new()
  end
end
