defmodule CGraphWeb.API.UsernameControllerTest do
  @moduledoc """
  Tests for username management endpoints (availability, history, cooldown).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/users/check-username" do
    test "checks username availability", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/check-username?username=test_unique_name_999")

      response = json_response(conn, 200)
      assert is_map(response)
    end

    test "returns error without username param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/check-username")

      assert conn.status in [400, 422]
    end
  end

  describe "POST /api/v1/users/me/change-username" do
    test "rejects invalid username", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/users/me/change-username", %{"username" => ""})

      assert conn.status in [400, 422]
    end
  end

  describe "GET /api/v1/users/me/username-history" do
    test "returns username change history", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/me/username-history")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/users/me/username-cooldown" do
    test "returns cooldown status", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/me/username-cooldown")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/users/check-username?username=test")

      assert json_response(conn, 401)
    end
  end
end
