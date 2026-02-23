defmodule CGraph.WebRTC do
  @moduledoc """
  WebRTC infrastructure for real-time voice and video calls.

  ## Overview

  Provides complete WebRTC signaling and coordination:

  - **Signaling Server**: ICE candidate and SDP exchange via Phoenix Channels
  - **Room Management**: Multi-party call coordination
  - **SFU Integration**: Optional Selective Forwarding Unit for large calls
  - **TURN Server**: NAT traversal for restrictive networks

  ## Architecture

  ```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                         WEBRTC SYSTEM                                      │
  ├───────────────────────────────────────────────────────────────────────────┤
  │                                                                            │
  │   Client A                    Server                      Client B        │
  │   ┌──────┐                  ┌────────┐                   ┌──────┐        │
  │   │Peer  │◄───Signaling────►│Phoenix │◄───Signaling─────►│Peer  │        │
  │   │Conn  │                  │Channel │                   │Conn  │        │
  │   └──┬───┘                  └────────┘                   └──┬───┘        │
  │      │                           │                          │             │
  │      │         ┌─────────────────┼─────────────────┐       │             │
  │      │         ▼                 ▼                 ▼       │             │
  │      │    ┌─────────┐     ┌───────────┐     ┌─────────┐   │             │
  │      │    │ STUN    │     │  TURN     │     │   SFU   │   │             │
  │      │    │ Server  │     │  Server   │     │(Optional)│   │             │
  │      │    └─────────┘     └───────────┘     └─────────┘   │             │
  │      │                                                     │             │
  │      └────────────── Media Stream ─────────────────────────┘             │
  │                                                                            │
  └───────────────────────────────────────────────────────────────────────────┘
  ```

  ## Call Flow

  1. **Initiate**: Caller creates room, gets room_id
  2. **Ring**: Callee receives incoming call notification
  3. **Answer**: Callee joins room
  4. **Exchange**: ICE candidates and SDP exchanged via signaling
  5. **Connect**: Direct peer connection established
  6. **Media**: Audio/video streams flow peer-to-peer
  7. **End**: Either party can end call

  ## Configuration

      config :cgraph, CGraph.WebRTC,
        stun_servers: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302"
        ],
        turn_servers: [
          %{
            urls: "turn:turn.example.com:3478",
            username: "user",
            credential: "pass"
          }
        ],
        sfu_enabled: false,
        sfu_url: "wss://sfu.example.com",
        max_participants: 10,
        call_timeout_ms: 60_000

  ## Usage

      # Start a call
      {:ok, room} = WebRTC.create_room(caller_id, :video)

      # Invite participants
      WebRTC.invite(room.id, [callee_id])

      # Get ICE servers for client
      ice_servers = WebRTC.get_ice_servers()
  """

  use GenServer
  require Logger

  alias CGraph.WebRTC.{Participant, Room}
  alias __MODULE__.{Calls, Signaling}
  alias CGraph.WebRTC.RoomUtils

  @ets_table :cgraph_webrtc_rooms
  @max_participants 10

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type room_id :: String.t()
  @type call_type :: :audio | :video | :screen_share
  @type participant_id :: String.t()

  @type room :: %Room{
    id: room_id(),
    type: call_type(),
    creator_id: participant_id(),
    participants: %{participant_id() => Participant.t()},
    state: :waiting | :active | :ended,
    created_at: DateTime.t(),
    started_at: DateTime.t() | nil,
    ended_at: DateTime.t() | nil
  }

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Start the WebRTC manager.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Create a new call room.

  ## Options

  - `:type` - Call type (:audio, :video, :screen_share)
  - `:group_id` - For group calls
  - `:max_participants` - Override max (default: 10)

  ## Returns

  - `{:ok, room}` - Room created successfully
  - `{:error, reason}` - Creation failed
  """
  @spec create_room(participant_id(), call_type(), keyword()) :: {:ok, room()} | {:error, term()}
  def create_room(creator_id, type \\ :audio, opts \\ []) do
    room_id = RoomUtils.generate_room_id()
    max = Keyword.get(opts, :max_participants, @max_participants)
    group_id = Keyword.get(opts, :group_id)

    room = %Room{
      id: room_id,
      type: type,
      creator_id: creator_id,
      participants: %{},
      state: :waiting,
      max_participants: max,
      group_id: group_id,
      created_at: DateTime.utc_now(),
      started_at: nil,
      ended_at: nil
    }

    case GenServer.call(__MODULE__, {:create_room, room}) do
      :ok ->
        Logger.info("webrtc_room_created_by", room_id: room_id, creator_id: creator_id)
        RoomUtils.emit_telemetry(:room_created, room)
        {:ok, room}

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Get room by ID.
  """
  @spec get_room(room_id()) :: {:ok, room()} | {:error, :not_found}
  def get_room(room_id) do
    case :ets.lookup(@ets_table, room_id) do
      [{^room_id, room}] -> {:ok, room}
      [] -> {:error, :not_found}
    end
  end

  @doc """
  Join an existing call room.
  """
  @spec join_room(room_id(), participant_id(), keyword()) :: {:ok, room()} | {:error, term()}
  def join_room(room_id, participant_id, opts \\ []) do
    device = Keyword.get(opts, :device, "unknown")
    media = Keyword.get(opts, :media, %{audio: true, video: false})

    participant = %Participant{
      id: participant_id,
      device: device,
      media: media,
      joined_at: DateTime.utc_now(),
      state: :connecting
    }

    GenServer.call(__MODULE__, {:join_room, room_id, participant})
  end

  @doc """
  Leave a call room.
  """
  @spec leave_room(room_id(), participant_id()) :: {:ok, room() | :room_ended} | {:error, :not_found}
  def leave_room(room_id, participant_id) do
    GenServer.call(__MODULE__, {:leave_room, room_id, participant_id})
  end

  @doc """
  End a call (creator or last participant).
  """
  @spec end_room(room_id(), participant_id()) :: {:ok, room()} | {:error, :not_found}
  def end_room(room_id, requester_id) do
    GenServer.call(__MODULE__, {:end_room, room_id, requester_id})
  end

  @doc """
  Update participant media state.
  """
  @spec update_media(room_id(), participant_id(), map()) :: {:ok, Participant.t()} | {:error, term()}
  def update_media(room_id, participant_id, media_state) do
    GenServer.call(__MODULE__, {:update_media, room_id, participant_id, media_state})
  end

  @doc """
  List active rooms for a user.
  """
  @spec list_user_rooms(participant_id()) :: [room()]
  def list_user_rooms(user_id) do
    :ets.foldl(fn
      {_id, %Room{participants: participants} = room}, acc ->
        if Map.has_key?(participants, user_id) do
          [room | acc]
        else
          acc
        end

      _, acc -> acc
    end, [], @ets_table)
  end

  # ---------------------------------------------------------------------------
  # Signaling Helpers (delegated to CGraph.WebRTC.Signaling)
  # ---------------------------------------------------------------------------

  @doc """
  Handle incoming ICE candidate from a peer.
  Broadcasts to other participants in the room.
  """
  defdelegate handle_ice_candidate(room_id, from_id, candidate), to: Signaling

  @doc """
  Handle SDP offer/answer exchange.
  """
  defdelegate handle_sdp(room_id, from_id, to_id, sdp_type, sdp), to: Signaling

  @doc """
  Get ICE server configuration for clients.
  """
  defdelegate get_ice_servers(), to: Signaling

  @doc """
  Check if SFU mode is enabled.
  """
  defdelegate sfu_enabled?(), to: Signaling

  @doc """
  Get SFU connection URL.
  """
  defdelegate get_sfu_url(), to: Signaling

  # ---------------------------------------------------------------------------
  # Call History API (delegated to CGraph.WebRTC.Calls)
  # ---------------------------------------------------------------------------

  @doc """
  List call history for a user, most recent first, with cursor-based pagination.
  """
  @spec list_call_history(participant_id(), keyword()) :: {:ok, [map()]} | {:error, term()}
  def list_call_history(user_id, opts \\ []), do: Calls.list_call_history(user_id, opts)

  @doc """
  Get a single call history record by ID.
  """
  defdelegate get_call(call_id), to: Calls

  @doc """
  Send ringing notification to callees.
  """
  defdelegate ring(room_id, callee_ids), to: Signaling

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @doc "Initializes the WebRTC room manager state and ETS table."
  @spec init(keyword()) :: {:ok, map()}
  @impl true
  def init(_opts) do
    :ets.new(@ets_table, [:named_table, :public, :set, {:read_concurrency, true}])
    RoomUtils.schedule_cleanup()
    {:ok, %{}}
  end

  @doc "Handles synchronous WebRTC room management requests."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:create_room, room}, _from, state) do
    :ets.insert(@ets_table, {room.id, room})
    # Schedule room timeout
    Process.send_after(self(), {:room_timeout, room.id}, RoomUtils.call_timeout())
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:join_room, room_id, participant}, _from, state) do
    case :ets.lookup(@ets_table, room_id) do
      [{^room_id, room}] ->
        if map_size(room.participants) >= room.max_participants do
          {:reply, {:error, :room_full}, state}
        else
          updated = %{room |
            participants: Map.put(room.participants, participant.id, participant),
            state: :active,
            started_at: room.started_at || DateTime.utc_now()
          }
          :ets.insert(@ets_table, {room_id, updated})

          # Notify other participants
          broadcast_room_event(room_id, :participant_joined, %{
            participant_id: participant.id
          })

          RoomUtils.emit_telemetry(:participant_joined, updated, participant)
          {:reply, {:ok, updated}, state}
        end

      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end

  @impl true
  def handle_call({:leave_room, room_id, participant_id}, _from, state) do
    case :ets.lookup(@ets_table, room_id) do
      [{^room_id, room}] ->
        updated = %{room |
          participants: Map.delete(room.participants, participant_id)
        }

        if map_size(updated.participants) == 0 do
          # Last person left, end the room
          final = %{updated | state: :ended, ended_at: DateTime.utc_now()}
          :ets.delete(@ets_table, room_id)
          Calls.persist_call_history(final, room)
          RoomUtils.emit_telemetry(:room_ended, final)
          {:reply, {:ok, :room_ended}, state}
        else
          :ets.insert(@ets_table, {room_id, updated})

          broadcast_room_event(room_id, :participant_left, %{
            participant_id: participant_id
          })

          {:reply, {:ok, updated}, state}
        end

      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end

  @impl true
  def handle_call({:end_room, room_id, _requester_id}, _from, state) do
    case :ets.lookup(@ets_table, room_id) do
      [{^room_id, room}] ->
        final = %{room | state: :ended, ended_at: DateTime.utc_now()}
        :ets.delete(@ets_table, room_id)

        Calls.persist_call_history(final, room)
        broadcast_room_event(room_id, :room_ended, %{})
        RoomUtils.emit_telemetry(:room_ended, final)

        {:reply, {:ok, final}, state}

      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end

  @impl true
  def handle_call({:update_media, room_id, participant_id, media_state}, _from, state) do
    case :ets.lookup(@ets_table, room_id) do
      [{^room_id, room}] ->
        case Map.get(room.participants, participant_id) do
          nil ->
            {:reply, {:error, :participant_not_found}, state}

          participant ->
            updated_participant = %{participant | media: Map.merge(participant.media, media_state)}
            updated_room = %{room |
              participants: Map.put(room.participants, participant_id, updated_participant)
            }
            :ets.insert(@ets_table, {room_id, updated_room})

            broadcast_room_event(room_id, :media_updated, %{
              participant_id: participant_id,
              media: updated_participant.media
            })

            {:reply, {:ok, updated_participant}, state}
        end

      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end

  @doc "Handles room timeout and periodic cleanup events."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_info({:room_timeout, room_id}, state) do
    case :ets.lookup(@ets_table, room_id) do
      [{^room_id, %Room{state: :waiting} = room}] ->
        # Room never started, clean it up
        :ets.delete(@ets_table, room_id)
        Logger.info("webrtc_room_timed_out_never_started", room_id: room_id)
        RoomUtils.emit_telemetry(:room_timeout, room)

      _ ->
        :ok
    end

    {:noreply, state}
  end

  @impl true
  def handle_info(:cleanup, state) do
    RoomUtils.cleanup_stale_rooms()
    RoomUtils.schedule_cleanup()
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp broadcast_room_event(room_id, event, payload) do
    RoomUtils.broadcast_room_event(room_id, event, payload)
  end
end
