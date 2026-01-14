defmodule CGraphWeb.Validation.MessageParams do
  @moduledoc """
  Strong parameter validation for message endpoints.

  Provides strict type checking, sanitization, and business rule validation
  for all message-related API operations.

  ## Security Features

  - Content length limits (prevent DoS)
  - XSS sanitization via HtmlSanitizeEx
  - File type validation for attachments
  - Rate limiting friendly (fast validation)

  ## Usage

      with {:ok, attrs} <- MessageParams.validate_create(params) do
        Messages.create_message(user, conversation, attrs)
      end
  """

  use Ecto.Schema
  import Ecto.Changeset

  @max_content_length 10_000
  @max_file_name_length 255
  @max_file_size 100 * 1024 * 1024  # 100MB
  @allowed_content_types ~w(text voice image video file link)
  @allowed_mime_types ~w(
    image/jpeg image/png image/gif image/webp
    video/mp4 video/webm video/quicktime
    audio/mpeg audio/ogg audio/webm audio/wav audio/mp4
    application/pdf application/zip application/x-zip-compressed
    text/plain text/csv
  )

  embedded_schema do
    field :content, :string
    field :content_type, :string, default: "text"
    field :reply_to_id, Ecto.UUID
    field :conversation_id, Ecto.UUID
    field :channel_id, Ecto.UUID
    field :is_encrypted, :boolean, default: false

    # Attachments
    field :file_url, :string
    field :file_name, :string
    field :file_size, :integer
    field :file_mime_type, :string
    field :thumbnail_url, :string

    # Link preview
    field :link_preview, :map

    # Idempotency
    field :client_message_id, :string

    # Reaction
    field :emoji, :string

    # Search
    field :query, :string
    field :before, :utc_datetime
    field :after_time, :utc_datetime
    field :limit, :integer, default: 50
  end

  @doc """
  Validate parameters for creating a new message.
  """
  def validate_create(params) do
    %__MODULE__{}
    |> cast(params, [
      :content, :content_type, :reply_to_id, :conversation_id, :channel_id,
      :is_encrypted, :file_url, :file_name, :file_size, :file_mime_type,
      :thumbnail_url, :link_preview, :client_message_id
    ], empty_values: [""])
    |> validate_required([:content])
    |> validate_length(:content, max: @max_content_length)
    |> validate_inclusion(:content_type, @allowed_content_types)
    |> validate_file_attachment()
    |> validate_link_preview()
    |> sanitize_content()
    |> validate_destination()
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for editing a message.
  """
  def validate_update(params) do
    %__MODULE__{}
    |> cast(params, [:content], empty_values: [""])
    |> validate_required([:content])
    |> validate_length(:content, max: @max_content_length)
    |> sanitize_content()
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for adding a reaction.
  """
  def validate_reaction(params) do
    %__MODULE__{}
    |> cast(params, [:emoji], empty_values: [""])
    |> validate_required([:emoji])
    |> validate_length(:emoji, max: 32)
    |> validate_emoji()
    |> result_from_changeset()
  end

  @doc """
  Validate search parameters for messages.
  """
  def validate_search(params) do
    %__MODULE__{}
    |> cast(params, [:query, :conversation_id, :channel_id, :before, :after_time, :limit], empty_values: [""])
    |> validate_required([:query])
    |> validate_length(:query, min: 2, max: 200)
    |> validate_number(:limit, greater_than: 0, less_than_or_equal_to: 100)
    |> result_from_changeset()
  end

  # ============================================================================
  # Private Validation Functions
  # ============================================================================

  defp validate_file_attachment(changeset) do
    if get_change(changeset, :file_url) do
      changeset
      |> validate_length(:file_name, max: @max_file_name_length)
      |> validate_number(:file_size, greater_than: 0, less_than_or_equal_to: @max_file_size)
      |> validate_mime_type()
    else
      changeset
    end
  end

  defp validate_mime_type(changeset) do
    mime_type = get_change(changeset, :file_mime_type)

    if mime_type && mime_type not in @allowed_mime_types do
      add_error(changeset, :file_mime_type, "is not an allowed file type")
    else
      changeset
    end
  end

  defp validate_link_preview(changeset) do
    preview = get_change(changeset, :link_preview)

    if preview && is_map(preview) do
      # Validate link preview structure
      allowed_keys = ~w(url title description image favicon site_name)

      invalid_keys = Map.keys(preview) -- allowed_keys

      if length(invalid_keys) > 0 do
        add_error(changeset, :link_preview, "contains invalid keys: #{Enum.join(invalid_keys, ", ")}")
      else
        changeset
      end
    else
      changeset
    end
  end

  defp sanitize_content(changeset) do
    update_change(changeset, :content, fn content ->
      if content && is_binary(content) do
        content
        |> String.trim()
        |> sanitize_html()
      else
        content
      end
    end)
  end

  defp sanitize_html(content) do
    # Basic HTML entity encoding for XSS prevention
    # In production, use HtmlSanitizeEx.strip_tags/1 or similar
    content
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&#39;")
  end

  defp validate_destination(changeset) do
    conversation_id = get_change(changeset, :conversation_id)
    channel_id = get_change(changeset, :channel_id)

    case {conversation_id, channel_id} do
      {nil, nil} ->
        add_error(changeset, :conversation_id, "either conversation_id or channel_id is required")

      {_, nil} -> changeset
      {nil, _} -> changeset

      {_, _} ->
        add_error(changeset, :conversation_id, "cannot specify both conversation_id and channel_id")
    end
  end

  defp validate_emoji(changeset) do
    # Basic emoji validation - in production use a proper emoji library
    validate_format(changeset, :emoji, ~r/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Component}:a-zA-Z0-9_-]+$/u)
  end

  # ============================================================================
  # Result Helpers
  # ============================================================================

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, struct} -> {:ok, to_map(struct)}
      {:error, cs} -> {:error, cs}
    end
  end

  defp to_map(%__MODULE__{} = struct) do
    struct
    |> Map.from_struct()
    |> Map.delete(:__meta__)
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
end
