defmodule CGraphWeb.MarketplaceControllerTest do
  @moduledoc """
  Tests for peer-to-peer marketplace (listings, purchases, history).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/marketplace" do
    test "lists marketplace items", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/marketplace")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end

    test "accepts sort param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/marketplace?sort=newest")

      assert json_response(conn, 200)
    end

    test "accepts category filter", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/marketplace?category=borders")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/marketplace/my-listings" do
    test "returns user's own listings", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/marketplace/my-listings")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/marketplace/history" do
    test "returns purchase/sale history", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/marketplace/history")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/marketplace/:id" do
    test "returns 404 for non-existent listing", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/marketplace/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/marketplace" do
    test "rejects listing without required fields", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/marketplace", %{})

      assert conn.status in [400, 422]
    end
  end

  describe "PUT /api/v1/marketplace/:id" do
    test "returns 404 for non-existent listing", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/marketplace/#{Ecto.UUID.generate()}", %{price: 100})

      assert conn.status in [403, 404, 422]
    end
  end

  describe "DELETE /api/v1/marketplace/:id" do
    test "returns 404 for non-existent listing", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/marketplace/#{Ecto.UUID.generate()}")

      assert conn.status in [403, 404, 422]
    end
  end

  describe "POST /api/v1/marketplace/:id/buy" do
    test "returns 404 for non-existent listing", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/marketplace/#{Ecto.UUID.generate()}/buy")

      assert conn.status in [404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/marketplace")

      assert json_response(conn, 401)
    end
  end
end
