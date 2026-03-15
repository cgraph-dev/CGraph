defmodule CGraph.Accounts.WalletAuth.Recovery do
  @moduledoc """
  Handles recovery code generation, recovery file encryption/decryption,
  and account recovery flows.

  This module provides:

  - Recovery code generation and verification (8 single-use codes)
  - Encrypted recovery file creation and decryption (AES-256-CBC)
  - Account recovery via backup codes or recovery files
  """

  import Ecto.Query

  alias CGraph.Accounts.{RecoveryCode, User}
  alias CGraph.Accounts.WalletAuth.Credentials
  alias CGraph.Repo

  # =============================================================================
  # Recovery Codes
  # =============================================================================

  @doc """
  Generates 8 single-use recovery codes.

  Format: XXXX-XXXX-XXXX-XXXX (4 segments of 4 chars each)
  Example: A3B7-K9M2-P5Q8-R1S4
  """
  @spec generate_recovery_codes(pos_integer()) :: {:ok, [String.t()]}
  def generate_recovery_codes(count \\ 8) do
    codes = Enum.map(1..count, fn _ -> generate_single_recovery_code() end)
    {:ok, codes}
  end

  defp generate_single_recovery_code do
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # Excluding confusing chars (0, O, 1, I)
    chars_len = String.length(chars)

    Enum.map_join(1..4, "-", fn _ ->
      :crypto.strong_rand_bytes(4)
      |> :binary.bin_to_list()
      |> Enum.map_join(fn byte -> String.at(chars, rem(byte, chars_len)) end)
    end)
  end

  @doc """
  Hashes recovery codes for secure storage.
  Returns a list of hashed codes.
  """
  @spec hash_recovery_codes([String.t()]) :: [String.t()]
  def hash_recovery_codes(codes) do
    Enum.map(codes, fn code ->
      # Use SHA256 for recovery codes (faster than Argon2, still secure for one-time codes)
      :crypto.hash(:sha256, code) |> Base.encode16(case: :lower)
    end)
  end

  @doc """
  Verifies a recovery code against stored hashes.
  Returns `{:ok, index}` if valid, `{:error, :invalid}` otherwise.
  """
  @spec verify_recovery_code(String.t(), [String.t()]) ::
          {:ok, non_neg_integer()} | {:error, :invalid}
  def verify_recovery_code(input_code, hashed_codes) do
    input_hash = :crypto.hash(:sha256, input_code) |> Base.encode16(case: :lower)

    case Enum.find_index(hashed_codes, fn hash -> hash == input_hash end) do
      nil -> {:error, :invalid}
      index -> {:ok, index}
    end
  end

  # =============================================================================
  # File Recovery
  # =============================================================================

  @doc """
  Generates an encrypted recovery file content.

  The file contains the wallet credentials encrypted with the user's PIN.
  """
  @spec generate_recovery_file(String.t(), String.t(), String.t()) :: {:ok, String.t()}
  def generate_recovery_file(wallet_address, crypto_alias, pin) do
    payload = %{
      wallet_address: wallet_address,
      crypto_alias: crypto_alias,
      created_at: DateTime.utc_now() |> DateTime.to_iso8601(),
      version: "1.0"
    }

    json = Jason.encode!(payload)

    # Derive encryption key from PIN
    key = derive_key_from_pin(pin)

    # Generate IV
    iv = :crypto.strong_rand_bytes(16)

    # Encrypt
    encrypted = :crypto.crypto_one_time(:aes_256_cbc, key, iv, pkcs7_pad(json), true)

    # Combine IV + encrypted data and base64 encode
    combined = iv <> encrypted
    encoded = Base.encode64(combined)

    {:ok, encoded}
  end

  @doc """
  Decrypts a recovery file using the PIN.
  """
  @spec decrypt_recovery_file(String.t(), String.t()) ::
          {:ok, map()} | {:error, :invalid_format | :decryption_failed}
  def decrypt_recovery_file(encrypted_content, pin) do
    combined = Base.decode64!(encrypted_content)
    <<iv::binary-size(16), encrypted::binary>> = combined

    key = derive_key_from_pin(pin)
    decrypted = :crypto.crypto_one_time(:aes_256_cbc, key, iv, encrypted, false)
    json = pkcs7_unpad(decrypted)

    case Jason.decode(json) do
      {:ok, data} -> {:ok, data}
      {:error, _} -> {:error, :invalid_format}
    end
  rescue
    _ -> {:error, :decryption_failed}
  end

  defp derive_key_from_pin(pin) do
    # Use PBKDF2 to derive a 256-bit key from the PIN
    salt = "cgraph_wallet_recovery_v1"
    :crypto.pbkdf2_hmac(:sha256, pin, salt, 100_000, 32)
  end

  defp pkcs7_pad(data) do
    block_size = 16
    padding_size = block_size - rem(byte_size(data), block_size)
    padding = :binary.copy(<<padding_size>>, padding_size)
    data <> padding
  end

  defp pkcs7_unpad(data) do
    padding_size = :binary.last(data)
    :binary.part(data, 0, byte_size(data) - padding_size)
  end

  # =============================================================================
  # Account Recovery
  # =============================================================================

  @doc """
  Recovers account access using a recovery code.
  Invalidates the used code after successful recovery.
  """
  @spec recover_with_code(String.t(), String.t(), String.t()) ::
          {:ok, any()} | {:error, any()}
  def recover_with_code(wallet_address, recovery_code, new_pin) do
    Repo.transaction(fn ->
      user = Repo.get_by(User, wallet_address: wallet_address)

      unless user do
        Repo.rollback(:user_not_found)
      end

      # Get unused recovery codes
      codes_query =
        from rc in RecoveryCode,
          where: rc.user_id == ^user.id and rc.used == false,
          select: rc

      recovery_codes = Repo.all(codes_query)
      hashed_codes = Enum.map(recovery_codes, & &1.code_hash)

      case verify_recovery_code(recovery_code, hashed_codes) do
        {:ok, index} ->
          # Mark code as used
          code = Enum.at(recovery_codes, index)
          code
          |> Ecto.Changeset.change(%{used: true, used_at: DateTime.utc_now() |> DateTime.truncate(:second)})
          |> Repo.update!()

          # Update PIN
          new_pin_hash = Credentials.hash_pin(new_pin)
          user
          |> Ecto.Changeset.change(%{pin_hash: new_pin_hash})
          |> Repo.update!()

          {:ok, user}

        {:error, _} ->
          Repo.rollback(:invalid_recovery_code)
      end
    end)
  end

  @doc """
  Recovers account access using a recovery file.
  """
  @spec recover_with_file(String.t(), String.t(), String.t()) ::
          {:ok, any()} | {:error, any()}
  def recover_with_file(file_content, old_pin, new_pin) do
    case decrypt_recovery_file(file_content, old_pin) do
      {:ok, data} ->
        wallet_address = data["wallet_address"]
        user = Repo.get_by(User, wallet_address: wallet_address)

        if user do
          new_pin_hash = Credentials.hash_pin(new_pin)

          user
          |> Ecto.Changeset.change(%{pin_hash: new_pin_hash})
          |> Repo.update()
        else
          {:error, :user_not_found}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end
end
