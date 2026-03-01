defmodule CGraphWeb.API.V1.MessageJSON do
  @moduledoc """
  JSON rendering for message responses.

  All field names use camelCase for frontend consistency.
  This module is also used by WebSocket channels for message serialization.
  """

  alias CGraph.Accounts.User
  alias CGraph.Messaging.Message

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{messages: messages, meta: meta}) do
    %{
      data: Enum.map(messages, &message_data/1),
      meta: meta
    }
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{message: message}) do
    %{data: message_data(message)}
  end

  @doc """
  Serialize a message to a consistent JSON-compatible map.
  Uses camelCase field names for frontend compatibility.
  Can be called from channels for WebSocket broadcasts.
  """
  @spec message_data(Message.t() | map()) :: map()
  def message_data(%Message{} = msg) do
    # Build metadata with file info for voice/audio/file messages
    file_metadata = build_file_metadata(msg)

    %{
      id: msg.id,
      conversationId: msg.conversation_id,
      channelId: msg.channel_id,
      senderId: msg.sender_id,
      content: msg.content,
      contentType: msg.content_type || "text",
      messageType: msg.content_type || "text",
      encryptedContent: if(msg.is_encrypted, do: msg.content, else: nil),
      isEncrypted: msg.is_encrypted || false,
      isEdited: msg.is_edited || false,
      isPinned: msg.is_pinned || false,
      pinnedAt: format_datetime(msg.pinned_at),
      pinnedById: msg.pinned_by_id,
      replyToId: msg.reply_to_id,
      replyTo: reply_data(msg.reply_to),
      deletedAt: msg.deleted_at,
      # Forwarding metadata
      forwardedFromId: msg.forwarded_from_id,
      forwardedFromUserId: msg.forwarded_from_user_id,
      forwardedFromUserName: forwarded_from_user_name(msg),
      # Include file info in metadata for voice/audio/file message types
      metadata: file_metadata,
      # Also include at root level for backwards compatibility
      fileUrl: msg.file_url,
      fileName: msg.file_name,
      fileSize: msg.file_size,
      fileMimeType: msg.file_mime_type,
      sender: sender_data(msg.sender),
      attachment: build_attachment(msg),
      reactions: reaction_summary(msg.reactions),
      createdAt: format_datetime(msg.inserted_at),
      updatedAt: format_datetime(msg.updated_at)
    }
  end

  # Fallback for when message is a map (from channel assigns)
  def message_data(%{id: _} = msg) do
    %{
      id: msg[:id],
      conversationId: msg[:conversation_id],
      channelId: msg[:channel_id],
      senderId: msg[:sender_id],
      content: msg[:content],
      contentType: msg[:content_type] || "text",
      messageType: msg[:content_type] || "text",
      encryptedContent: if(msg[:is_encrypted], do: msg[:content], else: nil),
      isEncrypted: msg[:is_encrypted] || false,
      isEdited: msg[:is_edited] || false,
      isPinned: false,
      replyToId: msg[:reply_to_id],
      replyTo: nil,
      deletedAt: msg[:deleted_at],
      metadata: build_file_metadata_from_map(msg),
      fileUrl: msg[:file_url],
      fileName: msg[:file_name],
      fileSize: msg[:file_size],
      fileMimeType: msg[:file_mime_type],
      sender: msg[:sender],
      attachment: nil,
      reactions: [],
      createdAt: format_datetime(msg[:inserted_at]),
      updatedAt: format_datetime(msg[:updated_at])
    }
  end

  defp format_datetime(nil), do: nil
  defp format_datetime(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_datetime(%NaiveDateTime{} = dt), do: NaiveDateTime.to_iso8601(dt) <> "Z"
  defp format_datetime(other), do: other

  # Build file metadata for voice/audio/file messages from Message struct
  # Populates metadata object with file info for frontend players
  defp build_file_metadata(%Message{file_url: nil, link_preview: nil}), do: %{}
  defp build_file_metadata(%Message{file_url: nil, link_preview: link_preview}) when is_map(link_preview) do
    # Return link_preview data for grid images or other custom metadata
    link_preview
  end
  defp build_file_metadata(%Message{content_type: content_type, link_preview: link_preview} = msg)
       when content_type in ["voice", "audio", "file", "image", "video"] do
    base_metadata = %{
      url: msg.file_url,
      filename: msg.file_name,
      size: msg.file_size,
      mimeType: msg.file_mime_type,
      thumbnailUrl: msg.thumbnail_url
    }
    # Merge link_preview data (grid_images, etc.) into metadata
    if is_map(link_preview) do
      Map.merge(base_metadata, link_preview)
    else
      base_metadata
    end
  end
  defp build_file_metadata(_msg), do: %{}

  # Build file metadata from map (for channel assigns)
  defp build_file_metadata_from_map(%{file_url: nil}), do: %{}
  defp build_file_metadata_from_map(%{content_type: content_type} = msg)
       when content_type in ["voice", "audio", "file", "image", "video"] do
    extract_file_metadata(msg)
  end
  defp build_file_metadata_from_map(msg) do
    url = msg[:file_url] || msg["file_url"]
    content_type = msg[:content_type] || msg["content_type"]
    maybe_extract_file_metadata(url, content_type, msg)
  end

  defp maybe_extract_file_metadata(nil, _content_type, _msg), do: %{}
  defp maybe_extract_file_metadata(url, content_type, msg) when content_type in ["voice", "audio", "file", "image", "video"] do
    %{
      url: url,
      filename: msg[:file_name] || msg["file_name"],
      size: msg[:file_size] || msg["file_size"],
      mimeType: msg[:file_mime_type] || msg["file_mime_type"],
      thumbnailUrl: msg[:thumbnail_url] || msg["thumbnail_url"]
    }
  end
  defp maybe_extract_file_metadata(_url, _content_type, _msg), do: %{}

  defp extract_file_metadata(msg) do
    %{
      url: msg[:file_url],
      filename: msg[:file_name],
      size: msg[:file_size],
      mimeType: msg[:file_mime_type],
      thumbnailUrl: msg[:thumbnail_url]
    }
  end

  # Build attachment data from message file fields
  defp build_attachment(%Message{file_url: nil}), do: nil
  defp build_attachment(%Message{} = msg) do
    %{
      url: msg.file_url,
      filename: msg.file_name,
      size: msg.file_size,
      mime_type: msg.file_mime_type,
      thumbnail_url: msg.thumbnail_url
    }
  end

  # Handle sender associations that may not be loaded
  # Uses camelCase for all fields to match frontend expectations
  defp sender_data(nil), do: nil
  defp sender_data(%Ecto.Association.NotLoaded{}), do: nil
  defp sender_data(%User{} = user) do
    base = %{
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      avatarBorderId: user.avatar_border_id,
      status: user.status || "offline"
    }

    # Include customization data if the association is preloaded
    case user.customization do
      %CGraph.Customizations.UserCustomization{} = c ->
        Map.merge(base, %{
          equippedTitleId: c.title_id,
          bubbleStyle: c.bubble_style,
          bubbleColor: c.bubble_color,
          bubbleRadius: c.bubble_radius,
          bubbleOpacity: c.bubble_opacity,
          messageEffect: c.message_effect,
          reactionStyle: c.reaction_style,
          chatTheme: c.chat_theme,
          profileTheme: c.profile_theme,
          entranceAnimation: c.entrance_animation,
          glassEffect: c.glass_effect,
          textColor: c.text_color,
          textSize: c.text_size,
          fontFamily: c.font_family
        })

      _ ->
        base
    end
  end

  # Handle reactions that may not be loaded
  defp reaction_summary(%Ecto.Association.NotLoaded{}), do: []
  defp reaction_summary(nil), do: []
  defp reaction_summary(reactions) do
    reactions
    |> Enum.group_by(& &1.emoji)
    |> Enum.map(fn {emoji, list} ->
      %{
        emoji: emoji,
        count: length(list),
        users: Enum.take(list, 3) |> Enum.map(fn r ->
          # Return full user object if preloaded, otherwise just user_id
          case r.user do
            %Ecto.Association.NotLoaded{} -> %{id: r.user_id}
            nil -> %{id: r.user_id}
            user -> %{
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              avatar_url: user.avatar_url,
              avatar_border_id: user.avatar_border_id
            }
          end
        end)
      }
    end)
  end

  # Handle reply_to associations that may not be loaded
  defp reply_data(nil), do: nil
  defp reply_data(%Ecto.Association.NotLoaded{}), do: nil
  defp reply_data(%Message{} = msg) do
    %{
      id: msg.id,
      content: truncate(msg.content, 100),
      sender: sender_data(msg.sender)
    }
  end

  # Extract name of the original sender for forwarded messages
  defp forwarded_from_user_name(%Message{forwarded_from_user_id: nil}), do: nil
  defp forwarded_from_user_name(%Message{} = msg) do
    case msg.forwarded_from_user do
      %User{} = user -> user.display_name || user.username
      %Ecto.Association.NotLoaded{} ->
        # Preload on-demand if not already loaded
        case CGraph.Repo.get(User, msg.forwarded_from_user_id) do
          nil -> nil
          user -> user.display_name || user.username
        end
      _ -> nil
    end
  end

  defp truncate(nil, _), do: nil
  defp truncate(str, max) when byte_size(str) <= max, do: str
  defp truncate(str, max), do: String.slice(str, 0, max) <> "..."
end
