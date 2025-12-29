defmodule Cgraph.Groups.AuditLog do
  @moduledoc """
  Audit log for tracking all moderation actions in a group.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @action_types [
    # Group
    "group_update", "group_delete",
    # Channels
    "channel_create", "channel_update", "channel_delete",
    # Members
    "member_kick", "member_ban", "member_unban", "member_mute", "member_unmute",
    "member_role_update",
    # Roles
    "role_create", "role_update", "role_delete",
    # Messages
    "message_delete", "message_pin", "message_unpin",
    # Invites
    "invite_create", "invite_delete",
    # Emojis
    "emoji_create", "emoji_delete"
  ]

  schema "audit_logs" do
    field :action_type, :string
    field :reason, :string
    field :changes, :map  # JSON of before/after values

    belongs_to :group, Cgraph.Groups.Group
    belongs_to :user, Cgraph.Accounts.User  # Who performed the action
    belongs_to :target_user, Cgraph.Accounts.User  # Who was affected (optional)

    timestamps(updated_at: false)
  end

  @doc """
  Create an audit log entry.
  """
  def changeset(log, attrs) do
    log
    |> cast(attrs, [:action_type, :reason, :changes, :group_id, :user_id, :target_user_id])
    |> validate_required([:action_type, :group_id, :user_id])
    |> validate_inclusion(:action_type, @action_types)
    |> validate_length(:reason, max: 512)
    |> foreign_key_constraint(:group_id)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:target_user_id)
  end

  @doc """
  Get list of valid action types.
  """
  def action_types, do: @action_types
end
