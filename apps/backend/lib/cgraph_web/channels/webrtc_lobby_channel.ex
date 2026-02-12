defmodule CGraphWeb.WebRTCLobbyChannel do
  @moduledoc """
  Phoenix Channel for WebRTC call initiation.

  This lobby channel handles:
  - Creating new call rooms
  - Ringing target users
  - Providing ICE server configuration

  Unlike the CallChannel which is room-specific ("call:room_id"),
  this lobby channel ("webrtc:lobby") is used for initiating calls.

  ## Client Flow

  ```
  1. Connect to socket with auth token
  2. Join "webrtc:lobby" channel
  3. Push "create_room" event with target user IDs and call type
  4. Receive room_id in response
  5. Leave lobby and join "call:room_id" for signaling
  ```

  ## Events

  ### Client -> Server

  - `create_room` - Create a new call room and ring participants

  ### Server -> Client

  - None (lobby is stateless, just for room creation)

  ## Example Client Usage (TypeScript)

  ```typescript
  const socket = new Socket("/socket", { params: { token: authToken } });
  socket.connect();

  const lobby = socket.channel("webrtc:lobby", {});
  lobby.join()
    .receive("ok", () => {
      // Create room
      lobby.push("create_room", {
        target_ids: ["user_abc123"],
        type: "video"
      })
        .receive("ok", ({ room_id, ice_servers }) => {
          console.log("Room created:", room_id);
          lobby.leave();
          // Now join call:room_id
        });
    });
  ```
  """

  use CGraphWeb, :channel
  require Logger

  alias CGraph.WebRTC

  @impl true
  def join("webrtc:lobby", _params, socket) do
    user_id = socket.assigns.user_id
    Logger.info("webrtc_lobby_joined", user_id: user_id)
    {:ok, socket}
  end

  @doc """
  Create a new call room and ring the target user(s).

  ## Parameters

  - `target_ids` - List of user IDs to ring (required)
  - `type` - Call type: "audio", "video", or "screen_share" (default: "audio")

  ## Returns

  - `{:ok, response}` with room_id and ICE servers
  - `{:error, reason}` if creation fails
  """
  @impl true
  def handle_in("create_room", params, socket) do
    user_id = socket.assigns.user_id
    target_ids = params["target_ids"] || params["target_user_ids"] || []
    call_type_str = params["type"] || params["call_type"] || "audio"

    # Validate parameters
    if target_ids == [] or not is_list(target_ids) do
      {:reply, {:error, %{reason: "target_ids required"}}, socket}
    else
      # Convert call type string to atom
      call_type = case call_type_str do
        "audio" -> :audio
        "video" -> :video
        "screen_share" -> :screen_share
        _ -> :audio
      end

      # Create the room
      case WebRTC.create_room(user_id, call_type) do
        {:ok, room} ->
          Logger.info("webrtc_room_created", room_id: room.id, creator: user_id, targets: inspect(target_ids))

          # Ring the target users
          case WebRTC.ring(room.id, target_ids) do
            :ok ->
              Logger.info("webrtc_ringing_users", targets: inspect(target_ids))

            {:error, reason} ->
              Logger.warning("webrtc_ring_failed", reason: inspect(reason))
          end

          # Return room info
          response = %{
            room_id: room.id,
            type: room.type,
            ice_servers: WebRTC.get_ice_servers(),
            sfu_enabled: WebRTC.sfu_enabled?(),
            sfu_url: WebRTC.get_sfu_url()
          }

          {:reply, {:ok, response}, socket}

        {:error, reason} ->
          Logger.error("webrtc_room_creation_failed", reason: inspect(reason))
          {:reply, {:error, %{reason: reason}}, socket}
      end
    end
  end

  # Catch-all for unknown events
  @impl true
  def handle_in(event, _params, socket) do
    Logger.warning("webrtc_lobby_unknown_event", event: event)
    {:reply, {:error, %{reason: "unknown_event"}}, socket}
  end
end
