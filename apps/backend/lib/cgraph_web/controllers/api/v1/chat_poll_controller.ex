defmodule CGraphWeb.API.V1.ChatPollController do
  @moduledoc """
  REST API for in-chat polls (distinct from forum PollController).
  """
  use CGraphWeb, :controller

  alias CGraph.Messaging.ChatPoll

  action_fallback CGraphWeb.FallbackController

  @doc "POST /api/v1/conversations/:conversation_id/polls"
  def create(conn, %{"conversation_id" => conv_id} = params) do
    user = conn.assigns.current_user

    opts = [
      multiple_choice: params["multiple_choice"] || false,
      anonymous: params["anonymous"] || false,
      closes_at: parse_datetime(params["closes_at"])
    ]

    case ChatPoll.create_poll(user.id, conv_id, params["question"], params["options"] || [], opts) do
      {:ok, poll} ->
        conn
        |> put_status(:created)
        |> json(%{data: poll_data(poll)})

      {:error, :not_member} ->
        conn |> put_status(:forbidden) |> json(%{error: "Not a member of this conversation"})

      {:error, %Ecto.Changeset{} = cs} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: format_errors(cs)})
    end
  end

  @doc "GET /api/v1/polls/:id"
  def show(conn, %{"id" => poll_id}) do
    case ChatPoll.get_poll(poll_id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{error: "Poll not found"})

      poll ->
        results = ChatPoll.get_poll_results(poll_id)
        json(conn, %{data: Map.merge(poll_data(poll), %{results: results})})
    end
  end

  @doc "POST /api/v1/polls/:id/vote"
  def vote(conn, %{"id" => poll_id} = params) do
    user = conn.assigns.current_user

    case ChatPoll.vote(poll_id, user.id, params["option_id"]) do
      {:ok, results} ->
        json(conn, %{data: results})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Poll not found"})

      {:error, :poll_closed} ->
        conn |> put_status(:conflict) |> json(%{error: "Poll is closed"})

      {:error, :invalid_option} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: "Invalid option"})
    end
  end

  @doc "DELETE /api/v1/polls/:id/vote/:option_id"
  def retract_vote(conn, %{"id" => poll_id, "option_id" => option_id}) do
    user = conn.assigns.current_user

    case ChatPoll.retract_vote(poll_id, user.id, option_id) do
      :ok ->
        json(conn, %{data: %{status: "retracted"}})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Poll not found"})

      {:error, :poll_closed} ->
        conn |> put_status(:conflict) |> json(%{error: "Poll is closed"})
    end
  end

  @doc "POST /api/v1/polls/:id/close"
  def close(conn, %{"id" => poll_id}) do
    user = conn.assigns.current_user

    case ChatPoll.close_poll(poll_id, user.id) do
      {:ok, poll} ->
        results = ChatPoll.get_poll_results(poll_id)
        json(conn, %{data: Map.merge(poll_data(poll), %{results: results})})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "Poll not found"})

      {:error, :unauthorized} ->
        conn |> put_status(:forbidden) |> json(%{error: "Only the creator can close the poll"})

      {:error, :already_closed} ->
        conn |> put_status(:conflict) |> json(%{error: "Poll is already closed"})
    end
  end

  defp poll_data(poll) do
    %{
      id: poll.id,
      question: poll.question,
      options: poll.options,
      multiple_choice: poll.multiple_choice,
      anonymous: poll.anonymous,
      closed: poll.closed,
      closes_at: poll.closes_at,
      creator_id: poll.creator_id,
      conversation_id: poll.conversation_id
    }
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(str) when is_binary(str) do
    case DateTime.from_iso8601(str) do
      {:ok, dt, _} -> dt
      _ -> nil
    end
  end
  defp parse_datetime(_), do: nil

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
