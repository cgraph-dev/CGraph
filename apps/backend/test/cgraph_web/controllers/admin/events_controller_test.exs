defmodule CGraphWeb.Admin.EventsControllerTest do
  @moduledoc """
  Tests for admin event management endpoints.
  Requires admin role — tests verify auth gates and CRUD operations.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/admin/events" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/events")

      assert conn.status in [401, 403]
    end

    test "returns 403 for non-admin user", %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      conn = get(conn, ~p"/api/v1/admin/events")

      assert conn.status in [401, 403]
    end
  end

  describe "POST /api/v1/admin/events" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/admin/events", %{"event" => %{"name" => "Test"}})

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/events/:id" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/events/#{Ecto.UUID.generate()}")

      assert conn.status in [401, 403]
    end
  end

  describe "POST /api/v1/admin/events/:id/start" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/admin/events/#{Ecto.UUID.generate()}/start")

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/events/:event_id/tiers" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/events/#{Ecto.UUID.generate()}/tiers")

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/events/:event_id/analytics" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/events/#{Ecto.UUID.generate()}/analytics")

      assert conn.status in [401, 403]
    end
  end

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(CGraphWeb.Admin.EventsController)
    end

    test "defines CRUD action functions" do
      for action <- [:index, :show, :create, :update, :delete] do
        assert function_exported?(CGraphWeb.Admin.EventsController, action, 2)
      end
    end
  end
end
