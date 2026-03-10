defmodule CGraphWeb.VoiceStateChannel do
  @moduledoc """
  Phoenix Channel for voice channel state events.

  Handles join/leave/mute/deafen for persistent voice channels.
  Topic format: `voice:{channel_id}`

  ## Events Handled (Incoming)

  - `"mute"` / `"unmute"` — Toggle self-mute
  - `"deafen"` / `"undeafen"` — Toggle self-deafen
  - `"video_on"` / `"video_off"` — Toggle video
  - `"leave"` — Graceful leave

  ## Events Broadcast (Outgoing)

  - `"voice_state_update"` — User voice state changed (mute/deafen/video)
  - `"voice_member_joined"` — User joined the voice channel
  - `"voice_member_left"` — User left the voice channel
  - `"presence_state"` — Initial presence state on join
  - `"presence_diff"` — Presence changes

  ## Cross-Channel Notifications

  When a user joins/leaves, broadcasts `voice_member_update` to
  `group:{group_id}` so the channel list can show live occupancy.
  """

  use CGraphWeb, :channel

  alias CGraph.Groups
  alias CGraph.WebRTC.VoiceChannelManager

  require Logger

  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, map(), Phoenix.Socket.t()} | {:error, map()}
  def join("voice:" <> channel_id, params, socket) do
    user = socket.assigns.current_user

    with {:ok, channel} <- Groups.get_channel(channel_id),
         {:ok, group} <- Groups.get_group(channel.group_id),
         {:ok, member} <- get_member(channel, user.id),
         :ok <- verify_connect_permission(member, group, channel) do
      # Join via VoiceChannelManager (auto-leaves previous channel)
      opts = [
        self_mute: Map.get(params, "muted", false),
        self_deafen: Map.get(params, "deafened", false),
        name: user.display_name || user.username
      ]

      case VoiceChannelManager.join_voice_channel(channel_id, user.id, opts) do
        {:ok, %{token: token, room_name: room_name}} ->
          socket = socket
            |> assign(:channel_id, channel_id)
            |> assign(:group_id, channel.group_id)
            |> assign(:user_id, user.id)
            |> assign(:channel, channel)

          send(self(), :after_join)

          # Broadcast to group channel that a member joined voice
          broadcast_voice_update(channel.group_id, channel_id, user, "joined")

          {:ok, %{token: token, room_name: room_name}, socket}

        {:error, reason} ->
          {:error, %{reason: to_string(reason)}}
      end
    else
      {:error, :not_found} -> {:error, %{reason: "not_found"}}
      {:error, :not_member} -> {:error, %{reason: "unauthorized"}}
      {:error, :no_connect} -> {:error, %{reason: "no_connect_permission"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    channel_id = socket.assigns.channel_id

    # Push current voice channel members as presence state
    members = VoiceChannelManager.get_voice_channel_members(channel_id)
    push(socket, "presence_state", %{members: members})

    # Broadcast that this user joined
    user = socket.assigns.current_user
    broadcast_from!(socket, "voice_member_joined", %{
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      self_mute: false,
      self_deafen: false
    })

    {:noreply, socket}
  end

  # ── Incoming Event Handlers ──────────────────────────────────────────

  @impl true
  def handle_in("mute", _params, socket) do
    update_and_broadcast_state(socket, %{self_mute: true})
  end

  @impl true
  def handle_in("unmute", _params, socket) do
    update_and_broadcast_state(socket, %{self_mute: false})
  end

  @impl true
  def handle_in("deafen", _params, socket) do
    update_and_broadcast_state(socket, %{self_deafen: true, self_mute: true})
  end

  @impl true
  def handle_in("undeafen", _params, socket) do
    update_and_broadcast_state(socket, %{self_deafen: false})
  end

  @impl true
  def handle_in("video_on", _params, socket) do
    update_and_broadcast_state(socket, %{video: true})
  end

  @impl true
  def handle_in("video_off", _params, socket) do
    update_and_broadcast_state(socket, %{video: false})
  end

  @impl true
  def handle_in("leave", _params, socket) do
    channel_id = socket.assigns.channel_id
    user = socket.assigns.current_user

    VoiceChannelManager.leave_voice_channel(channel_id, user.id)

    broadcast_from!(socket, "voice_member_left", %{
      user_id: user.id
    })

    # Notify group channel
    broadcast_voice_update(socket.assigns.group_id, channel_id, user, "left")

    {:stop, :normal, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    if channel_id = socket.assigns[:channel_id] do
      user = socket.assigns.current_user
      VoiceChannelManager.leave_voice_channel(channel_id, user.id)

      # Broadcast leave to remaining members and group
      CGraphWeb.Endpoint.broadcast("voice:#{channel_id}", "voice_member_left", %{
        user_id: user.id
      })
      broadcast_voice_update(socket.assigns[:group_id], channel_id, user, "left")
    end

    :ok
  end

  # ── Helpers ──────────────────────────────────────────────────────────

  defp update_and_broadcast_state(socket, state_changes) do
    channel_id = socket.assigns.channel_id
    user = socket.assigns.current_user

    VoiceChannelManager.update_voice_state(channel_id, user.id, state_changes)

    broadcast!(socket, "voice_state_update", Map.merge(%{
      user_id: user.id,
      channel_id: channel_id
    }, state_changes))

    {:noreply, socket}
  end

  defp broadcast_voice_update(group_id, channel_id, user, action) when is_binary(group_id) do
    members = VoiceChannelManager.get_voice_channel_members(channel_id)

    CGraphWeb.Endpoint.broadcast("group:#{channel_id}", "voice_member_update", %{
      channel_id: channel_id,
      action: action,
      user_id: user.id,
      username: user.username,
      member_count: length(members),
      members: Enum.map(members, fn m ->
        %{user_id: m.user_id, self_mute: m.self_mute, self_deafen: m.self_deafen}
      end)
    })
  end
  defp broadcast_voice_update(_, _, _, _), do: :ok

  defp get_member(channel, user_id) do
    case Groups.get_member_by_user(channel.group, user_id) do
      nil -> {:error, :not_member}
      member -> {:ok, member}
    end
  end

  defp verify_connect_permission(member, group, channel) do
    if Groups.has_effective_permission?(member, group, channel, :connect) do
      :ok
    else
      {:error, :no_connect}
    end
  end
end
