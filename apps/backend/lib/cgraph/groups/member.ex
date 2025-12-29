defmodule Cgraph.Groups.Member do
  @moduledoc """
  Group membership with roles and moderation status.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :nickname, :joined_at, :is_muted, :is_banned, :user_id, :group_id
  ]}

  schema "group_members" do
    field :nickname, :string
    field :joined_at, :utc_datetime

    # Moderation status
    field :is_muted, :boolean, default: false
    field :muted_until, :utc_datetime
    field :mute_reason, :string

    field :is_banned, :boolean, default: false
    field :banned_until, :utc_datetime
    field :ban_reason, :string

    # Notification settings
    field :notifications, :string, default: "all"  # all, mentions, none
    field :suppress_everyone, :boolean, default: false

    # Associations
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :group, Cgraph.Groups.Group

    many_to_many :roles, Cgraph.Groups.Role, join_through: "member_roles"

    timestamps()
  end

  @doc """
  Create a new member.
  """
  def changeset(member, attrs) do
    member
    |> cast(attrs, [:user_id, :group_id, :nickname])
    |> validate_required([:user_id, :group_id])
    |> put_change(:joined_at, DateTime.utc_now() |> DateTime.truncate(:second))
    |> validate_length(:nickname, max: 32)
    |> unique_constraint([:user_id, :group_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:group_id)
  end

  @doc """
  Update member settings.
  """
  def update_changeset(member, attrs) do
    member
    |> cast(attrs, [:nickname, :notifications, :suppress_everyone])
    |> validate_length(:nickname, max: 32)
    |> validate_inclusion(:notifications, ["all", "mentions", "none"])
  end

  @doc """
  Mute a member.
  """
  def mute_changeset(member, attrs) do
    member
    |> cast(attrs, [:muted_until, :mute_reason])
    |> put_change(:is_muted, true)
    |> validate_length(:mute_reason, max: 500)
  end

  @doc """
  Unmute a member.
  """
  def unmute_changeset(member) do
    member
    |> change(is_muted: false)
    |> change(muted_until: nil)
    |> change(mute_reason: nil)
  end

  @doc """
  Ban a member.
  """
  def ban_changeset(member, attrs) do
    member
    |> cast(attrs, [:banned_until, :ban_reason])
    |> put_change(:is_banned, true)
    |> validate_length(:ban_reason, max: 500)
  end

  @doc """
  Unban a member.
  """
  def unban_changeset(member) do
    member
    |> change(is_banned: false)
    |> change(banned_until: nil)
    |> change(ban_reason: nil)
  end
end
