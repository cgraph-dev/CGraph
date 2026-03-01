defmodule CGraphWeb.API.V1.PostIconController do
  @moduledoc """
  Controller for post icon operations.

  Provides endpoints for listing board-specific post icons.
  """
  use CGraphWeb, :controller

  alias CGraph.Forums.PostIcon

  action_fallback CGraphWeb.FallbackController

  @doc """
  List available post icons for a board.

  GET /api/v1/forums/:forum_id/boards/:board_id/post-icons
  """
  @spec board_icons(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def board_icons(conn, %{"forum_id" => forum_id, "board_id" => board_id}) do
    icons = PostIcon.available_for_board(forum_id, board_id)

    json(conn, %{
      data: Enum.map(icons, fn icon ->
        %{
          id: icon.id,
          name: icon.name,
          icon_url: icon.icon_url,
          emoji: icon.emoji,
          display_order: icon.display_order
        }
      end)
    })
  end
end
