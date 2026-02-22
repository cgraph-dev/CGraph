defmodule CGraph.Crypto.Encryption do
  @moduledoc """
  AES-256-GCM symmetric encryption and envelope encryption.

  Provides:
  - Standard AES-256-GCM encrypt/decrypt with optional AAD
  - Compact single-string encrypt/decrypt (nonce || ciphertext || tag)
  - Envelope encryption for large data and key rotation scenarios
  """

  require Logger

  # Algorithm constants
  @aes_key_bytes 32
  @nonce_bytes 12
  @tag_bytes 16

  @type key :: binary()
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
  - `opts` - Options including `:aad` for Additional Authenticated Data
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
        true
      )

      {:ok, %{
        ciphertext: Base.encode64(ciphertext),
        nonce: Base.encode64(nonce),
        tag: Base.encode64(tag),
        algorithm: "AES-256-GCM"
      }}
    rescue
      e ->
        Logger.error("encryption_failed", e: inspect(e))
        {:error, :encryption_failed}
    end
  end

  @doc """
  Decrypt data encrypted with AES-256-GCM.

  ## Parameters

  - `encrypted` - Encrypted payload from `encrypt/3`
  - `key` - 256-bit decryption key
  - `opts` - Options including `:aad` (must match encryption)
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
          false
        ) do
          plaintext when is_binary(plaintext) ->
            {:ok, plaintext}

          :error ->
            {:error, :decryption_failed}
        end
      rescue
        e ->
          Logger.error("decryption_failed", e: inspect(e))
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
  """
  @spec envelope_encrypt(binary(), key()) :: {:ok, map()} | {:error, term()}
  def envelope_encrypt(plaintext, kek) when byte_size(kek) == @aes_key_bytes do
    dek = :crypto.strong_rand_bytes(@aes_key_bytes)

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
    with {:ok, dek} <- decrypt_compact(envelope.encrypted_dek, kek) do
      decrypt_compact(envelope.encrypted_data, dek)
    end
  end

  # ---------------------------------------------------------------------------
  # Internal
  # ---------------------------------------------------------------------------

  defp generate_nonce, do: :crypto.strong_rand_bytes(@nonce_bytes)
end
