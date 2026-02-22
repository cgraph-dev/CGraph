defmodule CGraph.WebRTC.Signaling do
  @moduledoc """
  WebRTC signaling operations for ICE candidate exchange, SDP negotiation,
  and call notifications.

  Used by Phoenix Channels to coordinate peer-to-peer connections between clients.
  Handles the initial connection setup before direct media streams are established.
  """

  alias CGraph.WebRTC

  @doc """
  Handle incoming ICE candidate from a peer.
  Broadcasts to other participants in the room.
  """
  @spec handle_ice_candidate(String.t(), String.t(), map()) :: :ok | {:error, :room_not_found}
  def handle_ice_candidate(room_id, from_id, candidate) do
    case WebRTC.get_room(room_id) do
      {:ok, room} ->
        # Broadcast to all other participants
        other_ids = Map.keys(room.participants) -- [from_id]

        Enum.each(other_ids, fn participant_id ->
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "webrtc:user:#{participant_id}",
            {:ice_candidate, %{
              room_id: room_id,
              from: from_id,
              candidate: candidate
            }}
          )
        end)

        :ok

      {:error, :not_found} ->
        {:error, :room_not_found}
    end
  end

  @doc """
  Handle SDP offer/answer exchange.
  """
  @spec handle_sdp(String.t(), String.t(), String.t(), String.t(), String.t()) :: :ok | {:error, :room_not_found | :participant_not_found}
  def handle_sdp(room_id, from_id, to_id, sdp_type, sdp) do
    case WebRTC.get_room(room_id) do
      {:ok, room} ->
        if Map.has_key?(room.participants, to_id) do
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "webrtc:user:#{to_id}",
            {:sdp, %{
              room_id: room_id,
              from: from_id,
              type: sdp_type,
              sdp: sdp
            }}
          )

          :ok
        else
          {:error, :participant_not_found}
        end

      {:error, :not_found} ->
        {:error, :room_not_found}
    end
  end

  @doc """
  Send ringing notification to callees.
  """
  @spec ring(String.t(), [String.t()]) :: :ok | {:error, term()}
  def ring(room_id, callee_ids) when is_list(callee_ids) do
    case WebRTC.get_room(room_id) do
      {:ok, room} ->
        Enum.each(callee_ids, fn callee_id ->
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "webrtc:user:#{callee_id}",
            {:incoming_call, %{
              room_id: room_id,
              caller_id: room.creator_id,
              type: room.type
            }}
          )
        end)

        :ok

      {:error, _} = error ->
        error
    end
  end

  @doc """
  Get ICE server configuration for clients.
  """
  @spec get_ice_servers() :: [map()]
  def get_ice_servers do
    stun =
      config(:stun_servers) || [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302"
      ]

    turn = config(:turn_servers) || []

    stun_configs =
      Enum.map(stun, fn url ->
        %{urls: url}
      end)

    turn_configs =
      Enum.map(turn, fn server ->
        %{
          urls: server[:urls] || server["urls"],
          username: server[:username] || server["username"],
          credential: server[:credential] || server["credential"]
        }
      end)

    stun_configs ++ turn_configs
  end

  @doc """
  Check if SFU mode is enabled.
  """
  @spec sfu_enabled?() :: boolean()
  def sfu_enabled? do
    config(:sfu_enabled) == true
  end

  @doc """
  Get SFU connection URL.
  """
  @spec get_sfu_url() :: String.t() | nil
  def get_sfu_url do
    config(:sfu_url)
  end

  defp config(key) do
    Application.get_env(:cgraph, CGraph.WebRTC, [])
    |> Keyword.get(key)
  end
end
