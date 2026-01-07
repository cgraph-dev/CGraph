defmodule CgraphWeb.API.V1.MessageController do
  @moduledoc """
  Controller for messages within conversations.
  """
  use CgraphWeb, :controller

  alias Cgraph.Messaging
  alias CgraphWeb.API.V1.MessageJSON

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

    # Build message params, including file attachment fields
    message_params = %{
      content: Map.get(params, "content"),
      content_type: Map.get(params, "content_type", "text"),
      attachments: Map.get(params, "attachments", []),
      reply_to_id: Map.get(params, "reply_to_id"),
      # File attachment fields
      file_url: Map.get(params, "file_url"),
      file_name: Map.get(params, "file_name"),
      file_size: Map.get(params, "file_size"),
      file_mime_type: Map.get(params, "file_mime_type"),
      thumbnail_url: Map.get(params, "thumbnail_url"),
      is_encrypted: Map.get(params, "is_encrypted", false)
    }
    # Remove nil values to avoid overwriting with nils
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.send_message(conversation, user, message_params) do
      # Broadcast via Phoenix Channels
      CgraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "new_message",
        %{message: MessageJSON.message_data(message)}
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
  Verifies user is a participant in the conversation before broadcasting.
  """
  def typing(conn, %{"conversation_id" => conversation_id}) do
    user = conn.assigns.current_user

    # Verify user is a participant in this conversation
    with {:ok, _conversation} <- Messaging.get_user_conversation(user, conversation_id) do
      # Broadcast typing indicator only after authorization
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
end
