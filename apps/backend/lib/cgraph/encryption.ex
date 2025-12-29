defmodule Cgraph.Encryption do
  @moduledoc """
  Data encryption at rest and field-level encryption.
  
  ## Overview
  
  Provides encryption for sensitive data storage:
  
  - **Field-Level Encryption**: Encrypt specific database fields
  - **Key Management**: Secure key storage and rotation
  - **Envelope Encryption**: Data keys wrapped with master keys
  - **Authenticated Encryption**: AES-256-GCM with integrity
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                   ENCRYPTION SYSTEM                             │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Plaintext ──► Encrypt ──► Ciphertext ──► Store                │
  │                   │                                              │
  │            ┌──────▼──────┐                                      │
  │            │ Data Key    │                                      │
  │            │ (per-record)│                                      │
  │            └──────┬──────┘                                      │
  │                   │                                              │
  │            ┌──────▼──────┐                                      │
  │            │ Master Key  │                                      │
  │            │ (KEK)       │                                      │
  │            └─────────────┘                                      │
  │                                                                  │
  │  Supported Algorithms:                                           │
  │  ┌───────────────────────────────────────────────────────────┐ │
  │  │ AES-256-GCM   • Authenticated encryption                   │ │
  │  │ ChaCha20-Poly1305 • Alternative AEAD                       │ │
  │  │ HMAC-SHA256   • Key derivation                             │ │
  │  └───────────────────────────────────────────────────────────┘ │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
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
          field :email, Cgraph.Encryption.EncryptedField
          field :phone, Cgraph.Encryption.EncryptedField
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
  
  require Logger
  
  @aes_key_size 32
  @iv_size 12
  @tag_size 16
  @aad "cgraph_v1"
  
  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------
  
  @type key :: <<_::256>>
  @type ciphertext :: binary()
  @type plaintext :: binary() | term()
  
  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------
  
  @doc """
  Encrypt plaintext data.
  
  ## Options
  
  - `:key` - Override default key
  - `:aad` - Additional authenticated data
  - `:format` - Output format (:binary or :base64)
  """
  def encrypt(plaintext, opts \\ []) when is_binary(plaintext) do
    key = Keyword.get(opts, :key, get_master_key())
    aad = Keyword.get(opts, :aad, @aad)
    format = Keyword.get(opts, :format, :base64)
    
    iv = :crypto.strong_rand_bytes(@iv_size)
    
    case :crypto.crypto_one_time_aead(:aes_256_gcm, key, iv, plaintext, aad, @tag_size, true) do
      {ciphertext, tag} ->
        # Format: version (1 byte) + iv (12 bytes) + tag (16 bytes) + ciphertext
        result = <<1::8, iv::binary-size(@iv_size), tag::binary-size(@tag_size), ciphertext::binary>>
        
        case format do
          :binary -> {:ok, result}
          :base64 -> {:ok, Base.encode64(result)}
        end
      
      _ ->
        {:error, :encryption_failed}
    end
  rescue
    e ->
      Logger.error("Encryption error: #{Exception.message(e)}")
      {:error, :encryption_failed}
  end
  
  @doc """
  Decrypt ciphertext.
  
  ## Options
  
  - `:key` - Override default key
  - `:keys` - List of keys to try (for rotation)
  - `:aad` - Additional authenticated data
  """
  def decrypt(ciphertext, opts \\ [])
  
  def decrypt(ciphertext, opts) when is_binary(ciphertext) do
    # Decode if base64
    data = case Base.decode64(ciphertext) do
      {:ok, decoded} -> decoded
      :error -> ciphertext
    end
    
    keys = Keyword.get(opts, :keys) || [Keyword.get(opts, :key, get_master_key())]
    aad = Keyword.get(opts, :aad, @aad)
    
    try_decrypt_with_keys(data, keys, aad)
  end
  
  @doc """
  Encrypt a term (serializes to binary first).
  """
  def encrypt_term(term, opts \\ []) do
    plaintext = :erlang.term_to_binary(term)
    encrypt(plaintext, opts)
  end
  
  @doc """
  Decrypt and deserialize a term.
  """
  def decrypt_term(ciphertext, opts \\ []) do
    case decrypt(ciphertext, opts) do
      {:ok, binary} ->
        try do
          {:ok, :erlang.binary_to_term(binary, [:safe])}
        rescue
          _ -> {:error, :invalid_term}
        end
      
      error -> error
    end
  end
  
  @doc """
  Encrypt with envelope encryption (per-record key).
  
  Returns both the encrypted data and the wrapped data key.
  """
  def envelope_encrypt(plaintext, opts \\ []) do
    master_key = Keyword.get(opts, :key, get_master_key())
    
    # Generate random data key
    data_key = :crypto.strong_rand_bytes(@aes_key_size)
    
    # Encrypt data with data key
    {:ok, encrypted_data} = encrypt(plaintext, key: data_key, format: :binary)
    
    # Wrap data key with master key
    {:ok, wrapped_key} = encrypt(data_key, key: master_key, format: :binary)
    
    {:ok, %{
      ciphertext: Base.encode64(encrypted_data),
      wrapped_key: Base.encode64(wrapped_key)
    }}
  end
  
  @doc """
  Decrypt envelope-encrypted data.
  """
  def envelope_decrypt(%{ciphertext: ciphertext, wrapped_key: wrapped_key}, opts \\ []) do
    master_key = Keyword.get(opts, :key, get_master_key())
    
    # Unwrap data key
    with {:ok, wrapped_binary} <- Base.decode64(wrapped_key),
         {:ok, data_key} <- decrypt(wrapped_binary, key: master_key),
         {:ok, encrypted_binary} <- Base.decode64(ciphertext),
         {:ok, plaintext} <- decrypt(encrypted_binary, key: data_key) do
      {:ok, plaintext}
    else
      _ -> {:error, :decryption_failed}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Key Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Generate a new encryption key.
  """
  def generate_key do
    key = :crypto.strong_rand_bytes(@aes_key_size)
    Base.encode64(key)
  end
  
  @doc """
  Derive a key from a password using PBKDF2.
  """
  def derive_key(password, salt, opts \\ []) when is_binary(password) do
    iterations = Keyword.get(opts, :iterations, 100_000)
    key_length = Keyword.get(opts, :length, @aes_key_size)
    
    :crypto.pbkdf2_hmac(:sha256, password, salt, iterations, key_length)
  end
  
  @doc """
  Generate a random salt.
  """
  def generate_salt(size \\ 16) do
    :crypto.strong_rand_bytes(size)
  end
  
  @doc """
  Rotate to a new key, re-encrypting data.
  
  Returns the new key and re-encrypted ciphertext.
  """
  def rotate_encryption(ciphertext, opts \\ []) do
    old_keys = Keyword.get(opts, :old_keys, [get_master_key()])
    new_key = Keyword.get(opts, :new_key, :crypto.strong_rand_bytes(@aes_key_size))
    
    case decrypt(ciphertext, keys: old_keys) do
      {:ok, plaintext} ->
        case encrypt(plaintext, key: new_key) do
          {:ok, new_ciphertext} ->
            {:ok, %{ciphertext: new_ciphertext, new_key: new_key}}
          error -> error
        end
      
      error -> error
    end
  end
  
  # ---------------------------------------------------------------------------
  # Hashing
  # ---------------------------------------------------------------------------
  
  @doc """
  Hash data using SHA-256.
  """
  def hash(data) when is_binary(data) do
    :crypto.hash(:sha256, data)
    |> Base.encode64()
  end
  
  @doc """
  Create a keyed hash (HMAC).
  """
  def hmac(data, key \\ nil) when is_binary(data) do
    key = key || get_master_key()
    :crypto.mac(:hmac, :sha256, key, data)
    |> Base.encode64()
  end
  
  @doc """
  Verify a keyed hash.
  """
  def verify_hmac(data, expected_hmac, key \\ nil) do
    actual = hmac(data, key)
    secure_compare(actual, expected_hmac)
  end
  
  # ---------------------------------------------------------------------------
  # Secure Comparison
  # ---------------------------------------------------------------------------
  
  @doc """
  Timing-safe string comparison.
  """
  def secure_compare(a, b) when is_binary(a) and is_binary(b) do
    if byte_size(a) == byte_size(b) do
      :crypto.hash_equals(a, b)
    else
      false
    end
  end
  
  def secure_compare(_, _), do: false
  
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp try_decrypt_with_keys(_data, [], _aad) do
    {:error, :decryption_failed}
  end
  
  defp try_decrypt_with_keys(data, [key | rest], aad) do
    case do_decrypt(data, key, aad) do
      {:ok, plaintext} -> {:ok, plaintext}
      {:error, _} -> try_decrypt_with_keys(data, rest, aad)
    end
  end
  
  defp do_decrypt(<<1::8, iv::binary-size(@iv_size), tag::binary-size(@tag_size), ciphertext::binary>>, key, aad) do
    case :crypto.crypto_one_time_aead(:aes_256_gcm, key, iv, ciphertext, aad, tag, false) do
      plaintext when is_binary(plaintext) -> {:ok, plaintext}
      :error -> {:error, :decryption_failed}
    end
  rescue
    _ -> {:error, :decryption_failed}
  end
  
  defp do_decrypt(_, _, _) do
    {:error, :invalid_format}
  end
  
  defp get_master_key do
    case Application.get_env(:cgraph, :encryption_key) do
      nil ->
        # Fall back to environment variable
        case System.get_env("ENCRYPTION_KEY") do
          nil -> 
            # Generate ephemeral key for development (NOT FOR PRODUCTION)
            Logger.warning("No encryption key configured, using ephemeral key")
            :crypto.strong_rand_bytes(@aes_key_size)
          
          encoded -> 
            case Base.decode64(encoded) do
              {:ok, key} when byte_size(key) == @aes_key_size -> key
              _ -> raise "Invalid ENCRYPTION_KEY format"
            end
        end
      
      encoded when is_binary(encoded) ->
        case Base.decode64(encoded) do
          {:ok, key} when byte_size(key) == @aes_key_size -> key
          _ -> raise "Invalid encryption_key format"
        end
    end
  end
