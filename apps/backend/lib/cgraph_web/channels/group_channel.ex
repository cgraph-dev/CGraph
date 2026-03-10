defmodule CGraphWeb.GroupChannel do
  @moduledoc """
  Channel for group/channel messaging.

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
  alias CGraph.Messaging.DeliveryTracking
  alias CGraph.Presence
  alias CGraphWeb.API.V1.MessageJSON
  alias CGraphWeb.Channels.Backpressure

  # Rate limiting: max 10 messages per 10 seconds per user
  @rate_limit_window_ms 10_000
  @rate_limit_max_messages 10

  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("group:" <> channel_id, _params, socket) do
    user = socket.assigns.current_user

    with {:ok, channel} <- Groups.get_channel(channel_id),
         {:ok, group} <- Groups.get_group(channel.group_id),
         {:ok, member} <- get_channel_member(channel, user.id),
         :ok <- verify_channel_access(member, group, channel) do
      socket = socket
        |> assign(:channel_id, channel_id)
        |> assign(:group_id, channel.group_id)
        |> assign(:channel, channel)
        |> assign(:group, group)
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
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
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

    # Push E2EE session keys for this user in this group
    e2ee_keys = CGraph.Crypto.E2EE.GroupKeyDistribution.get_session_keys(
      socket.assigns.group_id, user.id
    )
    if e2ee_keys != [] do
      push(socket, "e2ee_session_keys", %{keys: e2ee_keys})
    end

    {:noreply, socket}
  end

  # ============================================================================
  # handle_in/3 Callbacks - All grouped together
  # ============================================================================

  @impl true
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}
  def handle_in("new_message", %{"content" => content} = params, socket) do
    user = socket.assigns.current_user
    channel_id = socket.assigns.channel_id
    member = socket.assigns.member
    group = socket.assigns.group
    channel = socket.assigns.channel

    with {:ok, socket} <- check_rate_limit(socket),
         :ok <- verify_send_permission(member, group, channel),
         :ok <- check_automod_rules(group, channel, member, content) do
      handle_message_creation(socket, user, channel_id, member, params, content)
    else
      {:error, :rate_limited, socket} ->
        {:reply, {:error, %{reason: "rate_limited", message: "Too many messages. Please slow down."}}, socket}
      {:error, :no_permission} ->
        {:reply, {:error, %{reason: "no_permission"}}, socket}
      {:error, :automod_blocked, action_result} ->
        handle_automod_action(action_result, socket)
    end
  end

  @impl true
  def handle_in("typing", params, socket) do
    # Drop typing events for degraded connections (backpressure pattern)
    if Backpressure.should_drop?("typing", socket) do
      {:noreply, socket}
    else
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
  end

  # Message delivery acknowledgment for group messages
  @impl true
  def handle_in("msg_ack", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user
    platform = socket.assigns[:platform] || "web"
    device_id = socket.assigns[:device_id]

    DeliveryTracking.mark_delivered(message_id, user.id, %{
      platform: platform,
      device_id: device_id
    })

    # Reset backpressure counter on client ACK
    socket = Backpressure.reset(socket)
    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("edit_message", %{"message_id" => message_id, "content" => content}, socket) do
    user = socket.assigns.current_user

    case Messaging.edit_message(message_id, user.id, content) do
      {:ok, message} ->
        message = CGraph.Repo.preload(message, [[sender: :customization], :reactions, :reply_to, :edits])
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
    member = socket.assigns.member
    group = socket.assigns.group
    channel = socket.assigns.channel

    with {:ok, message} <- Messaging.get_message(message_id),
         :ok <- verify_delete_permission(message, user, member, group, channel) do
      execute_message_deletion(socket, message, message_id)
    else
      {:error, :not_found} -> {:reply, {:error, %{reason: "not_found"}}, socket}
      {:error, :no_permission} -> {:reply, {:error, %{reason: "no_permission"}}, socket}
    end
  end

  @impl true
  def handle_in("pin_message", %{"message_id" => message_id}, socket) do
    member = socket.assigns.member
    group = socket.assigns.group
    channel = socket.assigns.channel

    if Groups.has_effective_permission?(member, group, channel, :manage_messages) do
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

  # E2EE: Register sender key for this group
  @impl true
  def handle_in("register_sender_key", %{"device_id" => device_id, "public_sender_key" => key_b64}, socket) do
    user = socket.assigns.current_user
    group_id = socket.assigns.group_id
    public_key = Base.decode64!(key_b64)

    case CGraph.Crypto.E2EE.GroupKeyDistribution.register_sender_key(group_id, user.id, device_id, public_key) do
      {:ok, session} ->
        {:reply, {:ok, %{session_id: session.id, sender_key_id: session.sender_key_id}}, socket}
      {:error, _} ->
        {:reply, {:error, %{reason: "registration_failed"}}, socket}
    end
  end

  # E2EE: Distribute encrypted sender key to a recipient
  @impl true
  def handle_in("distribute_sender_key", %{"session_id" => session_id, "recipient_user_id" => recipient_user_id, "recipient_device_id" => recipient_device_id, "encrypted_sender_key" => encrypted_key_b64}, socket) do
    encrypted_key = Base.decode64!(encrypted_key_b64)

    case CGraph.Crypto.E2EE.GroupKeyDistribution.distribute_key(session_id, recipient_user_id, recipient_device_id, encrypted_key) do
      {:ok, _dist} -> {:reply, :ok, socket}
      {:error, _} -> {:reply, {:error, %{reason: "distribution_failed"}}, socket}
    end
  end

  # E2EE: Request key distribution — ask existing members to share their keys
  @impl true
  def handle_in("request_key_distribution", _params, socket) do
    user = socket.assigns.current_user
    group_id = socket.assigns.group_id

    members_keys = CGraph.Crypto.E2EE.GroupKeyDistribution.get_group_members_keys(group_id)
    # Broadcast to all group members asking them to distribute their keys to this new member
    broadcast_from!(socket, "key_distribution_request", %{
      requesting_user_id: user.id,
      requesting_device_id: socket.assigns[:device_id] || "default"
    })

    {:reply, {:ok, %{existing_members: length(members_keys)}}, socket}
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

  defp verify_channel_access(member, group, channel) do
    if Groups.has_effective_permission?(member, group, channel, :view_channels), do: :ok, else: {:error, :no_access}
  end

  defp verify_send_permission(member, group, channel) do
    if Groups.has_effective_permission?(member, group, channel, :send_messages), do: :ok, else: {:error, :no_permission}
  end

  defp verify_delete_permission(message, user, member, group, channel) do
    can_delete = message.sender_id == user.id or Groups.has_effective_permission?(member, group, channel, :manage_messages)
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

  # Automod: check message against enabled rules, bypass for administrators
  defp check_automod_rules(group, _channel, member, content) do
    # Administrators bypass automod entirely
    if Groups.has_effective_permission?(member, group, nil, :administrator) do
      :ok
    else
      case Groups.check_automod(group.id, content, member.user_id) do
        :ok ->
          :ok
        {:blocked, rule} ->
          action_result = CGraph.Groups.Automod.Enforcement.execute_action(rule, content, member, nil)
          {:error, :automod_blocked, action_result}
      end
    end
  end

  # Handle automod action results
  defp handle_automod_action({:delete, info}, socket) do
    {:reply, {:error, %{reason: "automod_blocked", message: "Message removed by automod", rule: info.rule_name}}, socket}
  end

  defp handle_automod_action({:warn, info}, socket) do
    # Allow message through but push a warning to sender
    push(socket, "automod_warning", %{message: info.warning, rule: info.rule_name})
    # Return ok to let the message proceed — caller should continue
    {:reply, {:ok, %{warning: info.warning}}, socket}
  end

  defp handle_automod_action({:mute, info}, socket) do
    {:reply, {:error, %{reason: "automod_muted", message: "You have been muted by automod", until: DateTime.to_iso8601(info.mute_until)}}, socket}
  end

  defp handle_automod_action({:flag, info}, socket) do
    # Flag for review — allow message but create a report
    # The report is created asynchronously
    Task.start(fn ->
      CGraph.Moderation.Reports.create_report(%{
        target_type: "message",
        target_id: socket.assigns.channel_id,
        category: "automod_flag",
        description: info.description,
        reporter_id: nil
      })
    end)
    # Message still goes through — return a special ok so the caller continues
    {:reply, {:ok, %{flagged: true}}, socket}
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
