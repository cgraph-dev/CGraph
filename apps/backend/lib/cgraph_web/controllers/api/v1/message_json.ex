defmodule CgraphWeb.API.V1.MessageJSON do
  @moduledoc """
  JSON rendering for message responses.
  
  All field names use camelCase for frontend consistency.
  This module is also used by WebSocket channels for message serialization.
  """
  alias Cgraph.Messaging.Message
  alias Cgraph.Accounts.User

  def index(%{messages: messages, meta: meta}) do
    %{
      data: Enum.map(messages, &message_data/1),
      meta: meta
    }
  end

  def show(%{message: message}) do
    %{data: message_data(message)}
  end

  @doc """
  Serialize a message to a consistent JSON-compatible map.
  Uses camelCase field names for frontend compatibility.
  Can be called from channels for WebSocket broadcasts.
  """
  def message_data(%Message{} = msg) do
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
      isPinned: false,
      replyToId: msg.reply_to_id,
      replyTo: reply_data(msg.reply_to),
      deletedAt: msg.deleted_at,
      metadata: %{},
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
      metadata: %{},
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
    %{
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      status: user.status || "offline"
    }
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
        users: Enum.take(list, 3) |> Enum.map(& &1.user_id)
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

  defp truncate(nil, _), do: nil
  defp truncate(str, max) when byte_size(str) <= max, do: str
  defp truncate(str, max), do: String.slice(str, 0, max) <> "..."
end
