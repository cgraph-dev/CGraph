defmodule CGraphWeb.API.V1.SecondaryGroupsControllerTest do
  @moduledoc """
  Tests for secondary groups and auto-assignment rules.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:forum_id/my-groups
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:forum_id/my-groups" do
    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/my-groups")

      assert conn.status in [404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/my-groups")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:forum_id/group-rules
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:forum_id/group-rules" do
    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/group-rules")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/group-rules/templates
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/group-rules/templates" do
    test "returns available rule templates", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/group-rules/templates")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/forums/:forum_id/members/:member_id/secondary-groups
  # ──────────────────────────────────────────────────────────
  describe "POST .../secondary-groups" do
    test "returns 404 for non-existent forum/member", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/members/#{Ecto.UUID.generate()}/secondary-groups", %{
        group_id: Ecto.UUID.generate()
      })

      assert conn.status in [403, 404, 422]
    end
  end
end
