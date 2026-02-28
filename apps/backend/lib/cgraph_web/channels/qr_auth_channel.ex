defmodule CGraphWeb.QrAuthChannel do
  @moduledoc """
  WebSocket channel for QR code login protocol.

  The web client joins `qr_auth:{session_id}` after creating a QR session.
  No authentication is required to join — the channel is used to receive
  the `auth_complete` event once the mobile client approves the login.

  The channel verifies the session exists in Redis on join to prevent
  joining arbitrary/expired channels.
  """
  use CGraphWeb, :channel

  require Logger

  alias CGraph.Auth.QrLogin

  @impl true
  @doc """
  Handle channel join for QR auth sessions.

  Verifies the session exists in Redis before allowing the join.
  No user authentication is required.
  """
  def join("qr_auth:" <> session_id, _params, socket) do
    case QrLogin.get_session(session_id) do
      {:ok, _session} ->
        Logger.info("qr_auth_channel_joined", session_id: session_id)
        {:ok, assign(socket, :session_id, session_id)}

      {:error, :not_found} ->
        Logger.warning("qr_auth_channel_join_rejected",
          session_id: session_id,
          reason: "session_not_found"
        )

        {:error, %{reason: "session_not_found_or_expired"}}

      {:error, _reason} ->
        {:error, %{reason: "internal_error"}}
    end
  end
end
