defmodule CGraph.WebRTC.VoiceChannelManager do
  @moduledoc """
  Manages persistent voice channel state using Phoenix Presence.

  Discord-style always-on voice channels where users join/leave freely.
  Tracks per-channel occupancy, user voice state (mute/deafen), and
  handles LiveKit room lifecycle for voice channels.

  ## Architecture

  - **Presence-backed**: Uses Phoenix Presence for automatic cleanup on disconnect
  - **Single-channel constraint**: Users can only be in one voice channel at a time
  - **LiveKit integration**: Auto-creates LiveKit rooms on first join
  - **Room naming**: `vc_{channel_id}` for voice channels

  ## Usage

      # Join a voice channel (auto-leaves previous)
      {:ok, token} = VoiceChannelManager.join_voice_channel(channel_id, user_id)

      # Leave gracefully
      :ok = VoiceChannelManager.leave_voice_channel(channel_id, user_id)

      # Get members
      members = VoiceChannelManager.get_voice_channel_members(channel_id)

      # Get user's current voice state
      state = VoiceChannelManager.get_user_voice_state(user_id)
  """

  require Logger

  alias CGraph.WebRTC.{LiveKit, LiveKitToken}
  alias CGraphWeb.Presence

  @voice_room_prefix "vc_"

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type voice_member :: %{
    user_id: String.t(),
    self_mute: boolean(),
    self_deafen: boolean(),
    video: boolean(),
    joined_at: DateTime.t()
  }

  @type voice_state :: %{
    channel_id: String.t(),
    self_mute: boolean(),
    self_deafen: boolean(),
    video: boolean()
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Join a persistent voice channel.

  Auto-leaves any previous voice channel for this user. Creates the
  LiveKit room if it doesn't exist and returns a JWT token for it.

  ## Parameters

  - `channel_id` — The channel ID to join
  - `user_id` — The user joining
  - `opts` — Options:
    - `:self_mute` — Start muted (default: false)
    - `:self_deafen` — Start deafened (default: false)
    - `:name` — Display name for LiveKit participant

  ## Returns

  - `{:ok, %{token: token, room_name: room_name}}` — Success with LiveKit credentials
  - `{:error, reason}` — Failure
  """
  @spec join_voice_channel(String.t(), String.t(), keyword()) ::
    {:ok, %{token: String.t(), room_name: String.t()}} | {:error, term()}
  def join_voice_channel(channel_id, user_id, opts \\ []) do
    # Auto-leave any previous voice channel
    case get_user_voice_state(user_id) do
      %{channel_id: prev_channel_id} when prev_channel_id != channel_id ->
        leave_voice_channel(prev_channel_id, user_id)
      _ ->
        :ok
    end

    room_name = voice_room_name(channel_id)

    # Ensure LiveKit room exists
    ensure_livekit_room(room_name)

    # Track user in Presence for this voice channel
    topic = voice_topic(channel_id)
    meta = %{
      user_id: user_id,
      self_mute: Keyword.get(opts, :self_mute, false),
      self_deafen: Keyword.get(opts, :self_deafen, false),
      video: Keyword.get(opts, :video, false),
      joined_at: DateTime.utc_now()
    }

    # Track in voice-channel-specific presence topic
    case Presence.track(self(), topic, user_id, meta) do
      {:ok, _ref} ->
        :ok
      {:error, {:already_tracked, _pid, _topic, _key}} ->
        # Already tracked, update instead
        Presence.update(self(), topic, user_id, meta)
    end

    # Also track in a global voice state topic for user lookups
    global_meta = %{channel_id: channel_id}
    case Presence.track(self(), "voice:users", user_id, global_meta) do
      {:ok, _ref} ->
        :ok
      {:error, {:already_tracked, _pid, _topic, _key}} ->
        Presence.update(self(), "voice:users", user_id, global_meta)
    end

    # Generate LiveKit token
    participant_name = Keyword.get(opts, :name, user_id)
    case LiveKitToken.generate_token(room_name, user_id, name: participant_name) do
      {:ok, token} ->
        Logger.info("User #{user_id} joined voice channel #{channel_id}")
        {:ok, %{token: token, room_name: room_name}}

      {:error, reason} ->
        Logger.error("Failed to generate LiveKit token for voice channel: #{inspect(reason)}")
        {:error, :token_generation_failed}
    end
  end

  @doc """
  Leave a voice channel gracefully.

  Untracks the user from Presence. If the channel becomes empty,
  the LiveKit room is kept alive (persistent voice channels stay open).

  ## Returns

  - `:ok` — Always succeeds
  """
  @spec leave_voice_channel(String.t(), String.t()) :: :ok
  def leave_voice_channel(channel_id, user_id) do
    topic = voice_topic(channel_id)

    # Untrack from channel-specific presence
    Presence.untrack(self(), topic, user_id)

    # Untrack from global voice state
    Presence.untrack(self(), "voice:users", user_id)

    Logger.info("User #{user_id} left voice channel #{channel_id}")

    # Optionally clean up empty rooms after a delay
    # For persistent voice channels, we keep the room alive
    spawn(fn ->
      Process.sleep(5_000)
      members = get_voice_channel_members(channel_id)
      if Enum.empty?(members) do
        room_name = voice_room_name(channel_id)
        case LiveKit.delete_room(room_name) do
          :ok ->
            Logger.debug("Cleaned up empty voice room #{room_name}")
          {:error, _} ->
            :ok
        end
      end
    end)

    :ok
  end

  @doc """
  Get all members currently in a voice channel.

  ## Returns

  List of `%{user_id, self_mute, self_deafen, video, joined_at}` maps.
  """
  @spec get_voice_channel_members(String.t()) :: [voice_member()]
  def get_voice_channel_members(channel_id) do
    topic = voice_topic(channel_id)

    Presence.list(topic)
    |> Enum.map(fn {user_id, %{metas: [meta | _]}} ->
      %{
        user_id: user_id,
        self_mute: Map.get(meta, :self_mute, false),
        self_deafen: Map.get(meta, :self_deafen, false),
        video: Map.get(meta, :video, false),
        joined_at: Map.get(meta, :joined_at)
      }
    end)
  end

  @doc """
  Get a user's current voice channel state.

  ## Returns

  - `%{channel_id, self_mute, self_deafen, video}` — If in a voice channel
  - `nil` — If not in any voice channel
  """
  @spec get_user_voice_state(String.t()) :: voice_state() | nil
  def get_user_voice_state(user_id) do
    case Presence.list("voice:users") do
      presences when is_map(presences) ->
        case Map.get(presences, user_id) do
          %{metas: [%{channel_id: channel_id} | _]} ->
            # Get full state from channel-specific topic
            topic = voice_topic(channel_id)
            case Map.get(Presence.list(topic), user_id) do
              %{metas: [meta | _]} ->
                %{
                  channel_id: channel_id,
                  self_mute: Map.get(meta, :self_mute, false),
                  self_deafen: Map.get(meta, :self_deafen, false),
                  video: Map.get(meta, :video, false)
                }
              _ ->
                %{channel_id: channel_id, self_mute: false, self_deafen: false, video: false}
            end
          _ ->
            nil
        end
      _ ->
        nil
    end
  end

  @doc """
  Update a user's voice state (mute/deafen/video).

  Broadcasts the update via Presence diff.

  ## Parameters

  - `channel_id` — Voice channel the user is in
  - `user_id` — The user to update
  - `state` — Map of state changes (`:self_mute`, `:self_deafen`, `:video`)
  """
  @spec update_voice_state(String.t(), String.t(), map()) :: :ok | {:error, term()}
  def update_voice_state(channel_id, user_id, state) do
    topic = voice_topic(channel_id)

    case Presence.list(topic) do
      presences when is_map(presences) ->
        case Map.get(presences, user_id) do
          %{metas: [current_meta | _]} ->
            updated_meta = Map.merge(current_meta, state)
            Presence.update(self(), topic, user_id, updated_meta)
            :ok

          _ ->
            {:error, :not_in_channel}
        end

      _ ->
        {:error, :not_in_channel}
    end
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  @doc false
  @spec voice_room_name(String.t()) :: String.t()
  def voice_room_name(channel_id) do
    "#{@voice_room_prefix}#{channel_id}"
  end

  @doc false
  @spec voice_topic(String.t()) :: String.t()
  def voice_topic(channel_id) do
    "voice:#{channel_id}"
  end

  defp ensure_livekit_room(room_name) do
    case LiveKit.create_room(room_name, empty_timeout: 0, max_participants: 50) do
      {:ok, _room} ->
        Logger.debug("Created/ensured LiveKit room #{room_name}")
        :ok

      {:error, reason} ->
        # Room may already exist — LiveKit returns error for duplicate names
        Logger.debug("LiveKit room #{room_name} creation result: #{inspect(reason)}")
        :ok
    end
  end
end
