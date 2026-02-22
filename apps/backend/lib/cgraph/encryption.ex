defmodule CGraph.Encryption do
  @moduledoc """
  Data encryption at rest and field-level encryption.

  Delegates to submodules:

  - `CGraph.Encryption.Core` — encrypt/decrypt, envelope encryption, key rotation
  - `CGraph.Encryption.KeyManagement` — key generation, derivation, retrieval
  - `CGraph.Encryption.Hashing` — SHA-256, HMAC, secure comparison
  - `CGraph.Encryption.EncryptedField` — Ecto type for encrypted fields
  - `CGraph.Encryption.EncryptedMap` — Ecto type for encrypted map/JSON fields

  ## Usage

      # Encrypt data
      {:ok, ciphertext} = Encryption.encrypt("sensitive data")

      # Decrypt data
      {:ok, plaintext} = Encryption.decrypt(ciphertext)

      # With custom key
      {:ok, ciphertext} = Encryption.encrypt(data, key: custom_key)

      # Key rotation
      {:ok, new_key} = Encryption.rotate_key()

  ## Ecto Integration

      defmodule User do
        use Ecto.Schema

        schema "users" do
          field :email, CGraph.Encryption.EncryptedField
          field :phone, CGraph.Encryption.EncryptedField
        end
      end

  ## Key Management

  Keys are loaded from environment variables:

  - `ENCRYPTION_KEY` - Primary master key (base64)
  - `ENCRYPTION_KEY_PREVIOUS` - Previous key for rotation

  ## Security Considerations

  - Keys are never logged or exposed in errors
  - Each encryption uses unique IV/nonce
  - Ciphertext includes authentication tag
  - Timing-safe comparisons used throughout
  """

  alias CGraph.Encryption.{Core, KeyManagement, Hashing}

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type key :: <<_::256>>
  @type ciphertext :: binary()
  @type plaintext :: binary() | term()

  # ---------------------------------------------------------------------------
  # Core — Encrypt / Decrypt
  # ---------------------------------------------------------------------------

  @doc "Encrypt plaintext data. See `CGraph.Encryption.Core.encrypt/2`."
  @spec encrypt(plaintext(), keyword() | key()) :: {:ok, ciphertext()} | {:error, term()}
  def encrypt(plaintext, key_or_opts \\ []), do: Core.encrypt(plaintext, key_or_opts)

  @doc "Decrypt ciphertext. See `CGraph.Encryption.Core.decrypt/2`."
  @spec decrypt(ciphertext(), keyword()) :: {:ok, plaintext()} | {:error, term()}
  def decrypt(ciphertext, opts \\ []), do: Core.decrypt(ciphertext, opts)

  @doc "Encrypt a term (serializes to binary first)."
  @spec encrypt_term(term(), keyword()) :: {:ok, ciphertext()} | {:error, term()}
  def encrypt_term(term, opts \\ []), do: Core.encrypt_term(term, opts)

  @doc "Decrypt and deserialize a term."
  @spec decrypt_term(ciphertext(), keyword()) :: {:ok, term()} | {:error, term()}
  def decrypt_term(ciphertext, opts \\ []), do: Core.decrypt_term(ciphertext, opts)

  @doc "Encrypt with envelope encryption (per-record key)."
  @spec envelope_encrypt(plaintext(), keyword()) :: {:ok, map()} | {:error, term()}
  def envelope_encrypt(plaintext, opts \\ []), do: Core.envelope_encrypt(plaintext, opts)

  @doc "Decrypt envelope-encrypted data."
  @spec envelope_decrypt(map(), keyword()) :: {:ok, binary()} | {:error, term()}
  def envelope_decrypt(map, opts \\ []), do: Core.envelope_decrypt(map, opts)

  @doc "Rotate to a new key, re-encrypting data."
  @spec rotate_encryption(ciphertext(), keyword()) :: {:ok, ciphertext()} | {:error, term()}
  def rotate_encryption(ciphertext, opts \\ []), do: Core.rotate_encryption(ciphertext, opts)

  # ---------------------------------------------------------------------------
  # Key Management
  # ---------------------------------------------------------------------------

  @doc "Generate a new encryption key."
  defdelegate generate_key(), to: KeyManagement

  @doc "Derive a key from a password using PBKDF2."
  @spec derive_key(binary(), binary(), keyword()) :: binary()
  def derive_key(password, salt, opts \\ []), do: KeyManagement.derive_key(password, salt, opts)

  @doc "Generate a random salt."
  @spec generate_salt(pos_integer()) :: binary()
  def generate_salt(size \\ 16), do: KeyManagement.generate_salt(size)

  # ---------------------------------------------------------------------------
  # Hashing
  # ---------------------------------------------------------------------------

  @doc "Hash data using SHA-256."
  defdelegate hash(data), to: Hashing

  @doc "Create a keyed hash (HMAC)."
  @spec hmac(binary(), binary() | nil) :: binary()
  def hmac(data, key \\ nil), do: Hashing.hmac(data, key)

  @doc "Verify a keyed hash."
  @spec verify_hmac(binary(), binary(), binary() | nil) :: boolean()
  def verify_hmac(data, expected_hmac, key \\ nil), do: Hashing.verify_hmac(data, expected_hmac, key)

  @doc "Timing-safe string comparison."
  defdelegate secure_compare(a, b), to: Hashing
end
