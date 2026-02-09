defmodule CGraphWeb.GroupChannel do
  @moduledoc """
  Channel for group/channel messaging (Discord-style).

  Handles:
  - Channel messages
  - Typing indicators
  - Presence tracking
  - Role-based permissions
  - Rate limiting to prevent spam
  """
  use CGraphWeb, :channel

  alias CGraph.Groups
  alias CGraph.Messaging
  alias CGraph.Presence
  alias CGraphWeb.API.V1.MessageJSON

  # Rate limiting: max 10 messages per 10 seconds per user
  @rate_limit_window_ms 10_000
  @rate_limit_max_messages 10

  @impl true
  def join("group:" <> channel_id, _params, socket) do
    user = socket.assigns.current_user

    with {:ok, channel} <- Groups.get_channel(channel_id),
         {:ok, member} <- get_channel_member(channel, user.id),
         :ok <- verify_channel_access(member, channel) do
      socket = socket
        |> assign(:channel_id, channel_id)
        |> assign(:group_id, channel.group_id)
        |> assign(:member, member)
        |> assign(:rate_limit_messages, [])
      send(self(), :after_join)
      {:ok, socket}
    else
      {:error, :not_found} -> {:error, %{reason: "not_found"}}
      {:error, :not_member} -> {:error, %{reason: "unauthorized"}}
      {:error, :no_access} -> {:error, %{reason: "no_access"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user
    channel_id = socket.assigns.channel_id

    # Track presence in channel
    {:ok, _} = Presence.track(socket, user.id, %{
      online_at: DateTime.utc_now(),
      typing: false
    })

    push(socket, "presence_state", Presence.list(socket))

    # Send recent messages with proper serialization
    {messages, _total} = Groups.list_channel_messages(channel_id, limit: 50)
    serialized_messages = Enum.map(messages, &MessageJSON.message_data/1)
    push(socket, "message_history", %{messages: serialized_messages})

    {:noreply, socket}
  end

  # ============================================================================
  # handle_in/3 Callbacks - All grouped together
  # ============================================================================

  @impl true
  def handle_in("new_message", %{"content" => content} = params, socket) do
    user = socket.assigns.current_user
    channel_id = socket.assigns.channel_id
    member = socket.assigns.member

    with {:ok, socket} <- check_rate_limit(socket),
         :ok <- verify_send_permission(member) do
      handle_message_creation(socket, user, channel_id, member, params, content)
    else
      {:error, :rate_limited, socket} ->
        {:reply, {:error, %{reason: "rate_limited", message: "Too many messages. Please slow down."}}, socket}
      {:error, :no_permission} ->
        {:reply, {:error, %{reason: "no_permission"}}, socket}
    end
  end

  @impl true
  def handle_in("typing", params, socket) do
    user = socket.assigns.current_user
    member = socket.assigns.member

    # Support both payload formats: {"typing": bool} (old) and {"is_typing": bool} (web/mobile)
    is_typing = case params do
      %{"typing" => val} -> val
      %{"is_typing" => val} -> val
      _ -> false
    end

    # Current timestamp for typing indicator
    typing_started_at = if is_typing, do: DateTime.utc_now(), else: nil

    Presence.update(socket, user.id, fn meta ->
      meta
      |> Map.put(:typing, is_typing)
      |> Map.put(:typing_started_at, typing_started_at)
    end)

    # Broadcast typing indicator with timestamp
    broadcast_from!(socket, "typing", %{
      user_id: user.id,
      username: user.username,
      nickname: member.nickname,
      is_typing: is_typing,
      typing: is_typing,
      started_at: typing_started_at && DateTime.to_iso8601(typing_started_at)
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("delete_message", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user
    member = socket.assigns.member

    with {:ok, message} <- Messaging.get_message(message_id),
         :ok <- verify_delete_permission(message, user, member) do
      execute_message_deletion(socket, message, message_id)
    else
      {:error, :not_found} -> {:reply, {:error, %{reason: "not_found"}}, socket}
      {:error, :no_permission} -> {:reply, {:error, %{reason: "no_permission"}}, socket}
    end
  end

  @impl true
  def handle_in("pin_message", %{"message_id" => message_id}, socket) do
    member = socket.assigns.member

    if Groups.can_manage_messages?(member) do
      case Groups.pin_message(message_id, socket.assigns.channel_id) do
        {:ok, _} ->
          broadcast!(socket, "message_pinned", %{message_id: message_id})
          {:reply, :ok, socket}

        {:error, reason} ->
          {:reply, {:error, %{reason: reason}}, socket}
      end
    else
      {:reply, {:error, %{reason: "no_permission"}}, socket}
    end
  end

  # ============================================================================
  # Private Helper Functions
  # ============================================================================

  defp get_channel_member(channel, user_id) do
    case Groups.get_member_by_user(channel.group, user_id) do
      nil -> {:error, :not_member}
      member -> {:ok, member}
    end
  end

  defp verify_channel_access(member, channel) do
    if Groups.can_view_channel?(member, channel), do: :ok, else: {:error, :no_access}
  end

  defp verify_send_permission(member) do
    if Groups.can_send_messages?(member), do: :ok, else: {:error, :no_permission}
  end

  defp verify_delete_permission(message, user, member) do
    can_delete = message.sender_id == user.id or Groups.can_manage_messages?(member)
    if can_delete, do: :ok, else: {:error, :no_permission}
  end

  defp handle_message_creation(socket, user, channel_id, member, params, content) do
    message_attrs = %{
      content: content,
      sender_id: user.id,
      channel_id: channel_id,
      content_type: Map.get(params, "content_type", "text"),
      reply_to_id: Map.get(params, "reply_to_id"),
      # File attachment fields
      file_url: Map.get(params, "file_url"),
      file_name: Map.get(params, "file_name"),
      file_size: Map.get(params, "file_size"),
      file_mime_type: Map.get(params, "file_mime_type"),
      thumbnail_url: Map.get(params, "thumbnail_url")
    }

    case Messaging.create_message(message_attrs) do
      {:ok, message} ->
        message = CGraph.Repo.preload(message, [[sender: :customization], :reactions, :reply_to])
        serialized = message |> MessageJSON.message_data() |> Map.put(:senderNickname, member.nickname)
        broadcast!(socket, "new_message", %{message: serialized})
        {:reply, {:ok, %{message_id: message.id}}, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  defp execute_message_deletion(socket, message, message_id) do
    case Messaging.delete_message(message, for_everyone: true) do
      {:ok, _} ->
        broadcast!(socket, "message_deleted", %{message_id: message_id})
        {:reply, :ok, socket}
      {:error, _} ->
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
