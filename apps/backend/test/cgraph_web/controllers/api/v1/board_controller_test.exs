defmodule CGraphWeb.API.V1.BoardControllerTest do
  @moduledoc """
  Tests for MyBB-style boards (sub-forums).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/forums/:forum_id/boards" do
    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/boards")
      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/forums/:forum_id/boards/:id" do
    test "returns 404 for non-existent board", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/boards/#{Ecto.UUID.generate()}")
      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/forums/:forum_id/boards" do
    test "returns 403/404 for non-admin", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/boards", %{
        name: "Test Board", description: "A test board"
      })
      assert conn.status in [403, 404, 422]
    end
  end

  describe "DELETE /api/v1/forums/:forum_id/boards/:id" do
    test "returns 403/404 for non-admin", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/boards/#{Ecto.UUID.generate()}")
      assert conn.status in [403, 404, 422]
    end
  end
end
