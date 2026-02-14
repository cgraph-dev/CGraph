defmodule CgraphWeb.API.V1.MemberControllerTest do
  @moduledoc "Member controller tests — Discord-style guild member management"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "GET /api/v1/groups/:group_id/members" do
    setup %{conn: conn} do
      user = user_fixture()
      other_user = user_fixture()
      group = group_with_members_fixture(user, [other_user])
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, group: group}
    end

    test "lists group members", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/members")
      assert %{"data" => members} = json_response(conn, 200)
      assert is_list(members)
      assert length(members) >= 2
    end

    test "supports pagination", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/members", %{per_page: "1"})
      assert %{"data" => members} = json_response(conn, 200)
      assert length(members) <= 1
    end

    test "requires authentication", %{group: group} do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/members")
      assert json_response(conn, 401)
    end
  end

  describe "DELETE /api/v1/groups/:group_id/members/:user_id" do
    setup %{conn: conn} do
      admin = user_fixture()
      member = user_fixture()
      group = group_with_members_fixture(admin, [member])
      conn = log_in_user(conn, admin)
      %{conn: conn, admin: admin, member: member, group: group}
    end

    test "kicks a member (admin only)", %{conn: conn, group: group, member: member} do
      conn = delete(conn, ~p"/api/v1/groups/#{group.id}/members/#{member.id}")
      assert conn.status in [200, 204]
    end

    test "non-admin cannot kick", %{group: group, member: member} do
      non_admin = user_fixture()
      conn = build_conn()
        |> put_req_header("accept", "application/json")
        |> log_in_user(non_admin)
      conn = delete(conn, ~p"/api/v1/groups/#{group.id}/members/#{member.id}")
      assert conn.status in [401, 403, 404]
    end
  end
end
