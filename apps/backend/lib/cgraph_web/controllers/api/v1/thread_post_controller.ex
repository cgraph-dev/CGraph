defmodule CgraphWeb.API.V1.ThreadPostController do
  @moduledoc """
  API controller for thread posts (replies).
  Part of the MyBB-style forum hosting platform.
  """
  use CgraphWeb, :controller
  
  alias Cgraph.Forums
  
  action_fallback CgraphWeb.FallbackController

  @doc """
  List posts in a thread.
  GET /api/v1/threads/:thread_id/posts
  """
  def index(conn, %{"thread_id" => thread_id} = params) do
    page = String.to_integer(Map.get(params, "page", "1"))
    per_page = String.to_integer(Map.get(params, "per_page", "20"))
    
    opts = [page: page, per_page: per_page]
    {posts, meta} = Forums.list_thread_posts(thread_id, opts)
    
    render(conn, :index, posts: posts, meta: meta)
  end

  @doc """
  Get a single post.
  GET /api/v1/threads/:thread_id/posts/:id
  """
  def show(conn, %{"id" => id}) do
    with {:ok, post} <- Forums.get_thread_post(id) do
      render(conn, :show, post: post)
    end
  end

  @doc """
  Create a new post (reply).
  POST /api/v1/threads/:thread_id/posts
  """
  def create(conn, %{"thread_id" => thread_id, "post" => post_params}) do
    user = conn.assigns.current_user
    
    with {:ok, thread} <- Forums.get_thread(thread_id),
         false <- thread.is_locked,
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, _member} <- Forums.get_or_create_member(board.forum_id, user.id),
         post_attrs <- Map.merge(post_params, %{
           "thread_id" => thread_id,
           "author_id" => user.id
         }),
         {:ok, post} <- Forums.create_thread_post(post_attrs) do
      conn
      |> put_status(:created)
      |> render(:show, post: post)
    else
      true -> {:error, :thread_locked}
      error -> error
    end
  end

  @doc """
  Update a post.
  PUT /api/v1/threads/:thread_id/posts/:id
  """
  def update(conn, %{"id" => id, "post" => post_params}) do
    user = conn.assigns.current_user
    
    with {:ok, post} <- Forums.get_thread_post(id),
         {:ok, thread} <- Forums.get_thread(post.thread_id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         true <- post.author_id == user.id or Forums.is_moderator?(forum, user),
         {:ok, updated_post} <- Forums.update_thread_post(post, post_params, user.id) do
      render(conn, :show, post: updated_post)
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  @doc """
  Delete a post.
  DELETE /api/v1/threads/:thread_id/posts/:id
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    
    with {:ok, post} <- Forums.get_thread_post(id),
         {:ok, thread} <- Forums.get_thread(post.thread_id),
         {:ok, board} <- Forums.get_board(thread.board_id),
         {:ok, forum} <- Forums.get_forum(board.forum_id),
         true <- post.author_id == user.id or Forums.is_moderator?(forum, user),
         {:ok, _deleted} <- Forums.delete_thread_post(post) do
      send_resp(conn, :no_content, "")
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  @doc """
  Vote on a post.
  POST /api/v1/threads/:thread_id/posts/:id/vote
  """
  def vote(conn, %{"id" => id, "value" => value}) when value in [1, -1, "1", "-1"] do
    user = conn.assigns.current_user
    value = if is_binary(value), do: String.to_integer(value), else: value
    
    case Forums.vote_post(user.id, id, value) do
      {:ok, :removed} ->
        json(conn, %{data: %{voted: false, value: 0}})
      {:ok, vote} ->
        json(conn, %{data: %{voted: true, value: vote.value}})
      {:error, _} = error ->
        error
    end
  end
end
