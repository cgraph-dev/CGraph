defmodule CGraphWeb.API.V1.LiveKitController do
  @moduledoc """
  REST controller for LiveKit token generation.

  Issues LiveKit access tokens for authenticated users to join
  group voice/video calls via the LiveKit SFU.

  ## Endpoints

  - `POST /api/v1/livekit/token` — Generate a LiveKit access token
  """
  use CGraphWeb, :controller

  alias CGraph.WebRTC.LiveKitToken
  alias CGraph.WebRTC.LiveKit

  action_fallback CGraphWeb.FallbackController

  @doc """
  Generate a LiveKit access token for the authenticated user.

  POST /api/v1/livekit/token

  ## Request Body

  - `room_name` (required) — LiveKit room name to join
  - `channel_id` (optional) — Channel ID for group authorization check
  - `group_id` (optional) — Group ID for membership verification

  ## Response

  ```json
  {
    "token": "eyJ...",
    "url": "wss://livekit-server:7880"
  }
  ```
  """
  @spec create_token(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_token(conn, params) do
    user = conn.assigns.current_user

    with {:ok, room_name} <- require_param(params, "room_name"),
         :ok <- authorize_room_access(user, params),
         :ok <- check_livekit_configured() do
      token_opts = [
        name: user.display_name || user.username,
        metadata: Jason.encode!(%{user_id: user.id, username: user.username})
      ]

      case LiveKitToken.generate_token(room_name, user.id, token_opts) do
        {:ok, token} ->
          # Ensure room exists in LiveKit (idempotent)
          _ = LiveKit.create_room(room_name, max_participants: 50)

          conn
          |> put_status(:ok)
          |> json(%{
            token: token,
            url: LiveKitToken.get_url()
          })

        {:error, {:missing_config, key}} ->
          conn
          |> put_status(:service_unavailable)
          |> json(%{error: "LiveKit not configured: missing #{key}"})
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp require_param(params, key) do
    case Map.get(params, key) do
      nil -> {:error, {:missing_param, key}}
      "" -> {:error, {:missing_param, key}}
      value -> {:ok, value}
    end
  end

  defp authorize_room_access(user, %{"channel_id" => channel_id, "group_id" => group_id})
       when is_binary(channel_id) and is_binary(group_id) do
    # Verify user is a member of the group that owns this channel
    case CGraph.Groups.get_group(group_id) do
      {:ok, group} ->
        case CGraph.Groups.get_member_by_user(group, user.id) do
          nil -> {:error, :forbidden}
          _member -> :ok
        end

      _ ->
        {:error, :forbidden}
    end
  end

  defp authorize_room_access(_user, _params) do
    # No channel/group specified — allow (e.g., direct calls managed via P2P)
    :ok
  end

  defp check_livekit_configured do
    if LiveKitToken.configured?() do
      :ok
    else
      {:error, :livekit_not_configured}
    end
  end
end
