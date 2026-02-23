defmodule CGraph.Cache.Distributed.StampedePrevention do
  @moduledoc """
  Cache stampede prevention for the distributed cache.

  Prevents thundering herd problems when popular cache entries expire by using:
  - Locking to ensure only one process regenerates a value
  - Stale-while-revalidate with probabilistic background refresh
  """

  alias CGraph.Cache.Distributed

  @lock_timeout 5_000

  @doc """
  Compute a value with lock-based stampede prevention.
  """
  @spec compute_with_lock(String.t(), (-> term()), keyword()) :: term()
  def compute_with_lock(key, fallback, opts) do
    use_lock = Keyword.get(opts, :lock, true)

    if use_lock do
      lock_key = "lock:#{key}"

      case acquire_lock(lock_key) do
        :ok -> compute_with_held_lock(lock_key, key, fallback, opts)
        :locked -> compute_after_lock_wait(key, fallback, opts)
      end
    else
      value = fallback.()
      Distributed.set(key, value, opts)
      value
    end
  end

  @doc """
  Maybe trigger an async background refresh for stale data.

  10% chance to refresh stale data on access.
  """
  @spec maybe_refresh_async(String.t(), (-> term()), keyword()) :: {:ok, pid()} | nil
  def maybe_refresh_async(key, fallback, opts) do
    if :rand.uniform(10) == 1 do
      Task.Supervisor.start_child(CGraph.TaskSupervisor, fn ->
        compute_with_lock(key, fallback, opts)
      end)
    end
  end

  # Private helpers

  defp compute_with_held_lock(lock_key, key, fallback, opts) do
    value = fallback.()
    Distributed.set(key, value, opts)
    value
  after
    release_lock(lock_key)
  end

  defp compute_after_lock_wait(key, fallback, opts) do
    Process.sleep(50)

    case Distributed.get(key, opts) do
      nil -> fallback.()
      value -> value
    end
  end

  defp acquire_lock(lock_key) do
    now = System.monotonic_time(:millisecond)
    expires = now + @lock_timeout

    case :ets.insert_new(:cache_locks, {lock_key, expires}) do
      true ->
        :ok

      false ->
        # Check if lock expired
        case :ets.lookup(:cache_locks, lock_key) do
          [{^lock_key, exp}] when exp < now ->
            :ets.delete(:cache_locks, lock_key)
            acquire_lock(lock_key)

          _ ->
            :locked
        end
    end
  end

  defp release_lock(lock_key) do
    :ets.delete(:cache_locks, lock_key)
  end
end
