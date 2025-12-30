defmodule CgraphWeb.API.V1.ThreadController do
  @moduledoc """
  API controller for forum threads.
  Part of the MyBB-style forum hosting platform.
  """
  use CgraphWeb, :controller
  
  alias Cgraph.Forums
  
  action_fallback CgraphWeb.FallbackController

  @doc """
  List threads in a board.
  GET /api/v1/boards/:board_id/threads
  """
  def index(conn, %{"board_id" => board_id} = params) do
    page = String.to_integer(Map.get(params, "page", "1"))
    per_page = String.to_integer(Map.get(params, "per_page", "20"))
    sort = Map.get(params, "sort", "latest")
    
    opts = [page: page, per_page: per_page, sort: sort]
    {threads, meta} = Forums.list_threads(board_id, opts)
    
    render(conn, :index, threads: threads, meta: meta)
  end

  @doc """
  Get a single thread.
  GET /api/v1/boards/:board_id/threads/:id
  """
  def show(conn, %{"id" => id}) do
    with {:ok, thread} <- Forums.get_thread(id) do
      # Increment view count
      Forums.increment_thread_views(id)
      render(conn, :show, thread: thread)
    end
  end

  @doc """
  Get a thread by slug.
  GET /api/v1/boards/:board_id/threads/by-slug/:slug
  """
  def show_by_slug(conn, %{"board_id" => board_id, "slug" => slug}) do
    with {:ok, thread} <- Forums.get_thread_by_slug(board_id, slug) do
      Forums.increment_thread_views(thread.id)
      render(conn, :show, thread: thread)
    end
  end

  @doc """
  Create a new thread.
  POST /api/v1/boards/:board_id/threads
  """
  def create(conn, %{"board_id" => board_id, "thread" => thread_params}) do
    user = conn.assigns.current_user
    
    with {:ok, board} <- Forums.get_board(board_id),
         {:ok, _member} <- Forums.get_or_create_member(board.forum_id, user.id),
         thread_attrs <- Map.merge(thread_params, %{
           "board_id" => board_id,
           "author_id" => user.id
         }),
         {:ok, thread} <- Forums.create_thread(thread_attrs) do
      conn
      |> put_status(:created)
      |> render(:show, thread: thread)
    end
  end

  @doc """
  Update a thread.
  PUT /api/v1/boards/:board_id/threads/:id
  """
  def update(conn, %{"id" => id, "thread" => thread_params}) do
    user = conn.assigns.current_user
    
    with {:ok, thread} <- Forums.get_thread(id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         true <- thread.author_id == user.id or Forums.is_moderator?(forum, user),
         {:ok, updated_thread} <- Forums.update_thread(thread, thread_params) do
      render(conn, :show, thread: updated_thread)
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  @doc """
  Delete a thread.
  DELETE /api/v1/boards/:board_id/threads/:id
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    
    with {:ok, thread} <- Forums.get_thread(id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         true <- thread.author_id == user.id or Forums.is_moderator?(forum, user),
         {:ok, _deleted} <- Forums.delete_thread(thread) do
      send_resp(conn, :no_content, "")
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  @doc """
  Pin or unpin a thread.
  POST /api/v1/boards/:board_id/threads/:id/pin
  """
  def pin(conn, %{"id" => id, "pinned" => pinned}) do
    user = conn.assigns.current_user
    
    with {:ok, thread} <- Forums.get_thread(id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         true <- Forums.is_moderator?(forum, user),
         {1, nil} <- Forums.toggle_thread_pin(id, pinned) do
      {:ok, updated} = Forums.get_thread(id)
      render(conn, :show, thread: updated)
    else
      false -> {:error, :forbidden}
      {0, _} -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  Lock or unlock a thread.
  POST /api/v1/boards/:board_id/threads/:id/lock
  """
  def lock(conn, %{"id" => id, "locked" => locked}) do
    user = conn.assigns.current_user
    
    with {:ok, thread} <- Forums.get_thread(id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         true <- Forums.is_moderator?(forum, user),
         {1, nil} <- Forums.toggle_thread_lock(id, locked) do
      {:ok, updated} = Forums.get_thread(id)
      render(conn, :show, thread: updated)
    else
      false -> {:error, :forbidden}
      {0, _} -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  Vote on a thread.
  POST /api/v1/boards/:board_id/threads/:id/vote
  """
  def vote(conn, %{"id" => id, "value" => value}) when value in [1, -1, "1", "-1"] do
    user = conn.assigns.current_user
    value = if is_binary(value), do: String.to_integer(value), else: value
    
    case Forums.vote_thread(user.id, id, value) do
      {:ok, :removed} ->
        json(conn, %{data: %{voted: false, value: 0}})
      {:ok, vote} ->
        json(conn, %{data: %{voted: true, value: vote.value}})
      {:error, _} = error ->
        error
    end
  end
end
