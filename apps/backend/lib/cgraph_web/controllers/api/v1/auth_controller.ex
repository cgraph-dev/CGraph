defmodule CgraphWeb.API.V1.AuthController do
  @moduledoc """
  Authentication controller handling:
  - Email/password registration and login
  - Ethereum wallet authentication
  - Token refresh
  - Password reset

  ## Security Features

  - Account lockout after failed attempts
  - JWT token revocation on logout
  - Progressive lockout duration
  - IP-based rate limiting
  - HTTP-only cookie authentication (XSS-safe)
  """
  use CgraphWeb, :controller

  alias Cgraph.Accounts
  alias Cgraph.Guardian
  alias Cgraph.Security.AccountLockout
  alias CgraphWeb.Plugs.CookieAuth

  action_fallback CgraphWeb.FallbackController

  @doc """
  Register a new user with email and password.
  Sets HTTP-only cookies for web clients.
  """
  def register(conn, %{"user" => user_params}) do
    with {:ok, user} <- Accounts.register_user(user_params),
         {:ok, tokens} <- Guardian.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> maybe_set_cookies(tokens)
      |> put_status(:created)
      |> render(:auth_response, user: user, tokens: tokens)
    end
  end

  @doc """
  Login with email OR username and password.

  Accepts either email or username in the "identifier" field.
  Implements account lockout protection to prevent brute force attacks.
  """
  def login(conn, params)

  def login(conn, %{"email" => email, "password" => password}) do
    # Delegate to identifier-based login for backwards compatibility
    login(conn, %{"identifier" => email, "password" => password})
  end

  def login(conn, %{"identifier" => identifier, "password" => password}) do
    ip_address = get_client_ip(conn)
    lockout_key = String.downcase(identifier)

    # Check if account is locked
    case AccountLockout.check_locked(lockout_key) do
      {:locked, remaining} -> respond_locked(conn, remaining)
      :ok -> attempt_authentication(conn, identifier, password, lockout_key, ip_address)
    end
  end

  defp respond_locked(conn, remaining) do
    conn
    |> put_status(:too_many_requests)
    |> put_resp_header("retry-after", Integer.to_string(remaining))
    |> json(%{
      error: "Account temporarily locked",
      message: "Too many failed login attempts. Please try again later.",
      retry_after: remaining
    })
  end

  defp attempt_authentication(conn, identifier, password, lockout_key, ip_address) do
    case Accounts.authenticate_by_identifier(identifier, password) do
      {:ok, user} -> handle_successful_login(conn, user, lockout_key)
      {:error, :no_password_set} -> respond_no_password(conn)
      {:error, reason} when reason in [:invalid_credentials, :user_not_found] ->
        handle_failed_login(conn, lockout_key, ip_address)
    end
  end

  defp handle_successful_login(conn, user, lockout_key) do
    AccountLockout.clear_attempts(lockout_key)

    with {:ok, tokens} <- Guardian.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> maybe_set_cookies(tokens)
      |> render(:auth_response, user: user, tokens: tokens)
    end
  end

  defp respond_no_password(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{
      error: "No password set",
      message: "This account was created with OAuth or wallet. Please use that method to login."
    })
  end

  defp handle_failed_login(conn, lockout_key, ip_address) do
    case AccountLockout.record_failed_attempt(lockout_key, ip_address: ip_address) do
      {:locked, duration} -> respond_account_locked(conn, duration)
      :ok -> respond_invalid_credentials(conn)
    end
  end

  defp respond_account_locked(conn, duration) do
    conn
    |> put_status(:too_many_requests)
    |> put_resp_header("retry-after", Integer.to_string(duration))
    |> json(%{error: "Account locked", message: "Too many failed login attempts. Account has been locked.", retry_after: duration})
  end

  defp respond_invalid_credentials(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "Invalid username/email or password"})
  end

  @doc """
  Refresh access token using refresh token.
  Accepts token from body or HTTP-only cookie.
  """
  def refresh(conn, params) do
    # Check for refresh token in body first, then cookie
    refresh_token = params["refresh_token"] || CookieAuth.get_refresh_token(conn)
    
    case refresh_token do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "No refresh token provided"})
        
      token ->
        case Guardian.refresh_tokens(token) do
          {:ok, tokens} ->
            conn
            |> maybe_set_cookies(tokens)
            |> json(%{tokens: tokens})

          {:error, _reason} ->
            conn
            |> CookieAuth.clear_auth_cookies()
            |> put_status(:unauthorized)
            |> json(%{error: "Invalid or expired refresh token"})
        end
    end
  end

  @doc """
  Request a wallet authentication challenge.
  Returns a nonce to sign with the wallet.
  """
  def wallet_challenge(conn, %{"wallet_address" => address}) do
    case Accounts.get_or_create_wallet_challenge(address) do
      {:ok, nonce} ->
        message = "Sign this message to authenticate with Cgraph.\n\nNonce: #{nonce}"
        json(conn, %{message: message, nonce: nonce})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  @doc """
  Verify wallet signature and authenticate.
  Sets HTTP-only cookies for web clients.
  """
  def wallet_verify(conn, %{"wallet_address" => address, "signature" => signature}) do
    with {:ok, user} <- Accounts.verify_wallet_signature(address, signature),
         {:ok, tokens} <- Guardian.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> maybe_set_cookies(tokens)
      |> render(:auth_response, user: user, tokens: tokens)
    else
      {:error, :invalid_signature} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid signature"})

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  @doc """
  Request password reset email.
  """
  def forgot_password(conn, %{"email" => email}) do
    # Always return success to prevent email enumeration
    Accounts.request_password_reset(email)
    json(conn, %{message: "If an account exists with this email, you will receive a password reset link."})
  end

  @doc """
  Reset password with token.
  """
  def reset_password(conn, %{"token" => token, "password" => password, "password_confirmation" => confirmation}) do
    case Accounts.reset_password(token, password, confirmation) do
      {:ok, _user} ->
        json(conn, %{message: "Password has been reset successfully."})

      {:error, :invalid_token} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid or expired reset token"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: CgraphWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  @doc """
  Logout and revoke the current session and JWT token.

  This ensures both the session record is deleted and the JWT
  is added to the blacklist to prevent reuse.
  Also clears HTTP-only auth cookies.
  """
  def logout(conn, _params) do
    # Get the token from Authorization header or cookie
    token = case get_req_header(conn, "authorization") do
      ["Bearer " <> t] -> t
      _ -> CookieAuth.get_access_token(conn)
    end
    
    case token do
      nil ->
        conn
        |> CookieAuth.clear_auth_cookies()
        |> json(%{message: "Logged out successfully"})
        
      token ->
        # Get user for audit logging
        user = Guardian.Plug.current_resource(conn)
        user_id = if user, do: user.id, else: nil

        # Delete session record from database
        Accounts.delete_session_token(token)

        # Add token to blacklist for remaining validity period
        Guardian.revoke_token(token, reason: :logout, user_id: user_id)

        conn
        |> CookieAuth.clear_auth_cookies()
        |> json(%{message: "Logged out successfully"})
    end
  end

  @doc """
  Verify email with token.
  """
  def verify_email(conn, %{"token" => token}) do
    case Accounts.verify_email(token) do
      {:ok, _user} ->
        json(conn, %{message: "Email verified successfully"})

      {:error, :invalid_token} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid verification token"})

      {:error, :expired_token} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Verification token has expired. Please request a new one."})

      {:error, _} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to verify email"})
    end
  end

  @doc """
  Resend verification email.
  Requires authentication.
  """
  def resend_verification(conn, _params) do
    case Guardian.Plug.current_resource(conn) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication required"})

      user ->
        case Accounts.resend_verification_email(user) do
          {:ok, _token} ->
            json(conn, %{message: "Verification email sent"})

          {:error, :rate_limited} ->
            conn
            |> put_status(:too_many_requests)
            |> json(%{error: "Please wait before requesting another verification email"})

          {:error, _} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: "Failed to send verification email"})
        end
    end
  end

  # Private helpers

  defp get_client_ip(conn) do
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded_for = get_req_header(conn, "x-forwarded-for")
    real_ip = get_req_header(conn, "x-real-ip")

    cond do
      forwarded_for != [] ->
        # X-Forwarded-For can contain multiple IPs, take the first (client)
        forwarded_for
        |> List.first()
        |> String.split(",")
        |> List.first()
        |> String.trim()

      real_ip != [] ->
        List.first(real_ip)

      true ->
        # Fall back to remote_ip from conn
        conn.remote_ip
        |> :inet.ntoa()
        |> List.to_string()
    end
  end
  
  # Set HTTP-only cookies for web clients
  # Mobile clients use the tokens from the JSON response directly
  defp maybe_set_cookies(conn, tokens) do
    # Check if request indicates web client (has Origin header or specific User-Agent)
    # This allows mobile clients to continue using token-based auth
    case get_req_header(conn, "x-auth-mode") do
      ["cookie"] ->
        CookieAuth.set_auth_cookies(conn, tokens.access_token, tokens.refresh_token)
      _ ->
        # Default: set cookies for all requests (backwards compatible)
        # Mobile clients will ignore cookies and use token from response
        CookieAuth.set_auth_cookies(conn, tokens.access_token, tokens.refresh_token)
    end
  end
end
