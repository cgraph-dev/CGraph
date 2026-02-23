defmodule CGraphWeb.API.V1.ConversationJSON do
  @moduledoc """
  JSON rendering for conversation responses.

  Handles both direct (1:1) and group conversations with proper
  association loading guards throughout.
  """
  alias CGraph.Messaging.{Conversation, Message}
  alias CGraph.Presence

  @doc """
  Renders a list of conversations with pagination metadata.
  """
  @spec index(map()) :: map()
  def index(%{conversations: conversations, current_user: current_user, meta: meta}) do
    %{
      data: Enum.map(conversations, &conversation_data(&1, current_user)),
      meta: meta
    }
  end

  @doc """
  Renders a single conversation with full details.
  """
  @spec show(map()) :: map()
  def show(%{conversation: conversation, current_user: current_user}) do
    %{data: conversation_data(conversation, current_user)}
  end

  # Renders complete conversation data including participants list
  # Uses camelCase for all fields for frontend consistency
  # Participants include nested user data with userId for matching
  defp conversation_data(%Conversation{} = conv, _current_user) do
    participants = get_participants_with_data(conv)
    last_msg = get_last_message(conv)

    %{
      id: conv.id,
      type: if(length(participants) > 2, do: "group", else: "direct"),
      name: Map.get(conv, :name),
      avatarUrl: Map.get(conv, :avatar_url),
      participants: participants,
      lastMessage: last_message_data(last_msg),
      lastMessageAt: conv.last_message_at,
      unreadCount: Map.get(conv, :unread_count) || 0,
      muted: Map.get(conv, :muted) || false,
      pinned: Map.get(conv, :pinned) || false,
      updatedAt: conv.updated_at,
      createdAt: conv.inserted_at
    }
  end

  # Extracts all participant users from conversation with proper structure
  # Returns list of participant objects with user data nested
  # Guards against NotLoaded associations
  defp get_participants_with_data(%Conversation{participants: %Ecto.Association.NotLoaded{}}), do: []
  defp get_participants_with_data(%Conversation{participants: participants}) when is_list(participants) do
    participants
    |> Enum.map(fn p ->
      case p.user do
        %Ecto.Association.NotLoaded{} -> nil
        user ->
          # Get last seen from presence cache
          last_seen = Presence.last_seen(user.id)

          %{
            id: p.id,
            userId: user.id,
            nickname: Map.get(p, :nickname),
            isMuted: Map.get(p, :is_muted, false),
            mutedUntil: Map.get(p, :muted_until),
            joinedAt: p.inserted_at,
            user: %{
              id: user.id,
              username: user.username,
              displayName: user.display_name,
              avatarUrl: user.avatar_url,
              avatarBorderId: user.avatar_border_id,
              status: user.status || "offline",
              lastSeenAt: last_seen
            }
          }
      end
    end)
    |> Enum.reject(&is_nil/1)
  end
  defp get_participants_with_data(_), do: []

  # Returns last message from preloaded messages, excluding deleted ones
  # Guards against NotLoaded associations
  defp get_last_message(%Conversation{messages: %Ecto.Association.NotLoaded{}}), do: nil
  defp get_last_message(%Conversation{messages: messages}) when is_list(messages) do
    messages
    |> Enum.reject(fn m -> m.deleted_at != nil end)
    |> Enum.sort_by(& &1.inserted_at, {:desc, DateTime})
    |> List.first()
  end
  defp get_last_message(_), do: nil

  defp last_message_data(nil), do: nil
  defp last_message_data(%Message{} = msg) do
    %{
      id: msg.id,
      content: truncate(msg.content, 100),
      senderId: msg.sender_id,
      createdAt: msg.inserted_at
    }
  end

  defp truncate(nil, _), do: nil
  defp truncate(str, max) when byte_size(str) <= max, do: str
  defp truncate(str, max) do
    String.slice(str, 0, max) <> "..."
  end

  @doc """
  Renders response for marking a conversation as read.
  """
  @spec mark_read(map()) :: map()
  def mark_read(%{conversation_id: conversation_id}) do
    %{
      status: "ok",
      conversationId: conversation_id,
      unreadCount: 0
    }
  end
end
