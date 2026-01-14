defmodule CGraphWeb.API.V1.ChannelMessageController do
  @moduledoc """
  Controller for messages within group channels.
  """
  use CGraphWeb, :controller
  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Groups
  alias CGraphWeb.API.V1.MessageJSON

  action_fallback CGraphWeb.FallbackController

  @max_per_page 100

  @doc """
  List messages in a channel.
  """
  def index(conn, %{"group_id" => group_id, "channel_id" => channel_id} = params) do
    user = conn.assigns.current_user

    opts = [
      page: parse_int(params["page"], 1, min: 1),
      per_page: parse_int(params["per_page"], 50, min: 1, max: @max_per_page),
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
      CGraphWeb.Endpoint.broadcast!(
        "channel:#{channel_id}",
        "new_message",
        %{message: MessageJSON.message_data(message)}
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
      CGraphWeb.Endpoint.broadcast!(
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
