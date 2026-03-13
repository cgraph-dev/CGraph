defmodule CGraph.Enterprise.OrgMembership do
  @moduledoc """
  Organization membership join table schema.

  Links users to organizations with a role (owner, admin, member).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [:id, :role, :joined_at, :org_id, :user_id, :inserted_at]}

  @type t :: %__MODULE__{}

  schema "enterprise_org_memberships" do
    field :role, Ecto.Enum, values: [:owner, :admin, :member], default: :member
    field :joined_at, :utc_datetime_usec

    belongs_to :organization, CGraph.Enterprise.Organization, foreign_key: :org_id
    belongs_to :user, CGraph.Accounts.User

    timestamps()
  end

  @doc "Create a new membership."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(membership, attrs) do
    membership
    |> cast(attrs, [:org_id, :user_id, :role, :joined_at])
    |> validate_required([:org_id, :user_id, :role])
    |> put_joined_at()
    |> unique_constraint([:org_id, :user_id], name: :enterprise_org_memberships_org_id_user_id_index)
    |> foreign_key_constraint(:org_id)
    |> foreign_key_constraint(:user_id)
  end

  defp put_joined_at(changeset) do
    if get_field(changeset, :joined_at) do
      changeset
    else
      put_change(changeset, :joined_at, DateTime.utc_now())
    end
  end
end
