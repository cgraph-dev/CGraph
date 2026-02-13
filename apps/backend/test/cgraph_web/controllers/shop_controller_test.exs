defmodule CGraphWeb.ShopControllerTest do
  @moduledoc """
  Tests for shop endpoints (browse, categories, purchase items).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/shop" do
    test "lists shop items", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/shop")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/shop/categories" do
    test "lists shop categories", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/shop/categories")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/shop/purchases" do
    test "lists user's purchase history", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/shop/purchases")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/shop/:id" do
    test "returns 404 for non-existent item", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/shop/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/shop/:id/purchase" do
    test "returns 404 when purchasing non-existent item", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/shop/#{Ecto.UUID.generate()}/purchase")

      assert conn.status in [404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/shop")

      assert json_response(conn, 401)
    end
  end
end
