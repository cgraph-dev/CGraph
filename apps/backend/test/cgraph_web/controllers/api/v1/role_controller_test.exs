defmodule CgraphWeb.API.V1.RoleControllerTest do
  @moduledoc "Role controller tests — Discord-style RBAC"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "GET /api/v1/groups/:group_id/roles" do
    setup %{conn: conn} do
      user = user_fixture()
      group = group_fixture(user)
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, group: group}
    end

    test "lists roles for a group", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/roles")
      assert %{"data" => roles} = json_response(conn, 200)
      assert is_list(roles)
      # Should have at least the default @everyone role
      assert length(roles) >= 1
    end

    test "requires authentication", %{group: group} do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/roles")
      assert json_response(conn, 401)
    end
  end

  describe "POST /api/v1/groups/:group_id/roles" do
    setup %{conn: conn} do
      user = user_fixture()
      group = group_fixture(user)
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, group: group}
    end

    test "creates a new role", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/roles", %{
        name: "Moderator",
        color: "#FF0000",
        permissions: ["manage_messages", "kick_members"]
      })
      assert %{"data" => role} = json_response(conn, 201)
      assert role["name"] == "Moderator"
    end

    test "requires a name", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/roles", %{})
      assert json_response(conn, 422)
    end
  end

  describe "PUT /api/v1/groups/:group_id/roles/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      group = group_fixture(user)
      role = role_fixture(group, %{name: "Test Role"})
      conn = log_in_user(conn, user)
      %{conn: conn, group: group, role: role}
    end

    test "updates a role", %{conn: conn, group: group, role: role} do
      conn = put(conn, ~p"/api/v1/groups/#{group.id}/roles/#{role.id}", %{
        name: "Updated Role"
      })
      assert %{"data" => updated} = json_response(conn, 200)
      assert updated["name"] == "Updated Role"
    end
  end
end
