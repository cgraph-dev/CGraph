defmodule CGraphWeb.GamificationControllerTest do
  @moduledoc """
  Tests for gamification achievement endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
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

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/gamification/achievements")

      assert json_response(conn, 401)
    end
  end
end
