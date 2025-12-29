defmodule CgraphWeb.API.V1.ChannelControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "GET /api/v1/groups/:group_id/channels" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      channel1 = channel_fixture(group, %{name: "general"})
      channel2 = channel_fixture(group, %{name: "random"})
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, channels: [channel1, channel2]}
    end

    test "lists channels in group", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/channels")
      
      assert %{"data" => channels} = json_response(conn, 200)
      assert is_list(channels)
      assert length(channels) >= 2
    end
  end

  describe "POST /api/v1/groups/:group_id/channels" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group}
    end

    test "creates a new channel", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/channels", %{
        name: "new-channel",
        type: "text"
      })
      
      assert %{
        "data" => %{
          "name" => "new-channel",
          "type" => "text"
        }
      } = json_response(conn, 201)
    end

    test "creates a voice channel", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/channels", %{
        name: "voice-chat",
        type: "voice"
      })
      
      assert %{
        "data" => %{
          "type" => "voice"
        }
      } = json_response(conn, 201)
    end
  end

  describe "PUT /api/v1/groups/:group_id/channels/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      channel = channel_fixture(group)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, channel: channel}
    end

    test "updates channel", %{conn: conn, group: group, channel: channel} do
      conn = put(conn, ~p"/api/v1/groups/#{group.id}/channels/#{channel.id}", %{
        name: "updated-name",
        topic: "New topic"
      })
      
      assert %{
        "data" => %{
          "name" => "updated-name",
          "topic" => "New topic"
        }
      } = json_response(conn, 200)
    end
  end

  describe "DELETE /api/v1/groups/:group_id/channels/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      channel = channel_fixture(group)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, channel: channel}
    end

    test "deletes channel", %{conn: conn, group: group, channel: channel} do
      conn = delete(conn, ~p"/api/v1/groups/#{group.id}/channels/#{channel.id}")
      assert response(conn, 204)
    end
  end
end

defmodule CgraphWeb.API.V1.RoleControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "GET /api/v1/groups/:group_id/roles" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      role = role_fixture(group, %{name: "Moderator"})
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, role: role}
    end

    test "lists roles in group", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/roles")
      
      assert %{"data" => roles} = json_response(conn, 200)
      assert is_list(roles)
    end
  end

  describe "POST /api/v1/groups/:group_id/roles" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group}
    end

    test "creates a new role", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/roles", %{
        name: "VIP",
        color: "#FFD700"
      })
      
      assert %{
        "data" => %{
          "name" => "VIP",
          "color" => "#FFD700"
        }
      } = json_response(conn, 201)
    end
  end

  describe "PUT /api/v1/groups/:group_id/roles/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      role = role_fixture(group)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, role: role}
    end

    test "updates role", %{conn: conn, group: group, role: role} do
      conn = put(conn, ~p"/api/v1/groups/#{group.id}/roles/#{role.id}", %{
        name: "Super VIP",
        color: "#FF0000"
      })
      
      assert %{
        "data" => %{
          "name" => "Super VIP"
        }
      } = json_response(conn, 200)
    end
  end

  describe "DELETE /api/v1/groups/:group_id/roles/:id" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      role = role_fixture(group)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, role: role}
    end

    test "deletes role", %{conn: conn, group: group, role: role} do
      conn = delete(conn, ~p"/api/v1/groups/#{group.id}/roles/#{role.id}")
      assert response(conn, 204)
    end
  end
end

defmodule CgraphWeb.API.V1.InviteControllerTest do
  use CgraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures
  import CgraphWeb.GroupFixtures

  describe "GET /api/v1/groups/:group_id/invites" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      {:ok, invite} = Cgraph.Groups.create_invite(group, user, %{})
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group, invite: invite}
    end

    test "lists invites for group", %{conn: conn, group: group} do
      conn = get(conn, ~p"/api/v1/groups/#{group.id}/invites")
      
      assert %{"data" => invites} = json_response(conn, 200)
      assert is_list(invites)
    end
  end

  describe "POST /api/v1/groups/:group_id/invites" do
    setup %{conn: conn} do
      user = user_fixture()
      %{group: group} = group_fixture(user)
      conn = log_in_user(conn, user)
      
      %{conn: conn, group: group}
    end

    test "creates a new invite", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/invites", %{})
      
      assert %{
        "data" => %{
          "code" => code
        }
      } = json_response(conn, 201)
      
      assert is_binary(code)
    end

    test "creates invite with max uses", %{conn: conn, group: group} do
      conn = post(conn, ~p"/api/v1/groups/#{group.id}/invites", %{
        max_uses: 10
      })
      
      assert %{
        "data" => %{
          "max_uses" => 10
        }
      } = json_response(conn, 201)
    end
  end

  describe "POST /api/v1/invites/:code/join" do
    setup %{conn: conn} do
      owner = user_fixture()
      %{group: group} = group_fixture(owner)
      {:ok, invite} = Cgraph.Groups.create_invite(group, owner, %{})
      
      joiner = user_fixture()
      conn = log_in_user(conn, joiner)
      
      %{conn: conn, group: group, invite: invite, joiner: joiner}
    end

    test "joins group via invite", %{conn: conn, invite: invite} do
      conn = post(conn, ~p"/api/v1/invites/#{invite.code}/join")
      
      # 201 Created is returned when successfully joining a group
      # as a new membership resource is created
      assert %{
        "data" => %{
          "member" => member,
          "group" => group
        }
      } = json_response(conn, 201)
      
      assert is_map(member)
      assert is_map(group)
    end

    test "returns error for invalid invite code", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/invites/invalid-code/join")
      assert json_response(conn, 404)
    end
  end
end
