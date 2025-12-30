defmodule CgraphWeb.API.V1.BoardController do
  @moduledoc """
  API controller for forum boards (sections/categories).
  Part of the MyBB-style forum hosting platform.
  """
  use CgraphWeb, :controller
  
  alias Cgraph.Forums
  
  action_fallback CgraphWeb.FallbackController

  @doc """
  List boards for a forum.
  GET /api/v1/forums/:forum_id/boards
  """
  def index(conn, %{"forum_id" => forum_id} = params) do
    include_hidden = Map.get(params, "include_hidden", "false") == "true"
    parent_id = Map.get(params, "parent_id")
    
    opts = [include_hidden: include_hidden, parent_id: parent_id]
    boards = Forums.list_boards(forum_id, opts)
    
    render(conn, :index, boards: boards)
  end

  @doc """
  Get a single board.
  GET /api/v1/forums/:forum_id/boards/:id
  """
  def show(conn, %{"forum_id" => forum_id, "id" => id}) do
    with {:ok, board} <- Forums.get_board(id),
         true <- board.forum_id == forum_id do
      render(conn, :show, board: board)
    else
      false -> {:error, :not_found}
      error -> error
    end
  end

  @doc """
  Get a board by slug.
  GET /api/v1/forums/:forum_id/boards/by-slug/:slug
  """
  def show_by_slug(conn, %{"forum_id" => forum_id, "slug" => slug}) do
    with {:ok, board} <- Forums.get_board_by_slug(forum_id, slug) do
      render(conn, :show, board: board)
    end
  end

  @doc """
  Create a new board.
  POST /api/v1/forums/:forum_id/boards
  """
  def create(conn, %{"forum_id" => forum_id, "board" => board_params}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         true <- Forums.is_moderator?(forum, user),
         {:ok, board} <- Forums.create_board(Map.put(board_params, "forum_id", forum_id)) do
      conn
      |> put_status(:created)
      |> render(:show, board: board)
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  @doc """
  Update a board.
  PUT /api/v1/forums/:forum_id/boards/:id
  """
  def update(conn, %{"forum_id" => forum_id, "id" => id, "board" => board_params}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         true <- Forums.is_moderator?(forum, user),
         {:ok, board} <- Forums.get_board(id),
         true <- board.forum_id == forum_id,
         {:ok, updated_board} <- Forums.update_board(board, board_params) do
      render(conn, :show, board: updated_board)
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end

  @doc """
  Delete a board.
  DELETE /api/v1/forums/:forum_id/boards/:id
  """
  def delete(conn, %{"forum_id" => forum_id, "id" => id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         true <- Forums.is_moderator?(forum, user),
         {:ok, board} <- Forums.get_board(id),
         true <- board.forum_id == forum_id,
         {:ok, _deleted} <- Forums.delete_board(board) do
      send_resp(conn, :no_content, "")
    else
      false -> {:error, :forbidden}
      error -> error
    end
  end
end
