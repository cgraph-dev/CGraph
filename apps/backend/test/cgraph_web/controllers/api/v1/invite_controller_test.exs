defmodule CgraphWeb.API.V1.InviteControllerTest do
  @moduledoc "Invite controller tests — Invite links"
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "POST /api/v1/groups/:group_id/invites" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      %{conn: conn, user: user, group: group}
    end

    test "creates an invite link", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/invites", %{
        max_uses: 10,
        expires_in: 86400
      })
      assert %{"data" => invite} = json_response(conn, 201)
      assert invite["code"]
      assert is_binary(invite["code"])
    end

    test "requires authentication", %{group: group} do
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/invites", %{})
      assert json_response(conn, 401)
    end
  end

  describe "GET /api/v1/invites/:code" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      invite = invite_fixture(group, user)
      conn = log_in_user(conn, user)
      %{conn: conn, invite: invite}
    end

    test "returns invite details", %{conn: conn, invite: invite} do
      conn = get(conn, ~p"/api/v1/invites/#{invite.code}")
      assert %{"data" => data} = json_response(conn, 200)
      assert data["code"] == invite.code
    end

    test "returns 404 for invalid code", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/invites/invalid-code-xyz")
      assert json_response(conn, 404)
    end
  end

  describe "POST /api/v1/invites/:code/accept" do
    setup %{conn: conn} do
      creator = user_fixture()
      joiner = user_fixture()
      %{group: group} = group_fixture(creator)
      invite = invite_fixture(group, creator)
      conn = log_in_user(conn, joiner)
      %{conn: conn, invite: invite, joiner: joiner}
    end

    test "joins group via invite", %{conn: conn, invite: invite} do
      conn = post(conn, ~p"/api/v1/invites/#{invite.code}/accept")
      assert conn.status in [200, 201]
    end
  end
end
