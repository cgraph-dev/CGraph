defmodule Cgraph.Forums.Ban do
  @moduledoc """
  Schema for forum bans.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_bans" do
    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :banned_by, Cgraph.Accounts.User

    field :reason, :string
    field :expires_at, :utc_datetime
    field :is_permanent, :boolean, default: false
    field :revoked_at, :utc_datetime
    field :revoked_by_id, :binary_id
    
    timestamps()
  end

  def changeset(ban, attrs) do
    ban
    |> cast(attrs, [:forum_id, :user_id, :banned_by_id, :reason, :expires_at, :is_permanent])
    |> validate_required([:forum_id, :user_id, :banned_by_id, :reason])
    |> validate_length(:reason, max: 1000)
    |> unique_constraint([:forum_id, :user_id], name: :forum_bans_active_ban_index)
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:user_id)
  end

  def revoke_changeset(ban, revoked_by_id) do
    change(ban,
      revoked_at: DateTime.utc_now(),
      revoked_by_id: revoked_by_id
    )
  end
end
