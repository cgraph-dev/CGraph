defmodule CGraph.Security.TokenBlacklist do
  @moduledoc """
  Token revocation system using multi-tier storage (Cachex + Redis).

  ## Overview

  Provides JWT token revocation capabilities for:

  - **Logout**: Revoke individual tokens on user logout
  - **Security Breach**: Mass revocation for compromised accounts
  - **Session Management**: Revoke specific sessions
  - **Password Change**: Invalidate all existing tokens

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    TOKEN BLACKLIST SYSTEM                       │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Token Check Flow:                                             │
  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
  │   │ Check L1    │────►│ Check L2    │────►│ Check Redis │      │
  │   │ (Cachex)    │ miss│ (ETS bloom) │ miss│ (persistent)│      │
  │   │   <1ms      │     │   <1ms      │     │   <5ms      │      │
  │   └─────────────┘     └─────────────┘     └─────────────┘      │
  │                                                                  │
  │   Revocation Flow:                                              │
  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
  │   │ Add to L1   │────►│ Add to L2   │────►│ Add to Redis│      │
  │   │ (Cachex)    │     │ (ETS bloom) │     │ (persistent)│      │
  │   └─────────────┘     └─────────────┘     └─────────────┘      │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Storage Strategy

  - **L1 (Cachex)**: Hot cache for recently revoked tokens
  - **L2 (ETS Bloom Filter)**: Fast negative lookups
  - **L3 (Redis)**: Persistent storage with TTL matching token expiry

  ## Usage

      # Revoke a single token
      TokenBlacklist.revoke(token, reason: :logout)

      # Revoke all tokens for a user
      TokenBlacklist.revoke_all_for_user(user_id, reason: :password_change)

      # Check if token is revoked
      case TokenBlacklist.revoked?(token) do
        true -> {:error, :token_revoked}
        false -> :ok
      end

  ## Telemetry Events

  - `[:cgraph, :security, :token_revoked]` - Token revoked
  - `[:cgraph, :security, :token_check]` - Token checked against blacklist
  - `[:cgraph, :security, :mass_revocation]` - Bulk revocation event
  """

  use GenServer
  require Logger

  alias CGraph.Security.TokenBlacklist.{Storage, Revocation}

  # Revocation reasons for audit
  @revocation_reasons [
    :logout,
    :password_change,
    :security_breach,
    :admin_action,
    :session_revoked,
    :account_deleted,
    :token_refresh
  ]

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type token :: String.t()
  @type jti :: String.t()
  @type reason :: :logout | :password_change | :security_breach | :admin_action | :session_revoked | :account_deleted
  @type user_id :: String.t()

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Start the token blacklist GenServer.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Revoke a token, adding it to the blacklist.

  ## Options

  - `:reason` - Reason for revocation (default: :logout)
  - `:ttl` - Custom TTL in seconds (default: remaining token lifetime or 30 days)
  - `:user_id` - User ID for audit logging
  - `:metadata` - Additional metadata for audit

  ## Examples

      TokenBlacklist.revoke("eyJ...", reason: :logout, user_id: "user_123")
      TokenBlacklist.revoke("eyJ...", reason: :password_change)
  """
  @spec revoke(token(), keyword()) :: :ok | {:error, term()}
  def revoke(token, opts \\ []) when is_binary(token) do
    reason = Keyword.get(opts, :reason, :logout)

    unless reason in @revocation_reasons do
      raise ArgumentError, "Invalid revocation reason: #{inspect(reason)}. Must be one of #{inspect(@revocation_reasons)}"
    end

    GenServer.call(__MODULE__, {:revoke, token, opts})
  end

  @doc """
  Revoke a token by its JTI (JWT ID) claim.

  More efficient than revoking by full token since JTI is smaller.
  """
  @spec revoke_by_jti(jti(), keyword()) :: :ok | {:error, term()}
  def revoke_by_jti(jti, opts \\ []) when is_binary(jti) do
    reason = Keyword.get(opts, :reason, :logout)

    unless reason in @revocation_reasons do
      raise ArgumentError, "Invalid revocation reason: #{inspect(reason)}. Must be one of #{inspect(@revocation_reasons)}"
    end

    GenServer.call(__MODULE__, {:revoke_jti, jti, opts})
  end

  @doc """
  Revoke all tokens for a user.

  This sets a "revoked before" timestamp, invalidating all tokens
  issued before this time for the user.

  ## Options

  - `:reason` - Reason for mass revocation
  - `:metadata` - Additional audit metadata

  ## Examples

      TokenBlacklist.revoke_all_for_user("user_123", reason: :password_change)
      TokenBlacklist.revoke_all_for_user("user_123", reason: :security_breach)
  """
  @spec revoke_all_for_user(user_id(), keyword()) :: :ok | {:error, term()}
  def revoke_all_for_user(user_id, opts \\ []) when is_binary(user_id) do
    GenServer.call(__MODULE__, {:revoke_all_user, user_id, opts})
  end

  @doc """
  Check if a token has been revoked.

  ## Options

  - `:check_user_revocation` - Also check user-level revocation (default: true)

  ## Returns

  - `true` if the token is revoked
  - `false` if the token is valid
  """
  @spec revoked?(token(), keyword()) :: boolean()
  def revoked?(token, opts \\ []) when is_binary(token) do
    GenServer.call(__MODULE__, {:check_revoked, token, opts})
  end

  @doc """
  Check if a token is revoked by its JTI.
  """
  @spec revoked_by_jti?(jti(), keyword()) :: boolean()
  def revoked_by_jti?(jti, opts \\ []) when is_binary(jti) do
    GenServer.call(__MODULE__, {:check_revoked_jti, jti, opts})
  end

  @doc """
  Check if any tokens for a user issued before a certain time are revoked.
  """
  @spec user_tokens_revoked_before?(user_id()) :: {:ok, DateTime.t()} | :not_revoked
  def user_tokens_revoked_before?(user_id) when is_binary(user_id) do
    GenServer.call(__MODULE__, {:get_user_revocation_time, user_id})
  end

  @doc """
  Get statistics about the blacklist.
  """
  @spec stats() :: map()
  def stats do
    GenServer.call(__MODULE__, :stats)
  end

  @doc """
  Clear expired entries from the blacklist.
  Called periodically by the cleanup job.
  """
  @spec cleanup() :: :ok
  def cleanup do
    GenServer.cast(__MODULE__, :cleanup)
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl true
  def init(_opts) do
    Storage.init_bloom_table()
    schedule_cleanup()

    state = %{
      revocation_count: 0,
      last_cleanup: DateTime.utc_now(),
      started_at: DateTime.utc_now()
    }

    Logger.info("TokenBlacklist started")
    {:ok, state}
  end

  @impl true
  def handle_call({:revoke, token, opts}, _from, state) do
    result = Revocation.revoke_token(token, opts)
    new_state = %{state | revocation_count: state.revocation_count + 1}
    {:reply, result, new_state}
  end

  @impl true
  def handle_call({:revoke_jti, jti, opts}, _from, state) do
    result = Revocation.revoke_jti(jti, opts)
    new_state = %{state | revocation_count: state.revocation_count + 1}
    {:reply, result, new_state}
  end

  @impl true
  def handle_call({:revoke_all_user, user_id, opts}, _from, state) do
    result = Revocation.revoke_all_for_user(user_id, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:check_revoked, token, opts}, _from, state) do
    result = Revocation.check_revoked(token, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:check_revoked_jti, jti, opts}, _from, state) do
    result = Revocation.check_revoked_jti(jti, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:get_user_revocation_time, user_id}, _from, state) do
    result = Revocation.get_user_revocation_time(user_id)
    {:reply, result, state}
  end

  @impl true
  def handle_call(:stats, _from, state) do
    stats = %{
      revocation_count: state.revocation_count,
      started_at: state.started_at,
      last_cleanup: state.last_cleanup,
      bloom_table_size: Storage.bloom_table_size(),
      uptime_seconds: DateTime.diff(DateTime.utc_now(), state.started_at)
    }
    {:reply, stats, state}
  end

  @impl true
  def handle_cast(:cleanup, state) do
    Storage.cleanup()
    new_state = %{state | last_cleanup: DateTime.utc_now()}
    {:noreply, new_state}
  end

  @impl true
  def handle_info(:scheduled_cleanup, state) do
    Storage.cleanup()
    schedule_cleanup()
    new_state = %{state | last_cleanup: DateTime.utc_now()}
    {:noreply, new_state}
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp schedule_cleanup do
    # Cleanup every hour
    Process.send_after(self(), :scheduled_cleanup, :timer.hours(1))
  end
end
