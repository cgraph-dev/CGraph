defmodule CGraph.Crypto.E2EE.GroupSession do
  @moduledoc """
  Ecto schema for group E2EE sessions using Sender Key protocol.

  Each group member registers a sender key per device. The sender key is
  distributed (encrypted per-recipient) to all other group members. Messages
  are encrypted using the sender's key with a ratcheting chain key index.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "group_e2ee_sessions" do
    field :device_id, :string
    field :sender_key_id, :string
    field :public_sender_key, :binary
    field :chain_key_index, :integer, default: 0
    field :is_active, :boolean, default: true

    belongs_to :group, CGraph.Groups.Group
    belongs_to :user, CGraph.Accounts.User

    has_many :distributions, CGraph.Crypto.E2EE.GroupSenderKeyDistribution, foreign_key: :session_id

    timestamps()
  end

  @required_fields ~w(group_id user_id device_id sender_key_id public_sender_key)a
  @optional_fields ~w(chain_key_index is_active)a

  @doc "Changeset for creating or updating a group E2EE session."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(session, attrs) do
    session
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:device_id, min: 1, max: 255)
    |> validate_length(:sender_key_id, min: 1, max: 255)
    |> unique_constraint([:group_id, :user_id, :device_id])
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:user_id)
  end
end

defmodule CGraph.Crypto.E2EE.GroupSenderKeyDistribution do
  @moduledoc """
  Schema for sender key distributions — encrypted sender keys shared with recipients.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "group_sender_key_distributions" do
    field :recipient_device_id, :string
    field :encrypted_sender_key, :binary
    field :distributed_at, :utc_datetime_usec

    belongs_to :session, CGraph.Crypto.E2EE.GroupSession
    belongs_to :recipient_user, CGraph.Accounts.User, foreign_key: :recipient_user_id

    timestamps()
  end

  @required_fields ~w(session_id recipient_user_id recipient_device_id encrypted_sender_key)a
  @optional_fields ~w(distributed_at)a

  @doc "Changeset for creating a sender key distribution record."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(distribution, attrs) do
    distribution
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> foreign_key_constraint(:session_id)
    |> foreign_key_constraint(:recipient_user_id)
  end
end
