defmodule CgraphWeb.API.V1.GroupControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "GET /api/v1/groups (unauthenticated)" do
    test "returns 401 without authentication", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups")
      assert json_response(conn, 401)
    end
  end

  describe "GET /api/v1/groups (authenticated)" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group, owner: _owner} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, group: group}
    end

    test "lists user's groups", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups")
      
      assert %{"data" => groups} = json_response(conn, 200)
      assert is_list(groups)
      
      ids = Enum.map(groups, & &1["id"])
      assert group.id in ids
    end
  end

  describe "POST /api/v1/groups" do
    setup %{conn: conn} do
      user = user_fixture()
      conn = log_in_user(conn, user)
      %{conn: conn, user: user}
    end

    test "creates a new group", %{conn: conn, user: _user} do
      conn = post(conn, ~p"/api/v1/groups", %{
        name: "My New Group",
        description: "A test group"
      })
      
      assert %{
        "data" => %{
          "id" => id,
          "name" => "My New Group",
          "description" => "A test group"
        }
      } = json_response(conn, 201)
      
      assert is_binary(id)
    end

    test "returns error for missing name", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/groups", %{description: "No name"})
      
      response = json_response(conn, 422)
      # Error format is either errors.name or error.details.name
      assert response["error"]["details"]["name"] || response["errors"]["name"]
    end
  end

  describe "GET /api/v1/groups/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, group: group}
    end

    test "returns group details", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}")
      
      assert %{
        "data" => %{
          "id" => id,
          "name" => name,
          "channels" => channels,
          "roles" => roles
        }
      } = json_response(conn, 200)
      
      assert id == group.id
      assert is_binary(name)
      assert is_list(channels)
      assert is_list(roles)
    end

    test "returns 404 for non-existent group", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/groups/#{Ecto.UUID.generate()}")
      assert json_response(conn, 404)
    end
  end

  describe "PUT /api/v1/groups/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, group: group}
    end

    test "updates group as owner", %{conn: conn, group: group} do
      conn = put(conn, ~p"/api/v1/groups/#{group.id}", %{
        name: "Updated Name",
        description: "Updated description"
      })
      
      assert %{
        "data" => %{
          "name" => "Updated Name",
          "description" => "Updated description"
        }
      } = json_response(conn, 200)
    end

    test "returns error for non-owner", %{conn: conn, group: group} do
      other_user = user_fixture()
      conn = log_in_user(conn, other_user)
      
      conn = put(conn, ~p"/api/v1/groups/#{group.id}", %{name: "Hacked"})
      # Non-member gets 404, member without permission would get 403
      assert json_response(conn, 404)
    end
  end

  describe "DELETE /api/v1/groups/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, group: group}
    end

    test "deletes group as owner", %{conn: conn, group: group} do
      conn = delete(conn, ~p"/api/v1/groups/#{group.id}")
      assert response(conn, 204)
    end

    test "returns error for non-owner", %{conn: conn, group: group} do
      other_user = user_fixture()
      conn = log_in_user(conn, other_user)
      
      conn = delete(conn, ~p"/api/v1/groups/#{group.id}")
      # Non-member gets 404, member without permission would get 403
      assert json_response(conn, 404)
    end
  end

  describe "GET /api/v1/groups/:id/audit-log" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, user: user, group: group}
    end

    test "returns audit log for authorized users", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/audit-log")
      
      assert %{"data" => entries} = json_response(conn, 200)
      assert is_list(entries)
    end
  end
end
