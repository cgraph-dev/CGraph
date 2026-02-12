defmodule CgraphWeb.API.V1.ProfileControllerTest do
  @moduledoc "Profile controller tests — Discord/WhatsApp user profile management"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/profile" do
    setup %{conn: conn} do
      user = user_fixture(%{username: "testuser", display_name: "Test User"})
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "returns current user profile", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/v1/profile")
      assert %{"data" => profile} = json_response(conn, 200)
      assert profile["id"] == user.id
      assert profile["username"] == "testuser"
    end

    test "returns 401 for unauthenticated request", %{conn: _conn} do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = get(conn, ~p"/api/v1/profile")
      assert json_response(conn, 401)
    end
  end

  describe "PUT /api/v1/profile" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "updates display name", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/profile", %{display_name: "New Name"})
      assert %{"data" => profile} = json_response(conn, 200)
      assert profile["display_name"] == "New Name"
    end

    test "updates bio", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/profile", %{bio: "Hello world"})
      assert %{"data" => profile} = json_response(conn, 200)
      assert profile["bio"] == "Hello world"
    end

    test "rejects invalid data", %{conn: conn} do
      # Bio too long (>500 chars)
      conn = put(conn, ~p"/api/v1/profile", %{bio: String.duplicate("x", 501)})
      assert json_response(conn, 422)
    end
  end
end
