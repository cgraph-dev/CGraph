defmodule CGraph.Security.TOTP do
  @moduledoc """
  Time-based One-Time Password (TOTP) implementation for 2FA.

  Delegates to submodules:

  - `CGraph.Security.TOTP.Algorithm` — TOTP generation, validation, encryption, config
  - `CGraph.Security.TOTP.BackupCodes` — backup code generation and management

  ## Usage

      # Setup 2FA
      {:ok, setup} = TOTP.setup_2fa(user)

      # Verify and enable
      TOTP.verify_and_enable(user, code, secret, backup_codes)

      # Verify during login
      TOTP.verify(user, code)

      # Use backup code
      TOTP.use_backup_code(user, code)

      # Disable 2FA
      TOTP.disable_2fa(user, code)

  ## Configuration

      config :cgraph, CGraph.Security.TOTP,
        issuer: "CGraph",
        digits: 6,
        period: 30,
        drift: 1,
        backup_codes_count: 10
  """

  require Logger

  alias CGraph.Accounts.User
  alias CGraph.Audit
  alias CGraph.Repo
  alias CGraph.Security.TokenBlacklist
  alias CGraph.Security.TOTP.{Algorithm, BackupCodes}

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
  """
  @spec setup_2fa(User.t()) :: {:ok, setup_result()} | {:error, :already_enabled}
  def setup_2fa(%User{} = user) do
    if totp_enabled?(user) do
      {:error, :already_enabled}
    else
      secret = Algorithm.generate_secret()
      backup_codes = BackupCodes.generate_backup_codes()

      {:ok, %{
        secret: Base.encode64(secret),
        secret_base32: Base.encode32(secret, padding: false),
        qr_code_uri: Algorithm.build_otpauth_uri(user, secret),
        backup_codes: backup_codes
      }}
    end
  end

  @doc """
  Verify a TOTP code and enable 2FA for the user.

  This should be called after `setup_2fa/1` with the code from
  the user's authenticator app to confirm setup.
  """
  @spec verify_and_enable(User.t(), totp_code(), String.t(), [backup_code()]) ::
    {:ok, User.t()} | {:error, :invalid_code}
  def verify_and_enable(%User{} = user, code, secret_base64, backup_codes) do
    secret = Base.decode64!(secret_base64)

    if Algorithm.valid_totp?(secret, code) do
      encrypted_secret = Algorithm.encrypt_secret(secret)
      hashed_backup_codes = BackupCodes.hash_backup_codes(backup_codes)

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
      secret = Algorithm.decrypt_secret(user.totp_secret)

      if Algorithm.valid_totp?(secret, code) do
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

  Backup codes can only be used once.
  """
  @spec use_backup_code(User.t(), backup_code()) ::
    {:ok, non_neg_integer()} | {:error, :invalid_code | :no_backup_codes}
  def use_backup_code(%User{} = user, code) do
    if is_nil(user.totp_backup_codes) or user.totp_backup_codes == [] do
      {:error, :no_backup_codes}
    else
      normalized_code = BackupCodes.normalize_backup_code(code)
      code_hash = BackupCodes.hash_backup_code(normalized_code)

      case BackupCodes.find_and_remove_backup_code(user.totp_backup_codes, code_hash) do
        {:ok, remaining_codes} ->
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

  @doc "Check if 2FA is enabled for a user."
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
        new_codes = BackupCodes.generate_backup_codes()
        hashed_codes = BackupCodes.hash_backup_codes(new_codes)

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
  # Private - Audit Logging
  # ---------------------------------------------------------------------------

  defp audit_2fa_enabled(user) do
    Audit.log(:security, :totp_enabled, %{user_id: user.id})
    Logger.info("2fa_enabled_for_user", user_id: user.id)
  rescue
    _ -> :ok
  end

  defp audit_2fa_disabled(user) do
    Audit.log(:security, :totp_disabled, %{user_id: user.id})
    Logger.info("2fa_disabled_for_user", user_id: user.id)
  rescue
    _ -> :ok
  end

  defp audit_backup_code_used(user, remaining) do
    Audit.log(:security, :totp_backup_code_used, %{
      user_id: user.id,
      remaining_codes: remaining
    })
    Logger.info("backup_code_used_for_user_remaining", user_id: user.id, remaining: remaining)
  rescue
    _ -> :ok
  end

  defp audit_backup_codes_regenerated(user) do
    Audit.log(:security, :totp_backup_codes_regenerated, %{user_id: user.id})
    Logger.info("backup_codes_regenerated_for_user", user_id: user.id)
  rescue
    _ -> :ok
  end
end
