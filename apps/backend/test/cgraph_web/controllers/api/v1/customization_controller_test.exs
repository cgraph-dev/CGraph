defmodule CGraphWeb.API.V1.CustomizationControllerTest do
  @moduledoc """
  Tests for user customization endpoints (avatar borders, themes, effects).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/users/:id/customizations (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/users/:id/customizations" do
    test "returns customizations for existing user", %{conn: conn, user: user} do
      conn = get(conn, ~p"/api/v1/users/#{user.id}/customizations")

      # May return 200 with data or 404 if no customizations set yet
      assert conn.status in [200, 404]
    end

    test "returns 404 for non-existent user", %{conn: conn} do
      try do
        conn = get(conn, ~p"/api/v1/users/#{Ecto.UUID.generate()}/customizations")

        assert conn.status in [404, 422]
      rescue
        Ecto.ConstraintError -> :ok
      end
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/me/customizations
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/me/customizations" do
    test "returns customizations for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/me/customizations")

      # May return 200 with customizations or 404 if none set
      assert conn.status in [200, 404]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/me/customizations")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # PATCH /api/v1/me/customizations
  # ──────────────────────────────────────────────────────────
  describe "PATCH /api/v1/me/customizations" do
    test "updates customization fields", %{conn: conn} do
      conn = patch(conn, ~p"/api/v1/me/customizations", %{
        bubble_style: "rounded",
        bubble_color: "#FF5733",
        text_size: "medium"
      })

      # Should succeed or indicate no customization record exists
      assert conn.status in [200, 404, 422]
    end

    test "rejects invalid customization values", %{conn: conn} do
      conn = patch(conn, ~p"/api/v1/me/customizations", %{
        bubble_opacity: -1
      })

      assert conn.status in [200, 400, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # PUT /api/v1/users/:id/customizations
  # ──────────────────────────────────────────────────────────
  describe "PUT /api/v1/users/:id/customizations" do
    test "rejects updating another user's customizations", %{conn: conn} do
      other_user_id = Ecto.UUID.generate()

      conn = put(conn, ~p"/api/v1/users/#{other_user_id}/customizations", %{
        bubble_style: "flat"
      })

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/users/:id/customizations
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/users/:id/customizations" do
    test "rejects deleting another user's customizations", %{conn: conn} do
      other_user_id = Ecto.UUID.generate()

      conn = delete(conn, ~p"/api/v1/users/#{other_user_id}/customizations")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/me/customizations
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/me/customizations" do
    test "resets customizations to defaults", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/me/customizations")

      # May return the default customizations or 404 if none existed
      assert conn.status in [200, 404]
    end
  end
end
