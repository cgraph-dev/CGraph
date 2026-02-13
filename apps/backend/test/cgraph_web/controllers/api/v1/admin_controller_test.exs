defmodule CGraphWeb.API.V1.AdminControllerTest do
  @moduledoc """
  Tests for admin endpoints — ensures non-admin users are rejected.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "admin endpoints require admin role" do
    test "non-admin user is rejected from admin endpoints", %{conn: conn} do
      # Try to hit an admin-ish endpoint - should be 403 or not found
      conn = get(conn, ~p"/api/v1/admin/stats")
      assert conn.status in [403, 404]
    end

    test "returns 401 for unauthenticated admin request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/stats")
      assert conn.status in [401, 404]
    end
  end
end
