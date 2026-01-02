defmodule CgraphWeb.GroupChannel do
  @moduledoc """
  Channel for group/channel messaging (Discord-style).
  
  Handles:
  - Channel messages
  - Typing indicators
  - Presence tracking
  - Role-based permissions
  """
  use CgraphWeb, :channel

  alias Cgraph.Groups
  alias Cgraph.Messaging
  alias Cgraph.Presence

  @impl true
  def join("group:" <> channel_id, _params, socket) do
    user = socket.assigns.current_user

    case Groups.get_channel(channel_id) do
      {:error, :not_found} ->
        {:error, %{reason: "not_found"}}

      {:ok, channel} ->
        # get_member_by_user returns member or nil
        case Groups.get_member_by_user(channel.group, user.id) do
          nil ->
            {:error, %{reason: "unauthorized"}}

          member ->
            if Groups.can_view_channel?(member, channel) do
              send(self(), :after_join)
              socket = socket
              |> assign(:channel_id, channel_id)
              |> assign(:group_id, channel.group_id)
              |> assign(:member, member)
              {:ok, socket}
            else
              {:error, %{reason: "no_access"}}
            end
        end
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

    # Send recent messages
    {messages, _total} = Groups.list_channel_messages(channel_id, limit: 50)
    push(socket, "message_history", %{messages: messages})

    {:noreply, socket}
  end

  @impl true
  def handle_in("new_message", %{"content" => content} = params, socket) do
    user = socket.assigns.current_user
    channel_id = socket.assigns.channel_id
    member = socket.assigns.member

    # Check permissions
    unless Groups.can_send_messages?(member) do
      {:reply, {:error, %{reason: "no_permission"}}, socket}
    else
      case Messaging.create_message(%{
        content: content,
        sender_id: user.id,
        channel_id: channel_id,
        content_type: Map.get(params, "content_type", "text"),
        reply_to_id: Map.get(params, "reply_to_id")
      }) do
        {:ok, message} ->
          broadcast!(socket, "new_message", %{
            message: message,
            sender: %{
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url,
              nickname: member.nickname
            }
          })
          {:reply, {:ok, %{message_id: message.id}}, socket}

        {:error, changeset} ->
          {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
      end
    end
  end

  @impl true
  def handle_in("typing", %{"typing" => is_typing}, socket) do
    user = socket.assigns.current_user
    member = socket.assigns.member

    Presence.update(socket, user.id, fn meta ->
      Map.put(meta, :typing, is_typing)
    end)

    broadcast_from!(socket, "user_typing", %{
      user_id: user.id,
      username: user.username,
      nickname: member.nickname,
      typing: is_typing
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("delete_message", %{"message_id" => message_id}, socket) do
    user = socket.assigns.current_user
    member = socket.assigns.member

    case Messaging.get_message(message_id) do
      {:error, :not_found} ->
        {:reply, {:error, %{reason: "not_found"}}, socket}

      {:ok, message} ->
        can_delete = message.sender_id == user.id or Groups.can_manage_messages?(member)

        if can_delete do
          case Messaging.delete_message(message, for_everyone: true) do
            {:ok, _} ->
              broadcast!(socket, "message_deleted", %{message_id: message_id})
              {:reply, :ok, socket}

            {:error, _} ->
              {:reply, {:error, %{reason: "failed"}}, socket}
          end
        else
          {:reply, {:error, %{reason: "no_permission"}}, socket}
        end
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

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
