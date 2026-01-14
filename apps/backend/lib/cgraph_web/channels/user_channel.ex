defmodule CGraphWeb.UserChannel do
  @moduledoc """
  Per-user private channel for targeted notifications and state sync.

  Each user joins their own private channel (user:{user_id}) to receive:
  - Direct presence updates for their contacts
  - Push notification fallbacks when app backgrounded
  - Account state changes (settings, profile updates)
  - Friend request notifications
  - Message previews for notification display

  This complements the PresenceChannel:
  - PresenceChannel = global broadcast for online status
  - UserChannel = private delivery for user-specific events
  """
  use CGraphWeb, :channel

  alias CGraph.Accounts
  alias CGraph.Presence

  @max_contact_batch 200

  @impl true
  def join("user:" <> requested_user_id, params, socket) do
    user = socket.assigns.current_user

    cond do
      is_nil(user) ->
        {:error, %{reason: "authentication_required"}}

      to_string(user.id) != requested_user_id ->
        {:error, %{reason: "unauthorized"}}

      true ->
        send(self(), {:after_join, params})
        {:ok, socket}
    end
  end

  @impl true
  def handle_info({:after_join, params}, socket) do
    user = socket.assigns.current_user

    # Subscribe to user-specific pubsub topics
    Phoenix.PubSub.subscribe(CGraph.PubSub, "user:#{user.id}:notifications")
    Phoenix.PubSub.subscribe(CGraph.PubSub, "user:#{user.id}:presence_updates")

    # If client requested initial contact presence, send it
    if params["include_contact_presence"] do
      spawn_link(fn ->
        contact_presence = fetch_contact_presence(user.id)
        Phoenix.Channel.push(socket, "contact_presence", %{contacts: contact_presence})
      end)
    end

    {:noreply, socket}
  end

  @impl true
  def handle_info({:notification, payload}, socket) do
    push(socket, "notification", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:presence_update, user_id, status_data}, socket) do
    push(socket, "contact_status_changed", %{
      user_id: user_id,
      online: status_data[:online],
      status: status_data[:status],
      last_seen: status_data[:last_seen]
    })
    {:noreply, socket}
  end

  @impl true
  def handle_info({:friend_request, from_user_id, request_data}, socket) do
    push(socket, "friend_request", %{
      from_user_id: from_user_id,
      request_id: request_data[:id],
      from_username: request_data[:username],
      from_display_name: request_data[:display_name],
      from_avatar_url: request_data[:avatar_url],
      created_at: request_data[:created_at]
    })
    {:noreply, socket}
  end

  @impl true
  def handle_info({:message_preview, conversation_id, message_data}, socket) do
    # Used for notification display when app backgrounded
    push(socket, "message_preview", %{
      conversation_id: conversation_id,
      sender_id: message_data[:sender_id],
      sender_name: message_data[:sender_name],
      content_preview: truncate_content(message_data[:content], 100),
      message_type: message_data[:type],
      sent_at: message_data[:sent_at]
    })
    {:noreply, socket}
  end

  @impl true
  def handle_in("get_contact_presence", _params, socket) do
    user = socket.assigns.current_user
    contact_presence = fetch_contact_presence(user.id)
    {:reply, {:ok, %{contacts: contact_presence}}, socket}
  end

  @impl true
  def handle_in("subscribe_to_user", %{"user_id" => target_user_id}, socket) do
    user = socket.assigns.current_user

    # Verify target is a friend/contact before allowing subscription
    if can_view_presence?(user.id, target_user_id) do
      Phoenix.PubSub.subscribe(CGraph.PubSub, "user:#{target_user_id}:status")

      # Send immediate status
      status = get_user_status(target_user_id)
      {:reply, {:ok, status}, socket}
    else
      {:reply, {:error, %{reason: "not_allowed"}}, socket}
    end
  end

  @impl true
  def handle_in("unsubscribe_from_user", %{"user_id" => target_user_id}, socket) do
    Phoenix.PubSub.unsubscribe(CGraph.PubSub, "user:#{target_user_id}:status")
    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("update_push_token", %{"token" => token, "platform" => platform}, socket) do
    user = socket.assigns.current_user

    case Accounts.register_push_token(user, token, platform) do
      {:ok, _} -> {:reply, :ok, socket}
      {:error, _} -> {:reply, {:error, %{reason: "save_failed"}}, socket}
    end
  end

  @impl true
  def handle_in("mark_notifications_read", %{"notification_ids" => ids}, socket) when is_list(ids) do
    # Mark notifications as read
    _updated = Enum.each(ids, fn id ->
      try do
        CGraph.Notifications.mark_as_read(id)
      rescue
        _ -> :ok
      end
    end)

    {:reply, :ok, socket}
  end

  def handle_in("mark_notifications_read", _params, socket) do
    {:reply, {:error, %{reason: "notification_ids_required"}}, socket}
  end

  # Private helpers

  defp fetch_contact_presence(user_id) do
    # Get user's friends/contacts
    contact_ids = get_contact_ids(user_id)
    |> Enum.take(@max_contact_batch)

    # Bulk fetch presence status
    Presence.bulk_status(contact_ids)
    |> Enum.map(fn {contact_id, status} ->
      enriched = if status[:online] do
        status
      else
        last_seen = Presence.last_seen(contact_id)
        Map.put(status, :last_seen, last_seen && DateTime.to_iso8601(last_seen))
      end

      {contact_id, enriched}
    end)
    |> Map.new()
  end

  defp get_contact_ids(user_id) do
    # Query conversations for unique participant IDs
    # The Relationships module is not implemented yet
    import Ecto.Query

    try do
      alias CGraph.Messaging.ConversationParticipant
      alias CGraph.Repo

      # Get all conversations the user is in
      conversation_ids = ConversationParticipant
        |> where([cp], cp.user_id == ^user_id)
        |> select([cp], cp.conversation_id)
        |> Repo.all()

      # Get all other participants in those conversations
      ConversationParticipant
        |> where([cp], cp.conversation_id in ^conversation_ids)
        |> where([cp], cp.user_id != ^user_id)
        |> select([cp], cp.user_id)
        |> distinct(true)
        |> Repo.all()
    rescue
      _ -> []
    end
  end

  defp get_user_status(user_id) do
    case Presence.user_online?(user_id) do
      true ->
        # get_user_presence/1 returns already merged presence
        merged = Presence.get_user_presence(user_id) || %{}

        %{
          online: true,
          status: merged[:status] || "online",
          status_message: merged[:status_message],
          last_active: merged[:last_active]
        }

      false ->
        last_seen = Presence.last_seen(user_id)
        %{
          online: false,
          status: "offline",
          last_seen: last_seen && DateTime.to_iso8601(last_seen)
        }
    end
  end

  defp can_view_presence?(viewer_id, target_id) do
    # Check if users share a conversation together
    import Ecto.Query

    try do
      alias CGraph.Messaging.ConversationParticipant
      alias CGraph.Repo

      # Get conversations viewer is in
      viewer_conversations = ConversationParticipant
        |> where([cp], cp.user_id == ^viewer_id)
        |> select([cp], cp.conversation_id)
        |> Repo.all()
        |> MapSet.new()

      # Check if target is in any of those conversations
      target_in_shared = ConversationParticipant
        |> where([cp], cp.user_id == ^target_id)
        |> where([cp], cp.conversation_id in ^MapSet.to_list(viewer_conversations))
        |> Repo.exists?()

      target_in_shared
    rescue
      error ->
        require Logger
        Logger.warning("Presence authorization check failed: #{inspect(error)}")
        false
    end
  end

  defp truncate_content(nil, _max_length), do: nil
  defp truncate_content(content, max_length) when byte_size(content) <= max_length, do: content
  defp truncate_content(content, max_length) do
    String.slice(content, 0, max_length - 3) <> "..."
  end
end
