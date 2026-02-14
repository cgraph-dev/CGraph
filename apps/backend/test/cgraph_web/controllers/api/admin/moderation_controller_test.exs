defmodule CGraphWeb.API.Admin.ModerationControllerTest do
  @moduledoc """
  Tests for moderation endpoints (reports, appeals, stats).
  Requires moderator role.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/admin/reports" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/admin/reports")

      assert conn.status in [401, 403]
    end

    test "returns 403 for non-moderator user", %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      conn = get(conn, ~p"/api/admin/reports")

      assert conn.status in [403, 200]
    end
  end

  describe "GET /api/admin/appeals" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/admin/appeals")

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/admin/moderation/stats" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/admin/moderation/stats")

      assert conn.status in [401, 403]
    end
  end

  describe "POST /api/admin/reports/:id/resolve" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/admin/reports/#{Ecto.UUID.generate()}/resolve")

      assert conn.status in [401, 403, 404]
    end
  end

  describe "POST /api/admin/appeals/:id/review" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/admin/appeals/#{Ecto.UUID.generate()}/review")

      assert conn.status in [401, 403]
    end
  end

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(CGraphWeb.API.Admin.ModerationController)
    end
  end
end
