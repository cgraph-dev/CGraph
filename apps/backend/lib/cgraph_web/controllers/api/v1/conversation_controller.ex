defmodule CGraphWeb.API.V1.ConversationController do
  @moduledoc """
  Controller for direct message conversations.

  Supports both 1:1 direct conversations and group conversations.
  Creating a conversation with existing participants returns the
  existing conversation (idempotent).
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Messaging

  action_fallback CGraphWeb.FallbackController

  @doc """
  List all conversations for the current user with pagination.

  Query params:
  - page: Page number (default: 1)
  - per_page: Items per page (default: 20, max: 100)
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> parse_integer(1)
    per_page = Map.get(params, "per_page", "20") |> parse_integer(20) |> min(100)

    {conversations, total} = Messaging.list_user_conversations(user,
      page: page,
      per_page: per_page
    )

    render(conn, :index,
      conversations: conversations,
      current_user: user,
      meta: %{page: page, per_page: per_page, total: total}
    )
  end

  # Safely parses an integer from string or returns default
  defp parse_integer(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  defp parse_integer(val, _default) when is_integer(val), do: val
  defp parse_integer(_, default), do: default

  @doc """
  Get a specific conversation by ID.
  Returns 403 if user is not a participant, 404 if not found.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- Messaging.get_user_conversation(user, id) do
      render(conn, :show, conversation: conversation, current_user: user)
    end
  end

  @doc """
  Start a new conversation with one or more users.

  For 1:1 conversations: returns existing conversation if one exists (200)
  For group conversations: creates new group with optional name

  Params:
  - participant_ids: List of user IDs to include (required)
  - message: Optional initial message content
  - name: Optional group name (for multi-participant conversations)
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"participant_ids" => participant_ids} = params) when is_list(participant_ids) do
    user = conn.assigns.current_user
    message_content = Map.get(params, "message")
    name = Map.get(params, "name")

    case participant_ids do
      [recipient_id] ->
        # Single recipient: direct conversation (may return existing)
        create_direct_conversation(conn, user, recipient_id, message_content)

      _ ->
        # Multiple recipients: group conversation
        create_group_conversation(conn, user, participant_ids, name, message_content)
    end
  end

  # Fallback for legacy recipient_id param
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"recipient_id" => recipient_id} = params) do
    user = conn.assigns.current_user
    message_content = Map.get(params, "message")
    create_direct_conversation(conn, user, recipient_id, message_content)
  end

  # Creates or retrieves a 1:1 direct conversation
  # Returns 200 if existing, 201 if newly created
  defp create_direct_conversation(conn, user, recipient_id, message_content) do
    case Messaging.create_or_get_conversation(user, recipient_id) do
      {:ok, conversation, :existing} ->
        conn
        |> put_status(:ok)
        |> render(:show, conversation: conversation, current_user: user)

      {:ok, conversation, :created} ->
        with {:ok, _} <- maybe_send_message(conversation, user, message_content) do
          conn
          |> put_status(:created)
          |> render(:show, conversation: conversation, current_user: user)
        end

      # Handle legacy tuple format (without created/existing indicator)
      {:ok, conversation} ->
        with {:ok, _} <- maybe_send_message(conversation, user, message_content) do
          conn
          |> put_status(:created)
          |> render(:show, conversation: conversation, current_user: user)
        end

      {:error, _} = error -> error
    end
  end

  # Creates a group conversation with multiple participants
  # NOTE: Group conversations are currently in development (v0.8.0 roadmap)
  defp create_group_conversation(conn, _user, _participant_ids, _name, _message_content) do
    conn
    |> put_status(:bad_request)
    |> put_view(json: CGraphWeb.ErrorJSON)
    |> render(:error,
      status: 400,
      code: "group_conversations_not_supported",
      message: "Group conversations are coming in v0.8.0. For now, please use 1:1 direct messages or Group Channels for multi-user communication."
    )
  end

  defp maybe_send_message(_conversation, _user, nil), do: {:ok, nil}
  defp maybe_send_message(conversation, user, content) do
    Messaging.send_message(conversation, user, %{content: content})
  end

  @doc """
  Mark all messages in a conversation as read.

  POST /api/v1/conversations/:id/read

  This marks all messages up to the latest as read for the current user,
  resetting the unread count to 0.
  """
  @spec mark_read(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def mark_read(conn, %{"conversation_id" => conversation_id}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, _result} <- Messaging.mark_conversation_read(conversation, user) do
      render(conn, :mark_read, conversation_id: conversation_id)
    end
  end

  @doc """
  Update disappearing message TTL for a conversation.

  PUT /api/v1/conversations/:id/ttl

  Body: { "ttl": 86400 }  (seconds, null = off)
  Valid values: null, 86400 (24h), 604800 (7d), 2592000 (30d)
  """
  @spec update_ttl(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_ttl(conn, %{"conversation_id" => conversation_id} = params) do
    user = conn.assigns.current_user
    ttl = params["ttl"]

    valid_ttls = [nil, 86_400, 604_800, 2_592_000]

    if ttl in valid_ttls do
      with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
           {:ok, updated} <- Messaging.update_conversation_ttl(conversation, ttl) do
        render_data(conn, %{
          conversation_id: updated.id,
          message_ttl: updated.message_ttl
        })
      end
    else
      render_error(conn, 400, "Invalid TTL value. Use null, 86400, 604800, or 2592000")
    end
  end
end
