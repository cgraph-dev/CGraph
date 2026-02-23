defmodule CGraph.Security.AccountLockout.LockoutLogic do
  @moduledoc false

  require Logger

  alias CGraph.Audit
  alias CGraph.Security.AccountLockout.Storage

  # ============================================================================
  # Lock Checks
  # ============================================================================

  @doc "Checks if an account is currently locked."
  @spec do_check_locked(String.t(), map(), boolean()) :: :ok | {:locked, integer()}
  def do_check_locked(identifier, _config, redis_available) do
    key = Storage.lockout_key(identifier)

    case Storage.get_from_storage(key, redis_available) do
      {:ok, nil} -> :ok
      {:ok, data} -> evaluate_lockout_status(key, data, redis_available)
      {:error, _} -> :ok
    end
  end

  @doc "Checks if an IP address is currently locked."
  @spec do_check_ip_locked(String.t(), map()) :: :ok | {:locked, integer()}
  def do_check_ip_locked(ip, config) do
    if ip in config.whitelist_ips do
      :ok
    else
      check_ip_lockout_status(ip)
    end
  end

  # ============================================================================
  # Record Failure
  # ============================================================================

  @doc "Records a failed authentication attempt."
  @spec do_record_failure(String.t(), String.t() | nil, keyword(), map()) :: :ok | {:locked, integer()}
  def do_record_failure(identifier, ip, opts, config) do
    attempts_key = Storage.attempts_key(identifier)
    lockout_key = Storage.lockout_key(identifier)

    # Increment attempt counter
    attempts = Storage.increment_attempts(attempts_key, config.attempt_window)

    # Log the failed attempt
    log_failed_attempt(identifier, ip, attempts, opts)

    if attempts >= config.max_attempts do
      # Calculate lockout duration (progressive)
      lock_count = Storage.get_lock_count(identifier)
      duration = calculate_lockout_duration(lock_count, config)

      # Set the lockout
      locked_until = DateTime.utc_now() |> DateTime.add(duration, :second)

      lockout_data = %{
        locked: true,
        locked_until: DateTime.to_iso8601(locked_until),
        attempts: attempts,
        lock_count: lock_count + 1,
        locked_at: DateTime.to_iso8601(DateTime.utc_now()),
        ip_address: ip
      }

      Storage.set_in_redis(lockout_key, Jason.encode!(lockout_data), duration)
      Storage.increment_lock_count(identifier)

      # Also lock the IP if provided (prevents account enumeration)
      if ip do
        lock_ip(ip, duration)
      end

      # Emit telemetry and audit log
      emit_account_locked(identifier, duration, attempts, ip)

      {:locked, duration}
    else
      :ok
    end
  end

  # ============================================================================
  # Clear / Unlock
  # ============================================================================

  @doc "Clears failed authentication attempts."
  @spec do_clear_attempts(String.t()) :: :ok
  def do_clear_attempts(identifier) do
    attempts_key = Storage.attempts_key(identifier)
    Storage.delete_from_redis(attempts_key)
    :ok
  end

  @doc "Performs an administrative account unlock."
  @spec do_admin_unlock(String.t(), String.t()) :: :ok
  def do_admin_unlock(identifier, admin_id) do
    lockout_key = Storage.lockout_key(identifier)
    attempts_key = Storage.attempts_key(identifier)

    # Clear both lockout and attempts
    Storage.delete_from_redis(lockout_key)
    Storage.delete_from_redis(attempts_key)

    # Audit log
    Audit.log(:admin, :account_unlocked, %{
      target_user: identifier,
      admin_id: admin_id,
      reason: "manual_unlock"
    })

    emit_account_unlocked(identifier, admin_id)

    Logger.info("account_unlocked_by_admin", identifier: identifier, admin_id: admin_id)
    :ok
  rescue
    _ -> :ok
  end

  # ============================================================================
  # Info
  # ============================================================================

  @doc "Retrieves lockout information for an account."
  @spec do_get_info(String.t()) :: map()
  def do_get_info(identifier) do
    lockout_key = Storage.lockout_key(identifier)
    attempts_key = Storage.attempts_key(identifier)

    lockout_data = case Storage.get_from_redis(lockout_key) do
      {:ok, nil} -> nil
      {:ok, data} -> parse_lockout_data(data)
      _ -> nil
    end

    attempts = case Storage.get_from_redis(attempts_key) do
      {:ok, nil} -> 0
      {:ok, count} when is_binary(count) -> String.to_integer(count)
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end

    if lockout_data && lockout_data.locked do
      remaining = DateTime.diff(lockout_data.locked_until, DateTime.utc_now())
      %{
        locked: remaining > 0,
        attempts: attempts,
        locked_until: lockout_data.locked_until,
        remaining_seconds: max(0, remaining)
      }
    else
      %{
        locked: false,
        attempts: attempts,
        locked_until: nil,
        remaining_seconds: 0
      }
    end
  end

  # ============================================================================
  # Helpers
  # ============================================================================

  @doc "Normalizes an account identifier for lockout tracking."
  @spec normalize_identifier(String.t()) :: String.t()
  def normalize_identifier(identifier) do
    identifier
    |> String.downcase()
    |> String.trim()
  end

  @doc "Calculates the lockout duration based on attempt count."
  @spec calculate_lockout_duration(non_neg_integer(), map()) :: non_neg_integer()
  def calculate_lockout_duration(lock_count, config) do
    base = config.lockout_duration
    multiplier = config.progressive_multiplier
    max_duration = config.max_lockout_duration

    # Progressive duration: base * multiplier^lock_count
    duration = base * :math.pow(multiplier, lock_count) |> round()
    min(duration, max_duration)
  end

  @doc "Parses stored lockout data into a structured format."
  @spec parse_lockout_data(binary() | nil) :: map() | nil
  def parse_lockout_data(nil), do: nil
  def parse_lockout_data(data) when is_binary(data) do
    case Jason.decode(data) do
      {:ok, %{"locked" => locked, "locked_until" => until}} ->
        {:ok, dt, _} = DateTime.from_iso8601(until)
        %{locked: locked, locked_until: dt}
      _ -> nil
    end
  end

  # ============================================================================
  # Private
  # ============================================================================

  defp evaluate_lockout_status(key, data, redis_available) do
    case parse_lockout_data(data) do
      %{locked: true, locked_until: until} -> check_lockout_expiry(key, until, redis_available)
      _ -> :ok
    end
  end

  defp check_lockout_expiry(key, until, redis_available) do
    remaining = DateTime.diff(until, DateTime.utc_now())

    if remaining > 0 do
      {:locked, remaining}
    else
      Storage.delete_from_storage(key, redis_available)
      :ok
    end
  end

  defp check_ip_lockout_status(ip) do
    key = Storage.ip_lockout_key(ip)
    redis_avail = Storage.redis_available?()

    case Storage.get_from_storage(key, redis_avail) do
      {:ok, nil} -> :ok
      {:ok, data} -> evaluate_lockout_status(key, data, redis_avail)
      {:error, _} -> :ok
    end
  end

  defp lock_ip(ip, duration) do
    key = Storage.ip_lockout_key(ip)
    data = %{
      locked: true,
      locked_until: DateTime.utc_now() |> DateTime.add(duration, :second) |> DateTime.to_iso8601()
    }
    Storage.set_in_redis(key, Jason.encode!(data), duration)
  end

  defp log_failed_attempt(identifier, ip, attempts, opts) do
    metadata = Keyword.get(opts, :metadata, %{})

    Audit.log(:auth, :login_failed, %{
      identifier: identifier,
      ip_address: ip,
      attempts: attempts,
      metadata: metadata
    })
  rescue
    _ -> :ok
  end

  defp emit_account_locked(identifier, duration, attempts, ip) do
    :telemetry.execute(
      [:cgraph, :security, :account_locked],
      %{duration: duration, attempts: attempts},
      %{identifier: identifier, ip_address: ip}
    )

    Audit.log(:security, :account_locked, %{
      identifier: identifier,
      duration_seconds: duration,
      attempts: attempts,
      ip_address: ip
    })

    Logger.warning("account_locked_after_failed_attempts", identifier: identifier, attempts: attempts)
  rescue
    _ -> :ok
  end

  defp emit_account_unlocked(identifier, admin_id) do
    :telemetry.execute(
      [:cgraph, :security, :account_unlocked],
      %{count: 1},
      %{identifier: identifier, admin_id: admin_id}
    )
  end
end
