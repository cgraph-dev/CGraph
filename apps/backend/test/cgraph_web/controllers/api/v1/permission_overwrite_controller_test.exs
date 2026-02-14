defmodule CGraphWeb.API.V1.PermissionOverwriteControllerTest do
  @moduledoc """
  Tests for channel-level permission overwrites ().
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/groups/:g/channels/:c/permissions" do
    test "returns 404 for non-existent group", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/permissions")
      assert conn.status in [403, 404, 422]
    end
  end

  describe "POST /api/v1/groups/:g/channels/:c/permissions" do
    test "returns 403/404 for non-admin", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/permissions", %{
        role_id: Ecto.UUID.generate(),
        allow: 0,
        deny: 0
      })
      assert conn.status in [403, 404, 422]
    end
  end

  describe "PUT /api/v1/groups/:g/channels/:c/permissions/:id" do
    test "returns 404 for non-existent permission", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/permissions/#{Ecto.UUID.generate()}", %{
        allow: 1, deny: 0
      })
      assert conn.status in [403, 404, 422]
    end
  end

  describe "DELETE /api/v1/groups/:g/channels/:c/permissions/:id" do
    test "returns 404 for non-existent permission", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}/channels/#{Ecto.UUID.generate()}/permissions/#{Ecto.UUID.generate()}")
      assert conn.status in [403, 404, 422]
    end
  end
end
