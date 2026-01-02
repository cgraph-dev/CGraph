defmodule Cgraph.Guardian do
  @moduledoc """
  Guardian implementation for JWT authentication.
  
  Handles token generation and verification for access and refresh tokens.
  Integrates with TokenBlacklist for secure token revocation.
  
  ## Token Structure
  
  Tokens include:
  - `sub`: User ID
  - `jti`: Unique token identifier for revocation
  - `typ`: Token type (access/refresh)
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp
  
  ## Security Features
  
  - JTI-based token revocation
  - User-level mass revocation
  - Configurable TTL via environment
  - Integration with audit logging
  """
  use Guardian, otp_app: :cgraph

  alias Cgraph.Accounts
  alias Cgraph.Security.TokenBlacklist

  require Logger

  @doc """
  Subject for the token (user ID).
  """
  def subject_for_token(%Accounts.User{id: id}, _claims) do
    {:ok, id}
  end

  def subject_for_token(_, _) do
    {:error, :invalid_resource}
  end

  @doc """
  Resource from claims (load user).
  """
  def resource_from_claims(%{"sub" => id}) do
    # Accounts.get_user/1 already returns {:ok, user} or {:error, :not_found}
    Accounts.get_user(id)
  end

  def resource_from_claims(_claims) do
    {:error, :invalid_claims}
  end

  @doc """
  Build claims with JTI for revocation support.
  
  Called by Guardian before token generation.
  """
  def build_claims(claims, _resource, _opts) do
    claims = claims
    |> Map.put("jti", generate_jti())
    |> Map.put("iat", System.system_time(:second))
    
    {:ok, claims}
  end

  @doc """
  Verify claims including revocation check.
  
  Called by Guardian during token verification.
  """
  def verify_claims(claims, _opts) do
    jti = Map.get(claims, "jti")
    user_id = Map.get(claims, "sub")
    
    cond do
      # Check JTI-based revocation
      jti && token_revoked_by_jti?(jti) ->
        {:error, :token_revoked}
      
      # Check user-level revocation
      user_id && token_revoked_for_user?(claims, user_id) ->
        {:error, :token_revoked}
      
      true ->
        {:ok, claims}
    end
  end

  @doc """
  Generate access and refresh token pair.
  """
  def generate_tokens(user) do
    access_ttl = Application.get_env(:cgraph, :jwt_access_token_ttl, 900)  # 15 min default
    refresh_ttl = Application.get_env(:cgraph, :jwt_refresh_token_ttl, 604_800)  # 7 days default

    with {:ok, access_token, _claims} <- encode_and_sign(user, %{}, ttl: {access_ttl, :second}, token_type: "access"),
         {:ok, refresh_token, _claims} <- encode_and_sign(user, %{}, ttl: {refresh_ttl, :second}, token_type: "refresh") do
      {:ok, %{
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: access_ttl
      }}
    end
  end

  @doc """
  Refresh an access token using a refresh token.
  
  The old refresh token is revoked after successful refresh.
  """
  def refresh_tokens(refresh_token) do
    case decode_and_verify(refresh_token, %{"typ" => "refresh"}) do
      {:ok, claims} ->
        case resource_from_claims(claims) do
          {:ok, user} -> 
            # Generate new tokens
            result = generate_tokens(user)
            
            # Revoke old refresh token (optional, adds security)
            if jti = Map.get(claims, "jti") do
              TokenBlacklist.revoke_by_jti(jti, reason: :token_refresh, user_id: user.id)
            end
            
            result
            
          error -> error
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Verify an access token.
  """
  def verify_access_token(token) do
    decode_and_verify(token, %{"typ" => "access"})
  end

  @doc """
  Revoke a token by adding it to the blacklist.
  """
  def revoke_token(token, opts \\ []) do
    case decode_and_verify(token, %{}) do
      {:ok, claims} ->
        jti = Map.get(claims, "jti")
        user_id = Map.get(claims, "sub")
        reason = Keyword.get(opts, :reason, :logout)
        
        if jti do
          TokenBlacklist.revoke_by_jti(jti, reason: reason, user_id: user_id)
        else
          TokenBlacklist.revoke(token, reason: reason, user_id: user_id)
        end
        
      {:error, _} ->
        # Token is already invalid, try to revoke by hash anyway
        TokenBlacklist.revoke(token, Keyword.merge(opts, [reason: :logout]))
    end
  end

  @doc """
  Revoke all tokens for a user.
  
  Useful for password changes, security incidents, or account deletion.
  """
  def revoke_all_user_tokens(user_id, reason \\ :security_breach) do
    TokenBlacklist.revoke_all_for_user(user_id, reason: reason)
  end

  # Private functions

  defp generate_jti do
    :crypto.strong_rand_bytes(16)
    |> Base.url_encode64(padding: false)
  end

  defp token_revoked_by_jti?(jti) do
    try do
      TokenBlacklist.revoked_by_jti?(jti)
    rescue
      _ -> false
    end
  end

  defp token_revoked_for_user?(claims, user_id) do
    try do
      case TokenBlacklist.user_tokens_revoked_before?(user_id) do
        {:ok, revoked_before} ->
          iat = Map.get(claims, "iat")
          if iat do
            token_time = DateTime.from_unix!(iat)
            DateTime.compare(token_time, revoked_before) == :lt
          else
            false
          end
        :not_revoked ->
          false
      end
    rescue
      _ -> false
    end
  end
end
