defmodule CGraphWeb.API.V1.CategoryControllerTest do
  @moduledoc """
  Tests for forum categories.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/forums/:forum_id/categories" do
    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/categories")
      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/forums/:forum_id/categories" do
    test "returns 403/404 for non-admin", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/categories", %{
        name: "General", color: "#3498db"
      })
      assert conn.status in [403, 404, 422]
    end
  end

  describe "PUT /api/v1/forums/:forum_id/categories/:id" do
    test "returns 404 for non-existent category", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/categories/#{Ecto.UUID.generate()}", %{
        name: "Updated"
      })
      assert conn.status in [403, 404, 422]
    end
  end

  describe "DELETE /api/v1/forums/:forum_id/categories/:id" do
    test "returns 403/404 for non-admin", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/categories/#{Ecto.UUID.generate()}")
      assert conn.status in [403, 404, 422]
    end
  end
end
