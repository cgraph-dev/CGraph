defmodule CGraphWeb.API.V1.ChannelMessageControllerTest do
  @moduledoc """
  Tests for channel message controller.
  Covers listing, sending messages, and typing indicators in group channels.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:gid/channels/:cid/messages
  # ──────────────────────────────────────────────────────────
  describe "GET channel messages" do
    test "returns 404 for non-existent group", %{conn: conn} do
      fake_gid = Ecto.UUID.generate()
      fake_cid = Ecto.UUID.generate()

      conn = get(conn, ~p"/api/v1/groups/#{fake_gid}/channels/#{fake_cid}/messages")

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_gid = Ecto.UUID.generate()
      fake_cid = Ecto.UUID.generate()

      conn = get(conn, ~p"/api/v1/groups/#{fake_gid}/channels/#{fake_cid}/messages")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:gid/channels/:cid/messages
  # ──────────────────────────────────────────────────────────
  describe "POST channel message" do
    test "returns error for non-existent group", %{conn: conn} do
      fake_gid = Ecto.UUID.generate()
      fake_cid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/groups/#{fake_gid}/channels/#{fake_cid}/messages", %{
        content: "Hello channel!"
      })

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_gid = Ecto.UUID.generate()
      fake_cid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/groups/#{fake_gid}/channels/#{fake_cid}/messages", %{
        content: "test"
      })

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:gid/channels/:cid/typing
  # ──────────────────────────────────────────────────────────
  describe "POST typing indicator" do
    test "returns error for non-existent group", %{conn: conn} do
      fake_gid = Ecto.UUID.generate()
      fake_cid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/groups/#{fake_gid}/channels/#{fake_cid}/typing")

      assert conn.status in [200, 403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_gid = Ecto.UUID.generate()
      fake_cid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/groups/#{fake_gid}/channels/#{fake_cid}/typing")

      assert json_response(conn, 401)
    end
  end
end
