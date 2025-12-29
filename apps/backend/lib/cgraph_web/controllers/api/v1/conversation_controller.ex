defmodule CgraphWeb.API.V1.ConversationController do
  @moduledoc """
  Controller for direct message conversations.
  
  Supports both 1:1 direct conversations and group conversations.
  Creating a conversation with existing participants returns the
  existing conversation (idempotent).
  """
  use CgraphWeb, :controller

  alias Cgraph.Messaging

  action_fallback CgraphWeb.FallbackController

  @doc """
  List all conversations for the current user with pagination.
  
  Query params:
  - page: Page number (default: 1)
  - per_page: Items per page (default: 20, max: 100)
  """
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
  defp create_group_conversation(conn, user, participant_ids, name, message_content) do
    attrs = %{
      participant_ids: [user.id | participant_ids],
      name: name,
      is_group: true
    }

    with {:ok, conversation} <- Messaging.create_group_conversation(user, attrs),
         {:ok, _} <- maybe_send_message(conversation, user, message_content) do
      conn
      |> put_status(:created)
      |> render(:show, conversation: conversation, current_user: user)
    end
  end

  defp maybe_send_message(_conversation, _user, nil), do: {:ok, nil}
  defp maybe_send_message(conversation, user, content) do
    Messaging.send_message(conversation, user, %{content: content})
  end
end
