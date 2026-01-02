defmodule CgraphWeb.API.V1.TwoFactorController do
  @moduledoc """
  Two-factor authentication (2FA) controller.
  
  Handles TOTP setup, verification, and management:
  - Setup: Generate secret and QR code for authenticator apps
  - Enable: Verify initial code to activate 2FA
  - Verify: Validate codes during login or sensitive operations
  - Disable: Remove 2FA protection (requires valid code)
  - Backup codes: Generate and regenerate recovery codes
  
  Supports all RFC 6238 compliant authenticator apps including
  Google Authenticator, Authy, and Microsoft Authenticator.
  """
  use CgraphWeb, :controller

  alias Cgraph.Security.TOTP
  alias Cgraph.Accounts.User

  action_fallback CgraphWeb.FallbackController

  @doc """
  Initialize 2FA setup for the authenticated user.
  
  Returns the secret, QR code URI for scanning, and backup codes.
  The user must call `enable/2` with a valid code to activate 2FA.
  
  ## Response
  
      {
        "secret": "base64_encoded_secret",
        "qr_code_uri": "otpauth://totp/CGraph:user@example.com?...",
        "backup_codes": ["XXXX-XXXX", ...]
      }
  """
  def setup(conn, _params) do
    user = conn.assigns.current_user
    
    case TOTP.setup_2fa(user) do
      {:ok, setup_data} ->
        conn
        |> put_status(:ok)
        |> json(%{
          secret: setup_data.secret,
          qr_code_uri: setup_data.qr_code_uri,
          backup_codes: setup_data.backup_codes
        })
      
      {:error, :already_enabled} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "Two-factor authentication is already enabled"})
    end
  end

  @doc """
  Enable 2FA after verifying the initial TOTP code.
  
  Must be called after `setup/2` with the code displayed by the
  authenticator app to confirm the secret was properly configured.
  
  ## Parameters
  
  - `code` - 6-digit TOTP code from authenticator app
  - `secret` - Secret from setup response (base64 encoded)
  - `backup_codes` - Backup codes from setup response
  """
  def enable(conn, %{"code" => code, "secret" => secret, "backup_codes" => backup_codes}) do
    user = conn.assigns.current_user
    
    case TOTP.verify_and_enable(user, code, secret, backup_codes) do
      {:ok, _user} ->
        conn
        |> put_status(:ok)
        |> json(%{
          message: "Two-factor authentication enabled successfully",
          enabled: true
        })
      
      {:error, :invalid_code} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Invalid verification code"})
    end
  end

  def enable(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameters: code, secret, backup_codes"})
  end

  @doc """
  Verify a TOTP code.
  
  Used during login or for sensitive operations requiring 2FA confirmation.
  
  ## Parameters
  
  - `code` - 6-digit TOTP code from authenticator app
  """
  def verify(conn, %{"code" => code}) do
    user = conn.assigns.current_user
    
    case TOTP.verify(user, code) do
      :ok ->
        conn
        |> put_status(:ok)
        |> json(%{valid: true})
      
      {:error, :invalid_code} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{valid: false, error: "Invalid code"})
      
      {:error, :totp_not_enabled} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Two-factor authentication is not enabled"})
    end
  end

  def verify(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: code"})
  end

  @doc """
  Disable 2FA for the authenticated user.
  
  Requires a valid TOTP code or backup code to prevent unauthorized disabling.
  All existing sessions are revoked for security.
  
  ## Parameters
  
  - `code` - Valid TOTP code or backup code
  """
  def disable(conn, %{"code" => code}) do
    user = conn.assigns.current_user
    
    case TOTP.disable_2fa(user, code) do
      {:ok, _user} ->
        conn
        |> put_status(:ok)
        |> json(%{
          message: "Two-factor authentication disabled",
          enabled: false
        })
      
      {:error, :invalid_code} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Invalid code"})
    end
  end

  def disable(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: code"})
  end

  @doc """
  Get 2FA status for the authenticated user.
  """
  def status(conn, _params) do
    user = conn.assigns.current_user
    
    enabled = TOTP.totp_enabled?(user)
    enabled_at = if enabled, do: user.totp_enabled_at, else: nil
    backup_codes_remaining = backup_code_count(user)
    
    conn
    |> put_status(:ok)
    |> json(%{
      enabled: enabled,
      enabled_at: enabled_at,
      backup_codes_remaining: backup_codes_remaining
    })
  end

  @doc """
  Regenerate backup codes.
  
  Invalidates all existing backup codes and generates new ones.
  Requires a valid TOTP code for security.
  
  ## Parameters
  
  - `code` - Valid TOTP code
  """
  def regenerate_backup_codes(conn, %{"code" => code}) do
    user = conn.assigns.current_user
    
    case TOTP.regenerate_backup_codes(user, code) do
      {:ok, backup_codes} ->
        conn
        |> put_status(:ok)
        |> json(%{
          backup_codes: backup_codes,
          count: length(backup_codes)
        })
      
      {:error, :invalid_code} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Invalid verification code"})
      
      {:error, :totp_not_enabled} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Two-factor authentication is not enabled"})
    end
  end

  def regenerate_backup_codes(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: code"})
  end

  @doc """
  Use a backup code for authentication.
  
  Backup codes are single-use and will be consumed upon successful use.
  
  ## Parameters
  
  - `code` - Backup code in format "XXXX-XXXX"
  """
  def use_backup_code(conn, %{"code" => code}) do
    user = conn.assigns.current_user
    
    case TOTP.use_backup_code(user, code) do
      {:ok, remaining} ->
        conn
        |> put_status(:ok)
        |> json(%{
          valid: true,
          backup_codes_remaining: remaining
        })
      
      {:error, :invalid_code} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{valid: false, error: "Invalid backup code"})
      
      {:error, :no_backup_codes} ->
        conn
        |> put_status(:gone)
        |> json(%{error: "No backup codes available"})
    end
  end

  def use_backup_code(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing required parameter: code"})
  end

  # Private helpers

  defp backup_code_count(%User{totp_backup_codes: nil}), do: 0
  defp backup_code_count(%User{totp_backup_codes: codes}), do: length(codes)
end
