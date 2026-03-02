defmodule CGraphWeb.API.V1.ScheduledMessageController do
  @moduledoc """
  CRUD controller for scheduled messages (MSG-15).

  Endpoints:
  - GET    /api/v1/messages/scheduled — list user's scheduled messages
  - POST   /api/v1/messages/scheduled — create a scheduled message
  - PATCH  /api/v1/messages/scheduled/:id — update a scheduled message
  - DELETE /api/v1/messages/scheduled/:id — cancel a scheduled message
  """
  use CGraphWeb, :controller

  alias CGraph.Messaging.ScheduledMessages

  action_fallback CGraphWeb.FallbackController

  @doc """
  List scheduled messages for the current user.

  Optionally filtered by conversation_id query param.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user
    opts = if params["conversation_id"], do: [conversation_id: params["conversation_id"]], else: []
    messages = ScheduledMessages.list_scheduled(user.id, opts)
    render(conn, :index, messages: messages)
  end

  @doc """
  Create a scheduled message.

  Expects `message` params with `content`, `conversation_id`, and `scheduled_at`.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"message" => params}) do
    user = conn.assigns.current_user

    case ScheduledMessages.create_scheduled(user.id, params) do
      {:ok, message} ->
        conn
        |> put_status(:created)
        |> render(:show, message: message)

      {:error, :scheduled_at_must_be_future} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: "Scheduled time must be in the future", code: "INVALID_SCHEDULED_AT"}})

      {:error, :scheduled_at_required} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: "scheduled_at is required", code: "MISSING_SCHEDULED_AT"}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_changeset_errors(changeset)})
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: %{message: "message params required", code: "MISSING_PARAMS"}})
  end

  @doc """
  Update a scheduled message (content, scheduled_at).
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"id" => id, "message" => params}) do
    user = conn.assigns.current_user

    case ScheduledMessages.update_scheduled(user.id, id, params) do
      {:ok, message} ->
        render(conn, :show, message: message)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{message: "Scheduled message not found", code: "NOT_FOUND"}})

      {:error, :scheduled_at_must_be_future} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: "Scheduled time must be in the future", code: "INVALID_SCHEDULED_AT"}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: format_changeset_errors(changeset)})
    end
  end

  @doc """
  Cancel a scheduled message.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case ScheduledMessages.cancel_scheduled(user.id, id) do
      {:ok, _message} ->
        send_resp(conn, :no_content, "")

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{message: "Scheduled message not found", code: "NOT_FOUND"}})
    end
  end

  defp format_changeset_errors(%Ecto.Changeset{} = changeset) do
    errors =
      Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
        Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
          opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
        end)
      end)

    %{message: "Validation failed", details: errors}
  end

  defp format_changeset_errors(error), do: %{message: to_string(error)}
end
