defmodule CGraphWeb.UserSocket do
  @moduledoc """
  WebSocket handler for real-time features.

  Authenticates connections using JWT tokens and routes to channels.
  """
  use Phoenix.Socket

  alias CGraph.Accounts

  # Channels
  channel "room:*", CGraphWeb.RoomChannel
  channel "conversation:*", CGraphWeb.ConversationChannel
  channel "group:*", CGraphWeb.GroupChannel
  channel "user:*", CGraphWeb.UserChannel
  channel "presence:*", CGraphWeb.PresenceChannel
  channel "call:*", CGraphWeb.CallChannel
  
  # Gamification Channels
  channel "gamification:*", CGraphWeb.GamificationChannel
  channel "marketplace:*", CGraphWeb.MarketplaceChannel
  channel "events:*", CGraphWeb.EventsChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user_id} ->
        case Accounts.get_user(user_id) do
          {:error, :not_found} ->
            :error

          {:ok, user} ->
            # Store token for periodic validation
            socket = socket
              |> assign(:current_user, user)
              |> assign(:token, token)

            # Schedule first token check in 5 minutes
            Process.send_after(self(), :check_token, :timer.minutes(5))

            {:ok, socket}
        end

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info) do
    :error
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.current_user.id}"

  # Periodic token validation to disconnect expired sessions
  def handle_info(:check_token, socket) do
    case verify_token(socket.assigns.token) do
      {:ok, _user_id} ->
        # Token still valid, schedule next check in 5 minutes
        Process.send_after(self(), :check_token, :timer.minutes(5))
        {:noreply, socket}

      {:error, _reason} ->
        # Token expired or invalid, disconnect gracefully
        {:stop, :normal, socket}
    end
  end

  defp verify_token(token) do
    case CGraph.Guardian.decode_and_verify(token) do
      {:ok, claims} -> {:ok, claims["sub"]}
      {:error, reason} -> {:error, reason}
    end
  end
end
