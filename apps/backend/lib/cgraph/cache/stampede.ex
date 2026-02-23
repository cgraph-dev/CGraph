defmodule CGraph.Cache.Stampede do
  @moduledoc """
  Stampede protection for cache fetches.

  Prevents multiple concurrent callers from computing the same
  expensive value on a cache miss by using a Redis-based distributed
  lock with exponential backoff.
  """

  @max_attempts 5

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Fetch a value using a distributed lock to prevent stampedes.

  Acquires a Redis lock, double-checks the cache, and only then
  computes the value. Retries with exponential backoff if the lock
  is held by another caller.
  """
  @spec fetch_with_lock(String.t(), (-> term()), keyword()) :: term()
  def fetch_with_lock(key, compute_fn, opts) do
    lock_key = "lock:#{key}"
    do_fetch(key, compute_fn, opts, lock_key, 0)
  end

  @doc """
  Compute a value and write it into the cache.
  """
  @spec compute_and_cache(String.t(), (-> term()), keyword()) :: term()
  def compute_and_cache(key, compute_fn, opts) do
    value = compute_fn.()
    CGraph.Cache.set(key, value, opts)
    value
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  # Max retries exhausted — compute without lock to avoid deadlock
  defp do_fetch(key, compute_fn, opts, _lock_key, attempt) when attempt >= @max_attempts do
    compute_and_cache(key, compute_fn, opts)
  end

  defp do_fetch(key, compute_fn, opts, lock_key, attempt) do
    case acquire_lock(lock_key) do
      :ok ->
        try do
          # Double-check if value was cached while waiting
          case CGraph.Cache.get(key) do
            {:ok, value} -> value
            _ -> compute_and_cache(key, compute_fn, opts)
          end
        after
          release_lock(lock_key)
        end

      :locked ->
        # Exponential backoff: 25ms, 50ms, 100ms, 200ms, 400ms
        backoff_ms = 25 * :math.pow(2, attempt) |> trunc()
        Process.sleep(backoff_ms)

        case CGraph.Cache.get(key) do
          {:ok, value} ->
            value

          _ ->
            do_fetch(key, compute_fn, opts, lock_key, attempt + 1)
        end
    end
  end

  defp acquire_lock(lock_key) do
    case CGraph.Redis.command(["SET", lock_key, "1", "NX", "EX", "5"]) do
      {:ok, "OK"} -> :ok
      _ -> :locked
    end
  rescue
    # Proceed without lock if Redis unavailable
    _ -> :ok
  end

  defp release_lock(lock_key) do
    CGraph.Redis.command(["DEL", lock_key])
  rescue
    _ -> :ok
  end
end
