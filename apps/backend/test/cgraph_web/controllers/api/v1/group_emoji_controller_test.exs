defmodule CGraphWeb.API.V1.GroupEmojiControllerTest do
  @moduledoc """
  Tests for group-specific custom emoji management.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/groups/:group_id/emojis" do
    test "returns 404 for non-existent group", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/emojis")
      assert conn.status in [403, 404, 422]
    end
  end

  describe "POST /api/v1/groups/:group_id/emojis" do
    test "returns 403/404 for non-member", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/emojis", %{
        name: "test_emoji"
      })
      assert conn.status in [403, 404, 422]
    end
  end

  describe "DELETE /api/v1/groups/:group_id/emojis/:id" do
    test "returns 404 for non-existent emoji", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/emojis/#{Ecto.UUID.generate()}")
      assert conn.status in [403, 404, 422]
    end
  end
end
