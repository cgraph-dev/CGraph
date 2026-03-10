defmodule CGraph.Security.AccountLockout do
  @moduledoc """
  Account lockout system with persistent state using Redis.

  Implements progressive account lockout to prevent brute force attacks:

  - **Threshold-based**: Lock after N failed attempts
  - **Progressive**: Increasing lockout duration with each violation
  - **Distributed**: Redis-backed for multi-node support
  - **Smart Unlock**: Automatic unlock after cooldown or manual admin action

  ## Configuration

      config :cgraph, CGraph.Security.AccountLockout,
        max_attempts: 5,
        lockout_duration: 900,
        progressive_multiplier: 2,
        max_lockout_duration: 86400,
        attempt_window: 3600,
        whitelist_ips: ["127.0.0.1"]

  ## Usage

      case AccountLockout.check_locked(user_id_or_email) do
        :ok -> proceed_with_auth()
        {:locked, remaining_seconds} -> reject_with_lockout(remaining_seconds)
      end

      AccountLockout.record_failed_attempt(user_id_or_email, ip_address)
      AccountLockout.clear_attempts(user_id_or_email)
      AccountLockout.admin_unlock(user_id, admin_id)
  """

  use GenServer
  require Logger

  alias CGraph.Security.AccountLockout.{LockoutLogic, Storage}

  # Default configuration
  @default_max_attempts 5
  @default_lockout_duration 900
  @default_progressive_multiplier 2
  @default_max_lockout_duration 86_400
  @default_attempt_window 3600

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
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Check if an account is currently locked.
  """
  @spec check_locked(account_identifier()) :: :ok | {:locked, non_neg_integer()}
  def check_locked(identifier) when is_binary(identifier) do
    GenServer.call(__MODULE__, {:check_locked, LockoutLogic.normalize_identifier(identifier)})
  end

  @doc """
  Check if an IP address is locked.
  """
  @spec check_ip_locked(ip_address()) :: :ok | {:locked, non_neg_integer()}
  def check_ip_locked(ip_address) when is_binary(ip_address) do
    GenServer.call(__MODULE__, {:check_ip_locked, ip_address})
  end

  @doc """
  Record a failed login attempt.
  """
  @spec record_failed_attempt(account_identifier(), keyword()) :: :ok | {:locked, non_neg_integer()}
  def record_failed_attempt(identifier, opts \\ []) when is_binary(identifier) do
    ip = Keyword.get(opts, :ip_address)
    GenServer.call(__MODULE__, {:record_failure, LockoutLogic.normalize_identifier(identifier), ip, opts})
  end

  @doc """
  Clear all failed attempts for an identifier (after successful login).
  """
  @spec clear_attempts(account_identifier()) :: :ok
  def clear_attempts(identifier) when is_binary(identifier) do
    GenServer.call(__MODULE__, {:clear_attempts, LockoutLogic.normalize_identifier(identifier)})
  end

  @doc """
  Manually unlock an account (admin action).
  """
  @spec admin_unlock(account_identifier(), String.t()) :: :ok
  def admin_unlock(identifier, admin_id) when is_binary(identifier) and is_binary(admin_id) do
    GenServer.call(__MODULE__, {:admin_unlock, LockoutLogic.normalize_identifier(identifier), admin_id})
  end

  @doc """
  Get lockout information for an identifier.
  """
  @spec get_lockout_info(account_identifier()) :: lockout_info()
  def get_lockout_info(identifier) when is_binary(identifier) do
    GenServer.call(__MODULE__, {:get_info, LockoutLogic.normalize_identifier(identifier)})
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
  @spec init(term()) :: {:ok, map()}
  def init(_opts) do
    config = load_config()
    redis_available = Storage.redis_available?()

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

  @impl true
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  def handle_call({:check_locked, identifier}, _from, state) do
    result = LockoutLogic.do_check_locked(identifier, state.config, state.redis_available)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:check_ip_locked, ip}, _from, state) do
    result = LockoutLogic.do_check_ip_locked(ip, state.config)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:record_failure, identifier, ip, opts}, _from, state) do
    result = LockoutLogic.do_record_failure(identifier, ip, opts, state.config)

    new_state = case result do
      {:locked, _} -> %{state | locks_issued: state.locks_issued + 1}
      _ -> state
    end

    {:reply, result, new_state}
  end

  @impl true
  def handle_call({:clear_attempts, identifier}, _from, state) do
    LockoutLogic.do_clear_attempts(identifier)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:admin_unlock, identifier, admin_id}, _from, state) do
    LockoutLogic.do_admin_unlock(identifier, admin_id)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:get_info, identifier}, _from, state) do
    info = LockoutLogic.do_get_info(identifier)
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
  # Private
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
end
