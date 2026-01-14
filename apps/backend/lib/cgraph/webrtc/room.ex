defmodule CGraph.WebRTC.Room do
  @moduledoc """
  Represents a WebRTC call room.

  A room coordinates multiple participants for voice/video calls.
  Supports 1:1 and group calls with up to 10 participants (or more with SFU).

  ## States

  - `:waiting` - Room created, waiting for participants
  - `:active` - At least one participant connected, call in progress
  - `:ended` - Call has ended

  ## Fields

  - `id` - Unique room identifier
  - `type` - Call type (:audio, :video, :screen_share)
  - `creator_id` - User who initiated the call
  - `participants` - Map of participant_id => Participant struct
  - `state` - Current room state
  - `max_participants` - Maximum allowed participants
  - `group_id` - Optional group/channel ID for group calls
  - `created_at` - When the room was created
  - `started_at` - When the first participant joined
  - `ended_at` - When the call ended
  """

  @type t :: %__MODULE__{
    id: String.t(),
    type: :audio | :video | :screen_share,
    creator_id: String.t(),
    participants: %{String.t() => CGraph.WebRTC.Participant.t()},
    state: :waiting | :active | :ended,
    max_participants: pos_integer(),
    group_id: String.t() | nil,
    created_at: DateTime.t(),
    started_at: DateTime.t() | nil,
    ended_at: DateTime.t() | nil
  }

  defstruct [
    :id,
    :type,
    :creator_id,
    :group_id,
    :created_at,
    :started_at,
    :ended_at,
    participants: %{},
    state: :waiting,
    max_participants: 10
  ]

  @doc """
  Check if room is still active.
  """
  def active?(%__MODULE__{state: state}), do: state == :active

  @doc """
  Check if room is full.
  """
  def full?(%__MODULE__{participants: participants, max_participants: max}) do
    map_size(participants) >= max
  end

  @doc """
  Get participant count.
  """
  def participant_count(%__MODULE__{participants: participants}) do
    map_size(participants)
  end

  @doc """
  Get call duration in seconds.
  """
  def duration(%__MODULE__{started_at: nil}), do: 0
  def duration(%__MODULE__{started_at: started, ended_at: nil}) do
    DateTime.diff(DateTime.utc_now(), started, :second)
  end
  def duration(%__MODULE__{started_at: started, ended_at: ended}) do
    DateTime.diff(ended, started, :second)
  end

  @doc """
  Convert room to a map for JSON serialization.
  """
  def to_map(%__MODULE__{} = room) do
    %{
      id: room.id,
      type: room.type,
      creator_id: room.creator_id,
      state: room.state,
      participant_count: participant_count(room),
      participants: Enum.map(room.participants, fn {id, p} ->
        %{id: id, media: p.media, state: p.state}
      end),
      group_id: room.group_id,
      duration: duration(room),
      created_at: room.created_at && DateTime.to_iso8601(room.created_at),
      started_at: room.started_at && DateTime.to_iso8601(room.started_at)
    }
  end
end
