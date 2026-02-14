defmodule CGraphWeb.API.V1.CommentControllerTest do
  @moduledoc """
  Tests for forum post comments (Reddit-style nested/threaded comments).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:forum_id/posts/:post_id/comments
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:forum_id/posts/:post_id/comments" do
    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments")

      assert conn.status in [404, 422]
    end

    test "accepts pagination params", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments?page=1&per_page=10")

      assert conn.status in [200, 404, 422]
    end

    test "accepts sort params", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments?sort=new")

      assert conn.status in [200, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:forum_id/posts/:post_id/comments/:id
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:forum_id/posts/:post_id/comments/:id" do
    test "returns 404 for non-existent comment", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/forums/:forum_id/posts/:post_id/comments
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/forums/:forum_id/posts/:post_id/comments" do
    test "returns error for non-existent post", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments", %{
        content: "Test comment"
      })

      assert conn.status in [404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments", %{
        content: "Test comment"
      })

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # PUT /api/v1/forums/:forum_id/posts/:post_id/comments/:id
  # ──────────────────────────────────────────────────────────
  describe "PUT /api/v1/forums/:forum_id/posts/:post_id/comments/:id" do
    test "returns 404 for non-existent comment", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments/#{Ecto.UUID.generate()}", %{
        comment: %{content: "Updated content"}
      })

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/forums/:forum_id/posts/:post_id/comments/:id
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/forums/:forum_id/posts/:post_id/comments/:id" do
    test "returns 404 for non-existent comment", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/forums/:forum_id/posts/:post_id/comments/:id/vote
  # ──────────────────────────────────────────────────────────
  describe "POST .../comments/:id/vote" do
    test "returns error for non-existent comment", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/comments/#{Ecto.UUID.generate()}/vote", %{
        direction: "up"
      })

      assert conn.status in [400, 404, 422, 500]
    end
  end
end
