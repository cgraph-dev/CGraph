defmodule CGraphWeb.API.V1.PollController do
  @moduledoc """
  API controller for thread polls.
  """
  use CGraphWeb, :controller

  alias CGraph.Forums.Polls

  action_fallback CGraphWeb.FallbackController

  @doc """
  Show poll for a thread.
  GET /api/v1/threads/:thread_id/poll
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"thread_id" => thread_id}) do
    case Polls.get_thread_poll(thread_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Poll not found"})

      poll ->
        user_id = conn.assigns[:current_user] && conn.assigns.current_user.id
        results = Polls.get_poll_results(poll.id)
        has_voted = if user_id, do: Polls.has_voted?(poll.id, user_id), else: false

        render(conn, :show, poll: poll, results: results, has_voted: has_voted)
    end
  end

  @doc """
  Create a poll for a thread.
  POST /api/v1/threads/:thread_id/poll
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"thread_id" => thread_id} = params) do
    poll_attrs = %{
      question: params["question"],
      options: params["options"],
      is_multiple_choice: params["is_multiple_choice"] || false,
      max_options: params["max_options"] || 1,
      is_public: Map.get(params, "is_public", true),
      closes_at: params["closes_at"]
    }

    case Polls.create_thread_poll(thread_id, poll_attrs) do
      {:ok, poll} ->
        conn
        |> put_status(:created)
        |> render(:show, poll: poll, results: %{option_counts: %{}, total_votes: 0}, has_voted: false)

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  Vote on a thread poll.
  POST /api/v1/threads/:thread_id/poll/vote
  """
  @spec vote(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def vote(conn, %{"thread_id" => thread_id} = params) do
    user_id = conn.assigns.current_user.id
    option_ids = params["option_ids"] || []

    case Polls.get_thread_poll(thread_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Poll not found"})

      poll ->
        case Polls.vote_poll(poll.id, user_id, option_ids) do
          {:ok, _vote} ->
            results = Polls.get_poll_results(poll.id)
            render(conn, :show, poll: poll, results: results, has_voted: true)

          {:error, reason} when is_atom(reason) ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{error: to_string(reason)})

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc """
  Close a poll.
  POST /api/v1/threads/:thread_id/poll/close
  """
  @spec close(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def close(conn, %{"thread_id" => thread_id}) do
    case Polls.get_thread_poll(thread_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Poll not found"})

      poll ->
        changeset = Ecto.Changeset.change(poll, %{closes_at: DateTime.utc_now()})

        case CGraph.Repo.update(changeset) do
          {:ok, updated_poll} ->
            results = Polls.get_poll_results(updated_poll.id)
            user_id = conn.assigns[:current_user] && conn.assigns.current_user.id
            has_voted = if user_id, do: Polls.has_voted?(updated_poll.id, user_id), else: false
            render(conn, :show, poll: updated_poll, results: results, has_voted: has_voted)

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc """
  Update poll settings.
  PUT /api/v1/threads/:thread_id/poll
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"thread_id" => thread_id} = params) do
    case Polls.get_thread_poll(thread_id) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Poll not found"})

      poll ->
        update_attrs =
          params
          |> Map.take(["question", "options", "is_multiple_choice", "max_options", "is_public", "closes_at"])
          |> Enum.into(%{}, fn {k, v} -> {String.to_existing_atom(k), v} end)

        changeset = CGraph.Forums.ThreadPoll.changeset(poll, update_attrs)

        case CGraph.Repo.update(changeset) do
          {:ok, updated_poll} ->
            results = Polls.get_poll_results(updated_poll.id)
            user_id = conn.assigns[:current_user] && conn.assigns.current_user.id
            has_voted = if user_id, do: Polls.has_voted?(updated_poll.id, user_id), else: false
            render(conn, :show, poll: updated_poll, results: results, has_voted: has_voted)

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end
end
