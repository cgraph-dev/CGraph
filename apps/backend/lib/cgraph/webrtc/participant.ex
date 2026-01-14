defmodule CGraph.WebRTC.Participant do
  @moduledoc """
  Represents a participant in a WebRTC call.

  ## States

  - `:connecting` - Participant joined, establishing connection
  - `:connected` - WebRTC connection established
  - `:reconnecting` - Connection lost, attempting to reconnect
  - `:disconnected` - Participant left or connection failed

  ## Media State

  The `media` field tracks the participant's media capabilities:

  - `audio` - Whether audio is enabled
  - `video` - Whether video is enabled
  - `screen` - Whether screen sharing is active
  - `muted` - Whether audio is muted (but still connected)

  ## Example

      %Participant{
        id: "user_123",
        device: "mobile",
        media: %{audio: true, video: true, muted: false},
        state: :connected,
        joined_at: ~U[2024-01-15 10:30:00Z]
      }
  """

  @type t :: %__MODULE__{
    id: String.t(),
    device: String.t(),
    media: media_state(),
    state: :connecting | :connected | :reconnecting | :disconnected,
    joined_at: DateTime.t(),
    connection_id: String.t() | nil
  }

  @type media_state :: %{
    optional(:audio) => boolean(),
    optional(:video) => boolean(),
    optional(:screen) => boolean(),
    optional(:muted) => boolean()
  }

  defstruct [
    :id,
    :joined_at,
    :connection_id,
    device: "unknown",
    media: %{audio: true, video: false, muted: false},
    state: :connecting
  ]

  @doc """
  Check if participant is currently connected.
  """
  def connected?(%__MODULE__{state: state}) do
    state in [:connected, :reconnecting]
  end

  @doc """
  Check if participant has video enabled.
  """
  def has_video?(%__MODULE__{media: %{video: video}}), do: video == true
  def has_video?(_), do: false

  @doc """
  Check if participant has audio enabled.
  """
  def has_audio?(%__MODULE__{media: %{audio: audio}}), do: audio == true
  def has_audio?(_), do: false

  @doc """
  Check if participant is screen sharing.
  """
  def screen_sharing?(%__MODULE__{media: %{screen: screen}}), do: screen == true
  def screen_sharing?(_), do: false

  @doc """
  Update media state.
  """
  def update_media(%__MODULE__{} = participant, updates) when is_map(updates) do
    %{participant | media: Map.merge(participant.media, updates)}
  end

  @doc """
  Mark participant as connected.
  """
  def mark_connected(%__MODULE__{} = participant, connection_id \\ nil) do
    %{participant | state: :connected, connection_id: connection_id}
  end

  @doc """
  Mark participant as disconnected.
  """
  def mark_disconnected(%__MODULE__{} = participant) do
    %{participant | state: :disconnected}
  end

  @doc """
  Convert to map for JSON serialization.
  """
  def to_map(%__MODULE__{} = p) do
    %{
      id: p.id,
      device: p.device,
      media: p.media,
      state: p.state,
      joined_at: p.joined_at && DateTime.to_iso8601(p.joined_at)
    }
  end
end
