defmodule CGraphWeb.PrestigeControllerTest do
  @moduledoc """
  Tests for prestige system (reset, rewards, leaderboard).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/prestige" do
    test "returns prestige status for user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/prestige")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "POST /api/v1/prestige/reset" do
    test "handles prestige reset", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/prestige/reset")

      # May fail if user hasn't met prestige requirements
      assert conn.status in [200, 400, 422]
    end
  end

  describe "GET /api/v1/prestige/rewards" do
    test "returns prestige rewards", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/prestige/rewards")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/prestige/leaderboard" do
    test "returns prestige leaderboard", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/prestige/leaderboard")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end

    test "accepts limit param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/prestige/leaderboard?limit=10")

      assert json_response(conn, 200)
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/prestige")

      assert json_response(conn, 401)
    end
  end
end
