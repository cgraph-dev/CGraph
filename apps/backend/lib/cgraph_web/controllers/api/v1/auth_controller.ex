defmodule CgraphWeb.API.V1.AuthController do
  @moduledoc """
  Authentication controller handling:
  - Email/password registration and login
  - Ethereum wallet authentication
  - Token refresh
  - Password reset
  """
  use CgraphWeb, :controller

  alias Cgraph.Accounts
  alias Cgraph.Guardian

  action_fallback CgraphWeb.FallbackController

  @doc """
  Register a new user with email and password.
  """
  def register(conn, %{"user" => user_params}) do
    with {:ok, user} <- Accounts.register_user(user_params),
         {:ok, tokens} <- Guardian.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> put_status(:created)
      |> render(:auth_response, user: user, tokens: tokens)
    end
  end

  @doc """
  Login with email and password.
  """
  def login(conn, %{"email" => email, "password" => password}) do
    with {:ok, user} <- Accounts.authenticate_user(email, password),
         {:ok, tokens} <- Guardian.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
      |> render(:auth_response, user: user, tokens: tokens)
    else
      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})

      {:error, :user_not_found} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
    end
  end

  @doc """
  Refresh access token using refresh token.
  """
  def refresh(conn, %{"refresh_token" => refresh_token}) do
    case Guardian.refresh_tokens(refresh_token) do
      {:ok, tokens} ->
        json(conn, %{tokens: tokens})

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid or expired refresh token"})
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
  """
  def wallet_verify(conn, %{"wallet_address" => address, "signature" => signature}) do
    with {:ok, user} <- Accounts.verify_wallet_signature(address, signature),
         {:ok, tokens} <- Guardian.generate_tokens(user),
         {:ok, _session} <- Accounts.create_session(user, conn) do
      conn
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
  Logout and revoke the current session.
  """
  def logout(conn, _params) do
    # Get the token from Authorization header
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        Accounts.delete_session_token(token)
        json(conn, %{message: "Logged out successfully"})
      
      _ ->
        json(conn, %{message: "Logged out successfully"})
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
end
