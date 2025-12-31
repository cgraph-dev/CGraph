defmodule CgraphWeb.UserSocket do
  @moduledoc """
  WebSocket handler for real-time features.
  
  Authenticates connections using JWT tokens and routes to channels.
  """
  use Phoenix.Socket

  alias Cgraph.Accounts

  # Channels
  channel "room:*", CgraphWeb.RoomChannel
  channel "conversation:*", CgraphWeb.ConversationChannel
  channel "group:*", CgraphWeb.GroupChannel
  channel "user:*", CgraphWeb.UserChannel
  channel "presence:*", CgraphWeb.PresenceChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user_id} ->
        case Accounts.get_user(user_id) do
          {:error, :not_found} -> :error
          {:ok, user} -> {:ok, assign(socket, :current_user, user)}
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

  defp verify_token(token) do
    case Cgraph.Guardian.decode_and_verify(token) do
      {:ok, claims} -> {:ok, claims["sub"]}
      {:error, reason} -> {:error, reason}
    end
  end
end
