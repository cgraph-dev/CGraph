defmodule Cgraph.Accounts.Friendship do
  @moduledoc """
  Schema for friendships between users.

  Friendships are bidirectional relationships with status tracking
  for pending requests, accepted friendships, and blocks.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @statuses [:pending, :accepted, :blocked]

  schema "friendships" do
    field :status, Ecto.Enum, values: @statuses, default: :pending
    field :nickname, :string  # Custom nickname for the friend
    field :notes, :string     # Private notes about the friend
    field :accepted_at, :utc_datetime  # When the friendship was accepted

    # The user who initiated the friendship/request
    belongs_to :user, Cgraph.Accounts.User
    # The target user
    belongs_to :friend, Cgraph.Accounts.User

    timestamps()
  end

  @doc false
  def changeset(friendship, attrs) do
    friendship
    |> cast(attrs, [:user_id, :friend_id, :status, :nickname, :notes, :accepted_at])
    |> validate_required([:user_id, :friend_id])
    |> validate_inclusion(:status, @statuses)
    |> validate_length(:nickname, max: 32)
    |> validate_length(:notes, max: 500)
    |> validate_not_self_friend()
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:friend_id)
    |> unique_constraint([:user_id, :friend_id])
  end

  defp validate_not_self_friend(changeset) do
    user_id = get_field(changeset, :user_id)
    friend_id = get_field(changeset, :friend_id)

    if user_id && friend_id && user_id == friend_id do
      add_error(changeset, :friend_id, "cannot be yourself")
    else
      changeset
    end
  end
end
