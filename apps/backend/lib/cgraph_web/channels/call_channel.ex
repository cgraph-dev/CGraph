defmodule CGraphWeb.CallChannel do
  @moduledoc """
  Phoenix Channel for WebRTC call signaling.

  ## Overview

  Handles real-time signaling for voice and video calls:

  - ICE candidate exchange
  - SDP offer/answer negotiation
  - Call lifecycle events (join, leave, end)
  - Media state updates (mute, video toggle)

  ## Client Flow

  ```
  1. Connect to socket with auth token
  2. Join "call:room_id" channel
  3. Send/receive signaling messages
  4. Establish WebRTC peer connection
  5. Stream media
  ```

  ## Events

  ### Client -> Server

  - `signal:offer` - Send SDP offer to peer
  - `signal:answer` - Send SDP answer to peer
  - `signal:ice_candidate` - Send ICE candidate to peer
  - `media:update` - Update media state (mute, video, screen)
  - `call:leave` - Leave the call
  - `call:end` - End the call for everyone

  ### Server -> Client

  - `signal:offer` - Received SDP offer
  - `signal:answer` - Received SDP answer
  - `signal:ice_candidate` - Received ICE candidate
  - `participant:joined` - New participant joined
  - `participant:left` - Participant left
  - `participant:media_updated` - Participant changed media state
  - `call:ended` - Call has ended
  - `call:error` - Error occurred

  ## Example Client Usage (TypeScript)

  ```typescript
  const socket = new Socket("/socket", { params: { token: authToken } });
  socket.connect();

  const channel = socket.channel("call:room_abc123", {
    device: "web",
    media: { audio: true, video: true }
  });

  channel.join()
    .receive("ok", (resp) => {
      console.log("Joined call", resp);
      setupPeerConnections(resp.participants);
    })
    .receive("error", (resp) => console.error("Unable to join", resp));

  // Send ICE candidate
  channel.push("signal:ice_candidate", {
    to: peerId,
    candidate: iceCandidate
  });

  // Receive ICE candidate
  channel.on("signal:ice_candidate", ({ from, candidate }) => {
    peerConnections[from].addIceCandidate(candidate);
  });
  ```
  """

  use CGraphWeb, :channel
  require Logger

  alias CGraph.WebRTC
  alias CGraph.WebRTC.Room

  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("call:" <> room_id, params, socket) do
    user_id = socket.assigns.user_id

    device = Map.get(params, "device", "unknown")
    media = Map.get(params, "media", %{"audio" => true, "video" => false})
    media = normalize_media(media)

    case WebRTC.join_room(room_id, user_id, device: device, media: media) do
      {:ok, room} ->
        # Subscribe to room events
        :ok = Phoenix.PubSub.subscribe(CGraph.PubSub, "webrtc:room:#{room_id}")

        # Track presence
        send(self(), :after_join)

        socket = socket
          |> assign(:room_id, room_id)
          |> assign(:device, device)
          |> assign(:media, media)

        response = %{
          room: Room.to_map(room),
          ice_servers: WebRTC.get_ice_servers(),
          sfu_enabled: WebRTC.sfu_enabled?(),
          sfu_url: WebRTC.get_sfu_url()
        }

        {:ok, response, socket}

      {:error, :not_found} ->
        {:error, %{reason: "room_not_found"}}

      {:error, :room_full} ->
        {:error, %{reason: "room_full"}}

      {:error, reason} ->
        Logger.warning("failed_to_join_call_room", room_id: room_id, reason: inspect(reason))
        {:error, %{reason: "join_failed"}}
    end
  end

  @impl true
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info(:after_join, socket) do
    # Broadcast to others that we joined
    broadcast_from!(socket, "participant:joined", %{
      participant_id: socket.assigns.user_id,
      device: socket.assigns.device,
      media: socket.assigns.media
    })

    {:noreply, socket}
  end

  @impl true
  def handle_info({:participant_joined, payload}, socket) do
    push(socket, "participant:joined", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:participant_left, payload}, socket) do
    push(socket, "participant:left", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:media_updated, payload}, socket) do
    push(socket, "participant:media_updated", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:room_ended, _payload}, socket) do
    push(socket, "call:ended", %{})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:ice_candidate, payload}, socket) do
    push(socket, "signal:ice_candidate", payload)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:sdp, payload}, socket) do
    event = case payload.type do
      "offer" -> "signal:offer"
      "answer" -> "signal:answer"
      _ -> "signal:sdp"
    end
    push(socket, event, payload)
    {:noreply, socket}
  end

  @impl true
  def handle_info(_msg, socket) do
    {:noreply, socket}
  end

  # ---------------------------------------------------------------------------
  # Client Events - Signaling
  # ---------------------------------------------------------------------------

  @impl true
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}
  def handle_in("signal:offer", %{"to" => to_id, "sdp" => sdp}, socket) do
    room_id = socket.assigns.room_id
    from_id = socket.assigns.user_id

    case WebRTC.handle_sdp(room_id, from_id, to_id, "offer", sdp) do
      :ok ->
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("signal:answer", %{"to" => to_id, "sdp" => sdp}, socket) do
    room_id = socket.assigns.room_id
    from_id = socket.assigns.user_id

    case WebRTC.handle_sdp(room_id, from_id, to_id, "answer", sdp) do
      :ok ->
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("signal:ice_candidate", %{"candidate" => candidate} = params, socket) do
    room_id = socket.assigns.room_id
    from_id = socket.assigns.user_id
    to_id = params["to"]  # Optional: if nil, broadcast to all

    if to_id do
      # Send to specific peer
      case WebRTC.handle_sdp(room_id, from_id, to_id, "ice", candidate) do
        :ok -> {:reply, :ok, socket}
        {:error, reason} -> {:reply, {:error, %{reason: reason}}, socket}
      end
    else
      # Broadcast to all peers
      case WebRTC.handle_ice_candidate(room_id, from_id, candidate) do
        :ok -> {:reply, :ok, socket}
        {:error, reason} -> {:reply, {:error, %{reason: reason}}, socket}
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Client Events - Media Control
  # ---------------------------------------------------------------------------

  @impl true
  def handle_in("media:update", %{"media" => media}, socket) do
    room_id = socket.assigns.room_id
    user_id = socket.assigns.user_id
    media = normalize_media(media)

    case WebRTC.update_media(room_id, user_id, media) do
      {:ok, _participant} ->
        socket = assign(socket, :media, Map.merge(socket.assigns.media, media))
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("media:mute", _params, socket) do
    handle_in("media:update", %{"media" => %{"muted" => true}}, socket)
  end

  @impl true
  def handle_in("media:unmute", _params, socket) do
    handle_in("media:update", %{"media" => %{"muted" => false}}, socket)
  end

  @impl true
  def handle_in("media:video_on", _params, socket) do
    handle_in("media:update", %{"media" => %{"video" => true}}, socket)
  end

  @impl true
  def handle_in("media:video_off", _params, socket) do
    handle_in("media:update", %{"media" => %{"video" => false}}, socket)
  end

  @impl true
  def handle_in("media:screen_share", %{"enabled" => enabled}, socket) do
    handle_in("media:update", %{"media" => %{"screen" => enabled}}, socket)
  end

  # ---------------------------------------------------------------------------
  # Client Events - Call Control
  # ---------------------------------------------------------------------------

  @impl true
  def handle_in("call:leave", _params, socket) do
    room_id = socket.assigns.room_id
    user_id = socket.assigns.user_id

    case WebRTC.leave_room(room_id, user_id) do
      {:ok, _} ->
        {:stop, :normal, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("call:end", _params, socket) do
    room_id = socket.assigns.room_id
    user_id = socket.assigns.user_id

    case WebRTC.end_room(room_id, user_id) do
      {:ok, _} ->
        {:stop, :normal, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("call:ring", %{"user_ids" => user_ids}, socket) do
    room_id = socket.assigns.room_id

    case WebRTC.ring(room_id, user_ids) do
      :ok ->
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Catch-all for unknown events
  @impl true
  def handle_in(event, _params, socket) do
    Logger.warning("callchannel_received_unknown_event", event: event)
    {:reply, {:error, %{reason: "unknown_event"}}, socket}
  end

  # ---------------------------------------------------------------------------
  # Termination
  # ---------------------------------------------------------------------------

  @impl true
  @spec terminate(term(), Phoenix.Socket.t()) :: :ok
  def terminate(_reason, socket) do
    if room_id = socket.assigns[:room_id] do
      user_id = socket.assigns.user_id
      WebRTC.leave_room(room_id, user_id)
    end
    :ok
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp normalize_media(media) when is_map(media) do
    %{
      audio: Map.get(media, "audio", Map.get(media, :audio, true)),
      video: Map.get(media, "video", Map.get(media, :video, false)),
      screen: Map.get(media, "screen", Map.get(media, :screen, false)),
      muted: Map.get(media, "muted", Map.get(media, :muted, false))
    }
  end

  defp normalize_media(_), do: %{audio: true, video: false, screen: false, muted: false}
end