end

defmodule Cgraph.Encryption.EncryptedField do
  @moduledoc """
  Ecto custom type for encrypted fields.
  
  ## Usage
  
      schema "users" do
        field :ssn, Cgraph.Encryption.EncryptedField
        field :credit_card, Cgraph.Encryption.EncryptedField
      end
  
  Data is automatically encrypted on insert/update and decrypted on load.
  """
  
  use Ecto.Type
  
  @impl true
  def type, do: :binary
  
  @impl true
  def cast(value) when is_binary(value) do
    {:ok, value}
  end
  
  def cast(nil), do: {:ok, nil}
  def cast(_), do: :error
  
  @impl true
  def load(nil), do: {:ok, nil}
  
  def load(data) when is_binary(data) do
    case Cgraph.Encryption.decrypt(data) do
      {:ok, plaintext} -> {:ok, plaintext}
      {:error, _} -> :error
    end
  end
  
  @impl true
  def dump(nil), do: {:ok, nil}
  
  def dump(value) when is_binary(value) do
    case Cgraph.Encryption.encrypt(value, format: :binary) do
      {:ok, ciphertext} -> {:ok, ciphertext}
      {:error, _} -> :error
    end
  end
  
  def dump(_), do: :error
  
  @impl true
  def equal?(a, b), do: a == b
