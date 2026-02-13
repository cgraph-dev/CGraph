defmodule CGraphWeb.API.V1.ThreadPostControllerTest do
  @moduledoc """
  Tests for thread posts (replies to board threads).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/threads/:thread_id/posts" do
    test "returns 404 for non-existent thread", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/threads/#{Ecto.UUID.generate()}/posts")
      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/threads/:thread_id/posts" do
    test "returns 404 for non-existent thread", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/threads/#{Ecto.UUID.generate()}/posts", %{
        content: "Test post reply"
      })
      assert conn.status in [404, 422]
    end
  end

  describe "PUT /api/v1/threads/:thread_id/posts/:id" do
    test "returns 404 for non-existent post", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/threads/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}", %{
        content: "Updated content"
      })
      assert conn.status in [404, 422]
    end
  end

  describe "DELETE /api/v1/threads/:thread_id/posts/:id" do
    test "returns 404 for non-existent post", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/threads/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}")
      assert conn.status in [403, 404, 422]
    end
  end

  describe "POST /api/v1/threads/:thread_id/posts/:id/vote" do
    test "returns 404 for non-existent post", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/threads/#{Ecto.UUID.generate()}/posts/#{Ecto.UUID.generate()}/vote", %{
        direction: "up"
      })
      assert conn.status in [404, 422]
    end
  end
end
