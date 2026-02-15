defmodule CGraph.Messaging.Message do
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
    :id, :snowflake_id, :content, :content_type, :is_encrypted, :is_edited,
    :sender_id, :conversation_id, :channel_id, :reply_to_id,
    :scheduled_at, :schedule_status, :expires_at,
    :inserted_at, :updated_at
  ]}

  @content_types ["text", "image", "video", "audio", "file", "voice", "sticker", "gif", "system"]

  schema "messages" do
    # Snowflake ID for guaranteed chronological ordering.
    # Used as the primary cursor for pagination (WHERE snowflake_id > ?)
    # while preserving UUID primary key for foreign key compatibility.
    field :snowflake_id, :integer

    field :content, :string
    field :content_type, :string, default: "text"
    field :is_encrypted, :boolean, default: true
    field :is_edited, :boolean, default: false
    field :edit_count, :integer, default: 0
    field :deleted_at, :utc_datetime
    field :deleted_for_everyone, :boolean, default: false

    # Client-generated UUID for idempotency (prevents duplicate messages on retry)
    field :client_message_id, :string

    # Pinned message fields
    field :is_pinned, :boolean, default: false
    field :pinned_at, :utc_datetime
    belongs_to :pinned_by, CGraph.Accounts.User

    # Scheduled message fields
    field :scheduled_at, :utc_datetime_usec
    field :schedule_status, :string, default: "immediate"

    # Ephemeral / disappearing message support
    field :expires_at, :utc_datetime_usec

    # For file attachments
    field :file_url, :string
    field :file_name, :string
    field :file_size, :integer
    field :file_mime_type, :string
    field :thumbnail_url, :string

    # Link preview metadata
    field :link_preview, :map

    # Associations
    belongs_to :sender, CGraph.Accounts.User
    belongs_to :conversation, CGraph.Messaging.Conversation
    belongs_to :channel, CGraph.Groups.Channel  # For group messages
    belongs_to :reply_to, __MODULE__

    has_many :reactions, CGraph.Messaging.Reaction
    has_many :read_receipts, CGraph.Messaging.ReadReceipt
    has_many :edits, CGraph.Messaging.MessageEdit

    timestamps()
  end

  @doc """
  Create a new message.
  Includes content sanitization to prevent XSS attacks.
  """
  def changeset(message, attrs) do
    message
    |> cast(attrs, [
      :content, :content_type, :is_encrypted, :sender_id,
      :conversation_id, :channel_id, :reply_to_id,
      :file_url, :file_name, :file_size, :file_mime_type,
      :thumbnail_url, :link_preview, :client_message_id,
      :scheduled_at, :schedule_status, :expires_at
    ])
    |> validate_required([:content, :sender_id])
    |> maybe_assign_snowflake_id()
    |> sanitize_content()
    |> validate_message_target()
    |> validate_inclusion(:content_type, @content_types)
    |> validate_length(:content, max: 10_000)
    |> validate_length(:client_message_id, max: 64)
    |> foreign_key_constraint(:sender_id)
    |> foreign_key_constraint(:conversation_id)
    |> foreign_key_constraint(:channel_id)
    |> foreign_key_constraint(:reply_to_id)
    |> unique_constraint([:conversation_id, :client_message_id],
        name: :messages_conversation_idempotency_idx,
        message: "message already sent")
  end

  @doc """
  Edit message content.
  """
  def edit_changeset(message, attrs) do
    message
    |> cast(attrs, [:content])
    |> validate_required([:content])
    |> sanitize_content()
    |> validate_length(:content, max: 10_000)
    |> put_change(:is_edited, true)
    |> put_change(:edit_count, message.edit_count + 1)
  end

  @doc """
  Soft delete a message.
  """
  def delete_changeset(message, for_everyone \\ false) do
    message
    |> change(deleted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> change(deleted_for_everyone: for_everyone)
  end

  # Assign a Snowflake ID if the generator is running (production/test)
  defp maybe_assign_snowflake_id(changeset) do
    if get_field(changeset, :snowflake_id) do
      changeset
    else
      case Process.whereis(CGraph.Snowflake) do
        nil -> changeset  # Snowflake not started (e.g., migration context)
        _pid -> put_change(changeset, :snowflake_id, CGraph.Snowflake.generate())
      end
    end
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

  # Sanitize message content to prevent XSS and injection attacks
  # Strips dangerous HTML/script tags while preserving safe formatting
  defp sanitize_content(changeset) do
    case get_change(changeset, :content) do
      nil ->
        changeset
      content when is_binary(content) ->
        sanitized = content
        |> String.trim()
        |> sanitize_html()
        |> limit_consecutive_newlines()
        put_change(changeset, :content, sanitized)
      _ ->
        changeset
    end
  end

  # Remove dangerous HTML tags and script content
  # Allows basic text formatting but strips scripts, iframes, etc.
  defp sanitize_html(content) do
    content
    # Remove script tags and their content
    |> String.replace(~r/<script[^>]*>.*?<\/script>/is, "")
    # Remove style tags and their content
    |> String.replace(~r/<style[^>]*>.*?<\/style>/is, "")
    # Remove iframe tags
    |> String.replace(~r/<iframe[^>]*>.*?<\/iframe>/is, "")
    # Remove object/embed tags
    |> String.replace(~r/<(object|embed|applet)[^>]*>.*?<\/\1>/is, "")
    # Remove onclick and other event handlers
    |> String.replace(~r/\bon\w+\s*=\s*["'][^"']*["']/i, "")
    # Remove javascript: URLs
    |> String.replace(~r/javascript:/i, "")
    # Remove data: URLs in sensitive contexts
    |> String.replace(~r/data:\s*text\/html/i, "")
    # Escape remaining HTML entities for safe display
    |> Phoenix.HTML.html_escape()
    |> Phoenix.HTML.safe_to_string()
  end

  # Limit consecutive newlines to prevent message spam/flooding
  defp limit_consecutive_newlines(content) do
    String.replace(content, ~r/\n{4,}/, "\n\n\n")
  end
end
