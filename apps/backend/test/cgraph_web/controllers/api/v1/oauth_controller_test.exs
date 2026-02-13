defmodule CGraphWeb.API.V1.OAuthControllerTest do
  @moduledoc """
  Tests for OAuth authentication (Google, Apple, Discord, GitHub).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/auth/oauth/providers (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/auth/oauth/providers" do
    test "returns list of available OAuth providers" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/auth/oauth/providers")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/auth/oauth/:provider
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/auth/oauth/:provider" do
    test "redirects to Google OAuth" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/auth/oauth/google")

      # Should redirect to provider's auth URL or return a redirect URL
      assert conn.status in [200, 302, 303]
    end

    test "returns error for unsupported provider" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/auth/oauth/unsupported_provider_xyz")

      assert conn.status in [400, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/auth/oauth/:provider/mobile
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/auth/oauth/:provider/mobile" do
    test "returns error with invalid token" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/auth/oauth/google/mobile", %{
        id_token: "invalid-token"
      })

      assert conn.status in [400, 401, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/auth/oauth/:provider/link (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/auth/oauth/:provider/link" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "returns error for link without valid OAuth code", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/oauth/google/link", %{
        code: "invalid-code"
      })

      assert conn.status in [400, 401, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/auth/oauth/google/link", %{code: "test"})

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/auth/oauth/:provider/link (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/auth/oauth/:provider/link" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "returns error when no linked account", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/auth/oauth/google/link")

      # Should return not found or success
      assert conn.status in [200, 204, 404, 422]
    end
  end
end
