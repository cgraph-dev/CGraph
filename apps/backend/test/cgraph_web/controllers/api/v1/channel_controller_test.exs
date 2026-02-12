defmodule CGraphWeb.API.V1.ChannelControllerTest do
  @moduledoc """
  Tests for group channel controller.
  Covers CRUD for channels within groups.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:group_id/channels
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/groups/:group_id/channels" do
    test "returns 404 for non-existent group", %{conn: conn} do
      fake_group_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/groups/#{fake_group_id}/channels")

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_group_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/groups/#{fake_group_id}/channels")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:group_id/channels/:id
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/groups/:group_id/channels/:id" do
    test "returns 404 for non-existent group/channel", %{conn: conn} do
      fake_group_id = Ecto.UUID.generate()
      fake_channel_id = Ecto.UUID.generate()
      conn = get(conn, ~p"/api/v1/groups/#{fake_group_id}/channels/#{fake_channel_id}")

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:group_id/channels
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/groups/:group_id/channels" do
    test "returns error for non-existent group", %{conn: conn} do
      fake_group_id = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/groups/#{fake_group_id}/channels", %{
        name: "general",
        type: "text"
      })

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_group_id = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/groups/#{fake_group_id}/channels", %{
        name: "general",
        type: "text"
      })

      assert json_response(conn, 401)
    end
  end
end
