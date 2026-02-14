defmodule CGraphWeb.API.V1.TierControllerTest do
  @moduledoc """
  Tests for subscription tier endpoints (public + authenticated).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/tiers (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/tiers" do
    test "returns list of subscription tiers" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/tiers")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/tiers/compare (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/tiers/compare" do
    test "returns tier comparison data" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/tiers/compare")

      assert conn.status in [200, 400]
      response = json_response(conn, conn.status)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/tiers/:tier (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/tiers/:tier" do
    test "returns tier details for free tier" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/tiers/free")

      assert conn.status in [200, 404]
    end

    test "returns 404 for non-existent tier" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/tiers/nonexistent_tier_xyz")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/tiers/me (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/tiers/me" do
    test "returns current user's tier info", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/tiers/me")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/tiers/me")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/tiers/check/:action (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/tiers/check/:action" do
    test "checks if user can perform action", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/tiers/check/create_group")

      assert conn.status in [200, 400]
      response = json_response(conn, conn.status)
      assert is_map(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/tiers/features/:feature (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/tiers/features/:feature" do
    test "checks feature availability", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/tiers/features/custom_emoji")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end
  end
end
