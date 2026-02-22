defmodule CGraph.WebRTC.RoomUtils do
  @moduledoc """
  Utility functions for WebRTC room management.

  Provides room ID generation, configuration access, stale-room cleanup,
  PubSub event broadcasting, and telemetry emission.
  """
  require Logger

  alias CGraph.WebRTC.Room

  @ets_table :cgraph_webrtc_rooms

  @doc "Generate a unique room identifier."
  @spec generate_room_id() :: String.t()
  def generate_room_id do
    "room_" <> Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
  end

  @doc "Return the configured call timeout (ms), or the default of 60 000."
  @spec call_timeout() :: non_neg_integer()
  def call_timeout do
    config(:call_timeout_ms) || 60_000
  end

  @doc "Schedule the next periodic cleanup message."
  @spec schedule_cleanup() :: reference()
  def schedule_cleanup do
    # Clean up every 5 minutes
    Process.send_after(self(), :cleanup, 300_000)
  end

  @doc "Remove stale or ended rooms from the ETS table."
  @spec cleanup_stale_rooms() :: nil
  def cleanup_stale_rooms do
    now = DateTime.utc_now()
    max_age = 3600  # 1 hour

    :ets.foldl(fn
      {room_id, %Room{created_at: created_at, state: state}}, acc ->
        age = DateTime.diff(now, created_at, :second)
        if age > max_age or state == :ended do
          :ets.delete(@ets_table, room_id)
        end
        acc

      _, acc -> acc
    end, nil, @ets_table)
  end

  @doc "Broadcast a room event to all subscribers via PubSub."
  @spec broadcast_room_event(String.t(), atom(), map()) :: :ok | {:error, term()}
  def broadcast_room_event(room_id, event, payload) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "webrtc:room:#{room_id}",
      {event, payload}
    )
  end

  @doc "Read a key from the `:cgraph, CGraph.WebRTC` application config."
  @spec config(atom()) :: term()
  def config(key) do
    Application.get_env(:cgraph, CGraph.WebRTC, [])
    |> Keyword.get(key)
  end

  @doc "Emit a telemetry event with room measurements and metadata."
  @spec emit_telemetry(atom(), Room.t(), term()) :: :ok
  def emit_telemetry(event, room, participant \\ nil) do
    measurements = %{
      participant_count: map_size(room.participants),
      timestamp: System.system_time(:millisecond)
    }

    metadata = %{
      room_id: room.id,
      type: room.type,
      state: room.state
    }

    metadata = if participant do
      Map.put(metadata, :participant_id, participant.id)
    else
      metadata
    end

    :telemetry.execute([:cgraph, :webrtc, event], measurements, metadata)
  end
end
