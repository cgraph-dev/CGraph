defmodule CGraph.Enterprise.AdminUser do
  @moduledoc """
  Enterprise admin user schema.

  Represents a platform administrator with role-based permissions
  and optional MFA. Separate from regular users to enforce admin-only access.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [
             :id, :email, :last_login_at, :mfa_enabled,
             :permissions, :inserted_at, :updated_at
           ]}

  schema "enterprise_admin_users" do
    field :email, :string
    field :password_hash, :string, redact: true
    field :last_login_at, :utc_datetime_usec
    field :mfa_enabled, :boolean, default: false
    field :mfa_secret, :string, redact: true
    field :permissions, :map, default: %{}

    belongs_to :role, CGraph.Enterprise.AdminRole
    belongs_to :user, CGraph.Accounts.User

    timestamps()
  end

  @doc "Create a new admin user."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(admin_user, attrs) do
    admin_user
    |> cast(attrs, [:email, :password_hash, :role_id, :user_id, :permissions, :mfa_enabled, :mfa_secret])
    |> validate_required([:email, :role_id, :user_id])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_length(:email, max: 255)
    |> unique_constraint(:email)
    |> unique_constraint(:user_id)
    |> foreign_key_constraint(:role_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc "Update login timestamp."
  @spec login_changeset(%__MODULE__{}) :: Ecto.Changeset.t()
  def login_changeset(admin_user) do
    change(admin_user, last_login_at: DateTime.utc_now())
  end
end
