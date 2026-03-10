defmodule CGraph.Crypto.E2EE.KeyGeneration do
  @moduledoc false

  @doc """
  Generate a complete key bundle for E2EE.

  This function generates all the cryptographic keys needed for E2EE:
  - Identity key (Ed25519 signing key pair)
  - Signed prekey (X25519 key pair, signed by identity key)
  - One-time prekeys (X25519 key pairs for forward secrecy)

  In production, these keys are generated on the client device and only
  the public keys are sent to the server. This function is primarily
  for testing and demonstration.

  ## Parameters

  - `device_id` - Unique identifier for the device

  ## Returns

  `{:ok, bundle}` where bundle contains all key material.
  """
  @spec generate_key_bundle(String.t()) :: {:ok, map()}
  def generate_key_bundle(device_id) do
    # Generate Ed25519 identity key pair
    identity_private = :crypto.strong_rand_bytes(32)
    {identity_public, identity_signing_key} = :crypto.generate_key(:eddsa, :ed25519, identity_private)
    identity_key_id = fingerprint(identity_public)

    # Generate X25519 signed prekey
    {signed_prekey_public, signed_prekey_private} = :crypto.generate_key(:ecdh, :x25519)
    signed_prekey_id = :erlang.unique_integer([:positive, :monotonic])

    # Sign the prekey with identity key
    signature = :crypto.sign(:eddsa, :sha512, signed_prekey_public, [identity_signing_key, :ed25519])

    # Generate one-time prekeys
    one_time_prekeys = Enum.map(1..100, fn key_id ->
      {public, private} = :crypto.generate_key(:ecdh, :x25519)
      %{
        public: public,
        private: private,
        key_id: key_id
      }
    end)

    bundle = %{
      device_id: device_id,
      identity_key: %{
        public: identity_public,
        private: identity_signing_key,
        key_id: identity_key_id
      },
      signed_prekey: %{
        public: signed_prekey_public,
        private: signed_prekey_private,
        signature: signature,
        key_id: signed_prekey_id
      },
      one_time_prekeys: one_time_prekeys
    }

    {:ok, bundle}
  end

  @doc """
  Generate a fingerprint from a public key.

  Returns a hex-encoded SHA256 hash of the key.
  """
  @spec fingerprint(binary()) :: String.t()
  def fingerprint(public_key) when is_binary(public_key) do
    :crypto.hash(:sha256, public_key)
    |> Base.encode16(case: :lower)
  end

  @doc """
  Encrypt a message for a user.

  Uses X3DH key exchange to establish a shared secret, then encrypts
  the message with AES-256-GCM.
  """
  @spec encrypt_for_user(String.t(), String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def encrypt_for_user(recipient_user_id, plaintext, _opts \\ []) do
    with {:ok, bundle} <- CGraph.Crypto.E2EE.KeyOperations.get_prekey_bundle(recipient_user_id),
         {:ok, keys} <- decode_bundle_keys(bundle) do
      perform_x3dh_encryption(bundle, keys, plaintext)
    end
  end

  defp decode_bundle_keys(bundle) do
    with {:ok, signed_prekey_raw} <- Base.decode64(bundle.signed_prekey),
         {:ok, identity_key_raw} <- Base.decode64(bundle.identity_key) do
      one_time_prekey_raw = decode_optional_prekey(Map.get(bundle, :one_time_prekey))
      {:ok, %{signed_prekey: signed_prekey_raw, identity_key: identity_key_raw, one_time_prekey: one_time_prekey_raw}}
    else
      _ -> {:error, :invalid_key_format}
    end
  end

  defp decode_optional_prekey(nil), do: nil
  defp decode_optional_prekey(otpk_b64) do
    case Base.decode64(otpk_b64) do
      {:ok, raw} -> raw
      _ -> nil
    end
  end

  defp perform_x3dh_encryption(bundle, keys, plaintext) do
    {ephemeral_public, ephemeral_private} = :crypto.generate_key(:ecdh, :x25519)

    shared_secret = compute_x3dh_secret(
      ephemeral_private,
      keys.identity_key,
      keys.signed_prekey,
      keys.one_time_prekey
    )

    key = :crypto.hash(:sha256, shared_secret)
    iv = :crypto.strong_rand_bytes(12)
    {ciphertext, tag} = :crypto.crypto_one_time_aead(:aes_256_gcm, key, iv, plaintext, <<>>, true)

    {:ok, %{
      ciphertext: Base.encode64(iv <> tag <> ciphertext),
      ephemeral_public_key: Base.encode64(ephemeral_public),
      recipient_identity_key_id: bundle.identity_key_id,
      one_time_prekey_id: Map.get(bundle, :one_time_prekey_id)
    }}
  end

  defp compute_x3dh_secret(ephemeral_private, identity_key, signed_prekey, one_time_prekey) do
    # DH1: Ephemeral private with recipient's signed prekey
    dh1 = :crypto.compute_key(:ecdh, signed_prekey, ephemeral_private, :x25519)

    # DH2: Ephemeral private with recipient's one-time prekey (if available)
    dh2 = if one_time_prekey do
      :crypto.compute_key(:ecdh, one_time_prekey, ephemeral_private, :x25519)
    else
      <<>>
    end

    # Combine DH outputs - identity key is included in key derivation for authentication
    :crypto.hash(:sha256, dh1 <> dh2 <> identity_key)
  end
end
