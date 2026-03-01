defmodule CGraphWeb.UserSocket do
  @moduledoc """
  WebSocket handler for real-time features.

  Authenticates connections using JWT tokens and routes to channels.
  """
  use Phoenix.Socket

  alias CGraph.Accounts

  # Channels
  channel "conversation:*", CGraphWeb.ConversationChannel
  channel "group:*", CGraphWeb.GroupChannel
  channel "user:*", CGraphWeb.UserChannel
  channel "presence:*", CGraphWeb.PresenceChannel
  channel "call:*", CGraphWeb.CallChannel
  channel "webrtc:lobby", CGraphWeb.WebRTCLobbyChannel
  channel "voice:*", CGraphWeb.VoiceStateChannel

  # Gamification Channels
  channel "gamification:*", CGraphWeb.GamificationChannel
  channel "marketplace:*", CGraphWeb.MarketplaceChannel
  channel "events:*", CGraphWeb.EventsChannel

  # Forum Channels
  channel "forum:*", CGraphWeb.ForumChannel
  channel "thread:*", CGraphWeb.ThreadChannel

  # AI Channel (streaming AI responses)
  channel "ai:*", CGraphWeb.Channels.AIChannel

  # Collaborative editing (Yjs CRDT sync)
  channel "document:*", CGraphWeb.Channels.DocumentChannel

  # QR code login (unauthenticated — web client awaits mobile approval)
  channel "qr_auth:*", CGraphWeb.QrAuthChannel

  @impl true
  @doc "Authenticates and establishes a socket connection."
  @spec connect(map(), Phoenix.Socket.t(), map()) :: {:ok, Phoenix.Socket.t()} | :error
  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user_id} ->
        case Accounts.get_user(user_id) do
          {:error, :not_found} ->
            :error

          {:ok, user} ->
            socket = socket
              |> assign(:current_user, user)
              |> assign(:token, token)

            {:ok, socket}
        end

      {:error, _reason} ->
        :error
    end
  end

  # Allow unauthenticated connections for QR auth channels
  def connect(%{"qr_auth" => "true"}, socket, _connect_info) do
    {:ok, assign(socket, :current_user, nil)}
  end

  def connect(_params, _socket, _connect_info) do
    :error
  end

  @impl true
  @doc "Returns the socket identifier for the connection."
  @spec id(Phoenix.Socket.t()) :: String.t() | nil
  def id(%{assigns: %{current_user: nil}}), do: nil
  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"

  defp verify_token(token) do
    case CGraph.Guardian.decode_and_verify(token) do
      {:ok, claims} -> {:ok, claims["sub"]}
      {:error, reason} -> {:error, reason}
    end
  end
end
