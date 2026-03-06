defmodule CGraph.Crypto.E2EE.KeySync do
  @moduledoc """
  Key synchronization context for multi-device E2EE.

  Handles encrypted key material transfer between devices. When a user adds
  a new device, existing devices can export encrypted key material (private keys,
  session state) for the new device to import.

  ## Security Model

  The server is a **blind relay** — it stores and delivers encrypted key material
  without ever seeing plaintext private keys. All key material is encrypted
  client-side with the target device's public key before being sent to this
  endpoint.

  ## Flow

  1. New device registers its identity key and requests key sync
  2. Existing device creates a sync package: encrypts key material with new device's public key
  3. New device picks up the sync package and decrypts locally
  4. Package is marked as complete
  """

  import Ecto.Query

  alias CGraph.Crypto.E2EE.IdentityKey
  alias CGraph.Crypto.E2EE.KeySync.SyncPackage
  alias CGraph.Repo

  # ============================================================================
  # Ecto Schema
  # ============================================================================

  defmodule SyncPackage do
    @moduledoc """
    Ecto schema for encrypted key sync packages between devices.

    The encrypted_key_material field contains opaque ciphertext — the server
    never attempts to decrypt or inspect it.
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
            from_device_id: Ecto.UUID.t() | nil,
            to_device_id: Ecto.UUID.t() | nil,
            user_id: Ecto.UUID.t() | nil,
            encrypted_key_material: binary() | nil,
            status: String.t() | nil,
            inserted_at: DateTime.t() | nil,
            updated_at: DateTime.t() | nil
          }

    schema "e2ee_key_sync_packages" do
      field :encrypted_key_material, :binary
      field :status, :string, default: "pending"

      belongs_to :from_device, IdentityKey
      belongs_to :to_device, IdentityKey
      belongs_to :user, User

      timestamps()
    end

    @required_fields [:from_device_id, :to_device_id, :user_id, :encrypted_key_material]

    @doc "Builds a changeset for a sync package."
    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
    def changeset(package, attrs) do
      package
      |> cast(attrs, @required_fields ++ [:status])
      |> validate_required(@required_fields)
      |> validate_inclusion(:status, ["pending", "completed", "expired"])
      |> foreign_key_constraint(:from_device_id)
      |> foreign_key_constraint(:to_device_id)
      |> foreign_key_constraint(:user_id)
    end
  end

  # ============================================================================
  # Ecto Schema — Key Backup
  # ============================================================================

  defmodule KeyBackup do
    @moduledoc """
    Encrypted key backup for cross-device key sync.

    The encrypted_backup field contains opaque ciphertext encrypted client-side
    with the user's password-derived key. Server stores it as a blind blob.
    """
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key {:id, :binary_id, autogenerate: true}
    @foreign_key_type :binary_id
    @timestamps_opts [type: :utc_datetime_usec]

    schema "e2ee_key_backups" do
      field :device_id, :string
      field :encrypted_backup, :binary

      belongs_to :user, CGraph.Accounts.User

      timestamps()
    end

    @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
    def changeset(backup, attrs) do
      backup
      |> cast(attrs, [:user_id, :device_id, :encrypted_backup])
      |> validate_required([:user_id, :device_id, :encrypted_backup])
      |> unique_constraint([:user_id, :device_id])
      |> foreign_key_constraint(:user_id)
    end
  end

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Creates a sync package for transferring encrypted key material between devices.

  The key material is encrypted client-side with the target device's public key.
  The server stores it as an opaque blob and never sees plaintext keys.

  ## Parameters

    - `from_device_id` - UUID of the sending device's identity key
    - `to_device_id` - UUID of the receiving device's identity key
    - `user_id` - UUID of the user who owns both devices
    - `encrypted_key_material` - Binary ciphertext (base64-decoded by caller)

  ## Returns

    - `{:ok, sync_package}` on success
    - `{:error, :device_not_found}` if either device doesn't exist or doesn't belong to user
    - `{:error, changeset}` on validation failure
  """
  @spec create_sync_package(String.t(), String.t(), String.t(), binary()) ::
          {:ok, SyncPackage.t()} | {:error, term()}
  def create_sync_package(from_device_id, to_device_id, user_id, encrypted_key_material) do
    with :ok <- verify_devices_belong_to_user(from_device_id, to_device_id, user_id) do
      attrs = %{
        from_device_id: from_device_id,
        to_device_id: to_device_id,
        user_id: user_id,
        encrypted_key_material: encrypted_key_material,
        status: "pending"
      }

      %SyncPackage{}
      |> SyncPackage.changeset(attrs)
      |> Repo.insert()
    end
  end

  @doc """
  Retrieves pending sync packages awaiting pickup by a device.

  ## Parameters

    - `device_id` - UUID of the identity key for the receiving device

  ## Returns

    - `{:ok, packages}` list of pending sync packages
  """
  @spec get_pending_sync_packages(String.t()) :: {:ok, list(SyncPackage.t())}
  def get_pending_sync_packages(device_id) do
    packages =
      from(sp in SyncPackage,
        where: sp.to_device_id == ^device_id,
        where: sp.status == "pending",
        order_by: [asc: sp.inserted_at]
      )
      |> Repo.all()

    {:ok, packages}
  end

  @doc """
  Marks a sync package as received/completed.

  ## Parameters

    - `package_id` - UUID of the sync package
    - `user_id` - UUID of the user (for authorization)

  ## Returns

    - `{:ok, package}` on success
    - `{:error, :not_found}` if package doesn't exist or doesn't belong to user
  """
  @spec mark_sync_complete(String.t(), String.t()) :: {:ok, SyncPackage.t()} | {:error, term()}
  def mark_sync_complete(package_id, user_id) do
    case Repo.get_by(SyncPackage, id: package_id, user_id: user_id) do
      nil ->
        {:error, :not_found}

      package ->
        package
        |> SyncPackage.changeset(%{status: "completed"})
        |> Repo.update()
    end
  end

  # ============================================================================
  # Key Backup API
  # ============================================================================

  @max_backups_per_user 5

  @doc """
  Store encrypted key backup for a device.

  The backup is encrypted client-side with the user's password-derived key.
  Server stores it as an opaque blob. Max 5 device backups per user.
  Upserts if a backup for the same user+device already exists.
  """
  @spec store_encrypted_key_backup(String.t(), String.t(), binary()) ::
          {:ok, KeyBackup.t()} | {:error, :max_backups_reached | Ecto.Changeset.t()}
  def store_encrypted_key_backup(user_id, device_id, encrypted_backup) do
    # Check if this device already has a backup (upsert case)
    existing = Repo.get_by(KeyBackup, user_id: user_id, device_id: device_id)

    if existing do
      # Upsert: update existing backup
      existing
      |> KeyBackup.changeset(%{encrypted_backup: encrypted_backup})
      |> Repo.update()
    else
      # Check max backups limit
      count =
        from(kb in KeyBackup, where: kb.user_id == ^user_id, select: count())
        |> Repo.one()

      if count >= @max_backups_per_user do
        {:error, :max_backups_reached}
      else
        %KeyBackup{}
        |> KeyBackup.changeset(%{
          user_id: user_id,
          device_id: device_id,
          encrypted_backup: encrypted_backup
        })
        |> Repo.insert()
      end
    end
  end

  @doc """
  Retrieve encrypted key backup for a specific device.
  """
  @spec get_encrypted_key_backup(String.t(), String.t()) ::
          {:ok, KeyBackup.t()} | {:error, :not_found}
  def get_encrypted_key_backup(user_id, device_id) do
    case Repo.get_by(KeyBackup, user_id: user_id, device_id: device_id) do
      nil -> {:error, :not_found}
      backup -> {:ok, backup}
    end
  end

  @doc """
  List devices that have key backups for a user.
  """
  @spec list_devices_with_backup(String.t()) :: {:ok, list(map())}
  def list_devices_with_backup(user_id) do
    devices =
      from(kb in KeyBackup,
        where: kb.user_id == ^user_id,
        select: %{device_id: kb.device_id, updated_at: kb.updated_at},
        order_by: [desc: kb.updated_at]
      )
      |> Repo.all()

    {:ok, devices}
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp verify_devices_belong_to_user(from_device_id, to_device_id, user_id) do
    count =
      from(k in IdentityKey,
        where: k.id in ^[from_device_id, to_device_id],
        where: k.user_id == ^user_id,
        where: is_nil(k.revoked_at),
        select: count()
      )
      |> Repo.one()

    if count == 2, do: :ok, else: {:error, :device_not_found}
  end
end
