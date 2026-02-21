defmodule CGraph.Cache.L3 do
  @moduledoc """
  L3 Cache tier — Redis for distributed caching.

  Provides low-millisecond lookups over the network.
  Values are serialised with `:erlang.term_to_binary/1` and
  deserialised with the `:safe` flag to prevent arbitrary atom
  creation.
  """

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc false
  def get(key) do
    redis_key = "cache:#{key}"

    case CGraph.Redis.command(["GET", redis_key]) do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, data} ->
        {:ok, :erlang.binary_to_term(data, [:safe])}

      {:error, _} = error ->
        error
    end
  rescue
    _ -> {:error, :redis_unavailable}
  end

  @doc false
  def set(key, value, ttl) do
    redis_key = "cache:#{key}"
    data = :erlang.term_to_binary(value)

    cmd =
      if ttl == :infinity do
        ["SET", redis_key, data]
      else
        ["SETEX", redis_key, div(ttl, 1000), data]
      end

    case CGraph.Redis.command(cmd) do
      {:ok, _} -> :ok
      {:error, _} = error -> error
    end
  rescue
    _ -> {:error, :redis_unavailable}
  end

  @doc false
  def delete(key) do
    redis_key = "cache:#{key}"
    CGraph.Redis.command(["DEL", redis_key])
    :ok
  rescue
    _ -> :ok
  end

  @doc """
  Delete all Redis keys matching a glob-style `pattern`.

  Uses SCAN + pipelined DEL instead of KEYS to avoid blocking
  all Redis clients at scale.
  """
  def delete_pattern(pattern) do
    redis_pattern = "cache:#{pattern}"
    {:ok, _count} = CGraph.Redis.scan_and_delete(redis_pattern)
    :ok
  rescue
    _ -> :ok
  end

  @doc false
  def stats do
    case CGraph.Redis.command(["INFO", "memory"]) do
      {:ok, info} -> parse_info(info)
      _ -> %{}
    end
  rescue
    _ -> %{}
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp parse_info(info) when is_binary(info) do
    info
    |> String.split("\r\n")
    |> Enum.filter(&String.contains?(&1, ":"))
    |> Enum.map(fn line ->
      [key, value] = String.split(line, ":", parts: 2)
      {key, value}
    end)
    |> Map.new()
  end

  defp parse_info(_), do: %{}
end
