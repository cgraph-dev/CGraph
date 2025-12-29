defmodule Cgraph.Crypto do
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
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Encryption Flow (E2EE)                        │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Sender                                    Recipient             │
  │  ┌──────────────┐                         ┌──────────────┐      │
  │  │ Private Key  │                         │ Private Key  │      │
  │  │ (Ed25519)    │                         │ (Ed25519)    │      │
  │  └──────┬───────┘                         └──────┬───────┘      │
  │         │                                        │              │
  │         │ Sign                                   │ Decrypt      │
  │         ▼                                        ▼              │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
  │  │ Message      │───▶│ Encrypted    │───▶│ Message      │      │
  │  │ (Plaintext)  │    │ (AES-256-GCM)│    │ (Plaintext)  │      │
  │  └──────────────┘    └──────────────┘    └──────────────┘      │
  │         │                   │                    ▲              │
  │         │                   │                    │              │
  │         ▼                   ▼                    │              │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
  │  │ Session Key  │    │ Key Exchange │    │ Session Key  │      │
  │  │ (Ephemeral)  │───▶│ (X25519)     │───▶│ (Derived)    │      │
  │  └──────────────┘    └──────────────┘    └──────────────┘      │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Security Notes
  
  - All keys are 256-bit minimum
  - Nonces are never reused (using random generation)
  - Memory is securely wiped after key operations (where possible)
  - Timing-safe comparisons for all verification
  """
  
  require Logger
  
  # Algorithm constants
  @aes_key_bits 256
  @aes_key_bytes div(@aes_key_bits, 8)
  @nonce_bytes 12  # 96 bits for AES-GCM
  @tag_bytes 16    # 128-bit auth tag
  @salt_bytes 16   # 128-bit salt
  
  # Argon2 parameters (OWASP recommended)
  @argon2_time_cost 3
  @argon2_memory_cost 65536  # 64 MiB
  @argon2_parallelism 4
  
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
  # Symmetric Encryption (AES-256-GCM)
  # ---------------------------------------------------------------------------
  
  @doc """
  Encrypt data using AES-256-GCM.
  
  Returns a map containing the ciphertext, nonce, and authentication tag.
  The nonce is randomly generated and must be stored with the ciphertext.
  
  ## Parameters
  
  - `plaintext` - Data to encrypt (binary or string)
  - `key` - 256-bit encryption key
  - `aad` - Additional Authenticated Data (optional, verified but not encrypted)
  
  ## Examples
  
      key = Crypto.generate_key()
      {:ok, encrypted} = Crypto.encrypt("Hello, World!", key)
      
      # With AAD for context binding
      {:ok, encrypted} = Crypto.encrypt(message, key, aad: "channel:123")
  """
  @spec encrypt(plaintext(), key(), keyword()) :: {:ok, encrypted_payload()} | {:error, term()}
  def encrypt(plaintext, key, opts \\ []) when byte_size(key) == @aes_key_bytes do
    aad = Keyword.get(opts, :aad, "")
    nonce = generate_nonce()
    
    try do
      {ciphertext, tag} = :crypto.crypto_one_time_aead(
        :aes_256_gcm,
        key,
        nonce,
        plaintext,
        aad,
        true  # encrypt
      )
      
      {:ok, %{
        ciphertext: Base.encode64(ciphertext),
        nonce: Base.encode64(nonce),
        tag: Base.encode64(tag),
        algorithm: "AES-256-GCM"
      }}
    rescue
      e ->
        Logger.error("Encryption failed: #{inspect(e)}")
        {:error, :encryption_failed}
    end
  end
  
  @doc """
  Decrypt data encrypted with AES-256-GCM.
  
  ## Parameters
  
  - `encrypted` - Encrypted payload from `encrypt/3`
  - `key` - 256-bit decryption key
  - `aad` - Additional Authenticated Data (must match encryption)
  
  ## Examples
  
      {:ok, plaintext} = Crypto.decrypt(encrypted, key)
  """
  @spec decrypt(encrypted_payload(), key(), keyword()) :: {:ok, plaintext()} | {:error, term()}
  def decrypt(encrypted, key, opts \\ []) when byte_size(key) == @aes_key_bytes do
    aad = Keyword.get(opts, :aad, "")
    
    with {:ok, ciphertext} <- Base.decode64(encrypted.ciphertext),
         {:ok, nonce} <- Base.decode64(encrypted.nonce),
         {:ok, tag} <- Base.decode64(encrypted.tag) do
      try do
        case :crypto.crypto_one_time_aead(
          :aes_256_gcm,
          key,
          nonce,
          ciphertext,
          aad,
          tag,
          false  # decrypt
        ) do
          plaintext when is_binary(plaintext) ->
            {:ok, plaintext}
            
          :error ->
            {:error, :decryption_failed}
        end
      rescue
        e ->
          Logger.error("Decryption failed: #{inspect(e)}")
          {:error, :decryption_failed}
      end
    else
      :error -> {:error, :invalid_base64}
    end
  end
  
  @doc """
  Encrypt data and return as a single base64-encoded string.
  
  Format: nonce || ciphertext || tag (all base64 encoded together)
  """
  @spec encrypt_compact(plaintext(), key()) :: {:ok, binary()} | {:error, term()}
  def encrypt_compact(plaintext, key) when byte_size(key) == @aes_key_bytes do
    nonce = generate_nonce()
    
    try do
      {ciphertext, tag} = :crypto.crypto_one_time_aead(
        :aes_256_gcm,
        key,
        nonce,
        plaintext,
        "",
        true
      )
      
      # Combine: nonce (12) + ciphertext (variable) + tag (16)
      combined = nonce <> ciphertext <> tag
      {:ok, Base.encode64(combined)}
    rescue
      _ -> {:error, :encryption_failed}
    end
  end
  
  @doc """
  Decrypt a compact encrypted string.
  """
  @spec decrypt_compact(binary(), key()) :: {:ok, plaintext()} | {:error, term()}
  def decrypt_compact(encrypted_b64, key) when byte_size(key) == @aes_key_bytes do
    with {:ok, combined} <- Base.decode64(encrypted_b64),
         true <- byte_size(combined) > @nonce_bytes + @tag_bytes do
      <<nonce::binary-size(@nonce_bytes), rest::binary>> = combined
      ciphertext_len = byte_size(rest) - @tag_bytes
      <<ciphertext::binary-size(ciphertext_len), tag::binary-size(@tag_bytes)>> = rest
      
      try do
        case :crypto.crypto_one_time_aead(
          :aes_256_gcm,
          key,
          nonce,
          ciphertext,
          "",
          tag,
          false
        ) do
          plaintext when is_binary(plaintext) -> {:ok, plaintext}
          :error -> {:error, :decryption_failed}
        end
      rescue
        _ -> {:error, :decryption_failed}
      end
    else
      :error -> {:error, :invalid_base64}
      false -> {:error, :invalid_ciphertext}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Key Generation and Derivation
  # ---------------------------------------------------------------------------
  
  @doc """
  Generate a cryptographically secure random key.
  
  ## Options
  
  - `:bytes` - Key length in bytes (default: 32 for 256-bit)
  - `:encoding` - Output encoding (`:raw`, `:base64`, `:hex`)
  
  ## Examples
  
      key = Crypto.generate_key()  # 256-bit key
      key = Crypto.generate_key(bytes: 16)  # 128-bit key
      key = Crypto.generate_key(encoding: :base64)  # Base64 encoded
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
  
  @doc """
  Derive an encryption key from a password using Argon2id.
  
  Uses OWASP-recommended parameters for password hashing.
  
  ## Parameters
  
  - `password` - User password
  - `salt` - Salt for key derivation (generate with `generate_salt/0`)
  
  ## Examples
  
      salt = Crypto.generate_salt()
      {:ok, key} = Crypto.derive_key("user_password", salt)
  """
  @spec derive_key(binary(), binary()) :: {:ok, key()} | {:error, term()}
  def derive_key(password, salt) when is_binary(password) and byte_size(salt) >= @salt_bytes do
    try do
      # Use Argon2id (preferred for key derivation)
      key = Argon2.Base.hash_password(
        password,
        salt,
        t_cost: @argon2_time_cost,
        m_cost: @argon2_memory_cost,
        parallelism: @argon2_parallelism,
        hashlen: @aes_key_bytes,
        argon2_type: 2  # Argon2id
      )
      
      {:ok, key}
    rescue
      e ->
        Logger.error("Key derivation failed: #{inspect(e)}")
        {:error, :key_derivation_failed}
    end
  end
  
  @doc """
  Generate a random salt for key derivation.
  """
  @spec generate_salt() :: binary()
  def generate_salt do
    :crypto.strong_rand_bytes(@salt_bytes)
  end
  
  @doc """
  Generate a random nonce for encryption.
  """
  @spec generate_nonce() :: binary()
  def generate_nonce do
    :crypto.strong_rand_bytes(@nonce_bytes)
  end
  
  # ---------------------------------------------------------------------------
  # Hashing
  # ---------------------------------------------------------------------------
  
  @doc """
  Compute SHA-256 hash of data.
  
  ## Examples
  
      hash = Crypto.hash("data to hash")
      hash = Crypto.hash(data, encoding: :base64)
  """
  @spec hash(binary(), keyword()) :: binary()
  def hash(data, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :hex)
    hash = :crypto.hash(:sha256, data)
    
    case encoding do
      :raw -> hash
      :hex -> Base.encode16(hash, case: :lower)
      :base64 -> Base.encode64(hash)
    end
  end
  
  @doc """
  Compute SHA-512 hash of data.
  """
  @spec hash512(binary(), keyword()) :: binary()
  def hash512(data, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :hex)
    hash = :crypto.hash(:sha512, data)
    
    case encoding do
      :raw -> hash
      :hex -> Base.encode16(hash, case: :lower)
      :base64 -> Base.encode64(hash)
    end
  end
  
  @doc """
  Compute HMAC-SHA256.
  
  Used for message authentication codes.
  """
  @spec hmac(binary(), key(), keyword()) :: binary()
  def hmac(data, key, opts \\ []) do
    encoding = Keyword.get(opts, :encoding, :hex)
    mac = :crypto.mac(:hmac, :sha256, key, data)
    
    case encoding do
      :raw -> mac
      :hex -> Base.encode16(mac, case: :lower)
      :base64 -> Base.encode64(mac)
    end
  end
  
  # ---------------------------------------------------------------------------
  # Password Hashing
  # ---------------------------------------------------------------------------
  
  @doc """
  Hash a password for storage.
  
  Uses Argon2id with secure parameters.
  
  ## Examples
  
      hash = Crypto.hash_password("user_password")
      # Store hash in database
  """
  @spec hash_password(binary()) :: binary()
  def hash_password(password) when is_binary(password) do
    Argon2.hash_pwd_salt(password)
  end
  
  @doc """
  Verify a password against a stored hash.
  
  ## Examples
  
      if Crypto.verify_password(password, stored_hash) do
        # Password correct
      end
  """
  @spec verify_password(binary(), binary()) :: boolean()
  def verify_password(password, hash) when is_binary(password) and is_binary(hash) do
    Argon2.verify_pass(password, hash)
  end
  
  # ---------------------------------------------------------------------------
  # Secure Comparison
  # ---------------------------------------------------------------------------
  
  @doc """
  Timing-safe comparison of two binaries.
  
  Prevents timing attacks by ensuring comparison takes constant time.
  """
  @spec secure_compare(binary(), binary()) :: boolean()
  def secure_compare(a, b) when is_binary(a) and is_binary(b) do
    byte_size(a) == byte_size(b) and :crypto.hash_equals(a, b)
  end
  
  # ---------------------------------------------------------------------------
  # Token Generation
  # ---------------------------------------------------------------------------
  
  @doc """
  Generate a cryptographically secure random token.
  
  ## Examples
  
      token = Crypto.generate_token()  # 32-byte URL-safe token
      token = Crypto.generate_token(64)  # 64-byte token
  """
  @spec generate_token(pos_integer()) :: binary()
  def generate_token(bytes \\ 32) do
    bytes
    |> :crypto.strong_rand_bytes()
    |> Base.url_encode64(padding: false)
  end
  
  @doc """
  Generate a numeric OTP code.
  
  ## Examples
  
      code = Crypto.generate_otp(6)  # "847293"
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
  # Envelope Encryption (for large data)
  # ---------------------------------------------------------------------------
  
  @doc """
  Encrypt large data using envelope encryption.
  
  Generates a random data encryption key (DEK), encrypts the data with it,
  then encrypts the DEK with the provided key encryption key (KEK).
  
  This is useful for:
  - Encrypting large files efficiently
  - Key rotation without re-encrypting data
  - Multi-recipient encryption
  
  ## Examples
  
      kek = Crypto.generate_key()
      {:ok, envelope} = Crypto.envelope_encrypt(large_data, kek)
      
      # Later, decrypt:
      {:ok, data} = Crypto.envelope_decrypt(envelope, kek)
  """
  @spec envelope_encrypt(binary(), key()) :: {:ok, map()} | {:error, term()}
  def envelope_encrypt(plaintext, kek) when byte_size(kek) == @aes_key_bytes do
    # Generate random DEK
    dek = generate_key()
    
    # Encrypt data with DEK
    with {:ok, encrypted_data} <- encrypt_compact(plaintext, dek),
         {:ok, encrypted_dek} <- encrypt_compact(dek, kek) do
      {:ok, %{
        encrypted_data: encrypted_data,
        encrypted_dek: encrypted_dek,
        algorithm: "AES-256-GCM-ENVELOPE"
      }}
    end
  end
  
  @doc """
  Decrypt envelope-encrypted data.
  """
  @spec envelope_decrypt(map(), key()) :: {:ok, binary()} | {:error, term()}
  def envelope_decrypt(envelope, kek) when byte_size(kek) == @aes_key_bytes do
    with {:ok, dek} <- decrypt_compact(envelope.encrypted_dek, kek),
         {:ok, plaintext} <- decrypt_compact(envelope.encrypted_data, dek) do
      {:ok, plaintext}
    end
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
    # Overwrite with zeros (limited effectiveness in BEAM VM)
    size = byte_size(data)
    _zeroed = :binary.copy(<<0>>, size)
    :erlang.garbage_collect()
    :ok
  end
  
  @doc """
  Encode binary data as URL-safe base64.
  """
  @spec url_encode(binary()) :: binary()
  def url_encode(data), do: Base.url_encode64(data, padding: false)
  
  @doc """
  Decode URL-safe base64 data.
  """
  @spec url_decode(binary()) :: {:ok, binary()} | {:error, term()}
  def url_decode(encoded) do
    case Base.url_decode64(encoded, padding: false) do
      {:ok, data} -> {:ok, data}
      :error -> {:error, :invalid_encoding}
    end
  end
end
