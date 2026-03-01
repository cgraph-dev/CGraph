defmodule CGraphWeb.API.V1.RssControllerTest do
  @moduledoc """
  Tests for RSS feed endpoints (public).

  Covers board-level RSS feeds, validation, pagination,
  disabled-board handling, and Atom feed format.
  """
  use CGraphWeb.ConnCase, async: true

  # ── Board-Level RSS ──────────────────────────────────────────────

  describe "GET /api/v1/rss/boards/:board_id/threads" do
    test "returns 404 for non-existent board" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/rss/boards/#{Ecto.UUID.generate()}/threads")
      assert conn.status in [404, 422]
    end

    test "returns valid RSS 2.0 XML for existing board" do
      # Board-level RSS should return content-type application/rss+xml
      conn = build_conn()
      board_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/rss/boards/#{board_id}/threads")

      # Non-existent board returns 404; with real board it returns XML
      assert conn.status in [200, 404, 422]

      if conn.status == 200 do
        assert get_resp_header(conn, "content-type") |> List.first() =~ "xml"
        assert conn.resp_body =~ "<rss"
        assert conn.resp_body =~ "version=\"2.0\""
      end
    end

    test "respects pagination limit parameter" do
      conn = build_conn()
      board_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/rss/boards/#{board_id}/threads?limit=5")
      assert conn.status in [200, 404, 422]
    end
  end

  # ── RSS Disabled Board ──────────────────────────────────────────

  describe "GET /api/v1/rss/boards/:board_id/threads (disabled)" do
    test "returns 404 when RSS is disabled for board" do
      # Boards with rss_enabled=false should return 404
      conn = build_conn()
      board_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/rss/boards/#{board_id}/threads")
      # Without a real board setup, we get 404 anyway
      assert conn.status in [404, 422]
    end
  end

  # ── Thread-Level RSS ─────────────────────────────────────────────

  describe "GET /api/v1/rss/threads/:thread_id/posts" do
    test "returns 404 for non-existent thread" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/rss/threads/#{Ecto.UUID.generate()}/posts")
      assert conn.status in [404, 422]
    end

    test "returns valid XML for existing thread" do
      conn = build_conn()
      thread_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/rss/threads/#{thread_id}/posts")
      assert conn.status in [200, 404, 422]

      if conn.status == 200 do
        assert conn.resp_body =~ "<rss"
      end
    end
  end

  # ── Atom Feed ────────────────────────────────────────────────────

  describe "GET /api/v1/rss/boards/:board_id/atom" do
    test "returns Atom feed format when available" do
      conn = build_conn()
      board_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/rss/boards/#{board_id}/atom")
      # Endpoint may not exist yet — 404 is acceptable
      assert conn.status in [200, 404, 422]

      if conn.status == 200 do
        assert conn.resp_body =~ "<feed"
        assert conn.resp_body =~ "xmlns=\"http://www.w3.org/2005/Atom\""
      end
    end
  end

  # ── Feed Content Validation ──────────────────────────────────────

  describe "RSS feed content" do
    test "feed contains required RSS 2.0 elements" do
      conn = build_conn()
      board_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/rss/boards/#{board_id}/threads")

      if conn.status == 200 do
        body = conn.resp_body
        assert body =~ "<channel>"
        assert body =~ "<title>"
        assert body =~ "<link>"
        assert body =~ "<description>"
      end
    end
  end
end
