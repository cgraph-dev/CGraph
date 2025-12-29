defmodule CgraphWeb.ConversationChannel do
  @moduledoc """
  Channel for 1:1 direct message conversations.
  
  Handles:
  - Real-time message delivery
  - Typing indicators
  - Read receipts
  - Presence (online status)
  """
  use CgraphWeb, :channel

  alias Cgraph.Messaging
  alias Cgraph.Presence

  @typing_timeout 3_000

  @impl true
  def join("conversation:" <> conversation_id, _params, socket) do
    user = socket.assigns.current_user

    case Messaging.get_conversation(conversation_id) do
      nil ->
        {:error, %{reason: "not_found"}}

      conversation ->
        if Messaging.user_in_conversation?(user.id, conversation) do
          send(self(), :after_join)
          {:ok, assign(socket, :conversation_id, conversation_id)}
        else
          {:error, %{reason: "unauthorized"}}
        end
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user
    conversation_id = socket.assigns.conversation_id

    # Track presence
    {:ok, _} = Presence.track(socket, user.id, %{
      online_at: DateTime.utc_now(),
      typing: false
    })

    # Send current presence state
    push(socket, "presence_state", Presence.list(socket))

    # Send recent messages
    messages = Messaging.list_messages(conversation_id, limit: 50)
    push(socket, "message_history", %{messages: messages})

    {:noreply, socket}
  end

  @impl true
  def handle_info({:clear_typing, user_id}, socket) do
    if socket.assigns.current_user.id == user_id do
      Presence.update(socket, user_id, fn meta ->
        Map.put(meta, :typing, false)
      end)
    end
    {:noreply, socket}
  end

  @impl true
  def handle_in("new_message", %{"content" => content} = params, socket) do
    user = socket.assigns.current_user
    conversation_id = socket.assigns.conversation_id

    case Messaging.create_message(%{
      content: content,
      sender_id: user.id,
      conversation_id: conversation_id,
      content_type: Map.get(params, "content_type", "text"),
      reply_to_id: Map.get(params, "reply_to_id"),
      is_encrypted: Map.get(params, "is_encrypted", false)
    }) do
      {:ok, message} ->
        broadcast!(socket, "new_message", %{
          message: message,
          sender: %{id: user.id, username: user.username, avatar_url: user.avatar_url}
        })
        {:reply, {:ok, %{message_id: message.id}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  @impl true
  def handle_in("typing", %{"typing" => is_typing}, socket) do
    user = socket.assigns.current_user

    # Update presence with typing status
    Presence.update(socket, user.id, fn meta ->
      Map.put(meta, :typing, is_typing)
    end)

    # Broadcast typing indicator
    broadcast_from!(socket, "user_typing", %{
      user_id: user.id,
      username: user.username,
      typing: is_typing
    })

    # Auto-clear typing after timeout
    if is_typing do
      Process.send_after(self(), {:clear_typing, user.id}, @typing_timeout)
    end

    {:noreply, socket}
  end

  @impl true
  def handle_in("mark_read", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user
    _conversation_id = socket.assigns.conversation_id

    case Messaging.mark_message_read(message_id, user.id) do
      {:ok, _receipt} ->
        broadcast_from!(socket, "message_read", %{
          user_id: user.id,
          message_id: message_id
        })
        {:reply, :ok, socket}

      {:error, _reason} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  @impl true
  def handle_in("add_reaction", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user = socket.assigns.current_user

    case Messaging.add_reaction(message_id, user.id, emoji) do
      {:ok, _reaction} ->
        broadcast!(socket, "reaction_added", %{
          message_id: message_id,
          user_id: user.id,
          emoji: emoji
        })
        {:reply, :ok, socket}

      {:error, _reason} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  @impl true
  def handle_in("remove_reaction", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user = socket.assigns.current_user

    case Messaging.remove_reaction(message_id, user.id, emoji) do
      :ok ->
        broadcast!(socket, "reaction_removed", %{
          message_id: message_id,
          user_id: user.id,
          emoji: emoji
        })
        {:reply, :ok, socket}

      {:error, _reason} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
