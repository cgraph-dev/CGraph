defmodule CGraph.Accounts.DeletedFriendship do
  @moduledoc """
  Audit record for unfriended relationships.

  When a friendship is hard-deleted (unfriend), a record is inserted here
  so that sync clients can detect the removal and update their local state.
  This enables the sync pull endpoint to report "deleted" friendships
  that would otherwise be invisible after the friendship row is removed.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "deleted_friendships" do
    belongs_to :user, CGraph.Accounts.User
    belongs_to :friend, CGraph.Accounts.User
    field :deleted_at, :utc_datetime_usec

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(record, attrs) do
    record
    |> cast(attrs, [:user_id, :friend_id, :deleted_at])
    |> validate_required([:user_id, :friend_id, :deleted_at])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:friend_id)
  end
end
