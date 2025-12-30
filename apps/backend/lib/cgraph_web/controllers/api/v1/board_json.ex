defmodule CgraphWeb.API.V1.BoardJSON do
  @moduledoc """
  JSON rendering for boards.
  """

  def index(%{boards: boards}) do
    %{data: Enum.map(boards, &board_data/1)}
  end

  def show(%{board: board}) do
    %{data: board_data(board)}
  end

  defp board_data(board) do
    %{
      id: board.id,
      name: board.name,
      slug: board.slug,
      description: board.description,
      icon: board.icon,
      position: board.position,
      is_locked: board.is_locked,
      is_hidden: board.is_hidden,
      thread_count: board.thread_count,
      post_count: board.post_count,
      last_post_at: board.last_post_at,
      parent_board_id: board.parent_board_id,
      forum_id: board.forum_id,
      inserted_at: board.inserted_at,
      updated_at: board.updated_at
    }
  end
end
