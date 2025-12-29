defmodule CgraphWeb.API.V1.ChannelMessageController do
  @moduledoc """
  Controller for messages within group channels.
  """
  use CgraphWeb, :controller

  alias Cgraph.Groups

  action_fallback CgraphWeb.FallbackController

  @doc """
  List messages in a channel.
  """
  def index(conn, %{"group_id" => group_id, "channel_id" => channel_id} = params) do
    user = conn.assigns.current_user
    
    opts = [
      page: Map.get(params, "page", "1") |> String.to_integer(),
      per_page: Map.get(params, "per_page", "50") |> String.to_integer() |> min(100),
      before: Map.get(params, "before"),
      after: Map.get(params, "after")
    ]

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {messages, total} <- Groups.list_channel_messages(channel, opts) do
      render(conn, :index,
        messages: messages,
        meta: %{page: opts[:page], per_page: opts[:per_page], total: total}
      )
    end
  end

  @doc """
  Send a message to a channel.
  """
  def create(conn, %{"group_id" => group_id, "channel_id" => channel_id} = params) do
    user = conn.assigns.current_user
    
    message_params = %{
      content: Map.get(params, "content"),
      attachments: Map.get(params, "attachments", []),
      reply_to_id: Map.get(params, "reply_to_id")
    }

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         :ok <- Groups.authorize(user, group, :send_messages),
         {:ok, message} <- Groups.send_channel_message(channel, user, message_params) do
      # Broadcast via Phoenix Channels
      CgraphWeb.Endpoint.broadcast!(
        "channel:#{channel_id}",
        "new_message",
        %{message: CgraphWeb.API.V1.MessageJSON.message_data(message)}
      )

      conn
      |> put_status(:created)
      |> render(:show, message: message)
    end
  end

  @doc """
  Send typing indicator.
  """
  def typing(conn, %{"group_id" => group_id, "channel_id" => channel_id}) do
    user = conn.assigns.current_user

    with {:ok, _group} <- Groups.get_user_group(user, group_id) do
      # Broadcast typing indicator
      CgraphWeb.Endpoint.broadcast!(
        "channel:#{channel_id}",
        "typing",
        %{
          user_id: user.id,
          username: user.username
        }
      )

      json(conn, %{status: "ok"})
    end
  end
end
