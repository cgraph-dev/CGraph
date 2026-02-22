defmodule CGraph.Redis.Scan do
  @moduledoc """
  SCAN-based helpers for Redis.

  Provides safe, non-blocking alternatives to the KEYS command using
  Redis SCAN with streaming and batch processing.
  """

  alias CGraph.Redis

  @doc """
  Scan keys matching a pattern using SCAN (non-blocking).

  Returns a stream of matching keys. Use instead of KEYS which blocks Redis.

  ## Options
  - `:count` - Hint for items per SCAN iteration (default: 100)

  ## Example

      Redis.scan_keys("user:*:sessions") |> Enum.to_list()
  """
  @spec scan_keys(String.t(), keyword()) :: Enumerable.t()
  def scan_keys(pattern, opts \\ []) do
    count = Keyword.get(opts, :count, 100)

    Stream.unfold("0", fn
      :done ->
        nil

      cursor ->
        case Redis.command(["SCAN", cursor, "MATCH", pattern, "COUNT", to_string(count)]) do
          {:ok, [next_cursor, keys]} ->
            next = if next_cursor == "0", do: :done, else: next_cursor
            {keys, next}

          _ ->
            nil
        end
    end)
    |> Stream.flat_map(& &1)
  end

  @doc """
  Scan and delete all keys matching a pattern.

  Uses SCAN + pipelined DEL in batches of 100 keys.
  Safe for production (non-blocking).

  Returns the count of deleted keys.

  ## Example

      {:ok, 42} = Redis.scan_and_delete("cache:user:*")
  """
  @spec scan_and_delete(String.t(), keyword()) :: {:ok, non_neg_integer()}
  def scan_and_delete(pattern, opts \\ []) do
    batch_size = Keyword.get(opts, :batch_size, 100)

    deleted_count =
      scan_keys(pattern, opts)
      |> Stream.chunk_every(batch_size)
      |> Enum.reduce(0, fn batch, acc ->
        case Redis.pipeline(Enum.map(batch, fn key -> ["DEL", key] end)) do
          {:ok, results} ->
            batch_deleted = results |> Enum.filter(&match?({:ok, 1}, &1)) |> length()
            acc + batch_deleted

          _ ->
            acc
        end
      end)

    {:ok, deleted_count}
  end

  @doc """
  Scan keys and apply a function to each batch.

  ## Example

      Redis.scan_and_process("session:*", fn keys ->
        Enum.each(keys, &process_session/1)
      end)
  """
  @spec scan_and_process(String.t(), (list() -> any()), keyword()) :: :ok
  def scan_and_process(pattern, process_fn, opts \\ []) when is_function(process_fn, 1) do
    batch_size = Keyword.get(opts, :batch_size, 100)

    scan_keys(pattern, opts)
    |> Stream.chunk_every(batch_size)
    |> Enum.each(process_fn)

    :ok
  end

  @doc """
  Pipeline DEL for a list of keys in batches.

  More efficient than individual DEL commands. Reduces round-trips.

  ## Example

      Redis.pipeline_delete(["key1", "key2", ..., "key200"])
  """
  @spec pipeline_delete(list(), pos_integer()) :: non_neg_integer()
  def pipeline_delete(keys, batch_size \\ 100) when is_list(keys) do
    keys
    |> Enum.chunk_every(batch_size)
    |> Enum.reduce(0, fn batch, acc ->
      case Redis.pipeline(Enum.map(batch, fn key -> ["DEL", key] end)) do
        {:ok, results} ->
          batch_deleted = results |> Enum.filter(&match?({:ok, 1}, &1)) |> length()
          acc + batch_deleted

        _ ->
          acc
      end
    end)
  end
end
