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
  Includes content sanitization to prevent XSS attacks.
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
    |> sanitize_content()
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
