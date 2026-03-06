defmodule CGraphWeb.SecretChatChannel do
  @moduledoc """
  Real-time channel for secret chat message exchange.

  All messages are opaque ciphertext — the server never inspects content.
  Supports typing indicators, read receipts, and screenshot detection alerts.

  ## Events

  ### Incoming (client → server)
  - `"new_message"` — send an encrypted message
  - `"typing"` — typing indicator
  - `"message_read"` — mark message as read (triggers self-destruct)
  - `"screenshot_detected"` — alert other participant about screenshot

  ### Outgoing (server → client)
  - `"new_message"` — broadcast encrypted message to other participant
  - `"typing"` — typing indicator broadcast
  - `"message_read"` — read receipt broadcast
  - `"screenshot_alert"` — screenshot warning broadcast
  - `"timer_changed"` — self-destruct timer update
  - `"chat_terminated"` — chat was destroyed by the other participant
  """
  use CGraphWeb, :channel

  alias CGraph.Messaging.SecretChat
  alias CGraph.Messaging.SecretConversation

  # Rate limiting: max 10 messages per 10 seconds
  @rate_limit_window_ms 10_000
  @rate_limit_max_messages 10

  @impl true
  def join("secret_chat:" <> conversation_id, params, socket) do
    user = socket.assigns.current_user
    device_id = params["device_id"]

    case SecretChat.get_secret_conversation(conversation_id, user.id) do
      {:ok, %SecretConversation{status: "active"} = conversation} ->
        # Optionally verify device binding
        socket =
          socket
          |> assign(:conversation_id, conversation_id)
          |> assign(:conversation, conversation)
          |> assign(:device_id, device_id)
          |> assign(:rate_limit_messages, [])

        # Subscribe to PubSub for timer/termination events
        Phoenix.PubSub.subscribe(CGraph.PubSub, "secret_chat:#{conversation_id}")

        {:ok, socket}

      {:ok, %SecretConversation{status: status}} ->
        {:error, %{reason: "chat_#{status}"}}

      {:error, :not_found} ->
        {:error, %{reason: "not_found"}}
    end
  end

  # ============================================================================
  # Incoming Events
  # ============================================================================

  @impl true
  def handle_in("new_message", payload, socket) do
    if rate_limited?(socket) do
      {:reply, {:error, %{reason: "rate_limited"}}, socket}
    else
      user = socket.assigns.current_user
      conversation = socket.assigns.conversation

      attrs = %{
        ciphertext: decode_binary(payload["ciphertext"]),
        nonce: decode_binary(payload["nonce"]),
        ratchet_header: decode_binary(payload["ratchet_header"]),
        content_type: payload["content_type"] || "text",
        file_metadata: payload["file_metadata"]
      }

      case SecretChat.send_secret_message(conversation, user, attrs) do
        {:ok, message} ->
          broadcast_from!(socket, "new_message", %{
            id: message.id,
            sender_id: user.id,
            ciphertext: encode_binary(message.ciphertext),
            nonce: encode_binary(message.nonce),
            ratchet_header: encode_binary(message.ratchet_header),
            content_type: message.content_type,
            file_metadata: message.file_metadata,
            expires_at: message.expires_at,
            inserted_at: message.inserted_at
          })

          socket = track_message(socket)
          {:reply, {:ok, %{id: message.id, inserted_at: message.inserted_at}}, socket}

        {:error, :not_participant} ->
          {:reply, {:error, %{reason: "not_participant"}}, socket}

        {:error, :conversation_terminated} ->
          {:reply, {:error, %{reason: "chat_terminated"}}, socket}

        {:error, _reason} ->
          {:reply, {:error, %{reason: "send_failed"}}, socket}
      end
    end
  end

  def handle_in("typing", _payload, socket) do
    user = socket.assigns.current_user

    broadcast_from!(socket, "typing", %{
      user_id: user.id,
      timestamp: DateTime.utc_now()
    })

    {:noreply, socket}
  end

  def handle_in("message_read", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user

    case SecretChat.mark_secret_message_read(message_id, user.id) do
      {:ok, message} ->
        broadcast_from!(socket, "message_read", %{
          message_id: message.id,
          read_at: message.read_at,
          expires_at: message.expires_at
        })

        {:reply, :ok, socket}

      {:error, _reason} ->
        {:reply, {:error, %{reason: "read_failed"}}, socket}
    end
  end

  def handle_in("screenshot_detected", _payload, socket) do
    user = socket.assigns.current_user

    broadcast_from!(socket, "screenshot_alert", %{
      user_id: user.id,
      timestamp: DateTime.utc_now()
    })

    {:noreply, socket}
  end

  # Catch-all for unrecognized events
  def handle_in(_event, _payload, socket) do
    {:reply, {:error, %{reason: "unknown_event"}}, socket}
  end

  # ============================================================================
  # PubSub Handlers (timer/termination events from the context)
  # ============================================================================

  @impl true
  def handle_info({:timer_changed, payload}, socket) do
    push(socket, "timer_changed", payload)
    {:noreply, socket}
  end

  def handle_info({:secret_chat_terminated, payload}, socket) do
    push(socket, "chat_terminated", payload)
    {:noreply, socket}
  end

  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  # ============================================================================
  # Rate Limiting
  # ============================================================================

  defp rate_limited?(socket) do
    now = System.monotonic_time(:millisecond)
    messages = socket.assigns[:rate_limit_messages] || []
    recent = Enum.filter(messages, &(&1 > now - @rate_limit_window_ms))
    length(recent) >= @rate_limit_max_messages
  end

  defp track_message(socket) do
    now = System.monotonic_time(:millisecond)
    messages = socket.assigns[:rate_limit_messages] || []
    recent = Enum.filter(messages, &(&1 > now - @rate_limit_window_ms))
    assign(socket, :rate_limit_messages, [now | recent])
  end

  # ============================================================================
  # Binary Encoding Helpers
  # ============================================================================

  defp decode_binary(nil), do: nil
  defp decode_binary(data) when is_binary(data) do
    case Base.decode64(data) do
      {:ok, decoded} -> decoded
      :error -> data
    end
  end

  defp encode_binary(nil), do: nil
  defp encode_binary(data) when is_binary(data), do: Base.encode64(data)
end
