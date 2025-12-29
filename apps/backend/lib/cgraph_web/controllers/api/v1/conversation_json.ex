defmodule CgraphWeb.API.V1.ConversationJSON do
  @moduledoc """
  JSON rendering for conversation responses.
  
  Handles both direct (1:1) and group conversations with proper
  association loading guards throughout.
  """
  alias Cgraph.Messaging.{Conversation, Message}
  alias Cgraph.Accounts.User

  @doc """
  Renders a list of conversations with pagination metadata.
  """
  def index(%{conversations: conversations, current_user: current_user, meta: meta}) do
    %{
      data: Enum.map(conversations, &conversation_data(&1, current_user)),
      meta: meta
    }
  end

  @doc """
  Renders a single conversation with full details.
  """
  def show(%{conversation: conversation, current_user: current_user}) do
    %{data: conversation_data(conversation, current_user)}
  end

  # Renders complete conversation data including participants list
  # Currently only supports 1:1 direct conversations (schema limitation)
  defp conversation_data(%Conversation{} = conv, _current_user) do
    participants = get_participants(conv)
    last_msg = get_last_message(conv)
    
    %{
      id: conv.id,
      participants: Enum.map(participants, &participant_data/1),
      last_message: last_message_data(last_msg),
      last_message_at: conv.last_message_at,
      unread_count: Map.get(conv, :unread_count) || 0,
      muted: Map.get(conv, :muted) || false,
      pinned: Map.get(conv, :pinned) || false,
      updated_at: conv.updated_at,
      created_at: conv.inserted_at
    }
    # Note: Group conversations with `name` field require schema update
  end

  # Extracts all participant users from conversation
  # Guards against NotLoaded associations
  defp get_participants(%Conversation{participants: %Ecto.Association.NotLoaded{}}), do: []
  defp get_participants(%Conversation{participants: participants}) when is_list(participants) do
    participants
    |> Enum.map(fn p -> 
      case p.user do
        %Ecto.Association.NotLoaded{} -> nil
        user -> user
      end
    end)
    |> Enum.reject(&is_nil/1)
  end
  defp get_participants(_), do: []

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

  # Renders participant user data with NotLoaded guard
  defp participant_data(nil), do: nil
  defp participant_data(%Ecto.Association.NotLoaded{}), do: nil
  defp participant_data(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      status: user.status
    }
  end

  defp last_message_data(nil), do: nil
  defp last_message_data(%Message{} = msg) do
    %{
      id: msg.id,
      content: truncate(msg.content, 100),
      sender_id: msg.sender_id,
      created_at: msg.inserted_at
    }
  end

  defp truncate(nil, _), do: nil
  defp truncate(str, max) when byte_size(str) <= max, do: str
  defp truncate(str, max) do
    String.slice(str, 0, max) <> "..."
  end
end
