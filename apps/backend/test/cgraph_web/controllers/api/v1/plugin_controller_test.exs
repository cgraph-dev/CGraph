defmodule CGraphWeb.API.V1.PluginControllerTest do
  @moduledoc """
  Tests for plugin marketplace and forum plugin management.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/plugins/marketplace" do
    test "returns plugin marketplace listing", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/plugins/marketplace")
      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/plugins/marketplace/:plugin_id" do
    test "returns 404 for non-existent plugin", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/plugins/marketplace/#{Ecto.UUID.generate()}")
      assert conn.status in [404, 422]
    end
  end

  describe "GET /api/v1/forums/:forum_id/plugins" do
    test "returns 404 for non-existent forum", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/plugins")
      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/forums/:forum_id/plugins" do
    test "returns 403/404 for non-admin", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/plugins", %{
        plugin_id: Ecto.UUID.generate()
      })
      assert conn.status in [403, 404, 422]
    end
  end
end
