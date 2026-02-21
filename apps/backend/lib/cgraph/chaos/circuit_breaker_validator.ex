defmodule CGraph.Chaos.CircuitBreakerValidator do
  @moduledoc """
  Validates circuit breaker (fuse) behavior under fault conditions.

  Tests that fuses trip after the configured threshold and recover
  after the cooldown period.
  """

  require Logger

  @doc """
  Validate that a fuse exists and is in the expected state.
  Returns `:ok` (closed/healthy), `:blown` (open/tripped), or `:not_found`.
  """
  def validate_fuse(fuse_name) do
    case :fuse.ask(fuse_name, :sync) do
      :ok -> :ok
      :blown -> :blown
      {:error, :not_found} -> :not_found
    end
  rescue
    _ -> :not_found
  end

  @doc """
  Stress a fuse by sending N failures until it trips.
  Returns `{:tripped, attempts}` or `{:still_ok, attempts}`.

  ## Options

    * `:max_attempts` - Maximum failures to inject (default: 20)
    * `:delay_between` - ms between failures (default: 10)
  """
  def stress_fuse(fuse_name, opts \\ []) do
    max = Keyword.get(opts, :max_attempts, 20)
    delay = Keyword.get(opts, :delay_between, 10)

    result =
      Enum.reduce_while(1..max, :ok, fn attempt, _acc ->
        :fuse.melt(fuse_name)
        if delay > 0, do: Process.sleep(delay)

        case :fuse.ask(fuse_name, :sync) do
          :blown -> {:halt, {:tripped, attempt}}
          :ok -> {:cont, {:still_ok, attempt}}
          {:error, :not_found} -> {:halt, {:not_found, attempt}}
        end
      end)

    case result do
      {:tripped, n} ->
        Logger.info("chaos_fuse_tripped", fuse_name: fuse_name, failures: n)
        {:tripped, n}

      {:still_ok, n} ->
        Logger.warning("chaos_fuse_not_tripped", fuse_name: fuse_name, failures: n)
        {:still_ok, n}

      {:not_found, _} ->
        Logger.error("chaos_fuse_not_found", fuse_name: fuse_name)
        :not_found
    end
  rescue
    e ->
      Logger.error("chaos_fuse_stress_error", fuse_name: fuse_name, error: inspect(e))
      {:error, e}
  end

  @doc """
  Validate that a blown fuse recovers after its reset period.
  Waits for `wait_ms` then checks if fuse is healthy again.

  Returns `:recovered` or `:still_blown`.
  """
  def validate_recovery(fuse_name, wait_ms \\ 5_000) do
    # Ensure fuse is blown first
    case validate_fuse(fuse_name) do
      :blown ->
        Logger.info("chaos_fuse_recovery_waiting", fuse_name: fuse_name, wait_ms: wait_ms)
        Process.sleep(wait_ms)

        case validate_fuse(fuse_name) do
          :ok ->
            Logger.info("chaos_fuse_recovered", fuse_name: fuse_name)
            :recovered

          :blown ->
            Logger.warning("chaos_fuse_still_blown", fuse_name: fuse_name, wait_ms: wait_ms)
            :still_blown

          :not_found ->
            :not_found
        end

      :ok ->
        Logger.info("chaos_fuse_already_healthy", fuse_name: fuse_name)
        :already_ok

      :not_found ->
        :not_found
    end
  end

  @doc """
  Reset a fuse back to healthy state.
  """
  def reset_fuse(fuse_name) do
    :fuse.reset(fuse_name)
    Logger.info("chaos_fuse_manually_reset", fuse_name: fuse_name)
    :ok
  rescue
    _ -> {:error, :reset_failed}
  end

  @doc """
  Get a list of all known fuse names in the system.
  """
  def known_fuses do
    [
      :redis_fuse,
      :apns_fuse,
      :fcm_fuse,
      :expo_fuse,
      :web_push_fuse,
      :mailer_fuse
    ]
  end

  @doc """
  Validate all known fuses and return a health report.
  """
  def health_report do
    known_fuses()
    |> Enum.map(fn fuse ->
      {fuse, validate_fuse(fuse)}
    end)
    |> Map.new()
  end
end
