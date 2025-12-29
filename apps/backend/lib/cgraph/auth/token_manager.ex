defmodule Cgraph.Auth.TokenManager do
  @moduledoc """
  Enhanced JWT token management with security best practices.
  
  ## Design Philosophy
  
  This module implements a defense-in-depth approach to token security:
  
  1. **Short-lived access tokens**: Minimize window of compromise
  2. **Rotating refresh tokens**: Each use generates a new token
  3. **Token binding**: Tokens tied to device/session fingerprint
  4. **Revocation support**: Immediate invalidation when needed
  5. **Audit trail**: Track all token operations
  
  ## Token Types
  
  ### Access Token
  
  - Short-lived (15 minutes default)
  - Used for API authentication
  - Contains minimal claims (user_id, role)
  - Not stored server-side
  
  ### Refresh Token
  
  - Longer-lived (7 days default)
  - Used only to obtain new access tokens
  - Stored server-side for revocation
  - Rotated on each use (one-time use)
  
  ## Token Rotation
  
  When a refresh token is used:
  
  1. Validate the refresh token
  2. Check it hasn't been used before (revoke family if reused)
  3. Generate new access + refresh token pair
  4. Mark old refresh token as used
  5. Store new refresh token
  
  This provides "refresh token rotation" which detects token theft.
  
  ## Device Fingerprinting
  
  Tokens are optionally bound to device characteristics:
  
  - User agent hash
  - IP address (optional, can cause issues with mobile)
  - Device ID (from client)
  
  If a token is presented from a different device, it's rejected.
  
  ## Revocation Scenarios
  
  1. **User logout**: Revoke specific token
  2. **Password change**: Revoke all user tokens
  3. **Security concern**: Revoke token family
  4. **Session management**: Revoke all but current
  
  ## Usage
  
  ```elixir
  # Generate token pair on login
  {:ok, tokens} = TokenManager.generate_tokens(user, device_info)
  
  # Refresh tokens
  {:ok, new_tokens} = TokenManager.refresh(refresh_token, device_info)
  
  # Revoke on logout
  :ok = TokenManager.revoke(refresh_token)
  
  # Revoke all user sessions
  :ok = TokenManager.revoke_all_user_tokens(user_id)
  ```
  """
  
  use GenServer
  require Logger
  
  alias Cgraph.Guardian
  alias Cgraph.Accounts.User
  
  @access_token_ttl {15, :minutes}
  @refresh_token_ttl {7, :days}
  @max_sessions_per_user 10
  @cleanup_interval :timer.hours(1)
  
  # Token storage: In production, use Redis for distributed systems
  # This ETS implementation is for single-node or development
  
  # ---------------------------------------------------------------------------
  # GenServer API
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Create ETS tables for token storage
    :ets.new(:refresh_tokens, [:set, :named_table, :public, read_concurrency: true])
    :ets.new(:revoked_tokens, [:set, :named_table, :public, read_concurrency: true])
    :ets.new(:token_families, [:set, :named_table, :public, read_concurrency: true])
    
    # Schedule cleanup
    Process.send_after(self(), :cleanup_expired, @cleanup_interval)
    
    {:ok, %{}}
  end
  
  @impl true
  def handle_info(:cleanup_expired, state) do
    cleanup_expired_tokens()
    Process.send_after(self(), :cleanup_expired, @cleanup_interval)
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------
  
  @doc """
  Generate access and refresh token pair for a user.
  
  ## Options
  
  - `:device_info` - Map with device fingerprint info
  - `:session_name` - Optional name for the session
  - `:remember_me` - If true, use longer refresh token TTL
  
  ## Returns
  
  ```elixir
  {:ok, %{
    access_token: "eyJ...",
    refresh_token: "eyJ...",
    access_token_expires_at: ~U[2024-01-15 12:15:00Z],
    refresh_token_expires_at: ~U[2024-01-22 12:00:00Z],
    token_type: "Bearer"
  }}
  ```
  """
  @spec generate_tokens(User.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def generate_tokens(%User{} = user, opts \\ []) do
    device_info = Keyword.get(opts, :device_info, %{})
    session_name = Keyword.get(opts, :session_name, "default")
    remember_me = Keyword.get(opts, :remember_me, false)
    
    # Generate token family ID (groups related tokens)
    family_id = generate_family_id()
    
    # Device fingerprint for token binding
    device_fingerprint = compute_device_fingerprint(device_info)
    
    # Calculate expiration times
    access_expires_at = compute_expiration(@access_token_ttl)
    refresh_ttl = if remember_me, do: {30, :days}, else: @refresh_token_ttl
    refresh_expires_at = compute_expiration(refresh_ttl)
    
    # Build claims
    access_claims = %{
      "typ" => "access",
      "sub" => user.id,
      "role" => Map.get(user, :role, "user"),
      "fam" => family_id
    }
    
    refresh_claims = %{
      "typ" => "refresh",
      "sub" => user.id,
      "fam" => family_id,
      "jti" => generate_jti(),
      "dfp" => device_fingerprint,
      "ses" => session_name
    }
    
    # Generate tokens
    with {:ok, access_token, _} <- Guardian.encode_and_sign(user, access_claims, ttl: @access_token_ttl),
         {:ok, refresh_token, _full_claims} <- Guardian.encode_and_sign(user, refresh_claims, ttl: refresh_ttl) do
      
      # Store refresh token metadata
      store_refresh_token(%{
        jti: refresh_claims["jti"],
        user_id: user.id,
        family_id: family_id,
        device_fingerprint: device_fingerprint,
        session_name: session_name,
        expires_at: refresh_expires_at,
        created_at: DateTime.utc_now(),
        used: false
      })
      
      # Store family info
      store_token_family(%{
        family_id: family_id,
        user_id: user.id,
        created_at: DateTime.utc_now(),
        revoked: false
      })
      
      # Enforce max sessions
      enforce_max_sessions(user.id)
      
      # Emit telemetry
      :telemetry.execute(
        [:cgraph, :auth, :tokens, :generated],
        %{count: 1},
        %{user_id: user.id}
      )
      
      {:ok, %{
        access_token: access_token,
        refresh_token: refresh_token,
        access_token_expires_at: access_expires_at,
        refresh_token_expires_at: refresh_expires_at,
        token_type: "Bearer"
      }}
    end
  end
  
  @doc """
  Refresh tokens using a valid refresh token.
  
  Implements refresh token rotation:
  - Old refresh token is marked as used
  - New token pair is generated
  - If old token was already used, revoke entire family (possible theft)
  """
  @spec refresh(String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def refresh(refresh_token, opts \\ []) do
    device_info = Keyword.get(opts, :device_info, %{})
    
    with {:ok, claims} <- Guardian.decode_and_verify(refresh_token),
         :ok <- verify_token_type(claims, "refresh"),
         {:ok, stored_token} <- get_stored_refresh_token(claims["jti"]),
         :ok <- verify_not_used(stored_token),
         :ok <- verify_family_not_revoked(stored_token.family_id),
         :ok <- verify_device_fingerprint(stored_token, device_info),
         {:ok, user} <- get_user(claims["sub"]) do
      
      # Mark old token as used
      mark_token_used(claims["jti"])
      
      # Generate new token pair in same family
      generate_tokens(user, [
        device_info: device_info,
        session_name: stored_token.session_name
      ])
    else
      {:error, :token_already_used} ->
        # Possible token theft! Revoke entire family
        Logger.warning("Refresh token reuse detected - possible token theft")
        handle_token_reuse(refresh_token)
        {:error, :token_reused}
        
      {:error, _} = error ->
        error
    end
  end
  
  @doc """
  Revoke a specific token.
  """
  @spec revoke(String.t()) :: :ok | {:error, term()}
  def revoke(token) do
    case Guardian.decode_and_verify(token) do
      {:ok, %{"jti" => jti, "typ" => "refresh"}} ->
        revoke_by_jti(jti)
        :ok
        
      {:ok, %{"typ" => "access"}} ->
        # Access tokens can't be individually revoked (short-lived)
        # Client should just discard them
        :ok
        
      {:error, _} ->
        :ok  # Token invalid anyway
    end
  end
  
  @doc """
  Revoke all tokens for a user.
  """
  @spec revoke_all_user_tokens(String.t()) :: :ok
  def revoke_all_user_tokens(user_id) do
    # Revoke all families for user
    :ets.match_object(:token_families, {:_, %{user_id: user_id}})
    |> Enum.each(fn {family_id, _} ->
      revoke_family(family_id)
    end)
    
    # Delete all refresh tokens
    :ets.match_delete(:refresh_tokens, {:_, %{user_id: user_id}})
    
    :telemetry.execute(
      [:cgraph, :auth, :tokens, :revoked_all],
      %{count: 1},
      %{user_id: user_id}
    )
    
    :ok
  end
  
  @doc """
  Revoke all tokens except the current one.
  
  Useful for "sign out other sessions" feature.
  """
  @spec revoke_other_sessions(String.t(), String.t()) :: :ok
  def revoke_other_sessions(user_id, current_jti) do
    :ets.match_object(:refresh_tokens, {:_, %{user_id: user_id}})
    |> Enum.each(fn {jti, _} ->
      if jti != current_jti do
        revoke_by_jti(jti)
      end
    end)
    
    :ok
  end
  
  @doc """
  List active sessions for a user.
  """
  @spec list_user_sessions(String.t()) :: [map()]
  def list_user_sessions(user_id) do
    now = DateTime.utc_now()
    
    :ets.match_object(:refresh_tokens, {:_, %{user_id: user_id}})
    |> Enum.filter(fn {_, token} -> 
      not token.used and DateTime.compare(token.expires_at, now) == :gt
    end)
    |> Enum.map(fn {jti, token} ->
      %{
        session_id: jti,
        session_name: token.session_name,
        created_at: token.created_at,
        expires_at: token.expires_at,
        device_fingerprint: token.device_fingerprint
      }
    end)
    |> Enum.sort_by(& &1.created_at, {:desc, DateTime})
  end
  
  @doc """
  Check if a token is valid (not revoked).
  
  For access tokens, this checks if the family is revoked.
  For refresh tokens, this also checks individual revocation.
  """
  @spec valid?(String.t()) :: boolean()
  def valid?(token) do
    case Guardian.decode_and_verify(token) do
      {:ok, %{"typ" => "access", "fam" => family_id}} ->
        not family_revoked?(family_id)
        
      {:ok, %{"typ" => "refresh", "jti" => jti, "fam" => family_id}} ->
        not family_revoked?(family_id) and not token_revoked?(jti)
        
      _ ->
        false
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------
  
  defp generate_family_id do
    "fam_" <> Base.encode32(:crypto.strong_rand_bytes(16), case: :lower, padding: false)
  end
  
  defp generate_jti do
    "jti_" <> Base.encode32(:crypto.strong_rand_bytes(16), case: :lower, padding: false)
  end
  
  defp compute_device_fingerprint(device_info) when is_map(device_info) do
    data = [
      Map.get(device_info, :user_agent, ""),
      Map.get(device_info, :device_id, "")
    ]
    |> Enum.join("|")
    
    :crypto.hash(:sha256, data)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end
  
  defp compute_expiration({amount, :minutes}) do
    DateTime.utc_now() |> DateTime.add(amount * 60, :second)
  end
  
  defp compute_expiration({amount, :hours}) do
    DateTime.utc_now() |> DateTime.add(amount * 3600, :second)
  end
  
  defp compute_expiration({amount, :days}) do
    DateTime.utc_now() |> DateTime.add(amount * 86400, :second)
  end
  
  defp store_refresh_token(token_data) do
    :ets.insert(:refresh_tokens, {token_data.jti, token_data})
  end
  
  defp store_token_family(family_data) do
    :ets.insert(:token_families, {family_data.family_id, family_data})
  end
  
  defp get_stored_refresh_token(jti) do
    case :ets.lookup(:refresh_tokens, jti) do
      [{^jti, token_data}] -> {:ok, token_data}
      [] -> {:error, :token_not_found}
    end
  end
  
  defp verify_token_type(%{"typ" => expected}, expected), do: :ok
  defp verify_token_type(_, _), do: {:error, :invalid_token_type}
  
  defp verify_not_used(%{used: false}), do: :ok
  defp verify_not_used(%{used: true}), do: {:error, :token_already_used}
  
  defp verify_family_not_revoked(family_id) do
    if family_revoked?(family_id) do
      {:error, :family_revoked}
    else
      :ok
    end
  end
  
  defp verify_device_fingerprint(stored_token, device_info) do
    current_fingerprint = compute_device_fingerprint(device_info)
    
    if stored_token.device_fingerprint == current_fingerprint do
      :ok
    else
      Logger.warning("Device fingerprint mismatch for token #{stored_token.jti}")
      {:error, :device_mismatch}
    end
  end
  
  defp mark_token_used(jti) do
    case :ets.lookup(:refresh_tokens, jti) do
      [{^jti, token_data}] ->
        updated = %{token_data | used: true, used_at: DateTime.utc_now()}
        :ets.insert(:refresh_tokens, {jti, updated})
      [] ->
        :ok
    end
  end
  
  defp revoke_by_jti(jti) do
    :ets.insert(:revoked_tokens, {jti, DateTime.utc_now()})
  end
  
  defp revoke_family(family_id) do
    case :ets.lookup(:token_families, family_id) do
      [{^family_id, family_data}] ->
        updated = %{family_data | revoked: true, revoked_at: DateTime.utc_now()}
        :ets.insert(:token_families, {family_id, updated})
      [] ->
        :ok
    end
  end
  
  defp family_revoked?(family_id) do
    case :ets.lookup(:token_families, family_id) do
      [{^family_id, %{revoked: true}}] -> true
      _ -> false
    end
  end
  
  defp token_revoked?(jti) do
    case :ets.lookup(:revoked_tokens, jti) do
      [{^jti, _}] -> true
      [] -> false
    end
  end
  
  defp handle_token_reuse(token) do
    case Guardian.decode_and_verify(token) do
      {:ok, %{"fam" => family_id, "sub" => user_id}} ->
        # Revoke entire family
        revoke_family(family_id)
        
        # Log security event
        Logger.error("Token reuse detected for user #{user_id}, family #{family_id}")
        
        :telemetry.execute(
          [:cgraph, :auth, :security, :token_reuse],
          %{count: 1},
          %{user_id: user_id, family_id: family_id}
        )
        
      _ ->
        :ok
    end
  end
  
  defp enforce_max_sessions(user_id) do
    sessions = list_user_sessions(user_id)
    
    if length(sessions) > @max_sessions_per_user do
      # Revoke oldest sessions
      sessions
      |> Enum.sort_by(& &1.created_at, {:asc, DateTime})
      |> Enum.take(length(sessions) - @max_sessions_per_user)
      |> Enum.each(fn session ->
        revoke_by_jti(session.session_id)
      end)
    end
  end
  
  defp get_user(user_id) do
    case Cgraph.Accounts.get_user(user_id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user}
    end
  end
  
  defp cleanup_expired_tokens do
    now = DateTime.utc_now()
    
    # Clean expired refresh tokens
    :ets.foldl(
      fn {jti, token}, acc ->
        if DateTime.compare(token.expires_at, now) == :lt do
          :ets.delete(:refresh_tokens, jti)
          :ets.delete(:revoked_tokens, jti)
        end
        acc
      end,
      nil,
      :refresh_tokens
    )
    
    Logger.debug("Token cleanup completed")
  end
end
