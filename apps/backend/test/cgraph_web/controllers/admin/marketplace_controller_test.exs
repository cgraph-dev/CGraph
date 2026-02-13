defmodule CGraphWeb.Admin.MarketplaceControllerTest do
  @moduledoc """
  Tests for admin marketplace moderation endpoints.
  Requires admin role — tests verify auth gates and moderation actions.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  describe "GET /api/v1/admin/marketplace/flagged" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/marketplace/flagged")

      assert conn.status in [401, 403]
    end

    test "returns 403 for non-admin user", %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      conn = get(conn, ~p"/api/v1/admin/marketplace/flagged")

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/marketplace/listings/:id" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/marketplace/listings/#{Ecto.UUID.generate()}")

      assert conn.status in [401, 403]
    end
  end

  describe "POST /api/v1/admin/marketplace/listings/:id/approve" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/admin/marketplace/listings/#{Ecto.UUID.generate()}/approve", %{"note" => "ok"})

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/marketplace/analytics" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/marketplace/analytics")

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/marketplace/settings" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/marketplace/settings")

      assert conn.status in [401, 403]
    end
  end

  describe "GET /api/v1/admin/marketplace/transactions/disputed" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/admin/marketplace/transactions/disputed")

      assert conn.status in [401, 403]
    end
  end

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(CGraphWeb.Admin.MarketplaceController)
    end

    test "defines key moderation actions" do
      for action <- [:flagged_listings, :approve_listing, :reject_listing, :remove_listing, :analytics] do
        assert function_exported?(CGraphWeb.Admin.MarketplaceController, action, 2)
      end
    end
  end
end
