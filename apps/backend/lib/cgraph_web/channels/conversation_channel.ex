defmodule CGraphWeb.ConversationChannel do
  @moduledoc """
  Channel for 1:1 direct message conversations.

  Handles:
  - Real-time message delivery
  - Typing indicators
  - Read receipts
  - Presence (online status)
  - Rate limiting to prevent spam
  """
  use CGraphWeb, :channel

  alias CGraph.Messaging
  alias CGraph.Messaging.DeliveryTracking
  alias CGraph.Presence
  alias CGraphWeb.API.V1.MessageJSON
  alias CGraphWeb.Channels.Backpressure

  @typing_timeout 5_000

  # Rate limiting: max 10 messages per 10 seconds per user
  @rate_limit_window_ms 10_000
  @rate_limit_max_messages 10

  @impl true
  def join("conversation:" <> conversation_id, _params, socket) do
    user = socket.assigns.current_user

    case Messaging.get_conversation(conversation_id) do
      {:error, :not_found} ->
        {:error, %{reason: "not_found"}}

      {:ok, _conversation} ->
        if Messaging.user_in_conversation?(conversation_id, user.id) do
          send(self(), :after_join)
          socket = socket
            |> assign(:conversation_id, conversation_id)
            |> assign(:rate_limit_messages, [])  # Initialize rate limit tracking
          {:ok, socket}
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

    # Send recent messages (fetch the conversation struct first)
    case Messaging.get_conversation(conversation_id) do
      {:ok, conversation} ->
        {messages, _meta} = Messaging.list_messages(conversation, per_page: 50)
        serialized_messages = Enum.map(messages, &MessageJSON.message_data/1)
        push(socket, "message_history", %{messages: serialized_messages})
      _ ->
        push(socket, "message_history", %{messages: []})
    end

    {:noreply, socket}
  end

  @impl true
  def handle_info({:clear_typing, user_id}, socket) do
    user = socket.assigns.current_user

    if user.id == user_id do
      # Update presence to clear typing status
      Presence.update(socket, user_id, fn meta ->
        meta
        |> Map.put(:typing, false)
        |> Map.put(:typing_started_at, nil)
      end)

      # Broadcast typing stopped to other clients
      broadcast_from!(socket, "typing", %{
        user_id: user_id,
        username: user.username,
        is_typing: false,
        typing: false,
        started_at: nil
      })
    end
    {:noreply, socket}
  end

  @impl true
  def handle_in("new_message", %{"content" => content} = params, socket) do
    user = socket.assigns.current_user
    conversation_id = socket.assigns.conversation_id

    # Check rate limit first
    case check_rate_limit(socket) do
      {:error, :rate_limited, socket} ->
        {:reply, {:error, %{reason: "rate_limited", message: "Too many messages. Please slow down."}}, socket}

      {:ok, socket} ->
        case Messaging.create_message(%{
          content: content,
          sender_id: user.id,
          conversation_id: conversation_id,
          content_type: Map.get(params, "content_type", "text"),
          reply_to_id: Map.get(params, "reply_to_id"),
          is_encrypted: Map.get(params, "is_encrypted", false),
          # File attachment fields
          file_url: Map.get(params, "file_url"),
          file_name: Map.get(params, "file_name"),
          file_size: Map.get(params, "file_size"),
          file_mime_type: Map.get(params, "file_mime_type"),
          thumbnail_url: Map.get(params, "thumbnail_url")
        }) do
          {:ok, message} ->
            # Preload sender for serialization (including reply_to sender)
            message = CGraph.Repo.preload(message, [[sender: :customization], :reactions, [reply_to: [sender: :customization]]])
            serialized = MessageJSON.message_data(message)

            broadcast!(socket, "new_message", %{message: serialized})
            {:reply, {:ok, %{message_id: message.id}}, socket}

          {:error, changeset} ->
            {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
        end
    end
  end

  @impl true
  def handle_in("typing", params, socket) do
    # Drop typing events for degraded connections (Discord backpressure pattern)
    if Backpressure.should_drop?("typing", socket) do
      {:noreply, socket}
    else
      user = socket.assigns.current_user

    # Support both payload formats: {"typing": bool} (old) and {"is_typing": bool} (web/mobile)
    is_typing = case params do
      %{"typing" => val} -> val
      %{"is_typing" => val} -> val
      _ -> false
    end

    # Current timestamp for typing indicator
    typing_started_at = if is_typing, do: DateTime.utc_now(), else: nil

    # Update presence with typing status and timestamp
    Presence.update(socket, user.id, fn meta ->
      meta
      |> Map.put(:typing, is_typing)
      |> Map.put(:typing_started_at, typing_started_at)
    end)

    # Broadcast typing indicator with timestamp
    # Include both key formats for backward compatibility
    broadcast_from!(socket, "typing", %{
      user_id: user.id,
      username: user.username,
      is_typing: is_typing,
      typing: is_typing,
      started_at: typing_started_at && DateTime.to_iso8601(typing_started_at)
    })

    # Auto-clear typing after timeout
    if is_typing do
      Process.send_after(self(), {:clear_typing, user.id}, @typing_timeout)
    end

    {:noreply, socket}
    end
  end

  # WhatsApp-style message delivery acknowledgment
  # Client sends this when a message has been displayed on their device
  @impl true
  def handle_in("msg_ack", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user
    platform = socket.assigns[:platform] || "web"
    device_id = socket.assigns[:device_id]

    # Mark message as delivered (single-check → double-check)
    DeliveryTracking.mark_delivered(message_id, user.id, %{
      platform: platform,
      device_id: device_id
    })

    # Notify sender that their message was delivered
    broadcast_from!(socket, "msg_delivered", %{
      message_id: message_id,
      user_id: user.id,
      delivered_at: DateTime.utc_now() |> DateTime.to_iso8601()
    })

    # Reset backpressure counter on client ACK
    socket = Backpressure.reset(socket)

    {:reply, :ok, socket}
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
  def handle_in("edit_message", %{"message_id" => message_id, "content" => content}, socket) do
    user = socket.assigns.current_user

    case Messaging.edit_message(message_id, user.id, content) do
      {:ok, message} ->
        message = CGraph.Repo.preload(message, [[sender: :customization], :reactions, :reply_to])
        serialized = MessageJSON.message_data(message)
        broadcast!(socket, "message_updated", %{message: serialized})
        {:reply, {:ok, %{message_id: message.id}}, socket}

      {:error, reason} when is_atom(reason) ->
        {:reply, {:error, %{reason: to_string(reason)}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  @impl true
  def handle_in("delete_message", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user

    case Messaging.delete_message(message_id, user.id) do
      {:ok, _message} ->
        broadcast!(socket, "message_deleted", %{
          message_id: message_id,
          deleted_by: user.id
        })
        {:reply, :ok, socket}

      {:error, reason} when is_atom(reason) ->
        {:reply, {:error, %{reason: to_string(reason)}}, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  @impl true
  def handle_in("pin_message", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user

    case Messaging.pin_message(message_id, user.id) do
      {:ok, message} ->
        message = CGraph.Repo.preload(message, [[sender: :customization], :reactions, :reply_to])
        serialized = MessageJSON.message_data(message)
        broadcast!(socket, "message_pinned", %{message: serialized})
        {:reply, {:ok, %{message_id: message.id}}, socket}

      {:error, reason} when is_atom(reason) ->
        {:reply, {:error, %{reason: to_string(reason)}}, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  @impl true
  def handle_in("unpin_message", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user

    case Messaging.unpin_message(message_id, user.id) do
      {:ok, message} ->
        broadcast!(socket, "message_unpinned", %{message_id: message.id})
        {:reply, {:ok, %{message_id: message.id}}, socket}

      {:error, reason} when is_atom(reason) ->
        {:reply, {:error, %{reason: to_string(reason)}}, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  @impl true
  def handle_in("add_reaction", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user = socket.assigns.current_user
    conversation_id = socket.assigns.conversation_id

    with {:ok, message} <- Messaging.get_message(message_id),
         {:ok, _conversation} <- Messaging.get_conversation(conversation_id),
         {:ok, _reaction, _replaced} <- Messaging.add_reaction(user, message, emoji) do
      broadcast!(socket, "reaction_added", %{
        message_id: message_id,
        user_id: user.id,
        emoji: emoji,
        user: %{
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        }
      })
      {:reply, :ok, socket}
    else
      {:error, :already_exists} ->
        {:reply, {:error, %{reason: "already_exists"}}, socket}
      {:error, _reason} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  @impl true
  def handle_in("remove_reaction", %{"message_id" => message_id, "emoji" => emoji}, socket) do
    user = socket.assigns.current_user

    with {:ok, message} <- Messaging.get_message(message_id),
         {:ok, _} <- Messaging.remove_reaction(user, message, emoji) do
      broadcast!(socket, "reaction_removed", %{
        message_id: message_id,
        user_id: user.id,
        emoji: emoji
      })
      {:reply, :ok, socket}
    else
      {:error, _reason} ->
        {:reply, {:error, %{reason: "failed"}}, socket}
    end
  end

  # Catch-all for unhandled events — prevents FunctionClauseError crashes
  def handle_in(event, _payload, socket) do
    require Logger
    Logger.warning("Unhandled conversation channel event: #{event}")
    {:reply, {:error, %{reason: "unhandled_event"}}, socket}
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  # Rate limiting: sliding window implementation
  # Tracks message timestamps and enforces max messages per window
  defp check_rate_limit(socket) do
    now = System.monotonic_time(:millisecond)
    window_start = now - @rate_limit_window_ms

    # Get recent message timestamps, filter out old ones
    recent_messages = socket.assigns[:rate_limit_messages] || []
    recent_messages = Enum.filter(recent_messages, fn ts -> ts > window_start end)

    if length(recent_messages) >= @rate_limit_max_messages do
      # Rate limited
      {:error, :rate_limited, assign(socket, :rate_limit_messages, recent_messages)}
    else
      # Add current timestamp and allow message
      updated_messages = [now | recent_messages]
      {:ok, assign(socket, :rate_limit_messages, updated_messages)}
    end
  end
end
