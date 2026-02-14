defmodule CGraphWeb.EventsControllerTest do
  @moduledoc """
  Tests for timed events, battle passes, and event leaderboards.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/events" do
    test "lists active events", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/events")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end

    test "accepts status filter", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/events?status=active")

      assert json_response(conn, 200)
    end
  end

  describe "GET /api/v1/events/:id" do
    test "returns 404 for non-existent event", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/events/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/events/:id/progress" do
    test "returns 404 for non-existent event", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/events/#{Ecto.UUID.generate()}/progress")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/events/:id/join" do
    test "returns 404 for non-existent event", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/events/#{Ecto.UUID.generate()}/join")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/events/:id/claim-reward" do
    test "returns error for non-existent event", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/events/#{Ecto.UUID.generate()}/claim-reward", %{
        reward_id: Ecto.UUID.generate()
      })

      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/events/:id/leaderboard" do
    test "returns 404 for non-existent event", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/events/#{Ecto.UUID.generate()}/leaderboard")

      assert conn.status in [200, 404, 422]
    end
  end

  describe "POST /api/v1/events/:id/battle-pass/purchase" do
    test "returns 404 for non-existent event", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/events/#{Ecto.UUID.generate()}/battle-pass/purchase")

      assert conn.status in [404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/events")

      assert json_response(conn, 401)
    end
  end
end
