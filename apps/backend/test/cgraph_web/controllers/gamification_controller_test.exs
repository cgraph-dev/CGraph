defmodule CGraphWeb.GamificationControllerTest do
  @moduledoc """
  Tests for gamification endpoints (stats, achievements, streaks, leaderboard, XP).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/gamification/stats" do
    test "returns gamification stats for user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/stats")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "GET /api/v1/gamification/progress" do
    test "returns progress (alias for stats)", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/progress")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/gamification/level-info" do
    test "returns level info", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/level-info")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "GET /api/v1/gamification/xp/history" do
    test "returns XP history", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/xp/history")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/gamification/achievements" do
    test "lists achievements", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/achievements")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/gamification/achievements/:id" do
    test "returns 404 for non-existent achievement", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/achievements/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/gamification/achievements/:id/unlock" do
    test "returns 404 for non-existent achievement", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/gamification/achievements/#{Ecto.UUID.generate()}/unlock")

      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/gamification/leaderboard/:category" do
    test "returns leaderboard for xp category", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/leaderboard/xp")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end

    test "returns leaderboard for level category", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/leaderboard/level")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/gamification/streak" do
    test "returns streak info", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/gamification/streak")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "POST /api/v1/gamification/streak/claim" do
    test "claims daily streak reward", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/gamification/streak/claim")

      # May succeed or indicate already claimed
      assert conn.status in [200, 400, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/gamification/stats")

      assert json_response(conn, 401)
    end
  end
end
