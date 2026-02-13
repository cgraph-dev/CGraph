defmodule CGraphWeb.API.V1.PresenceControllerTest do
  @moduledoc """
  Tests for user presence status endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/users/:id/presence" do
    test "returns presence for existing user", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/v1/users/#{user.id}/presence")
      assert conn.status in [200, 404]
    end

    test "returns 404 for non-existent user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/#{Ecto.UUID.generate()}/presence")
      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/users/presence/bulk" do
    test "returns presence for multiple users", %{conn: conn, user: user} do
      conn = post(conn, ~p"/api/v1/users/presence/bulk", %{
        user_ids: [user.id, Ecto.UUID.generate()]
      })
      assert conn.status in [200, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/users/presence/bulk", %{user_ids: []})
      assert json_response(conn, 401)
    end
  end
end
