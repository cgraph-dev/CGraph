defmodule Cgraph.Messaging.ConversationParticipant do
  @moduledoc """
  Tracks user participation in conversations with per-user settings.
  
  Stores mute preferences, unread counts, and encryption keys.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "conversation_participants" do
    field :unread_count, :integer, default: 0
    field :last_read_at, :utc_datetime
    field :left_at, :utc_datetime  # When user left the conversation
    field :is_muted, :boolean, default: false
    field :muted_until, :utc_datetime
    field :is_archived, :boolean, default: false
    field :is_pinned, :boolean, default: false
    field :nickname, :string  # Custom nickname for the other user

    # E2E encryption - client stores encrypted keys
    field :public_key, :string
    field :encrypted_private_key, :string

    belongs_to :conversation, Cgraph.Messaging.Conversation
    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  @doc """
  Create a participant record.
  """
  def changeset(participant, attrs) do
    participant
    |> cast(attrs, [
      :conversation_id, :user_id, :public_key, :encrypted_private_key,
      :nickname, :is_muted, :muted_until, :is_archived, :is_pinned
    ])
    |> validate_required([:conversation_id, :user_id])
    |> unique_constraint([:conversation_id, :user_id])
    |> foreign_key_constraint(:conversation_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Mark messages as read up to current time.
  """
  def mark_read_changeset(participant) do
    participant
    |> change(last_read_at: DateTime.utc_now())
    |> change(unread_count: 0)
  end

  @doc """
  Increment unread count.
  """
  def increment_unread_changeset(participant) do
    change(participant, unread_count: participant.unread_count + 1)
  end

  @doc """
  Toggle mute status.
  """
  def mute_changeset(participant, attrs) do
    participant
    |> cast(attrs, [:is_muted, :muted_until])
    |> validate_mute_until()
  end

  defp validate_mute_until(changeset) do
    if get_field(changeset, :is_muted) && is_nil(get_field(changeset, :muted_until)) do
      # Muted indefinitely is fine
      changeset
    else
      changeset
    end
  end
end
