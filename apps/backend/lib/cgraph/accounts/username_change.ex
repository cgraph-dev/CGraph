defmodule CGraph.Accounts.UsernameChange do
  @moduledoc """
  Schema for tracking username change history.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "username_changes" do
    field :old_username, :string
    field :new_username, :string
    field :reason, :string
    field :changed_by_admin, :boolean, default: false

    belongs_to :user, CGraph.Accounts.User

    timestamps()
  end

  @doc "Builds a changeset for a username change request."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(username_change, attrs) do
    username_change
    |> cast(attrs, [:user_id, :old_username, :new_username, :reason, :changed_by_admin])
    |> validate_required([:user_id, :old_username, :new_username])
    |> validate_length(:old_username, min: 3, max: 32)
    |> validate_length(:new_username, min: 3, max: 32)
    |> validate_format(:new_username, ~r/^[a-zA-Z0-9_-]+$/, message: "can only contain letters, numbers, underscores, and hyphens")
    |> foreign_key_constraint(:user_id)
  end
end
