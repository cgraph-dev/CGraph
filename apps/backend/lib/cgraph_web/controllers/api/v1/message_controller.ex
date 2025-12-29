defmodule CgraphWeb.API.V1.MessageController do
  @moduledoc """
  Controller for messages within conversations.
  """
  use CgraphWeb, :controller

  alias Cgraph.Messaging

  action_fallback CgraphWeb.FallbackController

  @doc """
  List messages in a conversation.
  """
  def index(conn, %{"conversation_id" => conversation_id} = params) do
    user = conn.assigns.current_user
    
    opts = [
      page: Map.get(params, "page", "1") |> String.to_integer(),
      per_page: Map.get(params, "per_page", "50") |> String.to_integer() |> min(100),
      before: Map.get(params, "before"),
      after: Map.get(params, "after")
    ]

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {messages, total} <- Messaging.list_messages(conversation, opts) do
      render(conn, :index,
        messages: messages,
        meta: %{page: opts[:page], per_page: opts[:per_page], total: total}
      )
    end
  end

  @doc """
  Send a message to a conversation.
  """
  def create(conn, %{"conversation_id" => conversation_id} = params) do
    user = conn.assigns.current_user
    
    message_params = %{
      content: Map.get(params, "content"),
      attachments: Map.get(params, "attachments", []),
      reply_to_id: Map.get(params, "reply_to_id")
    }

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.send_message(conversation, user, message_params) do
      # Broadcast via Phoenix Channels
      CgraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "new_message",
        %{message: CgraphWeb.API.V1.MessageJSON.message_data(message)}
      )

      conn
      |> put_status(:created)
      |> render(:show, message: message)
    end
  end

  @doc """
  Mark a message as read.
  """
  def mark_read(conn, %{"conversation_id" => conversation_id, "id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, _receipt} <- Messaging.mark_message_read(conversation, user, message_id) do
      json(conn, %{status: "ok"})
    end
  end

  @doc """
  Send typing indicator.
  """
  def typing(conn, %{"conversation_id" => conversation_id}) do
    user = conn.assigns.current_user

    # Broadcast typing indicator
    CgraphWeb.Endpoint.broadcast!(
      "conversation:#{conversation_id}",
      "typing",
      %{
        user_id: user.id,
        username: user.username
      }
    )

    json(conn, %{status: "ok"})
  end
end
