defmodule CGraph.Forums.Boards do
  @moduledoc """
  Board management for MyBB-style forum sections.

  Boards are hierarchical containers for threads within a forum.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Forums.Board
  alias CGraph.Repo

  @doc """
  List boards for a forum.

  ## Options
  - `:include_hidden` - include hidden boards (default: false)
  - `:parent_id` - filter by parent board (nil for top-level)
  """
  @spec list_boards(Ecto.UUID.t(), keyword()) :: [Board.t()]
  def list_boards(forum_id, opts \\ []) do
    include_hidden = Keyword.get(opts, :include_hidden, false)
    parent_id = Keyword.get(opts, :parent_id, nil)

    query = Board
      |> exclude_deleted()
      |> where([b], b.forum_id == ^forum_id)
      |> order_by([b], asc: b.position, asc: b.name)

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

    query
    |> preload([:sub_boards])
    |> Repo.all()
  end

  @doc """
  Get a board by ID.
  """
  @spec get_board(Ecto.UUID.t()) :: {:ok, Board.t()} | {:error, :not_found}
  def get_board(id) do
    query = from(b in Board, where: b.id == ^id, preload: [:forum])

    case Repo.one(query) do
      nil -> {:error, :not_found}
      board -> {:ok, board}
    end
  end

  @doc """
  Get a board by forum_id and slug.
  """
  @spec get_board_by_slug(Ecto.UUID.t(), String.t()) :: {:ok, Board.t()} | {:error, :not_found}
  def get_board_by_slug(forum_id, slug) do
    query = Board
      |> exclude_deleted()
      |> where([b], b.forum_id == ^forum_id and b.slug == ^slug)

    case Repo.one(query |> preload([:forum])) do
      nil -> {:error, :not_found}
      board -> {:ok, board}
    end
  end

  @doc """
  Create a board.
  """
  @spec create_board(map()) :: {:ok, Board.t()} | {:error, Ecto.Changeset.t()}
  def create_board(attrs \\ %{}) do
    %Board{}
    |> Board.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a board.
  """
  @spec update_board(Board.t(), map()) :: {:ok, Board.t()} | {:error, Ecto.Changeset.t()}
  def update_board(%Board{} = board, attrs) do
    board
    |> Board.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a board (soft delete).
  """
  @spec delete_board(Board.t()) :: {:ok, Board.t()} | {:error, Ecto.Changeset.t()}
  def delete_board(%Board{} = board) do
    board
    |> Ecto.Changeset.change(deleted_at: DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end
end
