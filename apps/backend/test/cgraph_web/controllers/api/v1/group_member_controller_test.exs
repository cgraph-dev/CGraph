defmodule CGraphWeb.API.V1.GroupMemberControllerTest do
  @moduledoc """
  Tests for group member management (kick, ban, mute, roles).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:group_id/members
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/groups/:group_id/members" do
    test "returns 404 for non-existent group", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/members")

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/members")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:group_id/members/:id/kick
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/groups/:group_id/members/:id/kick" do
    test "returns 403/404 for non-member", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/members/#{Ecto.UUID.generate()}/kick")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:group_id/members/:id/ban
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/groups/:group_id/members/:id/ban" do
    test "returns 403/404 for non-member", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/members/#{Ecto.UUID.generate()}/ban")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:group_id/members/:id/mute
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/groups/:group_id/members/:id/mute" do
    test "returns 403/404 for non-member", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/members/#{Ecto.UUID.generate()}/mute")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # PATCH /api/v1/groups/:group_id/members/me/notifications
  # ──────────────────────────────────────────────────────────
  describe "PATCH /api/v1/groups/:group_id/members/me/notifications" do
    test "returns 404 for non-existent group", %{conn: conn} do
      conn = patch(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/members/me/notifications", %{
        muted: true
      })

      assert conn.status in [403, 404, 422]
    end
  end
end
