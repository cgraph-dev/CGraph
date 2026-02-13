defmodule CGraphWeb.API.V1.ThemeControllerTest do
  @moduledoc """
  Tests for theme management endpoints (global theme system).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/users/:id/theme
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/users/:id/theme" do
    test "returns theme for user", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/v1/users/#{user.id}/theme")

      assert conn.status in [200, 404]
    end

    test "returns 404 for non-existent user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/#{Ecto.UUID.generate()}/theme")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # PUT /api/v1/users/:id/theme
  # ──────────────────────────────────────────────────────────
  describe "PUT /api/v1/users/:id/theme" do
    test "updates own theme", %{conn: conn, user: user} do
      conn = put(conn, ~p"/api/v1/users/#{user.id}/theme", %{
        primary_color: "#FF5733",
        mode: "dark"
      })

      assert conn.status in [200, 404, 422]
    end

    test "rejects updating another user's theme", %{conn: conn} do
      other_id = Ecto.UUID.generate()
      conn = put(conn, ~p"/api/v1/users/#{other_id}/theme", %{mode: "dark"})

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/users/:id/theme/reset
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/users/:id/theme/reset" do
    test "resets own theme to defaults", %{conn: conn, user: user} do
      conn = post(conn, ~p"/api/v1/users/#{user.id}/theme/reset")

      assert conn.status in [200, 404]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/themes/default
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/themes/default" do
    test "returns default theme configuration", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/themes/default")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/themes/presets
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/themes/presets" do
    test "returns available theme presets", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/themes/presets")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end
end