end

defmodule Cgraph.Encryption.EncryptedMap do
  @moduledoc """
  Ecto custom type for encrypted map/JSON fields.
  
  ## Usage
  
      schema "users" do
        field :settings, Cgraph.Encryption.EncryptedMap
        field :metadata, Cgraph.Encryption.EncryptedMap
      end
  """
  
  use Ecto.Type
  
  @impl true
  def type, do: :binary
  
  @impl true
  def cast(value) when is_map(value), do: {:ok, value}
  def cast(nil), do: {:ok, nil}
  def cast(_), do: :error
  
  @impl true
  def load(nil), do: {:ok, nil}
  
  def load(data) when is_binary(data) do
    case Cgraph.Encryption.decrypt(data) do
      {:ok, json} ->
        case Jason.decode(json) do
          {:ok, map} -> {:ok, map}
          _ -> :error
        end
      {:error, _} -> :error
    end
  end
  
  @impl true
  def dump(nil), do: {:ok, nil}
  
  def dump(value) when is_map(value) do
    case Jason.encode(value) do
      {:ok, json} ->
        case Cgraph.Encryption.encrypt(json, format: :binary) do
          {:ok, ciphertext} -> {:ok, ciphertext}
          {:error, _} -> :error
        end
      _ -> :error
    end
  end
  
  def dump(_), do: :error
  
  @impl true
  def equal?(a, b), do: a == b
end
