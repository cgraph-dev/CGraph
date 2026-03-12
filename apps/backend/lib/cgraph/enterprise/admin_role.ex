defmodule CGraph.Enterprise.AdminRole do
  @moduledoc """
  Enterprise admin role schema.

  Defines role-based access control for enterprise admin users.
  Each role has a permissions matrix stored as JSONB.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [:id, :name, :description, :permissions, :inserted_at, :updated_at]}

  schema "enterprise_admin_roles" do
    field :name, Ecto.Enum, values: [:super_admin, :admin, :moderator, :analyst]
    field :description, :string
    field :permissions, :map, default: %{}

    has_many :admin_users, CGraph.Enterprise.AdminUser, foreign_key: :role_id

    timestamps()
  end

  @doc "Create or update an admin role."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(role, attrs) do
    role
    |> cast(attrs, [:name, :description, :permissions])
    |> validate_required([:name])
    |> validate_length(:description, max: 500)
    |> unique_constraint(:name)
  end
end
