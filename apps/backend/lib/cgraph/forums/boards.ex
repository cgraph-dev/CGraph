defmodule CGraph.Forums.Boards do
  @moduledoc """
  Board management for MyBB-style forum sections.

  Boards are hierarchical containers for threads within a forum.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.Board
  alias CGraph.Repo

  @doc """
  List boards for a forum.

  ## Options
  - `:include_hidden` - include hidden boards (default: false)
  - `:parent_id` - filter by parent board (nil for top-level)
  """
  def list_boards(forum_id, opts \\ []) do
    include_hidden = Keyword.get(opts, :include_hidden, false)
    parent_id = Keyword.get(opts, :parent_id, nil)

    query = from b in Board,
      where: b.forum_id == ^forum_id and is_nil(b.deleted_at),
      order_by: [asc: b.position, asc: b.name]

    query = if parent_id do
      from b in query, where: b.parent_board_id == ^parent_id
    else
      from b in query, where: is_nil(b.parent_board_id)
    end

    query = if include_hidden do
      query
    else
      from b in query, where: b.is_hidden == false
    end

    Repo.all(query)
  end

  @doc """
  Get a board by ID.
  """
  def get_board(id) do
    case Repo.get(Board, id) do
      nil -> {:error, :not_found}
      board -> {:ok, Repo.preload(board, [:forum])}
    end
  end

  @doc """
  Get a board by forum_id and slug.
  """
  def get_board_by_slug(forum_id, slug) do
    query = from b in Board,
      where: b.forum_id == ^forum_id and b.slug == ^slug and is_nil(b.deleted_at)

    case Repo.one(query) do
      nil -> {:error, :not_found}
      board -> {:ok, Repo.preload(board, [:forum])}
    end
  end

  @doc """
  Create a board.
  """
  def create_board(attrs \\ %{}) do
    %Board{}
    |> Board.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a board.
  """
  def update_board(%Board{} = board, attrs) do
    board
    |> Board.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a board (soft delete).
  """
  def delete_board(%Board{} = board) do
    board
    |> Ecto.Changeset.change(deleted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end
end
