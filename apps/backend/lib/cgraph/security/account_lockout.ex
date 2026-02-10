defmodule CGraph.Security.AccountLockout do
  @moduledoc """
  Account lockout system with persistent state using Redis.

  ## Overview

  Implements progressive account lockout to prevent brute force attacks:

  - **Threshold-based**: Lock after N failed attempts
  - **Progressive**: Increasing lockout duration with each violation
  - **Distributed**: Redis-backed for multi-node support
  - **Smart Unlock**: Automatic unlock after cooldown or manual admin action

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    ACCOUNT LOCKOUT SYSTEM                       │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Login Attempt                                                  │
  │        │                                                         │
  │        ▼                                                         │
  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
  │   │ Check Lock  │────►│ Validate   │────►│ Update State│       │
  │   │   Status    │     │ Credentials │     │ (pass/fail) │       │
  │   └─────────────┘     └─────────────┘     └─────────────┘       │
  │         │                                        │              │
  │         │ Locked?                               │ Failed?       │
  │         ▼                                        ▼              │
  │   ┌─────────────┐                        ┌─────────────┐        │
  │   │   Reject    │                        │ Increment   │        │
  │   │  + Cooldown │                        │  Counter    │        │
  │   └─────────────┘                        └──────┬──────┘        │
  │                                                  │              │
  │                                           Threshold?            │
  │                                                  │              │
  │                                           ┌──────▼──────┐       │
  │                                           │    Lock     │       │
  │                                           │   Account   │       │
  │                                           └─────────────┘       │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Configuration

      config :cgraph, CGraph.Security.AccountLockout,
        max_attempts: 5,
        lockout_duration: 900,  # 15 minutes
        progressive_multiplier: 2,
        max_lockout_duration: 86400,  # 24 hours
        attempt_window: 3600,  # 1 hour
        whitelist_ips: ["127.0.0.1"]

  ## Usage

      # Before authentication
      case AccountLockout.check_locked(user_id_or_email) do
        :ok -> proceed_with_auth()
        {:locked, remaining_seconds} -> reject_with_lockout(remaining_seconds)
      end

      # After failed authentication
      AccountLockout.record_failed_attempt(user_id_or_email, ip_address)

      # After successful authentication
      AccountLockout.clear_attempts(user_id_or_email)

      # Admin unlock
      AccountLockout.admin_unlock(user_id, admin_id)

  ## Telemetry Events

  - `[:cgraph, :security, :login_failed]` - Failed login attempt
  - `[:cgraph, :security, :account_locked]` - Account locked
  - `[:cgraph, :security, :account_unlocked]` - Account unlocked
  """

  use GenServer
  require Logger

  alias CGraph.Audit

  @redis_prefix "account_lockout:"
  @ip_prefix "ip_lockout:"

  # Default configuration
  @default_max_attempts 5
  @default_lockout_duration 900  # 15 minutes
  @default_progressive_multiplier 2
  @default_max_lockout_duration 86_400  # 24 hours
  @default_attempt_window 3600  # 1 hour window for counting attempts

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type account_identifier :: String.t()
  @type ip_address :: String.t()
  @type lockout_info :: %{
    locked: boolean(),
    attempts: non_neg_integer(),
    locked_until: DateTime.t() | nil,
    remaining_seconds: non_neg_integer()
  }

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Start the account lockout GenServer.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Check if an account is currently locked.

  Returns:
  - `:ok` if not locked and can proceed with authentication
  - `{:locked, remaining_seconds}` if account is locked
  """
  @spec check_locked(account_identifier()) :: :ok | {:locked, non_neg_integer()}
  def check_locked(identifier) when is_binary(identifier) do
    GenServer.call(__MODULE__, {:check_locked, normalize_identifier(identifier)})
  end

  @doc """
  Check if an IP address is locked.

  Used for IP-based rate limiting in addition to account-based lockout.
  """
  @spec check_ip_locked(ip_address()) :: :ok | {:locked, non_neg_integer()}
  def check_ip_locked(ip_address) when is_binary(ip_address) do
    GenServer.call(__MODULE__, {:check_ip_locked, ip_address})
  end

  @doc """
  Record a failed login attempt.

  Increments the failure counter and potentially locks the account.

  ## Options

  - `:ip_address` - The IP address of the request
  - `:metadata` - Additional metadata for audit logging
  """
  @spec record_failed_attempt(account_identifier(), keyword()) :: :ok | {:locked, non_neg_integer()}
  def record_failed_attempt(identifier, opts \\ []) when is_binary(identifier) do
    ip = Keyword.get(opts, :ip_address)
    GenServer.call(__MODULE__, {:record_failure, normalize_identifier(identifier), ip, opts})
  end

  @doc """
  Clear all failed attempts for an identifier (after successful login).
  """
  @spec clear_attempts(account_identifier()) :: :ok
  def clear_attempts(identifier) when is_binary(identifier) do
    GenServer.call(__MODULE__, {:clear_attempts, normalize_identifier(identifier)})
  end

  @doc """
  Manually unlock an account (admin action).

  ## Parameters

  - `identifier` - The user ID or email that was locked
  - `admin_id` - The admin performing the unlock
  """
  @spec admin_unlock(account_identifier(), String.t()) :: :ok
  def admin_unlock(identifier, admin_id) when is_binary(identifier) and is_binary(admin_id) do
    GenServer.call(__MODULE__, {:admin_unlock, normalize_identifier(identifier), admin_id})
  end

  @doc """
  Get lockout information for an identifier.
  """
  @spec get_lockout_info(account_identifier()) :: lockout_info()
  def get_lockout_info(identifier) when is_binary(identifier) do
    GenServer.call(__MODULE__, {:get_info, normalize_identifier(identifier)})
  end

  @doc """
  Get statistics about lockouts.
  """
  @spec stats() :: map()
  def stats do
    GenServer.call(__MODULE__, :stats)
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl true
  def init(_opts) do
    config = load_config()
    redis_available = redis_available?()

    # Create ETS table for fallback storage when Redis isn't available
    unless redis_available do
      :ets.new(:account_lockout_cache, [:set, :public, :named_table, read_concurrency: true])
    end

    state = %{
      config: config,
      locks_issued: 0,
      started_at: DateTime.utc_now(),
      redis_available: redis_available
    }

    if redis_available do
      Logger.info("accountlockout_started_with_max_attempts_redis_bac", config_max_attempts: config.max_attempts)
    else
      Logger.info("accountlockout_started_with_max_attempts_ets_fallb", config_max_attempts: config.max_attempts)
    end

    {:ok, state}
  end

  defp redis_available? do
    case System.get_env("REDIS_URL") do
      nil -> false
      "" -> false
      _url -> Process.whereis(:redix) != nil
    end
  end

  @impl true
  def handle_call({:check_locked, identifier}, _from, state) do
    result = do_check_locked(identifier, state.config, state.redis_available)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:check_ip_locked, ip}, _from, state) do
    result = do_check_ip_locked(ip, state.config)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:record_failure, identifier, ip, opts}, _from, state) do
    result = do_record_failure(identifier, ip, opts, state.config)

    new_state = case result do
      {:locked, _} -> %{state | locks_issued: state.locks_issued + 1}
      _ -> state
    end

    {:reply, result, new_state}
  end

  @impl true
  def handle_call({:clear_attempts, identifier}, _from, state) do
    do_clear_attempts(identifier)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:admin_unlock, identifier, admin_id}, _from, state) do
    do_admin_unlock(identifier, admin_id)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:get_info, identifier}, _from, state) do
    info = do_get_info(identifier)
    {:reply, info, state}
  end

  @impl true
  def handle_call(:stats, _from, state) do
    stats = %{
      locks_issued: state.locks_issued,
      started_at: state.started_at,
      uptime_seconds: DateTime.diff(DateTime.utc_now(), state.started_at),
      config: state.config
    }
    {:reply, stats, state}
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp load_config do
    app_config = Application.get_env(:cgraph, __MODULE__, [])

    %{
      max_attempts: Keyword.get(app_config, :max_attempts, @default_max_attempts),
      lockout_duration: Keyword.get(app_config, :lockout_duration, @default_lockout_duration),
      progressive_multiplier: Keyword.get(app_config, :progressive_multiplier, @default_progressive_multiplier),
      max_lockout_duration: Keyword.get(app_config, :max_lockout_duration, @default_max_lockout_duration),
      attempt_window: Keyword.get(app_config, :attempt_window, @default_attempt_window),
      whitelist_ips: Keyword.get(app_config, :whitelist_ips, [])
    }
  end

  defp do_check_locked(identifier, _config, redis_available) do
    key = lockout_key(identifier)

    case get_from_storage(key, redis_available) do
      {:ok, nil} -> :ok
      {:ok, data} -> evaluate_lockout_status(key, data, redis_available)
      {:error, _} -> :ok
    end
  end

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
      delete_from_storage(key, redis_available)
      :ok
    end
  end

  defp do_check_ip_locked(ip, config) do
    if ip in config.whitelist_ips do
      :ok
    else
      check_ip_lockout_status(ip)
    end
  end

  defp check_ip_lockout_status(ip) do
    key = ip_lockout_key(ip)
    redis_avail = redis_available?()

    case get_from_storage(key, redis_avail) do
      {:ok, nil} -> :ok
      {:ok, data} -> evaluate_lockout_status(key, data, redis_avail)
      {:error, _} -> :ok
    end
  end

  defp do_record_failure(identifier, ip, opts, config) do
    attempts_key = attempts_key(identifier)
    lockout_key = lockout_key(identifier)

    # Increment attempt counter
    attempts = increment_attempts(attempts_key, config.attempt_window)

    # Log the failed attempt
    log_failed_attempt(identifier, ip, attempts, opts)

    if attempts >= config.max_attempts do
      # Calculate lockout duration (progressive)
      lock_count = get_lock_count(identifier)
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

      set_in_redis(lockout_key, Jason.encode!(lockout_data), duration)
      increment_lock_count(identifier)

      # Also lock the IP if provided (prevents account enumeration)
      if ip do
        lock_ip(ip, duration, config)
      end

      # Emit telemetry and audit log
      emit_account_locked(identifier, duration, attempts, ip)

      {:locked, duration}
    else
      :ok
    end
  end

  defp do_clear_attempts(identifier) do
    attempts_key = attempts_key(identifier)
    delete_from_redis(attempts_key)
    :ok
  end

  defp do_admin_unlock(identifier, admin_id) do
    lockout_key = lockout_key(identifier)
    attempts_key = attempts_key(identifier)

    # Clear both lockout and attempts
    delete_from_redis(lockout_key)
    delete_from_redis(attempts_key)

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

  defp do_get_info(identifier) do
    lockout_key = lockout_key(identifier)
    attempts_key = attempts_key(identifier)

    lockout_data = case get_from_redis(lockout_key) do
      {:ok, nil} -> nil
      {:ok, data} -> parse_lockout_data(data)
      _ -> nil
    end

    attempts = case get_from_redis(attempts_key) do
      {:ok, nil} -> 0
      {:ok, count} -> String.to_integer(count)
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

  # Helper functions

  defp normalize_identifier(identifier) do
    identifier
    |> String.downcase()
    |> String.trim()
  end

  defp lockout_key(identifier), do: "#{@redis_prefix}lock:#{identifier}"
  defp attempts_key(identifier), do: "#{@redis_prefix}attempts:#{identifier}"
  defp lock_count_key(identifier), do: "#{@redis_prefix}lock_count:#{identifier}"
  defp ip_lockout_key(ip), do: "#{@ip_prefix}#{ip}"

  defp increment_attempts(key, window) do
    redis_avail = redis_available?()

    if redis_avail do
      try do
        case Redix.command(:redix, ["INCR", key]) do
          {:ok, count} ->
            # Set expiry only on first attempt
            if count == 1 do
              Redix.command(:redix, ["EXPIRE", key, window])
            end
            count
          {:error, _} -> 1
        end
      rescue
        _ -> ets_increment_attempts(key, window)
      catch
        :exit, _ -> ets_increment_attempts(key, window)
      end
    else
      ets_increment_attempts(key, window)
    end
  end

  defp ets_increment_attempts(key, window) do
    try do
      case :ets.lookup(:account_lockout_cache, key) do
        [{^key, count, _expiry}] ->
          new_count = count + 1
          expiry = DateTime.add(DateTime.utc_now(), window, :second)
          :ets.insert(:account_lockout_cache, {key, new_count, expiry})
          new_count
        [] ->
          expiry = DateTime.add(DateTime.utc_now(), window, :second)
          :ets.insert(:account_lockout_cache, {key, 1, expiry})
          1
      end
    rescue
      ArgumentError -> 1
    end
  end

  defp get_lock_count(identifier) do
    key = lock_count_key(identifier)
    case get_from_redis(key) do
      {:ok, nil} -> 0
      {:ok, count} -> String.to_integer(count)
      _ -> 0
    end
  end

  defp increment_lock_count(identifier) do
    key = lock_count_key(identifier)
    redis_avail = redis_available?()

    if redis_avail do
      try do
        # Lock count persists for 24 hours
        Redix.command(:redix, ["INCR", key])
        Redix.command(:redix, ["EXPIRE", key, 86_400])
      rescue
        _ -> ets_increment_lock_count(key)
      catch
        :exit, _ -> ets_increment_lock_count(key)
      end
    else
      ets_increment_lock_count(key)
    end
  end

  defp ets_increment_lock_count(key) do
    try do
      case :ets.lookup(:account_lockout_cache, key) do
        [{^key, count, _expiry}] ->
          new_count = count + 1
          expiry = DateTime.add(DateTime.utc_now(), 86_400, :second)
          :ets.insert(:account_lockout_cache, {key, new_count, expiry})
          new_count
        [] ->
          expiry = DateTime.add(DateTime.utc_now(), 86_400, :second)
          :ets.insert(:account_lockout_cache, {key, 1, expiry})
          1
      end
    rescue
      ArgumentError -> 1
    end
  end

  defp calculate_lockout_duration(lock_count, config) do
    base = config.lockout_duration
    multiplier = config.progressive_multiplier
    max_duration = config.max_lockout_duration

    # Progressive duration: base * multiplier^lock_count
    duration = base * :math.pow(multiplier, lock_count) |> round()
    min(duration, max_duration)
  end

  defp lock_ip(ip, duration, _config) do
    key = ip_lockout_key(ip)
    data = %{
      locked: true,
      locked_until: DateTime.utc_now() |> DateTime.add(duration, :second) |> DateTime.to_iso8601()
    }
    set_in_redis(key, Jason.encode!(data), duration)
  end

  defp parse_lockout_data(nil), do: nil
  defp parse_lockout_data(data) when is_binary(data) do
    case Jason.decode(data) do
      {:ok, %{"locked" => locked, "locked_until" => until}} ->
        {:ok, dt, _} = DateTime.from_iso8601(until)
        %{locked: locked, locked_until: dt}
      _ -> nil
    end
  end

  # Storage operations (Redis with ETS fallback)

  defp get_from_storage(key, true = _redis_available) do
    Redix.command(:redix, ["GET", key])
  rescue
    _ -> {:ok, nil}
  catch
    :exit, _ -> {:ok, nil}
  end

  defp get_from_storage(key, false = _redis_available) do
    case :ets.lookup(:account_lockout_cache, key) do
      [{^key, value, expiry}] ->
        if DateTime.compare(DateTime.utc_now(), expiry) == :lt do
          {:ok, value}
        else
          :ets.delete(:account_lockout_cache, key)
          {:ok, nil}
        end
      [] -> {:ok, nil}
    end
  rescue
    ArgumentError -> {:ok, nil}
  end

  defp set_in_storage(key, value, ttl, true = _redis_available) do
    Redix.command(:redix, ["SETEX", key, ttl, value])
  rescue
    _ -> {:error, :redis_unavailable}
  catch
    :exit, _ -> {:error, :redis_unavailable}
  end

  defp set_in_storage(key, value, ttl, false = _redis_available) do
    expiry = DateTime.add(DateTime.utc_now(), ttl, :second)
    :ets.insert(:account_lockout_cache, {key, value, expiry})
    {:ok, "OK"}
  rescue
    ArgumentError -> {:error, :ets_unavailable}
  end

  defp delete_from_storage(key, true = _redis_available) do
    Redix.command(:redix, ["DEL", key])
  rescue
    _ -> {:ok, 0}
  catch
    :exit, _ -> {:ok, 0}
  end

  defp delete_from_storage(key, false = _redis_available) do
    :ets.delete(:account_lockout_cache, key)
    {:ok, 1}
  rescue
    ArgumentError -> {:ok, 0}
  end

  # Legacy Redis operations (kept for compatibility but wrapped)
  defp get_from_redis(key) do
    get_from_storage(key, redis_available?())
  end

  defp set_in_redis(key, value, ttl) do
    set_in_storage(key, value, ttl, redis_available?())
  end

  defp delete_from_redis(key) do
    delete_from_storage(key, redis_available?())
  end

  # Logging and telemetry

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

    Logger.warning("Account locked: #{identifier} after #{attempts} failed attempts")
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
