defmodule CGraph.WebRTC.LiveKit do
  @moduledoc """
  LiveKit SFU room management via Twirp (Protobuf-over-HTTP) API.

  Provides server-side room management operations for the LiveKit SFU:
  - Create/delete rooms
  - List rooms and participants
  - Remove or mute participants
  - Room naming conventions for deterministic mapping

  ## Room Naming Convention

  Rooms are named using a deterministic pattern:
  - Group calls: `group_{group_id}_channel_{channel_id}`
  - Direct calls: `direct_{sorted_user_ids}`

  ## LiveKit Server API

  LiveKit uses Twirp (Protobuf-over-HTTP) for its server API.
  We use JSON encoding for simplicity — LiveKit supports both protobuf and JSON.
  All requests require authorization via the same JWT mechanism used for client tokens.

  ## Configuration

      config :cgraph, CGraph.WebRTC.LiveKit,
        api_key: "devkey",
        api_secret: "secret",
        url: "ws://localhost:7880"
  """

  require Logger

  alias CGraph.WebRTC.LiveKitToken

  @typedoc "LiveKit room information"
  @type room_info :: %{
    name: String.t(),
    sid: String.t(),
    empty_timeout: integer(),
    max_participants: integer(),
    creation_time: integer(),
    num_participants: integer()
  }

  @typedoc "LiveKit participant information"
  @type participant_info :: %{
    identity: String.t(),
    sid: String.t(),
    name: String.t(),
    state: integer(),
    joined_at: integer(),
    tracks: [map()]
  }

  # ---------------------------------------------------------------------------
  # Room Management
  # ---------------------------------------------------------------------------

  @doc """
  Create a LiveKit room.

  ## Options

  - `:empty_timeout` — Seconds before an empty room is closed (default: 300)
  - `:max_participants` — Maximum allowed participants (default: 50)
  - `:metadata` — Arbitrary room metadata

  ## Returns

  - `{:ok, room_info}` — Room created successfully
  - `{:error, reason}` — Creation failed
  """
  @spec create_room(String.t(), keyword()) :: {:ok, room_info()} | {:error, term()}
  def create_room(name, opts \\ []) do
    body = %{
      "name" => name,
      "emptyTimeout" => Keyword.get(opts, :empty_timeout, 300),
      "maxParticipants" => Keyword.get(opts, :max_participants, 50)
    }

    body = case Keyword.get(opts, :metadata) do
      nil -> body
      meta -> Map.put(body, "metadata", meta)
    end

    twirp_request("RoomService", "CreateRoom", body)
  end

  @doc """
  List all active LiveKit rooms.
  """
  @spec list_rooms() :: {:ok, [room_info()]} | {:error, term()}
  def list_rooms do
    case twirp_request("RoomService", "ListRooms", %{}) do
      {:ok, %{"rooms" => rooms}} -> {:ok, rooms}
      {:ok, _} -> {:ok, []}
      error -> error
    end
  end

  @doc """
  Delete (close) a LiveKit room by name.
  """
  @spec delete_room(String.t()) :: :ok | {:error, term()}
  def delete_room(name) do
    case twirp_request("RoomService", "DeleteRoom", %{"room" => name}) do
      {:ok, _} -> :ok
      error -> error
    end
  end

  @doc """
  List participants in a given room.
  """
  @spec list_participants(String.t()) :: {:ok, [participant_info()]} | {:error, term()}
  def list_participants(room_name) do
    case twirp_request("RoomService", "ListParticipants", %{"room" => room_name}) do
      {:ok, %{"participants" => participants}} -> {:ok, participants}
      {:ok, _} -> {:ok, []}
      error -> error
    end
  end

  @doc """
  Remove a participant from a room.
  """
  @spec remove_participant(String.t(), String.t()) :: :ok | {:error, term()}
  def remove_participant(room_name, identity) do
    case twirp_request("RoomService", "RemoveParticipant", %{
      "room" => room_name,
      "identity" => identity
    }) do
      {:ok, _} -> :ok
      error -> error
    end
  end

  @doc """
  Server-side mute a participant's track.
  """
  @spec mute_participant(String.t(), String.t(), String.t()) :: :ok | {:error, term()}
  def mute_participant(room_name, identity, track_sid) do
    case twirp_request("RoomService", "MutePublishedTrack", %{
      "room" => room_name,
      "identity" => identity,
      "trackSid" => track_sid,
      "muted" => true
    }) do
      {:ok, _} -> :ok
      error -> error
    end
  end

  # ---------------------------------------------------------------------------
  # Room Naming
  # ---------------------------------------------------------------------------

  @doc """
  Generate a deterministic room name for a group channel.

  ## Examples

      iex> room_name_for_channel("group_abc", "channel_123")
      "group_abc_channel_123"
  """
  @spec room_name_for_channel(String.t(), String.t()) :: String.t()
  def room_name_for_channel(group_id, channel_id) do
    "group_#{group_id}_channel_#{channel_id}"
  end

  @doc """
  Generate a deterministic room name for a direct call.

  ## Examples

      iex> room_name_for_direct("user_a", "user_b")
      "direct_user_a_user_b"
  """
  @spec room_name_for_direct(String.t(), String.t()) :: String.t()
  def room_name_for_direct(user_id_a, user_id_b) do
    sorted = Enum.sort([user_id_a, user_id_b])
    "direct_#{Enum.join(sorted, "_")}"
  end

  # ---------------------------------------------------------------------------
  # Private — Twirp HTTP Client
  # ---------------------------------------------------------------------------

  defp twirp_request(service, method, body) do
    url = api_base_url() <> "/twirp/livekit.#{service}/#{method}"

    with {:ok, token} <- generate_service_token(),
         {:ok, json_body} <- Jason.encode(body) do
      headers = [
        {"Content-Type", "application/json"},
        {"Authorization", "Bearer #{token}"}
      ]

      case :httpc.request(
        :post,
        {String.to_charlist(url), Enum.map(headers, fn {k, v} -> {String.to_charlist(k), String.to_charlist(v)} end), ~c"application/json", String.to_charlist(json_body)},
        [{:timeout, 10_000}, {:connect_timeout, 5_000}],
        [{:body_format, :binary}]
      ) do
        {:ok, {{_, status, _}, _resp_headers, resp_body}} when status in 200..299 ->
          case Jason.decode(to_string(resp_body)) do
            {:ok, decoded} -> {:ok, decoded}
            {:error, _} -> {:ok, %{}}
          end

        {:ok, {{_, status, _}, _resp_headers, resp_body}} ->
          Logger.warning("LiveKit API error",
            status: status,
            service: service,
            method: method,
            body: to_string(resp_body)
          )
          {:error, {:livekit_api_error, status, to_string(resp_body)}}

        {:error, reason} ->
          Logger.warning("LiveKit API request failed",
            service: service,
            method: method,
            reason: inspect(reason)
          )
          {:error, {:request_failed, reason}}
      end
    end
  end

  defp generate_service_token do
    # Service tokens use a special grant for server-side API access
    LiveKitToken.generate_token("", "", can_publish: false, can_subscribe: false, ttl: 600)
  end

  defp api_base_url do
    url = LiveKitToken.get_url()

    # Convert ws:// to http:// for REST API calls
    url
    |> String.replace(~r{^wss://}, "https://")
    |> String.replace(~r{^ws://}, "http://")
  end
end
