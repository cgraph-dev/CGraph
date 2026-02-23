defmodule CGraph.Groups.GroupBan do
  @moduledoc """
  Schema for group bans. Tracks which users are banned from which groups,
  with optional expiry for temporary bans.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "group_bans" do
    belongs_to :user, CGraph.Accounts.User
    belongs_to :group, CGraph.Groups.Group
    belongs_to :banned_by, CGraph.Accounts.User

    field :reason, :string
    field :expires_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(ban, attrs) do
    ban
    |> cast(attrs, [:user_id, :group_id, :banned_by_id, :reason, :expires_at])
    |> validate_required([:user_id, :group_id])
    |> unique_constraint([:user_id, :group_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:banned_by_id)
  end

  @doc "Check if a ban is currently active (not expired)."
  @spec active?(%__MODULE__{}) :: boolean()
  def active?(%__MODULE__{expires_at: nil}), do: true
  def active?(%__MODULE__{expires_at: expires_at}) do
    DateTime.compare(expires_at, DateTime.utc_now()) == :gt
  end
end
