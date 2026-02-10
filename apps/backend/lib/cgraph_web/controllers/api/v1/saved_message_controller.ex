defmodule CGraphWeb.API.V1.SavedMessageController do
  @moduledoc """
  API controller for saved (bookmarked) messages.

  Allows users to bookmark messages from any conversation or channel
  and retrieve them later with optional search.

  ## Endpoints

  - `GET  /api/v1/saved-messages`     – List saved messages (with ?search= filter)
  - `POST /api/v1/saved-messages`     – Save/bookmark a message
  - `DELETE /api/v1/saved-messages/:id` – Remove a saved message
  """
  use CGraphWeb, :controller

  alias CGraph.Messaging

  action_fallback CGraphWeb.FallbackController

  @doc """
  List the current user's saved messages.
  GET /api/v1/saved-messages

  Query params:
  - search: optional text filter on message content
  """
  def index(conn, params) do
    user = conn.assigns.current_user
    search = Map.get(params, "search")

    saved_messages = Messaging.list_saved_messages(user.id, search: search)

    data =
      Enum.map(saved_messages, fn sm ->
        msg = sm.message
        sender = msg.sender

        %{
          id: sm.id,
          message_id: msg.id,
          content: msg.content,
          sender_name: sender && (sender.display_name || sender.username) || "Unknown",
          sender_avatar: sender && sender.avatar_url,
          conversation_name: nil,
          saved_at: sm.saved_at && DateTime.to_iso8601(sm.saved_at),
          note: sm.note
        }
      end)

    conn
    |> put_status(200)
    |> json(%{success: true, data: data})
  end

  @doc """
  Save (bookmark) a message.
  POST /api/v1/saved-messages

  Body:
  - message_id: required, the message to bookmark
  - note: optional text note
  """
  def create(conn, params) do
    user = conn.assigns.current_user
    message_id = Map.get(params, "message_id")
    note = Map.get(params, "note")

    case Messaging.save_message(user.id, message_id, note: note) do
      {:ok, saved} ->
        conn
        |> put_status(:created)
        |> json(%{success: true, data: %{id: saved.id, message_id: saved.message_id, saved_at: saved.saved_at}})

      {:error, changeset} ->
        errors = Ecto.Changeset.traverse_errors(changeset, fn {msg, _opts} -> msg end)

        conn
        |> put_status(:unprocessable_entity)
        |> json(%{success: false, errors: errors})
    end
  end

  @doc """
  Remove a saved message.
  DELETE /api/v1/saved-messages/:id
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Messaging.unsave_message(user.id, id) do
      {:ok, _} ->
        conn
        |> put_status(200)
        |> json(%{success: true, message: "Saved message removed"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{success: false, error: "Saved message not found"})
    end
  end
end
