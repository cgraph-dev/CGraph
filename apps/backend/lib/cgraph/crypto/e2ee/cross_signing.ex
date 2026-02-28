defmodule CGraph.Crypto.E2EE.CrossSigning do
  @moduledoc """
  Cross-device signature storage and verification for multi-device E2EE.

  When a user adds a new device, existing devices can cross-sign the new
  device's identity key to establish a trust chain. This module handles:

  - Storing cross-device signatures
  - Querying trust chains for a user
  - Verifying device trust (has at least one cross-signature)
  - Revoking device trust when a device is removed

  ## Security Invariant

  Both the signer and signed device identity keys MUST belong to the same
  user_id. This is enforced at the database level via the user_id FK and
  validated in business logic before insertion.
  """

  import Ecto.Query

  alias CGraph.Crypto.E2EE.IdentityKey
  alias CGraph.Repo

  # ============================================================================
  # Ecto Schema (defined first to avoid compile-time struct expansion issues)
  # ============================================================================

  defmodule CrossSignature do
    @moduledoc """
    Ecto schema for cross-device signatures in the E2EE trust chain.

    A cross-signature records that one device (signer) has cryptographically
    signed another device's (signed) identity key, establishing trust.
    """
    use Ecto.Schema
    import Ecto.Changeset

    alias CGraph.Accounts.User
    alias CGraph.Crypto.E2EE.IdentityKey

    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]

    @type t :: %__MODULE__{
            id: Ecto.UUID.t() | nil,
            signer_device_id: Ecto.UUID.t() | nil,
            signed_device_id: Ecto.UUID.t() | nil,
            user_id: Ecto.UUID.t() | nil,
            signature: binary() | nil,
            algorithm: String.t() | nil,
            status: String.t() | nil,
            inserted_at: DateTime.t() | nil,
            updated_at: DateTime.t() | nil
          }

    schema "e2ee_cross_signatures" do
      field :signature, :binary
      field :algorithm, :string, default: "ed25519"
      field :status, :string, default: "verified"

      belongs_to :signer_device, IdentityKey
      belongs_to :signed_device, IdentityKey
      belongs_to :user, User

      timestamps()
    end

    @required_fields [:signer_device_id, :signed_device_id, :user_id, :signature, :algorithm, :status]

    @doc "Builds a changeset for a cross-signature."
    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
    def changeset(cross_signature, attrs) do
      cross_signature
      |> cast(attrs, @required_fields)
      |> validate_required(@required_fields)
      |> validate_inclusion(:status, ["pending", "verified", "revoked"])
      |> validate_inclusion(:algorithm, ["ed25519", "ecdsa-p256"])
      |> validate_different_devices()
      |> unique_constraint([:signer_device_id, :signed_device_id])
      |> foreign_key_constraint(:signer_device_id)
      |> foreign_key_constraint(:signed_device_id)
      |> foreign_key_constraint(:user_id)
    end

    defp validate_different_devices(changeset) do
      signer = get_field(changeset, :signer_device_id)
      signed = get_field(changeset, :signed_device_id)

      if signer && signed && signer == signed do
        add_error(changeset, :signed_device_id, "cannot cross-sign itself")
      else
        changeset
      end
    end
  end

  # ============================================================================
  # Public API
  # ============================================================================

  alias __MODULE__.CrossSignature

  @doc """
  Creates a cross-signature between two devices owned by the same user.

  The signer device signs the signed device's identity key, establishing
  trust. Both devices must belong to the given user_id.

  ## Parameters

    - `signer_device_id` - UUID of the identity key doing the signing
    - `signed_device_id` - UUID of the identity key being signed
    - `user_id` - UUID of the user who owns both devices
    - `signature` - Binary cryptographic signature (base64-decoded by caller)
    - `algorithm` - Signature algorithm (e.g., "ed25519")

  ## Returns

    - `{:ok, cross_signature}` on success
    - `{:error, :devices_not_same_user}` if devices don't belong to same user
    - `{:error, :device_not_found}` if either device doesn't exist
    - `{:error, changeset}` on validation failure
  """
  @spec create_cross_signature(String.t(), String.t(), String.t(), binary(), String.t()) ::
          {:ok, CrossSignature.t()} | {:error, term()}
  def create_cross_signature(signer_device_id, signed_device_id, user_id, signature, algorithm \\ "ed25519") do
    with :ok <- verify_devices_same_user(signer_device_id, signed_device_id, user_id) do
      attrs = %{
        signer_device_id: signer_device_id,
        signed_device_id: signed_device_id,
        user_id: user_id,
        signature: signature,
        algorithm: algorithm,
        status: "verified"
      }

      %CrossSignature{}
      |> CrossSignature.changeset(attrs)
      |> Repo.insert(
        on_conflict: {:replace, [:signature, :algorithm, :status, :updated_at]},
        conflict_target: [:signer_device_id, :signed_device_id]
      )
    end
  end

  @doc """
  Returns all cross-signatures for a user, showing which devices trust which.

  ## Returns

  A list of cross-signature records with preloaded signer/signed device info.
  """
  @spec get_device_trust_chain(String.t()) :: {:ok, list(CrossSignature.t())}
  def get_device_trust_chain(user_id) do
    signatures =
      from(cs in CrossSignature,
        where: cs.user_id == ^user_id,
        where: cs.status != "revoked",
        preload: [:signer_device, :signed_device],
        order_by: [desc: cs.inserted_at]
      )
      |> Repo.all()

    {:ok, signatures}
  end

  @doc """
  Checks if a device has at least one cross-signature from another verified device.

  A device is considered trusted if any other non-revoked device has cross-signed it.

  ## Returns

    - `{:ok, true}` if the device is trusted
    - `{:ok, false}` if the device has no cross-signatures
  """
  @spec verify_device_trust(String.t(), String.t()) :: {:ok, boolean()}
  def verify_device_trust(user_id, device_id) do
    count =
      from(cs in CrossSignature,
        where: cs.user_id == ^user_id,
        where: cs.signed_device_id == ^device_id,
        where: cs.status == "verified",
        select: count()
      )
      |> Repo.one()

    {:ok, count > 0}
  end

  @doc """
  Revokes all cross-signatures involving a device (used when a device is removed).

  Sets status to "revoked" for all signatures where the device is either
  the signer or the signed party.

  ## Returns

    - `{:ok, revoked_count}` with the number of revoked signatures
  """
  @spec revoke_device_trust(String.t(), String.t()) :: {:ok, integer()}
  def revoke_device_trust(user_id, device_id) do
    {count, _} =
      from(cs in CrossSignature,
        where: cs.user_id == ^user_id,
        where: cs.signer_device_id == ^device_id or cs.signed_device_id == ^device_id,
        where: cs.status != "revoked"
      )
      |> Repo.update_all(set: [status: "revoked", updated_at: DateTime.utc_now()])

    {:ok, count}
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp verify_devices_same_user(signer_device_id, signed_device_id, user_id) do
    devices =
      from(k in IdentityKey,
        where: k.id in ^[signer_device_id, signed_device_id],
        where: k.user_id == ^user_id,
        where: is_nil(k.revoked_at),
        select: k.id
      )
      |> Repo.all()

    cond do
      length(devices) < 2 -> {:error, :device_not_found}
      MapSet.new(devices) != MapSet.new([signer_device_id, signed_device_id]) -> {:error, :devices_not_same_user}
      true -> :ok
    end
  end
end
