defmodule CGraphWeb.API.V1.RssControllerTest do
  @moduledoc """
  Tests for RSS feed endpoints (public).
  """
  use CGraphWeb.ConnCase, async: true

  describe "GET /api/v1/rss/boards/:board_id/threads" do
    test "returns 404 for non-existent board" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/rss/boards/#{Ecto.UUID.generate()}/threads")
      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/rss/threads/:thread_id/posts" do
    test "returns 404 for non-existent thread" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/rss/threads/#{Ecto.UUID.generate()}/posts")
      assert conn.status in [404, 422]
    end
  end
end
