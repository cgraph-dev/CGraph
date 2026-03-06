defmodule CGraphWeb.API.V1.SecretChatController do
  @moduledoc """
  REST API for secret chat lifecycle management.

  Secret chats are Telegram-style device-bound encrypted conversations.
  The server never sees plaintext — only ciphertext through the channel.

  ## Endpoints

  - `POST   /api/v1/secret-chats`            — Create a secret chat
  - `GET    /api/v1/secret-chats`            — List user's active secret chats
  - `GET    /api/v1/secret-chats/:id`        — Show a specific secret chat
  - `DELETE /api/v1/secret-chats/:id`        — Terminate and hard-delete all messages
  - `PUT    /api/v1/secret-chats/:id/timer`  — Set self-destruct timer
  """
  use CGraphWeb, :controller

  alias CGraph.Messaging.SecretChat

  action_fallback CGraphWeb.FallbackController

  # ============================================================================
  # Conversation Lifecycle
  # ============================================================================

  @doc """
  Create a new secret chat.

  POST /api/v1/secret-chats

  Body: `{"recipient_id": "uuid", "device_id": "optional", "fingerprint": "optional"}`
  """
  def create(conn, %{"recipient_id" => recipient_id} = params) do
    user = conn.assigns.current_user

    opts =
      []
      |> maybe_put(:device_id, params["device_id"])
      |> maybe_put(:fingerprint, params["fingerprint"])

    case SecretChat.create_secret_conversation(user, recipient_id, opts) do
      {:ok, conversation} ->
        conn
        |> put_status(:created)
        |> render(:show, conversation: conversation)

      {:error, :already_exists} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "An active secret chat already exists with this user"})

      {:error, :cannot_chat_with_self} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Cannot create a secret chat with yourself"})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Invalid parameters", details: format_errors(changeset)})
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "recipient_id is required"})
  end

  @doc """
  List authenticated user's active secret conversations.

  GET /api/v1/secret-chats
  """
  def index(conn, _params) do
    user = conn.assigns.current_user
    conversations = SecretChat.list_secret_conversations(user.id)

    conn
    |> put_status(:ok)
    |> render(:index, conversations: conversations)
  end

  @doc """
  Show a specific secret conversation.

  GET /api/v1/secret-chats/:id
  """
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case SecretChat.get_secret_conversation(id, user.id) do
      {:ok, conversation} ->
        conn
        |> put_status(:ok)
        |> render(:show, conversation: conversation)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Secret chat not found"})
    end
  end

  @doc """
  Terminate a secret chat and hard-delete all messages.

  DELETE /api/v1/secret-chats/:id
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- SecretChat.get_secret_conversation(id, user.id),
         {:ok, _terminated} <- SecretChat.destroy_secret_chat(conversation, user.id) do
      conn
      |> put_status(:ok)
      |> json(%{message: "Secret chat terminated and all messages deleted"})
    else
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Secret chat not found"})

      {:error, _reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to terminate secret chat"})
    end
  end

  @doc """
  Set the self-destruct timer on a secret conversation.

  PUT /api/v1/secret-chats/:id/timer

  Body: `{"seconds": 5|30|60|300|3600|86400|604800|null}`
  """
  def set_timer(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user
    seconds = params["seconds"]

    with {:ok, conversation} <- SecretChat.get_secret_conversation(id, user.id),
         {:ok, updated} <- SecretChat.set_self_destruct_timer(conversation, user.id, seconds) do
      conn
      |> put_status(:ok)
      |> render(:show, conversation: updated)
    else
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Secret chat not found"})

      {:error, :not_participant} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Not a participant in this chat"})

      {:error, %Ecto.Changeset{} = changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Invalid timer value", details: format_errors(changeset)})
    end
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp maybe_put(opts, _key, nil), do: opts
  defp maybe_put(opts, _key, ""), do: opts
  defp maybe_put(opts, key, value), do: Keyword.put(opts, key, value)

  defp format_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
