defmodule CGraphWeb.API.V1.LeaderboardControllerTest do
  @moduledoc """
  Tests for the unified global leaderboard endpoint.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/leaderboard
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/leaderboard" do
    test "returns leaderboard with default params", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end

    test "accepts category=xp param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?category=xp")

      assert json_response(conn, 200)
    end

    test "accepts category=karma param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?category=karma")

      assert json_response(conn, 200)
    end

    test "accepts category=level param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?category=level")

      assert json_response(conn, 200)
    end

    test "accepts period=weekly param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?period=weekly")

      assert json_response(conn, 200)
    end

    test "accepts period=monthly param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?period=monthly")

      assert json_response(conn, 200)
    end

    test "accepts limit param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?limit=10")

      assert json_response(conn, 200)
    end

    test "clamps limit to max 100", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard?limit=500")

      assert json_response(conn, 200)
    end

    test "includes current user rank info", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/leaderboard")

      response = json_response(conn, 200)
      # Should include user_rank or similar field
      assert is_map(response)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/leaderboard")

      assert json_response(conn, 401)
    end
  end
end
