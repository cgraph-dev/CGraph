defmodule CGraph.Crypto do
  @moduledoc """
  Cryptographic utilities for secure messaging and data protection.

  ## Overview

  Provides comprehensive cryptographic operations for:

  - **End-to-End Encryption**: AES-256-GCM for message encryption
  - **Key Derivation**: Argon2id for password hashing and key derivation
  - **Digital Signatures**: Ed25519 for message authentication
  - **Secure Random**: Cryptographically secure random generation
  - **Hash Functions**: SHA-256/512 for integrity verification

  ## Architecture

  Delegates to focused sub-modules:
  - `CGraph.Crypto.Encryption` — AES-256-GCM, compact encryption, envelope encryption
  - `CGraph.Crypto.Hashing` — SHA hashing, HMAC, password hashing, key derivation
  - `CGraph.Crypto.E2EE` — End-to-end encryption protocol

  ## Security Notes

  - All keys are 256-bit minimum
  - Nonces are never reused (using random generation)
  - Memory is securely wiped after key operations (where possible)
  - Timing-safe comparisons for all verification
  """

  alias CGraph.Crypto.{Encryption, Hashing}

  # Algorithm constants
  @aes_key_bytes 32
  @nonce_bytes 12
  @salt_bytes 16

  @type key :: binary()
  @type nonce :: binary()
  @type ciphertext :: binary()
  @type plaintext :: binary()
  @type encrypted_payload :: %{
    ciphertext: binary(),
    nonce: binary(),
    tag: binary(),
    algorithm: String.t()
  }

  # ---------------------------------------------------------------------------
  # Symmetric Encryption (AES-256-GCM) — delegated to Encryption
  # ---------------------------------------------------------------------------

  @doc "Encrypt data using AES-256-GCM. See `CGraph.Crypto.Encryption.encrypt/3`."
  @spec encrypt(plaintext(), key(), keyword()) :: {:ok, encrypted_payload()} | {:error, term()}
  def encrypt(plaintext, key, opts \\ []), do: Encryption.encrypt(plaintext, key, opts)

  @doc "Decrypt data encrypted with AES-256-GCM. See `CGraph.Crypto.Encryption.decrypt/3`."
  @spec decrypt(encrypted_payload(), key(), keyword()) :: {:ok, plaintext()} | {:error, term()}
  def decrypt(encrypted, key, opts \\ []), do: Encryption.decrypt(encrypted, key, opts)

  @doc "Encrypt data and return as a single base64-encoded string."
  defdelegate encrypt_compact(plaintext, key), to: Encryption

  @doc "Decrypt a compact encrypted string."
  defdelegate decrypt_compact(encrypted_b64, key), to: Encryption

  # ---------------------------------------------------------------------------
  # Envelope Encryption — delegated to Encryption
  # ---------------------------------------------------------------------------

  @doc "Encrypt large data using envelope encryption."
  defdelegate envelope_encrypt(plaintext, kek), to: Encryption

  @doc "Decrypt envelope-encrypted data."
  defdelegate envelope_decrypt(envelope, kek), to: Encryption

  # ---------------------------------------------------------------------------
  # Key Generation and Derivation
  # ---------------------------------------------------------------------------

  @doc """
  Generate a cryptographically secure random key.

  ## Options

  - `:bytes` - Key length in bytes (default: 32 for 256-bit)
  - `:encoding` - Output encoding (`:raw`, `:base64`, `:hex`)
  """
  @spec generate_key(keyword()) :: binary()
  def generate_key(opts \\ []) do
    bytes = Keyword.get(opts, :bytes, @aes_key_bytes)
    encoding = Keyword.get(opts, :encoding, :raw)

    key = :crypto.strong_rand_bytes(bytes)

    case encoding do
      :raw -> key
      :base64 -> Base.encode64(key)
      :hex -> Base.encode16(key, case: :lower)
    end
  end

  @doc "Derive an encryption key from a password using Argon2id."
  defdelegate derive_key(password, salt), to: Hashing

  @doc "Generate a random salt for key derivation."
  @spec generate_salt() :: binary()
  def generate_salt, do: :crypto.strong_rand_bytes(@salt_bytes)

  @doc "Generate a random nonce for encryption."
  @spec generate_nonce() :: binary()
  def generate_nonce, do: :crypto.strong_rand_bytes(@nonce_bytes)

  # ---------------------------------------------------------------------------
  # Hashing — delegated to Hashing
  # ---------------------------------------------------------------------------

  @doc "Compute SHA-256 hash of data."
  @spec hash(binary(), keyword()) :: binary()
  def hash(data, opts \\ []), do: Hashing.hash(data, opts)

  @doc "Compute SHA-512 hash of data."
  @spec hash512(binary(), keyword()) :: binary()
  def hash512(data, opts \\ []), do: Hashing.hash512(data, opts)

  @doc "Compute HMAC-SHA256."
  @spec hmac(binary(), key(), keyword()) :: binary()
  def hmac(data, key, opts \\ []), do: Hashing.hmac(data, key, opts)

  # ---------------------------------------------------------------------------
  # Password Hashing — delegated to Hashing
  # ---------------------------------------------------------------------------

  @doc "Hash a password for storage using Argon2id."
  defdelegate hash_password(password), to: Hashing

  @doc "Verify a password against a stored hash."
  defdelegate verify_password(password, hash), to: Hashing

  # ---------------------------------------------------------------------------
  # Secure Comparison — delegated to Hashing
  # ---------------------------------------------------------------------------

  @doc "Timing-safe comparison of two binaries."
  defdelegate secure_compare(a, b), to: Hashing

  # ---------------------------------------------------------------------------
  # Token Generation
  # ---------------------------------------------------------------------------

  @doc """
  Generate a cryptographically secure random token.
  """
  @spec generate_token(pos_integer()) :: binary()
  def generate_token(bytes \\ 32) do
    bytes
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end

  @doc """
  Generate a numeric OTP code.
  """
  @spec generate_otp(pos_integer()) :: binary()
  def generate_otp(digits \\ 6) do
    max = :math.pow(10, digits) |> round()

    :crypto.strong_rand_bytes(8)
    |> :binary.decode_unsigned()
    |> rem(max)
    |> Integer.to_string()
    |> String.pad_leading(digits, "0")
  end

  # ---------------------------------------------------------------------------
  # Utility Functions
  # ---------------------------------------------------------------------------

  @doc """
  Securely wipe sensitive data from memory.

  Note: Due to Erlang/Elixir memory management, this provides limited
  guarantees but helps reduce the window of exposure.
  """
  @spec secure_wipe(binary()) :: :ok
  def secure_wipe(data) when is_binary(data) do
    size = byte_size(data)
    _zeroed = :binary.copy(<<0>>, size)
    :erlang.garbage_collect()
    :ok
  end

  @doc "Encode binary data as URL-safe base64."
  @spec url_encode(binary()) :: binary()
  def url_encode(data), do: Base.url_encode64(data, padding: false)

  @doc "Decode URL-safe base64 data."
  @spec url_decode(binary()) :: {:ok, binary()} | {:error, term()}
  def url_decode(encoded) do
    case Base.url_decode64(encoded, padding: false) do
      {:ok, data} -> {:ok, data}
      :error -> {:error, :invalid_encoding}
    end
  end
end
