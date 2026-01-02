defmodule Cgraph.Security.TOTP do
  @moduledoc """
  Time-based One-Time Password (TOTP) implementation for 2FA.

  ## Overview

  Implements RFC 6238 TOTP for two-factor authentication:

  - **Setup**: Generate secret and QR code for authenticator apps
  - **Verify**: Validate TOTP codes with drift window
  - **Recovery**: Backup codes for account recovery
  - **Management**: Enable, disable, and regenerate 2FA

  ## Supported Authenticator Apps

  - Google Authenticator
  - Authy
  - Microsoft Authenticator
  - 1Password
  - Any RFC 6238 compliant app

  ## Usage

      # Setup 2FA
      {:ok, setup} = TOTP.setup_2fa(user)
      # Returns: %{secret: "...", qr_code_uri: "...", backup_codes: [...]}

      # Verify and enable
      case TOTP.verify_and_enable(user, code) do
        {:ok, user} -> # 2FA enabled
        {:error, :invalid_code} -> # Invalid code
      end

      # Verify during login
      case TOTP.verify(user, code) do
        :ok -> proceed_with_login()
        {:error, :invalid_code} -> reject_login()
      end

      # Use backup code
      case TOTP.use_backup_code(user, code) do
        {:ok, remaining} -> # Code used, remaining backup codes
        {:error, :invalid_code} -> # Invalid backup code
      end

      # Disable 2FA
      TOTP.disable_2fa(user)

  ## Configuration

      config :cgraph, Cgraph.Security.TOTP,
        issuer: "CGraph",
        digits: 6,
        period: 30,
        drift: 1,
        backup_codes_count: 10

  ## Security Notes

  - Secrets are encrypted at rest using application key
  - Backup codes are hashed (one-way)
  - Rate limiting on verification attempts
  - Codes are time-limited (30 second window + drift)
  """

  require Logger
  import Bitwise

  alias Cgraph.{Repo, Audit}
  alias Cgraph.Accounts.User
  alias Cgraph.Security.TokenBlacklist

  # TOTP configuration
  @default_issuer "CGraph"
  @default_digits 6
  @default_period 30
  @default_drift 1
  @backup_codes_count 10
  @backup_code_length 8

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type totp_code :: String.t()
  @type backup_code :: String.t()
  @type secret :: binary()

  @type setup_result :: %{
    secret: String.t(),
    secret_base32: String.t(),
    qr_code_uri: String.t(),
    backup_codes: [backup_code()]
  }

  # ---------------------------------------------------------------------------
  # Public API - Setup
  # ---------------------------------------------------------------------------

  @doc """
  Initialize 2FA setup for a user.

  Returns the secret, QR code URI, and backup codes.
  The secret is NOT saved until `verify_and_enable/2` is called.

  ## Returns

  - `{:ok, setup_data}` - Setup data including secret and QR code
  - `{:error, :already_enabled}` - 2FA is already enabled for this user
  """
  @spec setup_2fa(User.t()) :: {:ok, setup_result()} | {:error, :already_enabled}
  def setup_2fa(%User{} = user) do
    if totp_enabled?(user) do
      {:error, :already_enabled}
    else
      secret = generate_secret()
      backup_codes = generate_backup_codes()
      
      {:ok, %{
        secret: Base.encode64(secret),
        secret_base32: Base.encode32(secret, padding: false),
        qr_code_uri: build_otpauth_uri(user, secret),
        backup_codes: backup_codes
      }}
    end
  end

  @doc """
  Verify a TOTP code and enable 2FA for the user.

  This should be called after `setup_2fa/1` with the code from
  the user's authenticator app to confirm setup.

  ## Parameters

  - `user` - The user enabling 2FA
  - `code` - The 6-digit TOTP code
  - `secret` - The secret from `setup_2fa/1` (base64 encoded)
  - `backup_codes` - The backup codes from `setup_2fa/1`
  """
  @spec verify_and_enable(User.t(), totp_code(), String.t(), [backup_code()]) :: 
    {:ok, User.t()} | {:error, :invalid_code}
  def verify_and_enable(%User{} = user, code, secret_base64, backup_codes) do
    secret = Base.decode64!(secret_base64)
    
    if valid_totp?(secret, code) do
      # Encrypt secret for storage
      encrypted_secret = encrypt_secret(secret)
      hashed_backup_codes = hash_backup_codes(backup_codes)
      
      # Update user with 2FA data
      user
      |> User.totp_changeset(%{
        totp_enabled: true,
        totp_secret: encrypted_secret,
        totp_backup_codes: hashed_backup_codes,
        totp_enabled_at: DateTime.utc_now()
      })
      |> Repo.update()
      |> case do
        {:ok, updated_user} ->
          audit_2fa_enabled(user)
          {:ok, updated_user}
        
        error ->
          error
      end
    else
      {:error, :invalid_code}
    end
  end

  # ---------------------------------------------------------------------------
  # Public API - Verification
  # ---------------------------------------------------------------------------

  @doc """
  Verify a TOTP code for an authenticated user.

  Used during login or for sensitive operations requiring 2FA.
  """
  @spec verify(User.t(), totp_code()) :: :ok | {:error, :invalid_code | :totp_not_enabled}
  def verify(%User{} = user, code) do
    if totp_enabled?(user) do
      secret = decrypt_secret(user.totp_secret)
      
      if valid_totp?(secret, code) do
        :ok
      else
        {:error, :invalid_code}
      end
    else
      {:error, :totp_not_enabled}
    end
  end

  @doc """
  Use a backup code to authenticate.

  Backup codes can only be used once. Each successful use removes
  that code from the user's available backup codes.
  """
  @spec use_backup_code(User.t(), backup_code()) :: 
    {:ok, non_neg_integer()} | {:error, :invalid_code | :no_backup_codes}
  def use_backup_code(%User{} = user, code) do
    if is_nil(user.totp_backup_codes) or user.totp_backup_codes == [] do
      {:error, :no_backup_codes}
    else
      normalized_code = normalize_backup_code(code)
      code_hash = hash_backup_code(normalized_code)
      
      case find_and_remove_backup_code(user.totp_backup_codes, code_hash) do
        {:ok, remaining_codes} ->
          # Update user with remaining codes
          user
          |> User.totp_changeset(%{totp_backup_codes: remaining_codes})
          |> Repo.update()
          
          remaining_count = length(remaining_codes)
          
          audit_backup_code_used(user, remaining_count)
          
          {:ok, remaining_count}
        
        :not_found ->
          {:error, :invalid_code}
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Public API - Management
  # ---------------------------------------------------------------------------

  @doc """
  Check if 2FA is enabled for a user.
  """
  @spec totp_enabled?(User.t()) :: boolean()
  def totp_enabled?(%User{totp_enabled: enabled}), do: enabled == true
  def totp_enabled?(_), do: false

  @doc """
  Disable 2FA for a user.

  Requires either a valid TOTP code or backup code for security.
  """
  @spec disable_2fa(User.t(), totp_code() | backup_code()) :: 
    {:ok, User.t()} | {:error, :invalid_code}
  def disable_2fa(%User{} = user, code) do
    # Try TOTP code first, then backup code
    valid = case verify(user, code) do
      :ok -> true
      {:error, :invalid_code} ->
        case use_backup_code(user, code) do
          {:ok, _} -> true
          _ -> false
        end
      _ -> false
    end
    
    if valid do
      user
      |> User.totp_changeset(%{
        totp_enabled: false,
        totp_secret: nil,
        totp_backup_codes: nil,
        totp_enabled_at: nil
      })
      |> Repo.update()
      |> case do
        {:ok, updated_user} ->
          # Revoke all tokens for security
          TokenBlacklist.revoke_all_for_user(user.id, reason: :totp_disabled)
          audit_2fa_disabled(user)
          {:ok, updated_user}
        
        error ->
          error
      end
    else
      {:error, :invalid_code}
    end
  end

  @doc """
  Generate new backup codes for a user.

  Requires valid TOTP code. Replaces all existing backup codes.
  """
  @spec regenerate_backup_codes(User.t(), totp_code()) :: 
    {:ok, [backup_code()]} | {:error, :invalid_code}
  def regenerate_backup_codes(%User{} = user, code) do
    case verify(user, code) do
      :ok ->
        new_codes = generate_backup_codes()
        hashed_codes = hash_backup_codes(new_codes)
        
        user
        |> User.totp_changeset(%{totp_backup_codes: hashed_codes})
        |> Repo.update()
        |> case do
          {:ok, _} ->
            audit_backup_codes_regenerated(user)
            {:ok, new_codes}
          
          error ->
            error
        end
      
      error ->
        error
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions - TOTP Algorithm
  # ---------------------------------------------------------------------------

  defp generate_secret do
    :crypto.strong_rand_bytes(20)
  end

  defp valid_totp?(secret, code) when is_binary(code) do
    # Clean the code (remove spaces/dashes)
    clean_code = code |> String.replace(~r/[\s-]/, "") |> String.trim()
    
    # Get current time window
    current_window = div(System.system_time(:second), period())
    drift = drift_windows()
    
    # Check current window and drift windows
    Enum.any?(-drift..drift, fn offset ->
      expected = generate_totp(secret, current_window + offset)
      secure_compare(clean_code, expected)
    end)
  end

  defp generate_totp(secret, counter) do
    # HOTP algorithm (RFC 4226)
    counter_bytes = <<counter::unsigned-big-integer-size(64)>>
    
    hmac = :crypto.mac(:hmac, :sha, secret, counter_bytes)
    
    # Dynamic truncation
    offset = :binary.at(hmac, 19) &&& 0x0F
    
    <<_::binary-size(offset), code::unsigned-big-integer-size(32), _::binary>> = hmac
    
    # Mask to get 31-bit value and take modulo for digit count
    truncated = (code &&& 0x7FFFFFFF) |> rem(power_of_10(digits()))
    
    # Pad with zeros
    truncated
    |> Integer.to_string()
    |> String.pad_leading(digits(), "0")
  end

  defp power_of_10(n), do: :math.pow(10, n) |> round()

  defp secure_compare(a, b) when byte_size(a) != byte_size(b), do: false
  defp secure_compare(a, b) do
    # Constant-time comparison
    :crypto.hash_equals(a, b)
  end

  # ---------------------------------------------------------------------------
  # Private Functions - Backup Codes
  # ---------------------------------------------------------------------------

  defp generate_backup_codes do
    Enum.map(1..@backup_codes_count, fn _ ->
      :crypto.strong_rand_bytes(@backup_code_length)
      |> Base.encode32(case: :lower, padding: false)
      |> String.slice(0, @backup_code_length)
      |> format_backup_code()
    end)
  end

  defp format_backup_code(code) do
    # Format as XXXX-XXXX for readability
    code
    |> String.upcase()
    |> String.slice(0, 8)
    |> String.split_at(4)
    |> then(fn {a, b} -> "#{a}-#{b}" end)
  end

  defp normalize_backup_code(code) do
    code
    |> String.upcase()
    |> String.replace(~r/[\s-]/, "")
  end

  defp hash_backup_code(code) do
    :crypto.hash(:sha256, code)
    |> Base.encode64()
  end

  defp hash_backup_codes(codes) do
    Enum.map(codes, fn code ->
      normalized = normalize_backup_code(code)
      hash_backup_code(normalized)
    end)
  end

  defp find_and_remove_backup_code(hashed_codes, target_hash) do
    if target_hash in hashed_codes do
      {:ok, List.delete(hashed_codes, target_hash)}
    else
      :not_found
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions - Encryption
  # ---------------------------------------------------------------------------

  defp encrypt_secret(secret) do
    key = get_encryption_key()
    iv = :crypto.strong_rand_bytes(16)
    
    {ciphertext, tag} = :crypto.crypto_one_time_aead(
      :aes_256_gcm,
      key,
      iv,
      secret,
      "",
      true
    )
    
    # Combine IV + tag + ciphertext for storage
    Base.encode64(iv <> tag <> ciphertext)
  end

  defp decrypt_secret(encrypted_base64) do
    key = get_encryption_key()
    data = Base.decode64!(encrypted_base64)
    
    <<iv::binary-size(16), tag::binary-size(16), ciphertext::binary>> = data
    
    :crypto.crypto_one_time_aead(
      :aes_256_gcm,
      key,
      iv,
      ciphertext,
      "",
      tag,
      false
    )
  end

  defp get_encryption_key do
    # Derive from application secret
    secret = Application.get_env(:cgraph, CgraphWeb.Endpoint)[:secret_key_base]
    
    :crypto.hash(:sha256, "totp_encryption:" <> secret)
  end

  # ---------------------------------------------------------------------------
  # Private Functions - OTPAuth URI
  # ---------------------------------------------------------------------------

  defp build_otpauth_uri(user, secret) do
    issuer = config()[:issuer] || @default_issuer
    label = "#{issuer}:#{user.email}"
    secret_base32 = Base.encode32(secret, padding: false)
    
    params = URI.encode_query(%{
      "secret" => secret_base32,
      "issuer" => issuer,
      "algorithm" => "SHA1",
      "digits" => digits(),
      "period" => period()
    })
    
    "otpauth://totp/#{URI.encode(label)}?#{params}"
  end

  # ---------------------------------------------------------------------------
  # Private Functions - Configuration
  # ---------------------------------------------------------------------------

  defp config, do: Application.get_env(:cgraph, __MODULE__, [])
  defp digits, do: config()[:digits] || @default_digits
  defp period, do: config()[:period] || @default_period
  defp drift_windows, do: config()[:drift] || @default_drift

  # ---------------------------------------------------------------------------
  # Private Functions - Audit Logging
  # ---------------------------------------------------------------------------

  defp audit_2fa_enabled(user) do
    Audit.log(:security, :totp_enabled, %{user_id: user.id})
    Logger.info("2FA enabled for user #{user.id}")
  rescue
    _ -> :ok
  end

  defp audit_2fa_disabled(user) do
    Audit.log(:security, :totp_disabled, %{user_id: user.id})
    Logger.info("2FA disabled for user #{user.id}")
  rescue
    _ -> :ok
  end

  defp audit_backup_code_used(user, remaining) do
    Audit.log(:security, :totp_backup_code_used, %{
      user_id: user.id,
      remaining_codes: remaining
    })
    Logger.info("Backup code used for user #{user.id}, #{remaining} remaining")
  rescue
    _ -> :ok
  end

  defp audit_backup_codes_regenerated(user) do
    Audit.log(:security, :totp_backup_codes_regenerated, %{user_id: user.id})
    Logger.info("Backup codes regenerated for user #{user.id}")
  rescue
    _ -> :ok
  end
end
