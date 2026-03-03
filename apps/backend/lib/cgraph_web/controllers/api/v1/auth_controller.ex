defmodule CGraphWeb.API.V1.AuthController do
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
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Accounts
  alias CGraph.Auth.TokenManager
  alias CGraph.Guardian
  alias CGraph.Security.AccountLockout
  alias CGraph.Security.TOTP
  alias CGraphWeb.Plugs.CookieAuth
  alias CGraphWeb.Validation.AuthParams

  action_fallback CGraphWeb.FallbackController

  @doc """
  Register a new user with email and password.
  Sets HTTP-only cookies for web clients.
  """
  @spec register(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def register(conn, %{"user" => user_params}) do
      with {:ok, attrs} <- AuthParams.validate_register(user_params),
        {:ok, user} <- Accounts.register_user(attrs),
         {:ok, tokens} <- TokenManager.generate_tokens(user),
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
  @spec login(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def login(conn, params)

  def login(conn, %{"email" => email, "password" => password}) do
    # Delegate to identifier-based login for backwards compatibility
    login(conn, %{"identifier" => email, "password" => password})
  end

  def login(conn, %{"username" => username, "password" => password}) do
    # Delegate to identifier-based login for backwards compatibility
    login(conn, %{"identifier" => username, "password" => password})
  end

  def login(conn, %{"identifier" => identifier, "password" => password}) do
    with {:ok, %{identifier: normalized_identifier, password: normalized_password}} <-
           AuthParams.validate_login(%{"identifier" => identifier, "password" => password}) do
      ip_address = get_client_ip(conn)
      lockout_key = String.downcase(normalized_identifier)

      case safe_check_locked(lockout_key) do
        {:locked, remaining} -> respond_locked(conn, remaining)
        :ok -> attempt_authentication(conn, normalized_identifier, normalized_password, lockout_key, ip_address)
      end
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  # Safe wrapper for AccountLockout.check_locked that handles GenServer being unavailable
  defp safe_check_locked(lockout_key) do
    AccountLockout.check_locked(lockout_key)
  catch
    :exit, {:noproc, _} ->
      # Fail-closed: block login when lockout service is unavailable (security best practice)
      require Logger
      Logger.error("AccountLockout GenServer not running, blocking login for safety")
      {:locked, 60}
    :exit, {:timeout, _} ->
      # Fail-closed: block login on timeout
      require Logger
      Logger.error("AccountLockout timeout, blocking login for safety")
      {:locked, 60}
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
    safe_clear_attempts(lockout_key)

    if user.totp_enabled do
      # 2FA is enabled — issue a temp token, require TOTP verification before issuing JWT tokens
      temp_token = Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false)

      Cachex.put(:two_factor_challenges, temp_token, %{
        user_id: user.id,
        lockout_key: lockout_key
      }, ttl: :timer.minutes(5))

      conn
      |> put_status(:ok)
      |> json(%{status: "2fa_required", two_factor_token: temp_token})
    else
      # No 2FA — issue tokens directly
      with {:ok, tokens} <- TokenManager.generate_tokens(user),
           {:ok, _session} <- Accounts.create_session(user, conn) do
        conn
        |> maybe_set_cookies(tokens)
        |> render(:auth_response, user: user, tokens: tokens)
      end
    end
  end

  @doc """
  Verify 2FA code after password login for users with TOTP enabled.

  Accepts a temp token (from login response) and a TOTP code or backup code.
  On success, issues JWT tokens and creates a session.
  """
  @spec verify_login_2fa(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def verify_login_2fa(conn, %{"two_factor_token" => two_factor_token, "code" => code}) do
    case Cachex.get(:two_factor_challenges, two_factor_token) do
      {:ok, nil} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid or expired two-factor token"})

      {:ok, %{user_id: user_id, lockout_key: lockout_key}} ->
        case Accounts.get_user(user_id) do
          {:ok, user} ->
            verify_2fa_code_and_issue_tokens(conn, user, code, two_factor_token, lockout_key)

          {:error, _} ->
            conn
            |> put_status(:unauthorized)
            |> json(%{error: "Invalid or expired two-factor token"})
        end

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid or expired two-factor token"})
    end
  end

  def verify_login_2fa(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameters: two_factor_token, code"})
  end

  defp verify_2fa_code_and_issue_tokens(conn, user, code, two_factor_token, lockout_key) do
    case TOTP.verify(user, code) do
      :ok ->
        issue_tokens_after_2fa(conn, user, two_factor_token, lockout_key)

      {:error, :invalid_code} ->
        # Try backup code
        case TOTP.use_backup_code(user, code) do
          {:ok, _remaining} ->
            issue_tokens_after_2fa(conn, user, two_factor_token, lockout_key)

          {:error, _} ->
            conn
            |> put_status(:unauthorized)
            |> json(%{error: "Invalid verification code"})
        end

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid verification code"})
    end
  end

  defp issue_tokens_after_2fa(conn, user, two_factor_token, lockout_key) do
    # Delete temp token (single-use)
    Cachex.del(:two_factor_challenges, two_factor_token)
    safe_clear_attempts(lockout_key)

    with {:ok, tokens} <- TokenManager.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> maybe_set_cookies(tokens)
      |> render(:auth_response, user: user, tokens: tokens)
    end
  end

  # Safe wrapper for AccountLockout.clear_attempts
  defp safe_clear_attempts(lockout_key) do
    AccountLockout.clear_attempts(lockout_key)
  catch
    :exit, reason ->
      # Log but don't block login — clearing is best-effort after successful auth
      require Logger
      Logger.warning("accountlockout_unavailable_for_clearing_attempts", reason: inspect(reason))
      :ok
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
    case safe_record_failed_attempt(lockout_key, ip_address) do
      {:locked, duration} -> respond_account_locked(conn, duration)
      :ok -> respond_invalid_credentials(conn)
    end
  end

  # Safe wrapper for AccountLockout.record_failed_attempt
  defp safe_record_failed_attempt(lockout_key, ip_address) do
    AccountLockout.record_failed_attempt(lockout_key, ip_address: ip_address)
  catch
    :exit, reason ->
      # Fail-closed: treat as locked when unable to record attempt
      require Logger
      Logger.error("accountlockout_unavailable_for_recording_attempt", reason: inspect(reason))
      {:locked, 60}
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
  @spec refresh(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def refresh(conn, params) do
    with {:ok, %{refresh_token: body_token}} <- AuthParams.validate_refresh(params) do
      refresh_token = body_token || CookieAuth.get_refresh_token(conn)

      case refresh_token do
        nil ->
          conn
          |> put_status(:unauthorized)
          |> json(%{error: "No refresh token provided"})

        token ->
          case TokenManager.refresh(token) do
            {:ok, tokens} ->
              conn
              |> maybe_set_cookies(tokens)
              |> json(%{tokens: tokens})

            {:error, :token_reused} ->
              conn
              |> CookieAuth.clear_auth_cookies()
              |> render_error(401, "session_revoked")

            {:error, :family_revoked} ->
              conn
              |> CookieAuth.clear_auth_cookies()
              |> render_error(401, "session_revoked")

            {:error, :device_mismatch} ->
              conn
              |> CookieAuth.clear_auth_cookies()
              |> render_error(401, "device_mismatch")

            {:error, _reason} ->
              conn
              |> CookieAuth.clear_auth_cookies()
              |> render_error(401, "Invalid or expired refresh token")
          end
      end
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  @doc """
  Request a wallet authentication challenge.
  Returns a nonce to sign with the wallet.
  """
  @spec wallet_challenge(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def wallet_challenge(conn, %{"wallet_address" => address}) do
    with {:ok, %{wallet_address: wallet_address}} <- AuthParams.validate_wallet_challenge(%{"wallet_address" => address}) do
      domain = get_request_domain(conn)

      case Accounts.get_or_create_wallet_challenge(wallet_address) do
        {:ok, nonce} ->
          message =
            CGraph.Accounts.WalletAuthentication.build_siwe_message(nonce, wallet_address, domain)

          render_data(conn, %{message: message, nonce: nonce})

        {:error, reason} ->
          conn
          |> put_status(:bad_request)
          |> json(%{error: reason})
      end
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  defp get_request_domain(conn) do
    origin = Plug.Conn.get_req_header(conn, "origin") |> List.first("")

    case URI.parse(origin) do
      %URI{host: host} when is_binary(host) and host != "" -> host
      _ -> "web.cgraph.org"
    end
  end

  @doc """
  Verify wallet signature and authenticate.
  Sets HTTP-only cookies for web clients.
  """
  @spec wallet_verify(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def wallet_verify(conn, %{"wallet_address" => address, "signature" => signature} = params) do
    message = Map.get(params, "message")

    with {:ok, %{wallet_address: wallet_address, signature: sig}} <-
           AuthParams.validate_wallet_verify(%{"wallet_address" => address, "signature" => signature}),
         {:ok, user} <- Accounts.verify_wallet_signature(wallet_address, sig, message),
         {:ok, tokens} <- TokenManager.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> maybe_set_cookies(tokens)
      |> render(:auth_response, user: user, tokens: tokens)
    else
      {:error, :invalid_signature} ->
        conn
        |> render_error(401, "Invalid signature")

      {:error, reason} ->
        conn
        |> render_error(400, reason)
    end
  end

  @doc """
  Request password reset email.
  """
  @spec forgot_password(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def forgot_password(conn, %{"email" => email}) do
    with {:ok, %{email: normalized_email}} <- AuthParams.validate_forgot_password(%{"email" => email}) do
      # Always return success to prevent email enumeration
      Accounts.request_password_reset(normalized_email)
      render_data(conn, %{message: "If an account exists with this email, you will receive a password reset link."})
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  @doc """
  Reset password with token.
  """
  @spec reset_password(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reset_password(conn, %{"token" => token, "password" => password, "password_confirmation" => confirmation}) do
    with {:ok, %{token: reset_token, password: pass, password_confirmation: confirm}} <-
           AuthParams.validate_reset_password(%{"token" => token, "password" => password, "password_confirmation" => confirmation}) do
      case Accounts.reset_password(reset_token, pass, confirm) do
      {:ok, _user} ->
        render_data(conn, %{message: "Password has been reset successfully."})

      {:error, :invalid_token} ->
        render_error(conn, 400, "Invalid or expired reset token")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(json: CGraphWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
      end
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  @doc """
  Logout and revoke the current session and JWT token.

  This ensures both the session record is deleted and the JWT
  is added to the blacklist to prevent reuse.
  Also clears HTTP-only auth cookies.
  """
  @spec logout(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
        |> json(%{data: %{message: "Logged out successfully"}})

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
        |> json(%{data: %{message: "Logged out successfully"}})
    end
  end

  @doc """
  Verify email with token.
  """
  @spec verify_email(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def verify_email(conn, %{"token" => token}) do
    case Accounts.verify_email(token) do
      {:ok, _user} ->
        render_data(conn, %{message: "Email verified successfully"})

      {:error, :invalid_token} ->
        render_error(conn, 400, "Invalid verification token")

      {:error, :expired_token} ->
        render_error(conn, 400, "Verification token has expired. Please request a new one.")

      {:error, _} ->
        render_error(conn, 500, "Failed to verify email")
    end
  end

  @doc """
  Resend verification email.
  Requires authentication.
  """
  @spec resend_verification(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def resend_verification(conn, _params) do
    case Guardian.Plug.current_resource(conn) do
      nil ->
        render_error(conn, 401, "Authentication required")

      user ->
        case Accounts.resend_verification_email(user) do
          {:ok, _token} ->
            render_data(conn, %{message: "Verification email sent"})

          {:error, :rate_limited} ->
            render_error(conn, 429, "Please wait before requesting another verification email")

          {:error, _} ->
            render_error(conn, 500, "Failed to send verification email")
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
