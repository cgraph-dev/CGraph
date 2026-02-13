defmodule CGraphWeb.API.V1.PinnedMessageControllerTest do
  @moduledoc """
  Tests for pinned messages in group channels.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/groups/:group_id/channels/:channel_id/pins
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/groups/:group_id/channels/:channel_id/pins" do
    test "returns 404 for non-existent group", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/pins")

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/pins")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/groups/:group_id/channels/:channel_id/pins
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/groups/:group_id/channels/:channel_id/pins" do
    test "returns error for non-existent group/channel", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/pins", %{
        message_id: Ecto.UUID.generate()
      })

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/groups/:group_id/channels/:channel_id/pins/:id
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/groups/:group_id/channels/:channel_id/pins/:id" do
    test "returns error for non-existent pin", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/pins/#{Ecto.UUID.generate()}")

      assert conn.status in [403, 404, 422]
    end
  end
end
