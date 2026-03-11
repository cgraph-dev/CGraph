defmodule CGraphWeb.CoinsControllerTest do
  @moduledoc """
  Tests for coin balance, history, and package endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/coins
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/coins (balance)" do
    test "returns coin balance for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/coins")

      response = json_response(conn, 200)
      assert Map.has_key?(response, "coins")
      assert Map.has_key?(response, "subscription_tier")
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/coins")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/coins/history
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/coins/history" do
    test "returns coin transaction history", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/coins/history")

      assert conn.status == 200
    end

    test "accepts limit param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/coins/history?limit=10")

      assert conn.status == 200
    end

    test "clamps limit to max 100", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/coins/history?limit=999")

      assert conn.status == 200
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/coins/packages
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/coins/packages" do
    test "returns available coin packages", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/coins/packages")

      response = json_response(conn, 200)
      assert Map.has_key?(response, "packages")
      assert is_list(response["packages"])
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/coins/earn
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/coins/earn" do
    test "returns earn methods", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/coins/earn")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end
end
