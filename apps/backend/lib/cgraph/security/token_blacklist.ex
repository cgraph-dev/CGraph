defmodule Cgraph.Security.TokenBlacklist do
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

  alias Cgraph.Audit

  @cache_name :cgraph_cache
  @redis_prefix "token_blacklist:"
  @user_revocation_prefix "user_token_revocation:"
  
  # Default TTL matches refresh token (30 days)
  @default_ttl_seconds 30 * 24 * 60 * 60
  
  # ETS table for bloom filter simulation
  @bloom_table :token_blacklist_bloom

  # Revocation reasons for audit
  @revocation_reasons [:logout, :password_change, :security_breach, :admin_action, :session_revoked, :account_deleted, :token_refresh]

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
    # Create ETS table for bloom filter simulation
    :ets.new(@bloom_table, [:set, :public, :named_table, read_concurrency: true])
    
    # Schedule periodic cleanup
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
    result = do_revoke_token(token, opts)
    new_state = %{state | revocation_count: state.revocation_count + 1}
    {:reply, result, new_state}
  end

  @impl true
  def handle_call({:revoke_jti, jti, opts}, _from, state) do
    result = do_revoke_jti(jti, opts)
    new_state = %{state | revocation_count: state.revocation_count + 1}
    {:reply, result, new_state}
  end

  @impl true
  def handle_call({:revoke_all_user, user_id, opts}, _from, state) do
    result = do_revoke_all_for_user(user_id, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:check_revoked, token, opts}, _from, state) do
    result = do_check_revoked(token, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:check_revoked_jti, jti, opts}, _from, state) do
    result = do_check_revoked_jti(jti, opts)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:get_user_revocation_time, user_id}, _from, state) do
    result = do_get_user_revocation_time(user_id)
    {:reply, result, state}
  end

  @impl true
  def handle_call(:stats, _from, state) do
    stats = %{
      revocation_count: state.revocation_count,
      started_at: state.started_at,
      last_cleanup: state.last_cleanup,
      bloom_table_size: :ets.info(@bloom_table, :size),
      uptime_seconds: DateTime.diff(DateTime.utc_now(), state.started_at)
    }
    {:reply, stats, state}
  end

  @impl true
  def handle_cast(:cleanup, state) do
    do_cleanup()
    new_state = %{state | last_cleanup: DateTime.utc_now()}
    {:noreply, new_state}
  end

  @impl true
  def handle_info(:scheduled_cleanup, state) do
    do_cleanup()
    schedule_cleanup()
    new_state = %{state | last_cleanup: DateTime.utc_now()}
    {:noreply, new_state}
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp do_revoke_token(token, opts) do
    # Extract JTI from token if possible
    jti = extract_jti(token) || hash_token(token)
    ttl = Keyword.get(opts, :ttl, @default_ttl_seconds)
    reason = Keyword.get(opts, :reason, :logout)
    user_id = Keyword.get(opts, :user_id)
    
    revocation_data = %{
      revoked_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      reason: reason,
      user_id: user_id
    }
    
    # Store in all tiers
    with :ok <- store_in_cachex(jti, revocation_data, ttl),
         :ok <- store_in_ets(jti),
         :ok <- store_in_redis(jti, revocation_data, ttl) do
      
      # Emit telemetry
      :telemetry.execute(
        [:cgraph, :security, :token_revoked],
        %{count: 1},
        %{reason: reason, user_id: user_id}
      )
      
      # Audit log if user_id provided
      if user_id do
        log_revocation_audit(user_id, reason, opts)
      end
      
      :ok
    end
  end

  defp do_revoke_jti(jti, opts) do
    ttl = Keyword.get(opts, :ttl, @default_ttl_seconds)
    reason = Keyword.get(opts, :reason, :logout)
    user_id = Keyword.get(opts, :user_id)
    
    revocation_data = %{
      revoked_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      reason: reason,
      user_id: user_id
    }
    
    with :ok <- store_in_cachex(jti, revocation_data, ttl),
         :ok <- store_in_ets(jti),
         :ok <- store_in_redis(jti, revocation_data, ttl) do
      
      :telemetry.execute(
        [:cgraph, :security, :token_revoked],
        %{count: 1},
        %{reason: reason, user_id: user_id, by_jti: true}
      )
      
      :ok
    end
  end

  defp do_revoke_all_for_user(user_id, opts) do
    reason = Keyword.get(opts, :reason, :security_breach)
    revocation_time = DateTime.utc_now()
    
    revocation_data = %{
      revoked_before: DateTime.to_iso8601(revocation_time),
      reason: reason
    }
    
    key = "#{@user_revocation_prefix}#{user_id}"
    
    # Store user-level revocation with long TTL (matches refresh token)
    with :ok <- store_in_cachex(key, revocation_data, @default_ttl_seconds),
         :ok <- store_in_redis(key, revocation_data, @default_ttl_seconds) do
      
      :telemetry.execute(
        [:cgraph, :security, :mass_revocation],
        %{count: 1},
        %{reason: reason, user_id: user_id}
      )
      
      log_mass_revocation_audit(user_id, reason, opts)
      
      Logger.info("Revoked all tokens for user #{user_id}: #{reason}")
      :ok
    end
  end

  defp do_check_revoked(token, opts) do
    jti = extract_jti(token) || hash_token(token)
    check_user = Keyword.get(opts, :check_user_revocation, true)
    
    # Start telemetry span
    start_time = System.monotonic_time()
    
    result = case check_in_ets(jti) do
      true -> 
        true
      false -> 
        case check_in_cachex(jti) do
          {:ok, _} -> true
          _ -> 
            case check_in_redis(jti) do
              {:ok, _} -> 
                # Promote to faster tiers
                store_in_ets(jti)
                true
              _ -> 
                # Check user-level revocation if enabled
                if check_user do
                  check_user_level_revocation(token)
                else
                  false
                end
            end
        end
    end
    
    # Emit telemetry
    duration = System.monotonic_time() - start_time
    :telemetry.execute(
      [:cgraph, :security, :token_check],
      %{duration: duration},
      %{revoked: result}
    )
    
    result
  end

  defp do_check_revoked_jti(jti, _opts) do
    case check_in_ets(jti) do
      true -> true
      false -> 
        case check_in_cachex(jti) do
          {:ok, _} -> true
          _ -> 
            case check_in_redis(jti) do
              {:ok, _} -> 
                store_in_ets(jti)
                true
              _ -> false
            end
        end
    end
  end

  defp do_get_user_revocation_time(user_id) do
    key = "#{@user_revocation_prefix}#{user_id}"
    
    case check_in_cachex(key) do
      {:ok, data} -> {:ok, parse_revocation_time(data)}
      _ -> 
        case check_in_redis(key) do
          {:ok, data} -> {:ok, parse_revocation_time(data)}
          _ -> :not_revoked
        end
    end
  end

  defp check_user_level_revocation(token) do
    # Extract user_id and issued_at from token
    with {:ok, claims} <- decode_token_claims(token),
         user_id when is_binary(user_id) <- Map.get(claims, "sub"),
         iat when is_integer(iat) <- Map.get(claims, "iat") do
      
      case do_get_user_revocation_time(user_id) do
        {:ok, revoked_before} ->
          token_issued_at = DateTime.from_unix!(iat)
          DateTime.compare(token_issued_at, revoked_before) == :lt
        :not_revoked ->
          false
      end
    else
      _ -> false
    end
  end

  # Storage tier operations

  defp store_in_cachex(key, data, ttl_seconds) do
    ttl_ms = ttl_seconds * 1000
    case Cachex.put(@cache_name, "blacklist:#{key}", data, ttl: ttl_ms) do
      {:ok, true} -> :ok
      {:ok, false} -> :ok
      error -> 
        Logger.warning("Failed to store in Cachex: #{inspect(error)}")
        :ok  # Non-fatal, continue with other tiers
    end
  end

  defp store_in_ets(key) do
    expiry = System.system_time(:second) + @default_ttl_seconds
    :ets.insert(@bloom_table, {key, expiry})
    :ok
  end

  defp store_in_redis(key, data, ttl_seconds) do
    redis_key = "#{@redis_prefix}#{key}"
    encoded_data = Jason.encode!(data)
    
    case Redix.command(:redix, ["SETEX", redis_key, ttl_seconds, encoded_data]) do
      {:ok, _} -> :ok
      {:error, reason} ->
        Logger.warning("Failed to store in Redis: #{inspect(reason)}")
        :ok  # Non-fatal for revocation
    end
  end

  defp check_in_ets(key) do
    case :ets.lookup(@bloom_table, key) do
      [{^key, expiry}] -> 
        if System.system_time(:second) < expiry do
          true
        else
          :ets.delete(@bloom_table, key)
          false
        end
      [] -> false
    end
  end

  defp check_in_cachex(key) do
    case Cachex.get(@cache_name, "blacklist:#{key}") do
      {:ok, nil} -> {:error, :not_found}
      {:ok, data} -> {:ok, data}
      error -> error
    end
  end

  defp check_in_redis(key) do
    redis_key = "#{@redis_prefix}#{key}"
    
    case Redix.command(:redix, ["GET", redis_key]) do
      {:ok, nil} -> {:error, :not_found}
      {:ok, data} -> {:ok, Jason.decode!(data)}
      {:error, _} = error -> error
    end
  end

  # Helper functions

  defp extract_jti(token) do
    case decode_token_claims(token) do
      {:ok, %{"jti" => jti}} -> jti
      _ -> nil
    end
  end

  defp decode_token_claims(token) do
    # Decode without verification to extract claims
    case Cgraph.Guardian.decode_and_verify(token, %{}) do
      {:ok, claims} -> {:ok, claims}
      {:error, _} -> 
        # Try base64 decode for expired tokens
        try do
          [_, payload, _] = String.split(token, ".")
          {:ok, decoded} = Base.url_decode64(payload, padding: false)
          {:ok, Jason.decode!(decoded)}
        rescue
          _ -> {:error, :invalid_token}
        end
    end
  end

  defp hash_token(token) do
    :crypto.hash(:sha256, token)
    |> Base.encode16(case: :lower)
    |> binary_part(0, 32)
  end

  defp parse_revocation_time(%{"revoked_before" => timestamp}) do
    {:ok, dt, _} = DateTime.from_iso8601(timestamp)
    dt
  end

  defp parse_revocation_time(data) when is_map(data) do
    DateTime.utc_now()
  end

  defp schedule_cleanup do
    # Cleanup every hour
    Process.send_after(self(), :scheduled_cleanup, :timer.hours(1))
  end

  defp do_cleanup do
    now = System.system_time(:second)
    
    # Clean expired entries from ETS
    expired = :ets.select(@bloom_table, [{{:"$1", :"$2"}, [{:<, :"$2", now}], [:"$1"]}])
    
    Enum.each(expired, fn key ->
      :ets.delete(@bloom_table, key)
    end)
    
    Logger.debug("TokenBlacklist cleanup: removed #{length(expired)} expired entries")
    :ok
  end

  defp log_revocation_audit(user_id, reason, opts) do
    metadata = Keyword.get(opts, :metadata, %{})
    
    Audit.log(:security, :token_revoked, %{
      user_id: user_id,
      reason: reason,
      metadata: metadata
    })
  rescue
    _ -> :ok  # Don't fail on audit errors
  end

  defp log_mass_revocation_audit(user_id, reason, opts) do
    metadata = Keyword.get(opts, :metadata, %{})
    
    Audit.log(:security, :mass_token_revocation, %{
      user_id: user_id,
      reason: reason,
      metadata: metadata
    })
  rescue
    _ -> :ok
  end
end
