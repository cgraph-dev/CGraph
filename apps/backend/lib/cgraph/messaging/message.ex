defmodule Cgraph.Messaging.Message do
  @moduledoc """
  Message schema for direct messages and channel messages.
  
  Supports:
  - Text messages (encrypted for DMs)
  - File attachments
  - Replies/quotes
  - Reactions
  - Edit history
  - Soft deletes
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :content, :content_type, :is_encrypted, :is_edited,
    :sender_id, :conversation_id, :channel_id, :reply_to_id,
    :inserted_at, :updated_at
  ]}

  @content_types ["text", "image", "video", "audio", "file", "voice", "system"]

  schema "messages" do
    field :content, :string
    field :content_type, :string, default: "text"
    field :is_encrypted, :boolean, default: false
    field :is_edited, :boolean, default: false
    field :edit_count, :integer, default: 0
    field :deleted_at, :utc_datetime
    field :deleted_for_everyone, :boolean, default: false

    # For file attachments
    field :file_url, :string
    field :file_name, :string
    field :file_size, :integer
    field :file_mime_type, :string
    field :thumbnail_url, :string

    # Link preview metadata
    field :link_preview, :map

    # Associations
    belongs_to :sender, Cgraph.Accounts.User
    belongs_to :conversation, Cgraph.Messaging.Conversation
    belongs_to :channel, Cgraph.Groups.Channel  # For group messages
    belongs_to :reply_to, __MODULE__

    has_many :reactions, Cgraph.Messaging.Reaction
    has_many :read_receipts, Cgraph.Messaging.ReadReceipt
    has_many :edits, Cgraph.Messaging.MessageEdit

    timestamps()
  end

  @doc """
  Create a new message.
  """
  def changeset(message, attrs) do
    message
    |> cast(attrs, [
      :content, :content_type, :is_encrypted, :sender_id,
      :conversation_id, :channel_id, :reply_to_id,
      :file_url, :file_name, :file_size, :file_mime_type,
      :thumbnail_url, :link_preview
    ])
    |> validate_required([:content, :sender_id])
    |> validate_message_target()
    |> validate_inclusion(:content_type, @content_types)
    |> validate_length(:content, max: 10_000)
    |> foreign_key_constraint(:sender_id)
    |> foreign_key_constraint(:conversation_id)
    |> foreign_key_constraint(:channel_id)
    |> foreign_key_constraint(:reply_to_id)
  end

  @doc """
  Edit message content.
  """
  def edit_changeset(message, attrs) do
    message
    |> cast(attrs, [:content])
    |> validate_required([:content])
    |> validate_length(:content, max: 10_000)
    |> put_change(:is_edited, true)
    |> put_change(:edit_count, message.edit_count + 1)
  end

  @doc """
  Soft delete a message.
  """
  def delete_changeset(message, for_everyone \\ false) do
    message
    |> change(deleted_at: DateTime.utc_now())
    |> change(deleted_for_everyone: for_everyone)
  end

  # Either conversation_id OR channel_id must be present, not both
  defp validate_message_target(changeset) do
    conversation_id = get_field(changeset, :conversation_id)
    channel_id = get_field(changeset, :channel_id)

    case {conversation_id, channel_id} do
      {nil, nil} ->
        add_error(changeset, :conversation_id, "message must belong to a conversation or channel")
      {_, nil} -> changeset
      {nil, _} -> changeset
      {_, _} ->
        add_error(changeset, :channel_id, "message cannot belong to both conversation and channel")
    end
  end
end
