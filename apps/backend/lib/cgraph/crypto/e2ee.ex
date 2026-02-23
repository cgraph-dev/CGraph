defmodule CGraph.Crypto.E2EE do
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

  alias CGraph.Accounts.User

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

    @doc "Builds a changeset for E2EE key attributes."
    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
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

    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
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
      belongs_to :identity_key, IdentityKey

      timestamps()
    end

    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
    def changeset(key, attrs) do
      key
      |> cast(attrs, [:public_key, :key_id, :user_id, :identity_key_id, :used_at, :used_by_id])
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

  defmodule KyberPrekey do
    @moduledoc """
    ML-KEM-768 prekey for post-quantum key exchange (PQXDH).

    The Kyber prekey is an ML-KEM-768 key pair, with the public key stored
    on the server and the secret key stored only on the client device.
    The public key is signed by the identity signing key (ECDSA).

    ## Key Sizes
    - public_key: 1184 bytes (ML-KEM-768 encapsulation key)
    - signature: variable (ECDSA P-256/SHA-256 signature)

    Clients that publish a Kyber prekey enable other clients to use PQXDH
    key agreement for post-quantum forward secrecy.
    """
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]

    schema "e2ee_kyber_prekeys" do
      field :public_key, :binary
      field :signature, :binary
      field :key_id, :integer
      field :is_current, :boolean, default: true
      field :used_at, :utc_datetime
      field :used_by_id, :binary_id

      belongs_to :user, User
      belongs_to :identity_key, IdentityKey

      timestamps()
    end

    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
    def changeset(key, attrs) do
      key
      |> cast(attrs, [:public_key, :signature, :key_id, :user_id, :identity_key_id, :is_current, :used_at, :used_by_id])
      |> validate_required([:public_key, :signature, :key_id, :user_id])
      |> unique_constraint([:user_id, :key_id])
      |> foreign_key_constraint(:user_id)
      |> foreign_key_constraint(:identity_key_id)
    end
  end

  # ============================================================================
  # Public API — delegated to submodules
  # ============================================================================

  # Key Generation
  defdelegate generate_key_bundle(device_id), to: __MODULE__.KeyGeneration
  defdelegate fingerprint(public_key), to: __MODULE__.KeyGeneration

  @doc "Encrypts a message for a specific user."
  @spec encrypt_for_user(String.t(), String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def encrypt_for_user(recipient_user_id, plaintext, opts \\ []) do
    __MODULE__.KeyGeneration.encrypt_for_user(recipient_user_id, plaintext, opts)
  end

  # Key Registration
  defdelegate register_keys(user_id, keys), to: __MODULE__.KeyRegistration

  @doc "Uploads one-time prekeys for E2EE key exchange."
  @spec upload_one_time_prekeys(String.t(), list(), String.t() | nil) :: {:ok, integer()} | {:error, term()}
  def upload_one_time_prekeys(user_id, prekeys, identity_key_id \\ nil) do
    __MODULE__.KeyRegistration.upload_one_time_prekeys(user_id, prekeys, identity_key_id)
  end

  # Key Operations
  defdelegate get_prekey_bundle(user_id), to: __MODULE__.KeyOperations
  defdelegate get_user_identity_key(user_id), to: __MODULE__.KeyOperations
  defdelegate one_time_prekey_count(user_id), to: __MODULE__.KeyOperations
  defdelegate verify_identity_key(user_id, key_id), to: __MODULE__.KeyOperations
  defdelegate revoke_identity_key(user_id, key_id), to: __MODULE__.KeyOperations
  defdelegate safety_number(user1_id, user2_id), to: __MODULE__.KeyOperations
  defdelegate list_user_devices(user_id), to: __MODULE__.KeyOperations
  defdelegate remove_device(user_id, device_id), to: __MODULE__.KeyOperations
end
