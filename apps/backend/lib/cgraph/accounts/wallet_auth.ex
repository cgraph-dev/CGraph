defmodule Cgraph.Accounts.WalletAuth do
  @moduledoc """
  Handles anonymous wallet-based authentication.

  Wallet authentication provides a privacy-first login method where users
  are identified by a cryptographic wallet address instead of email/password.

  ## Credential Format

  - Wallet Address: `0x` + 24 hexadecimal characters (e.g., `0x4A7F3C9E2D1B8E4F6C5A2B9D`)
  - Crypto Alias: `word-word-XXXXXX` format (e.g., `quantum-cipher-ABC123`)
  - PIN: 4-6 digit numeric code for authentication
  """

  import Ecto.Query
  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, RecoveryCode}

  @wallet_prefix "0x"
  @wallet_hex_length 24
  @alias_words_first ~w(quantum stellar cosmic neural atomic digital cyber crystal shadow phantom
                        arctic blazing cosmic digital ethereal frozen golden hidden iron jade
                        lunar mystic neon obsidian plasma radiant silent thunder ultra violet)
  @alias_words_second ~w(cipher nexus pulse vortex matrix shield beacon prism nova flux
                         forge spark drift echo flame ghost haven iris knight lotus
                         nexus omega phoenix quasar raven storm titan unity wave zenith)

  # =============================================================================
  # Wallet Address Generation
  # =============================================================================

  @doc """
  Generates a new unique wallet address.

  Format: 0x + 24 hexadecimal characters
  Example: 0x4A7F3C9E2D1B8E4F6C5A2B9D

  Returns `{:ok, address}` or `{:error, reason}` if generation fails.
  """
  def generate_wallet_address do
    address = do_generate_address()

    # Ensure uniqueness
    if wallet_address_exists?(address) do
      generate_wallet_address()  # Recursively try again
    else
      {:ok, address}
    end
  end

  defp do_generate_address do
    hex_chars = "0123456789ABCDEF"

    random_hex =
      1..@wallet_hex_length
      |> Enum.map(fn _ -> String.at(hex_chars, :rand.uniform(16) - 1) end)
      |> Enum.join()

    @wallet_prefix <> random_hex
  end

  @doc """
  Validates wallet address format.
  """
  def valid_wallet_address?(address) when is_binary(address) do
    case address do
      <<@wallet_prefix, hex::binary-size(@wallet_hex_length)>> ->
        String.match?(hex, ~r/^[0-9A-Fa-f]+$/)
      _ ->
        false
    end
  end

  def valid_wallet_address?(_), do: false

  defp wallet_address_exists?(address) do
    Repo.exists?(from u in User, where: u.wallet_address == ^address)
  end

  # =============================================================================
  # Crypto Alias Generation
  # =============================================================================

  @doc """
  Generates a unique crypto alias.

  Format: word-word-XXXXXX (where X is alphanumeric)
  Example: quantum-cipher-ABC123
  """
  def generate_crypto_alias do
    alias_str = do_generate_alias()

    if crypto_alias_exists?(alias_str) do
      generate_crypto_alias()
    else
      {:ok, alias_str}
    end
  end

  defp do_generate_alias do
    word1 = Enum.random(@alias_words_first)
    word2 = Enum.random(@alias_words_second)
    suffix = generate_alphanumeric_suffix(6)

    "#{word1}-#{word2}-#{suffix}"
  end

  defp generate_alphanumeric_suffix(length) do
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    1..length
    |> Enum.map(fn _ -> String.at(chars, :rand.uniform(36) - 1) end)
    |> Enum.join()
  end

  defp crypto_alias_exists?(alias_str) do
    Repo.exists?(from u in User, where: u.crypto_alias == ^alias_str)
  end

  # =============================================================================
  # PIN Management
  # =============================================================================

  @doc """
  Validates PIN strength.

  Returns:
  - `{:ok, :excellent}` for 6 digits
  - `{:ok, :good}` for 5 digits
  - `{:error, :too_short}` for 4 digits (minimum allowed but weak)
  - `{:error, :invalid}` for less than 4 or non-numeric
  """
  def validate_pin_strength(pin) when is_binary(pin) do
    cond do
      not String.match?(pin, ~r/^\d+$/) ->
        {:error, :invalid_format}

      String.length(pin) < 4 ->
        {:error, :too_short}

      String.length(pin) == 4 ->
        {:ok, :minimum}

      String.length(pin) == 5 ->
        {:ok, :good}

      String.length(pin) >= 6 ->
        {:ok, :excellent}

      true ->
        {:error, :invalid}
    end
  end

  def validate_pin_strength(_), do: {:error, :invalid}

  @doc """
  Hashes a PIN for storage.
  Uses Argon2 for secure hashing.
  """
  def hash_pin(pin) do
    Argon2.hash_pwd_salt(pin)
  end

  @doc """
  Verifies a PIN against its hash.
  """
  def verify_pin(pin, hash) do
    Argon2.verify_pass(pin, hash)
  end

  # =============================================================================
  # Recovery Codes
  # =============================================================================

  @doc """
  Generates 8 single-use recovery codes.

  Format: XXXX-XXXX-XXXX-XXXX (4 segments of 4 chars each)
  Example: A3B7-K9M2-P5Q8-R1S4
  """
  def generate_recovery_codes(count \\ 8) do
    codes = Enum.map(1..count, fn _ -> generate_single_recovery_code() end)
    {:ok, codes}
  end

  defp generate_single_recovery_code do
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # Excluding confusing chars (0, O, 1, I)

    segments =
      1..4
      |> Enum.map(fn _ ->
        1..4
        |> Enum.map(fn _ -> String.at(chars, :rand.uniform(32) - 1) end)
        |> Enum.join()
      end)

    Enum.join(segments, "-")
  end

  @doc """
  Hashes recovery codes for secure storage.
  Returns a list of hashed codes.
  """
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
  def decrypt_recovery_file(encrypted_content, pin) do
    try do
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
  # Wallet Registration
  # =============================================================================

  @doc """
  Creates a new wallet-authenticated user.

  ## Parameters
  - `wallet_address`: The generated wallet address
  - `crypto_alias`: The generated crypto alias
  - `pin`: The user's chosen PIN (4-6 digits)
  - `recovery_method`: `:backup_codes` or `:file`

  ## Returns
  - `{:ok, %{user: user, recovery_data: data}}` on success
  - `{:error, changeset}` on failure
  """
  def create_wallet_user(wallet_address, crypto_alias, pin, recovery_method \\ :backup_codes) do
    Repo.transaction(fn ->
      # Validate inputs
      unless valid_wallet_address?(wallet_address) do
        Repo.rollback(:invalid_wallet_address)
      end

      case validate_pin_strength(pin) do
        {:error, reason} -> Repo.rollback(reason)
        {:ok, _} -> :ok
      end

      # Hash the PIN
      pin_hash = hash_pin(pin)

      # Create user
      user_attrs = %{
        wallet_address: wallet_address,
        crypto_alias: crypto_alias,
        pin_hash: pin_hash,
        auth_type: :wallet,
        display_name: crypto_alias,
        username: String.replace(crypto_alias, "-", "_")
      }

      user =
        %User{}
        |> User.wallet_registration_changeset(user_attrs)
        |> Repo.insert!()

      # Generate recovery data based on method
      recovery_data =
        case recovery_method do
          :backup_codes ->
            {:ok, codes} = generate_recovery_codes(8)
            hashed_codes = hash_recovery_codes(codes)

            # Store hashed codes
            Enum.each(hashed_codes, fn hash ->
              %RecoveryCode{}
              |> RecoveryCode.changeset(%{user_id: user.id, code_hash: hash, used: false})
              |> Repo.insert!()
            end)

            %{type: :backup_codes, codes: codes}

          :file ->
            {:ok, file_content} = generate_recovery_file(wallet_address, crypto_alias, pin)
            filename = "cgraph-wallet-#{crypto_alias}.cgraph"
            %{type: :file, content: file_content, filename: filename}
        end

      %{user: user, recovery_data: recovery_data}
    end)
  end

  # =============================================================================
  # Wallet Authentication
  # =============================================================================

  @doc """
  Authenticates a user with wallet address and PIN.
  """
  def authenticate_wallet(wallet_address, pin) do
    user = Repo.get_by(User, wallet_address: wallet_address)

    cond do
      is_nil(user) ->
        # Prevent timing attacks
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      is_nil(user.pin_hash) ->
        {:error, :no_pin_set}

      verify_pin(pin, user.pin_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Authenticates a user with crypto alias and PIN.
  """
  def authenticate_alias(crypto_alias, pin) do
    user = Repo.get_by(User, crypto_alias: crypto_alias)

    cond do
      is_nil(user) ->
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      is_nil(user.pin_hash) ->
        {:error, :no_pin_set}

      verify_pin(pin, user.pin_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  # =============================================================================
  # Account Recovery
  # =============================================================================

  @doc """
  Recovers account access using a recovery code.
  Invalidates the used code after successful recovery.
  """
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
          |> Ecto.Changeset.change(%{used: true, used_at: DateTime.utc_now()})
          |> Repo.update!()

          # Update PIN
          new_pin_hash = hash_pin(new_pin)
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
  def recover_with_file(file_content, old_pin, new_pin) do
    case decrypt_recovery_file(file_content, old_pin) do
      {:ok, data} ->
        wallet_address = data["wallet_address"]
        user = Repo.get_by(User, wallet_address: wallet_address)

        if user do
          new_pin_hash = hash_pin(new_pin)

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

  # =============================================================================
  # Linking Methods
  # =============================================================================

  @doc """
  Links a wallet to an existing email-authenticated user.
  """
  def link_wallet_to_user(user, pin) do
    case validate_pin_strength(pin) do
      {:error, reason} ->
        {:error, reason}

      {:ok, _} ->
        {:ok, wallet_address} = generate_wallet_address()
        {:ok, crypto_alias} = generate_crypto_alias()
        pin_hash = hash_pin(pin)

        user
        |> Ecto.Changeset.change(%{
          wallet_address: wallet_address,
          crypto_alias: crypto_alias,
          pin_hash: pin_hash
        })
        |> Repo.update()
    end
  end

  @doc """
  Links an email to an existing wallet-authenticated user.
  """
  def link_email_to_wallet_user(user, email, password) do
    password_hash = Argon2.hash_pwd_salt(password)

    user
    |> Ecto.Changeset.change(%{
      email: String.downcase(email),
      password_hash: password_hash
    })
    |> Ecto.Changeset.unique_constraint(:email)
    |> Ecto.Changeset.validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> Repo.update()
  end

  @doc """
  Unlinks wallet from user (must have email linked).
  """
  def unlink_wallet(user) do
    if is_nil(user.email) do
      {:error, :email_required}
    else
      user
      |> Ecto.Changeset.change(%{
        wallet_address: nil,
        crypto_alias: nil,
        pin_hash: nil
      })
      |> Repo.update()
    end
  end
end
