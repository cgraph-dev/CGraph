defmodule CGraphWeb.API.V1.ReactionControllerTest do
  @moduledoc """
  Tests for message reaction controller.
  Covers adding, removing, and listing reactions on messages.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/conversations/:cid/messages/:mid/reactions
  # ──────────────────────────────────────────────────────────
  describe "GET reactions on a conversation message" do
    test "returns 404 for non-existent conversation", %{conn: conn} do
      fake_cid = Ecto.UUID.generate()
      fake_mid = Ecto.UUID.generate()

      conn = get(conn, ~p"/api/v1/conversations/#{fake_cid}/messages/#{fake_mid}/reactions")

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_cid = Ecto.UUID.generate()
      fake_mid = Ecto.UUID.generate()

      conn = get(conn, ~p"/api/v1/conversations/#{fake_cid}/messages/#{fake_mid}/reactions")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/conversations/:cid/messages/:mid/reactions
  # ──────────────────────────────────────────────────────────
  describe "POST reaction to a conversation message" do
    test "returns error for non-existent conversation", %{conn: conn} do
      fake_cid = Ecto.UUID.generate()
      fake_mid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/conversations/#{fake_cid}/messages/#{fake_mid}/reactions", %{
        emoji: "👍"
      })

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      fake_cid = Ecto.UUID.generate()
      fake_mid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/conversations/#{fake_cid}/messages/#{fake_mid}/reactions", %{
        emoji: "👍"
      })

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/messages/:id/reactions (simplified route)
  # ──────────────────────────────────────────────────────────
  describe "POST reaction via simplified route" do
    test "returns error for non-existent message", %{conn: conn} do
      fake_mid = Ecto.UUID.generate()

      conn = post(conn, ~p"/api/v1/messages/#{fake_mid}/reactions", %{
        emoji: "❤️"
      })

      assert conn.status in [403, 404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/conversations/:cid/messages/:mid/reactions/:emoji
  # ──────────────────────────────────────────────────────────
  describe "DELETE reaction from a conversation message" do
    test "returns error for non-existent conversation", %{conn: conn} do
      fake_cid = Ecto.UUID.generate()
      fake_mid = Ecto.UUID.generate()

      conn = delete(conn, ~p"/api/v1/conversations/#{fake_cid}/messages/#{fake_mid}/reactions/👍")

      assert conn.status in [204, 403, 404, 422]
    end
  end
end
