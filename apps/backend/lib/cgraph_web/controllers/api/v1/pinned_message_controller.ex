defmodule CGraphWeb.API.V1.PinnedMessageController do
  @moduledoc """
  Controller for pinned messages in channels.
  """
  use CGraphWeb, :controller

  alias CGraph.Groups

  action_fallback CGraphWeb.FallbackController

  @doc """
  List pinned messages for a channel.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"group_id" => group_id, "channel_id" => channel_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         {:ok, channel} <- Groups.get_channel(group, channel_id) do
      pinned_messages = Groups.list_pinned_messages(channel)
      render(conn, :index, pinned_messages: pinned_messages)
    end
  end

  @doc """
  Pin a message in a channel.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"group_id" => group_id, "channel_id" => channel_id, "message_id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_messages),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {:ok, message} <- Groups.get_channel_message(channel, message_id),
         {:ok, pinned} <- Groups.pin_message(message, user) do
      conn
      |> put_status(:created)
      |> render(:show, pinned_message: pinned)
    end
  end

  @doc """
  Unpin a message from a channel.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"group_id" => group_id, "channel_id" => channel_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_messages),
         {:ok, _channel} <- Groups.get_channel(group, channel_id),
         {:ok, pinned} <- Groups.get_pinned_message(channel_id, id),
         {:ok, _} <- Groups.unpin_message(pinned) do
      send_resp(conn, :no_content, "")
    end
  end
end
