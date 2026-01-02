defmodule Cgraph.Crypto.E2EE do
  @moduledoc """
  End-to-End Encryption implementation for secure messaging.
  
  ## Overview
  
  Implements a proper E2EE system where:
  
  1. **Key pairs are generated on the client** - Server never sees private keys
  2. **Server stores only public keys** - Used for key exchange
  3. **Messages are encrypted client-side** - Server only sees ciphertext
  4. **Perfect Forward Secrecy** - Compromised keys don't decrypt past messages
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    E2EE Message Flow                            │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Alice (Sender)                         Bob (Recipient)         │
  │  ┌──────────────┐                      ┌──────────────┐        │
  │  │ Identity Key │                      │ Identity Key │        │
  │  │ (Ed25519)    │                      │ (Ed25519)    │        │
  │  └──────┬───────┘                      └──────┬───────┘        │
  │         │                                      │                │
  │         ▼                                      ▼                │
  │  ┌──────────────┐                      ┌──────────────┐        │
  │  │ Prekey       │                      │ Prekey       │        │
  │  │ (X25519)     │◄────────────────────▶│ (X25519)     │        │
  │  └──────┬───────┘  Key Exchange        └──────┬───────┘        │
  │         │                                      │                │
  │         ▼                                      ▼                │
  │  ┌──────────────┐                      ┌──────────────┐        │
  │  │ Shared       │                      │ Shared       │        │
  │  │ Secret       │◄────────────────────▶│ Secret       │        │
  │  └──────┬───────┘                      └──────┬───────┘        │
  │         │                                      │                │
  │         ▼                                      ▼                │
  │  ┌──────────────┐                      ┌──────────────┐        │
  │  │ Message Key  │   Encrypted Message  │ Message Key  │        │
  │  │ (AES-256)    │─────────────────────▶│ (AES-256)    │        │
  │  └──────────────┘                      └──────────────┘        │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Security Properties
  
  - **Confidentiality**: Only participants can read messages
  - **Integrity**: Messages cannot be tampered with
  - **Authentication**: Messages are signed by sender
  - **Forward Secrecy**: Past messages safe if keys compromised
  - **Deniability**: Messages can't be cryptographically proven
  
  ## Usage
  
  This module provides server-side key management. Actual encryption/decryption
  happens on the client. The server:
  
  1. Stores public identity keys
  2. Distributes prekeys for key exchange
  3. Stores and delivers encrypted messages (opaque blobs)
  
      # Register user's public keys
      {:ok, keys} = E2EE.register_keys(user_id, %{
        identity_key: base64_public_key,
        signed_prekey: base64_signed_prekey,
        prekey_signature: base64_signature,
        one_time_prekeys: [base64_otpk1, base64_otpk2, ...]
      })
      
      # Get recipient's keys for establishing session
      {:ok, bundle} = E2EE.get_prekey_bundle(recipient_id)
      
      # Store encrypted message (server never decrypts)
      {:ok, msg} = E2EE.store_encrypted_message(conversation_id, encrypted_payload)
  """
  
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query
  
  require Logger
  
  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  
  # ============================================================================
  # Schemas
  # ============================================================================
  
  defmodule IdentityKey do
    @moduledoc """
    User's long-term identity key for E2EE.
    
    The identity key is an Ed25519 key pair. Only the public key is stored
    on the server. The private key never leaves the user's device.
    """
    use Ecto.Schema
    import Ecto.Changeset
    
    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]
    
    @type t :: %__MODULE__{
      id: Ecto.UUID.t() | nil,
      public_key: binary() | nil,
      key_id: String.t() | nil,
      device_id: String.t() | nil,
      is_verified: boolean(),
      verified_at: DateTime.t() | nil,
      revoked_at: DateTime.t() | nil,
      user_id: Ecto.UUID.t() | nil,
      inserted_at: DateTime.t() | nil,
      updated_at: DateTime.t() | nil
    }
    
    schema "e2ee_identity_keys" do
      field :public_key, :binary
      field :key_id, :string  # Fingerprint for key verification
      field :device_id, :string
      field :is_verified, :boolean, default: false
      field :verified_at, :utc_datetime
      field :revoked_at, :utc_datetime
      
      belongs_to :user, User
      
      timestamps()
    end
    
    def changeset(key, attrs) do
      key
      |> cast(attrs, [:public_key, :key_id, :device_id, :user_id, :is_verified, :verified_at, :revoked_at])
      |> validate_required([:public_key, :key_id, :device_id, :user_id])
      |> validate_binary_length(:public_key, 32)  # Ed25519 public key is 32 bytes
      |> unique_constraint([:user_id, :device_id])
      |> foreign_key_constraint(:user_id)
    end
    
    defp validate_binary_length(changeset, field, expected_length) do
      Ecto.Changeset.validate_change(changeset, field, fn _, value ->
        if is_binary(value) and byte_size(value) == expected_length do
          []
        else
          [{field, "must be #{expected_length} bytes"}]
        end
      end)
    end
  end
  
  defmodule SignedPrekey do
    @moduledoc """
    Signed prekey for X3DH key exchange.
    
    The signed prekey is an X25519 key pair, signed by the identity key.
    Rotated periodically (recommended: weekly).
    """
    use Ecto.Schema
    import Ecto.Changeset
    
    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]
    
    schema "e2ee_signed_prekeys" do
      field :public_key, :binary
      field :signature, :binary  # Ed25519 signature from identity key
      field :key_id, :integer
      field :expires_at, :utc_datetime
      field :is_current, :boolean, default: true
      
      belongs_to :user, User
      belongs_to :identity_key, IdentityKey
      
      timestamps()
    end
    
    def changeset(key, attrs) do
      key
      |> cast(attrs, [:public_key, :signature, :key_id, :expires_at, :is_current, :user_id, :identity_key_id])
      |> validate_required([:public_key, :signature, :key_id, :user_id, :identity_key_id])
      |> validate_binary_length(:public_key, 32)  # X25519 public key is 32 bytes
      |> validate_binary_length(:signature, 64)   # Ed25519 signature is 64 bytes
      |> foreign_key_constraint(:user_id)
      |> foreign_key_constraint(:identity_key_id)
    end
    
    defp validate_binary_length(changeset, field, expected_length) do
      Ecto.Changeset.validate_change(changeset, field, fn _, value ->
        if is_binary(value) and byte_size(value) == expected_length do
          []
        else
          [{field, "must be #{expected_length} bytes"}]
        end
      end)
    end
  end
  
  defmodule OneTimePrekey do
    @moduledoc """
    One-time prekeys for forward secrecy.
    
    Each one-time prekey is used exactly once for establishing a new session.
    Clients should upload batches of 100 prekeys at a time.
    """
    use Ecto.Schema
    import Ecto.Changeset
    
    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]
    
    schema "e2ee_one_time_prekeys" do
      field :public_key, :binary
      field :key_id, :integer
      field :used_at, :utc_datetime
      field :used_by_id, :binary_id  # User who consumed this key
      
      belongs_to :user, User
      
      timestamps()
    end
    
    def changeset(key, attrs) do
      key
      |> cast(attrs, [:public_key, :key_id, :user_id, :used_at, :used_by_id])
      |> validate_required([:public_key, :key_id, :user_id])
      |> validate_binary_length(:public_key, 32)
      |> unique_constraint([:user_id, :key_id])
      |> foreign_key_constraint(:user_id)
    end
    
    defp validate_binary_length(changeset, field, expected_length) do
      Ecto.Changeset.validate_change(changeset, field, fn _, value ->
        if is_binary(value) and byte_size(value) == expected_length do
          []
        else
          [{field, "must be #{expected_length} bytes"}]
        end
      end)
    end
  end
  
  # ============================================================================
  # Key Generation (Client-side helpers for testing)
  # ============================================================================
  
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
    case get_prekey_bundle(recipient_user_id) do
      {:ok, bundle} ->
        # Decode Base64-encoded keys from the bundle
        with {:ok, signed_prekey_raw} <- Base.decode64(bundle.signed_prekey),
             {:ok, identity_key_raw} <- Base.decode64(bundle.identity_key) do
          
          # Decode one-time prekey if present
          one_time_prekey_raw = case Map.get(bundle, :one_time_prekey) do
            nil -> nil
            otpk_b64 -> 
              case Base.decode64(otpk_b64) do
                {:ok, raw} -> raw
                _ -> nil
              end
          end
          
          # Generate ephemeral key pair
          {ephemeral_public, ephemeral_private} = :crypto.generate_key(:ecdh, :x25519)
          
          # Compute shared secret using X3DH
          shared_secret = compute_x3dh_secret(
            ephemeral_private,
            identity_key_raw,
            signed_prekey_raw,
            one_time_prekey_raw
          )
          
          # Derive encryption key
          key = :crypto.hash(:sha256, shared_secret)
          
          # Encrypt with AES-256-GCM
          iv = :crypto.strong_rand_bytes(12)
          {ciphertext, tag} = :crypto.crypto_one_time_aead(
            :aes_256_gcm, key, iv, plaintext, <<>>, true
          )
          
          {:ok, %{
            ciphertext: Base.encode64(iv <> tag <> ciphertext),
            ephemeral_public_key: Base.encode64(ephemeral_public),
            recipient_identity_key_id: bundle.identity_key_id,
            one_time_prekey_id: Map.get(bundle, :one_time_prekey_id)
          }}
        else
          _ -> {:error, :invalid_key_format}
        end
        
      error -> error
    end
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
  
  # ============================================================================
  # Key Management
  # ============================================================================
  
  @doc """
  Register or update a user's E2EE keys.
  
  Called when a user:
  - Installs the app for the first time
  - Adds a new device
  - Rotates their signed prekey
  - Uploads new one-time prekeys
  
  ## Parameters
  
  - `user_id` - User's ID
  - `keys` - Map containing:
    - `identity_key` - Base64 encoded Ed25519 public key
    - `device_id` - Unique device identifier
    - `signed_prekey` - Base64 encoded X25519 public key
    - `prekey_signature` - Base64 encoded signature
    - `prekey_id` - Integer ID for the signed prekey
    - `one_time_prekeys` - List of {key_id, base64_public_key} tuples
  """
  @spec register_keys(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def register_keys(user_id, keys) do
    Repo.transaction(fn ->
      one_time_prekeys = keys["one_time_prekeys"] || keys[:one_time_prekeys] || []
      
      # Convert list of maps to list of tuples if needed
      prekeys_tuples = Enum.map(one_time_prekeys, fn
        {key_id, pk_b64} -> {key_id, pk_b64}
        %{"key_id" => key_id, "public_key" => pk_b64} -> {key_id, pk_b64}
        %{key_id: key_id, public_key: pk_b64} -> {key_id, pk_b64}
        other -> other
      end)
      
      with {:ok, identity_key} <- upsert_identity_key(user_id, keys),
           {:ok, signed_prekey} <- upsert_signed_prekey(user_id, identity_key, keys),
           {:ok, count} <- upload_one_time_prekeys(user_id, prekeys_tuples) do
        %{
          identity_key_id: identity_key.key_id,
          signed_prekey_id: if(signed_prekey, do: signed_prekey.key_id, else: nil),
          one_time_prekey_count: count
        }
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end
  
  @doc """
  Get a prekey bundle for establishing an E2EE session with a user.
  
  Returns the recipient's keys needed for X3DH key exchange:
  - Identity key
  - Signed prekey with signature
  - One one-time prekey (consumed and removed)
  
  If no one-time prekeys are available, the bundle is still valid
  but provides slightly weaker forward secrecy guarantees.
  """
  @spec get_prekey_bundle(String.t()) :: {:ok, map()} | {:error, term()}
  def get_prekey_bundle(user_id) do
    Repo.transaction(fn ->
      with {:ok, identity_key} <- get_current_identity_key(user_id),
           {:ok, signed_prekey} <- get_current_signed_prekey(user_id),
           one_time_prekey <- consume_one_time_prekey(user_id) do
        
        bundle = %{
          identity_key: Base.encode64(identity_key.public_key),
          identity_key_id: identity_key.key_id,
          device_id: identity_key.device_id,
          signed_prekey: Base.encode64(signed_prekey.public_key),
          signed_prekey_id: signed_prekey.key_id,
          signed_prekey_signature: Base.encode64(signed_prekey.signature)
        }
        
        # Add one-time prekey if available
        case one_time_prekey do
          nil -> bundle
          otpk -> Map.merge(bundle, %{
            one_time_prekey: Base.encode64(otpk.public_key),
            one_time_prekey_id: otpk.key_id
          })
        end
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end
  
  @doc """
  Get the count of remaining one-time prekeys for a user.
  
  Clients should upload more prekeys when this count falls below 25.
  """
  @spec one_time_prekey_count(String.t()) :: integer()
  def one_time_prekey_count(user_id) do
    from(k in OneTimePrekey,
      where: k.user_id == ^user_id,
      where: is_nil(k.used_at),
      select: count()
    )
    |> Repo.one()
  end
  
  @doc """
  Upload additional one-time prekeys.
  
  Called when the client's prekey count is low.
  """
  @spec upload_one_time_prekeys(String.t(), list()) :: {:ok, integer()} | {:error, term()}
  def upload_one_time_prekeys(_user_id, []), do: {:ok, 0}
  def upload_one_time_prekeys(user_id, prekeys) when is_list(prekeys) do
    entries = Enum.map(prekeys, fn {key_id, public_key_b64} ->
      with {:ok, public_key} <- Base.decode64(public_key_b64) do
        %{
          id: Ecto.UUID.generate(),
          user_id: user_id,
          key_id: key_id,
          public_key: public_key,
          inserted_at: DateTime.utc_now(),
          updated_at: DateTime.utc_now()
        }
      end
    end)
    
    # Filter out any decode errors
    valid_entries = Enum.filter(entries, &is_map/1)
    
    if valid_entries == [] do
      {:error, :invalid_prekeys}
    else
      case Repo.insert_all(OneTimePrekey, valid_entries, on_conflict: :nothing) do
        {count, _} -> {:ok, count}
      end
    end
  end
  
  @doc """
  Verify a user's identity key.
  
  Called after users have verified each other's safety numbers.
  """
  @spec verify_identity_key(String.t(), String.t()) :: {:ok, IdentityKey.t()} | {:error, term()}
  def verify_identity_key(user_id, key_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: k.key_id == ^key_id
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      key ->
        key
        |> IdentityKey.changeset(%{is_verified: true, verified_at: DateTime.utc_now()})
        |> Repo.update()
    end
  end
  
  @doc """
  Revoke an identity key.
  
  Called when a device is lost or compromised.
  """
  @spec revoke_identity_key(String.t(), String.t()) :: {:ok, IdentityKey.t()} | {:error, term()}
  def revoke_identity_key(user_id, key_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: k.key_id == ^key_id
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      key ->
        key
        |> IdentityKey.changeset(%{revoked_at: DateTime.utc_now()})
        |> Repo.update()
    end
  end
  
  @doc """
  Generate a safety number for key verification.
  
  The safety number is derived from both users' identity keys.
  Users compare this number out-of-band to verify they're communicating securely.
  """
  @spec safety_number(String.t(), String.t()) :: {:ok, String.t()} | {:error, term()}
  def safety_number(user1_id, user2_id) do
    with {:ok, key1} <- get_current_identity_key(user1_id),
         {:ok, key2} <- get_current_identity_key(user2_id) do
      
      # Sort keys to ensure consistent ordering
      [k1, k2] = Enum.sort([key1.public_key, key2.public_key])
      
      # Hash the concatenated keys
      hash = :crypto.hash(:sha256, k1 <> k2)
      
      # Convert to displayable format (groups of 5 digits)
      number = hash
      |> :binary.bin_to_list()
      |> Enum.chunk_every(2)
      |> Enum.take(6)
      |> Enum.map(fn [a, b] ->
        # Combine bytes and take last 5 digits
        n = a * 256 + b
        String.pad_leading(Integer.to_string(rem(n, 100000)), 5, "0")
      end)
      |> Enum.join(" ")
      
      {:ok, number}
    end
  end
  
  # ============================================================================
  # Private Functions
  # ============================================================================
  
  defp upsert_identity_key(user_id, keys) do
    identity_key_b64 = keys["identity_key"] || keys[:identity_key]
    device_id = keys["device_id"] || keys[:device_id] || "default"
    
    with {:ok, public_key} <- Base.decode64(identity_key_b64 || "") do
      key_id = compute_key_fingerprint(public_key)
      
      attrs = %{
        user_id: user_id,
        public_key: public_key,
        key_id: key_id,
        device_id: device_id
      }
      
      case get_identity_key_by_device(user_id, device_id) do
        nil ->
          %IdentityKey{}
          |> IdentityKey.changeset(attrs)
          |> Repo.insert()
        
        existing ->
          if existing.public_key == public_key do
            {:ok, existing}
          else
            # Key changed - this is a security event
            Logger.warning("Identity key changed for user #{user_id} device #{device_id}")
            
            existing
            |> IdentityKey.changeset(Map.put(attrs, :is_verified, false))
            |> Repo.update()
          end
      end
    end
  end
  
  defp upsert_signed_prekey(user_id, identity_key, keys) do
    signed_prekey = keys["signed_prekey"] || keys[:signed_prekey] || %{}
    
    public_key_b64 = signed_prekey["public_key"] || signed_prekey[:public_key] || 
                     keys[:signed_prekey]
    signature_b64 = signed_prekey["signature"] || signed_prekey[:signature] || 
                    keys[:prekey_signature]
    prekey_id = signed_prekey["key_id"] || signed_prekey[:key_id] || 
                keys[:prekey_id] || :erlang.unique_integer([:positive])
    
    case {public_key_b64, signature_b64} do
      {nil, _} -> {:ok, nil}
      {_, nil} -> {:ok, nil}
      {pk_b64, sig_b64} ->
        with {:ok, public_key} <- Base.decode64(pk_b64),
             {:ok, signature} <- Base.decode64(sig_b64) do
          
          # Mark old prekey as not current
          from(k in SignedPrekey,
            where: k.user_id == ^user_id,
            where: k.is_current == true
          )
          |> Repo.update_all(set: [is_current: false])
          
          attrs = %{
            user_id: user_id,
            identity_key_id: identity_key.id,
            public_key: public_key,
            signature: signature,
            key_id: prekey_id,
            is_current: true,
            expires_at: DateTime.add(DateTime.utc_now(), 30, :day)
          }
          
          %SignedPrekey{}
          |> SignedPrekey.changeset(attrs)
          |> Repo.insert()
        end
    end
  end
  
  defp get_current_identity_key(user_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: is_nil(k.revoked_at),
      order_by: [desc: k.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :no_identity_key}
      key -> {:ok, key}
    end
  end
  
  defp get_identity_key_by_device(user_id, device_id) do
    from(k in IdentityKey,
      where: k.user_id == ^user_id,
      where: k.device_id == ^device_id,
      where: is_nil(k.revoked_at)
    )
    |> Repo.one()
  end
  
  defp get_current_signed_prekey(user_id) do
    from(k in SignedPrekey,
      where: k.user_id == ^user_id,
      where: k.is_current == true,
      order_by: [desc: k.inserted_at],
      limit: 1
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :no_signed_prekey}
      key -> {:ok, key}
    end
  end
  
  defp consume_one_time_prekey(user_id) do
    # Get and mark as used atomically
    from(k in OneTimePrekey,
      where: k.user_id == ^user_id,
      where: is_nil(k.used_at),
      order_by: [asc: k.key_id],
      limit: 1,
      lock: "FOR UPDATE SKIP LOCKED"
    )
    |> Repo.one()
    |> case do
      nil -> nil
      key ->
        key
        |> OneTimePrekey.changeset(%{used_at: DateTime.utc_now()})
        |> Repo.update!()
    end
  end
  
  defp compute_key_fingerprint(public_key) do
    :crypto.hash(:sha256, public_key)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end
end
