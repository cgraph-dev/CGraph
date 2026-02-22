defmodule CGraph.Encryption.Core do
  @moduledoc """
  Core encryption and decryption operations using AES-256-GCM.

  Provides authenticated encryption with associated data (AEAD),
  envelope encryption, term serialization encryption, and key rotation.
  """

  require Logger

  alias CGraph.Encryption.KeyManagement

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
  # Encrypt
  # ---------------------------------------------------------------------------

  @doc """
  Encrypt plaintext data.

  ## Options

  - `:key` - Override default key
  - `:aad` - Additional authenticated data
  - `:format` - Output format (:binary or :base64)
  """
  @spec encrypt(binary(), keyword() | binary()) :: {:ok, binary()} | {:error, atom()}
  def encrypt(plaintext, key_or_opts \\ [])

  def encrypt(plaintext, key) when is_binary(plaintext) and is_binary(key) and byte_size(key) == 32 do
    encrypt(plaintext, key: key)
  end

  def encrypt(plaintext, key) when is_binary(plaintext) and is_binary(key) do
    # Try to decode base64-encoded key
    case Base.decode64(key) do
      {:ok, decoded} when byte_size(decoded) == 32 ->
        encrypt(plaintext, key: decoded)
      _ ->
        {:error, :invalid_key}
    end
  end

  def encrypt(plaintext, opts) when is_binary(plaintext) and is_list(opts) do
    key = Keyword.get(opts, :key, KeyManagement.get_master_key())
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
      Logger.error("encryption_error", e: inspect(Exception.message(e)))
      {:error, :encryption_failed}
  end

  # ---------------------------------------------------------------------------
  # Decrypt
  # ---------------------------------------------------------------------------

  @doc """
  Decrypt ciphertext.

  ## Options

  - `:key` - Override default key
  - `:keys` - List of keys to try (for rotation)
  - `:aad` - Additional authenticated data
  """
  @spec decrypt(binary(), keyword() | binary()) :: {:ok, binary()} | {:error, atom()}
  def decrypt(ciphertext, opts \\ [])

  def decrypt(ciphertext, key) when is_binary(ciphertext) and is_binary(key) and byte_size(key) == 32 do
    decrypt(ciphertext, key: key)
  end

  def decrypt(ciphertext, key) when is_binary(ciphertext) and is_binary(key) do
    # Try to decode base64-encoded key
    case Base.decode64(key) do
      {:ok, decoded} when byte_size(decoded) == 32 ->
        decrypt(ciphertext, key: decoded)
      _ ->
        {:error, :invalid_key}
    end
  end

  def decrypt(ciphertext, opts) when is_binary(ciphertext) and is_list(opts) do
    # Decode if base64
    data = case Base.decode64(ciphertext) do
      {:ok, decoded} -> decoded
      :error -> ciphertext
    end

    keys = Keyword.get(opts, :keys) || [Keyword.get(opts, :key, KeyManagement.get_master_key())]
    aad = Keyword.get(opts, :aad, @aad)

    try_decrypt_with_keys(data, keys, aad)
  end

  # ---------------------------------------------------------------------------
  # Term Encryption
  # ---------------------------------------------------------------------------

  @doc """
  Encrypt a term (serializes to binary first).
  """
  @spec encrypt_term(term(), keyword()) :: {:ok, binary()} | {:error, atom()}
  def encrypt_term(term, opts \\ []) do
    plaintext = :erlang.term_to_binary(term)
    encrypt(plaintext, opts)
  end

  @doc """
  Decrypt and deserialize a term.
  """
  @spec decrypt_term(binary(), keyword()) :: {:ok, term()} | {:error, atom()}
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

  # ---------------------------------------------------------------------------
  # Envelope Encryption
  # ---------------------------------------------------------------------------

  @doc """
  Encrypt with envelope encryption (per-record key).

  Returns both the encrypted data and the wrapped data key.
  """
  @spec envelope_encrypt(binary(), keyword()) :: {:ok, map()}
  def envelope_encrypt(plaintext, opts \\ []) do
    master_key = Keyword.get(opts, :key, KeyManagement.get_master_key())

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
  @spec envelope_decrypt(map(), keyword()) :: {:ok, binary()} | {:error, atom()}
  def envelope_decrypt(%{ciphertext: ciphertext, wrapped_key: wrapped_key}, opts \\ []) do
    master_key = Keyword.get(opts, :key, KeyManagement.get_master_key())

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
  # Key Rotation
  # ---------------------------------------------------------------------------

  @doc """
  Rotate to a new key, re-encrypting data.

  Returns the new key and re-encrypted ciphertext.
  """
  @spec rotate_encryption(binary(), keyword()) :: {:ok, map()} | {:error, atom()}
  def rotate_encryption(ciphertext, opts \\ []) do
    old_keys = Keyword.get(opts, :old_keys, [KeyManagement.get_master_key()])
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
  # Private Helpers
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
end
