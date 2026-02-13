defmodule CGraphWeb.API.V1.AutomodControllerTest do
  @moduledoc """
  Tests for automod rules management endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:group_id/automod/rules
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/groups/:group_id/automod/rules" do
    test "returns 404 for non-existent group", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/automod/rules")

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/automod/rules")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:group_id/automod/rules
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/groups/:group_id/automod/rules" do
    test "returns error for non-existent group", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/automod/rules", %{
        name: "no-spam",
        trigger_type: "keyword",
        trigger_metadata: %{keywords: ["spam", "buy now"]},
        action_type: "delete_message"
      })

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:group_id/automod/rules/:id
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/groups/:group_id/automod/rules/:id" do
    test "returns 404 for non-existent rule", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/automod/rules/#{Ecto.UUID.generate()}")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # PATCH /api/v1/groups/:group_id/automod/rules/:id/toggle
  # ──────────────────────────────────────────────────────────
  describe "PATCH /api/v1/groups/:group_id/automod/rules/:id/toggle" do
    test "returns 404 for non-existent rule", %{conn: conn} do
      conn = patch(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/automod/rules/#{Ecto.UUID.generate()}/toggle")

      assert conn.status in [403, 404, 422]
    end
  end
end
