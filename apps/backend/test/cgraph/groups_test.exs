defmodule Cgraph.GroupsTest do
  use Cgraph.DataCase, async: true

  alias Cgraph.Groups
  alias Cgraph.Groups.{Group, Channel, Member, Role}
  alias Cgraph.Accounts

  setup do
    {:ok, owner} = Accounts.create_user(%{
      username: "groupowner",
      email: "owner@example.com",
      password: "ValidPassword123!"
    })
    
    %{owner: owner}
  end

  describe "groups" do
    test "create_group/2 creates a new group", %{owner: owner} do
      assert {:ok, %Group{} = group} = Groups.create_group(owner, %{
        name: "Test Group",
        description: "A test group"
      })
      
      assert group.name == "Test Group"
      assert group.owner_id == owner.id
    end

    test "create_group/2 adds owner as member", %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      
      assert Groups.is_member?(owner, group)
    end

    test "create_group/2 creates default channels", %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      
      channels = Groups.list_channels(group)
      assert length(channels) >= 1
    end

    test "get_group/1 returns group by id", %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      
      assert {:ok, found} = Groups.get_group(group.id)
      assert found.id == group.id
    end

    test "update_group/2 updates group attributes", %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Original Name"})
      
      assert {:ok, updated} = Groups.update_group(group, %{name: "New Name"})
      assert updated.name == "New Name"
    end

    test "delete_group/1 soft deletes group", %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      
      assert {:ok, deleted} = Groups.delete_group(group)
      assert deleted.deleted_at != nil
    end

    test "list_user_groups/1 returns groups user is member of", %{owner: owner} do
      {:ok, _} = Groups.create_group(owner, %{name: "Group 1"})
      {:ok, _} = Groups.create_group(owner, %{name: "Group 2"})
      
      {groups, _meta} = Groups.list_user_groups(owner)
      assert length(groups) == 2
    end
  end

  describe "channels" do
    setup %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      %{owner: owner, group: group}
    end

    test "create_channel/2 creates a new text channel", %{group: group} do
      assert {:ok, %Channel{} = channel} = Groups.create_channel(group, %{
        name: "new-channel",
        channel_type: "text"
      })
      
      assert channel.name == "new-channel"
      assert channel.channel_type == "text"
    end

    test "create_channel/2 creates a voice channel", %{group: group} do
      assert {:ok, channel} = Groups.create_channel(group, %{
        name: "voice-chat",
        channel_type: "voice"
      })
      
      assert channel.channel_type == "voice"
    end

    test "list_channels/1 returns group's channels", %{group: group} do
      {:ok, _} = Groups.create_channel(group, %{name: "channel-1", channel_type: "text"})
      {:ok, _} = Groups.create_channel(group, %{name: "channel-2", channel_type: "text"})
      
      channels = Groups.list_channels(group)
      # +1 for default channel
      assert length(channels) >= 2
    end

    test "update_channel/2 updates channel attributes", %{group: group} do
      {:ok, channel} = Groups.create_channel(group, %{name: "original", type: "text"})
      
      assert {:ok, updated} = Groups.update_channel(channel, %{name: "renamed", topic: "New topic"})
      assert updated.name == "renamed"
      assert updated.topic == "New topic"
    end

    test "delete_channel/1 removes channel", %{group: group} do
      {:ok, channel} = Groups.create_channel(group, %{name: "to-delete", type: "text"})
      
      assert {:ok, _} = Groups.delete_channel(channel)
    end
  end

  describe "members" do
    setup %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      
      {:ok, user} = Accounts.create_user(%{
        username: "member1",
        email: "member1@example.com",
        password: "ValidPassword123!"
      })
      
      %{owner: owner, group: group, user: user}
    end

    test "add_member/2 adds user to group", %{group: group, user: user} do
      assert {:ok, %Member{} = member} = Groups.add_member(group, user)
      assert member.user_id == user.id
      assert member.group_id == group.id
    end

    test "is_member?/2 returns membership status", %{group: group, user: user} do
      assert Groups.is_member?(user, group) == false
      
      {:ok, _} = Groups.add_member(group, user)
      
      assert Groups.is_member?(user, group) == true
    end

    test "list_group_members/1 returns group members", %{owner: owner, group: group, user: user} do
      {:ok, _} = Groups.add_member(group, user)
      
      {members, _meta} = Groups.list_group_members(group)
      # Owner + new member
      assert length(members) >= 2
    end

    test "remove_member/1 removes user from group", %{group: group, user: user} do
      {:ok, member} = Groups.add_member(group, user)
      
      assert {:ok, _} = Groups.remove_member(member)
      assert Groups.is_member?(user, group) == false
    end

    test "mute_member/2 mutes member for duration", %{group: group, user: user} do
      {:ok, member} = Groups.add_member(group, user)
      
      assert {:ok, muted} = Groups.mute_member(member, 600) # 10 minutes
      assert muted.muted_until != nil
    end
  end

  describe "roles" do
    setup %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      %{group: group}
    end

    test "create_role/2 creates a new role", %{group: group} do
      assert {:ok, %Role{} = role} = Groups.create_role(group, %{
        name: "Moderator",
        color: "#FF5733"
      })
      
      assert role.name == "Moderator"
      assert role.color == "#FF5733"
    end

    test "list_roles/1 returns group's roles", %{group: group} do
      {:ok, _} = Groups.create_role(group, %{name: "Role 1"})
      {:ok, _} = Groups.create_role(group, %{name: "Role 2"})
      
      roles = Groups.list_roles(group)
      # +1 for default @everyone role
      assert length(roles) >= 2
    end

    test "update_role/2 updates role attributes", %{group: group} do
      {:ok, role} = Groups.create_role(group, %{name: "Original"})
      
      assert {:ok, updated} = Groups.update_role(role, %{name: "Updated", color: "#00FF00"})
      assert updated.name == "Updated"
    end

    test "delete_role/1 removes role", %{group: group} do
      {:ok, role} = Groups.create_role(group, %{name: "To Delete"})
      
      assert {:ok, _} = Groups.delete_role(role)
    end
  end

  describe "invites" do
    setup %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      %{owner: owner, group: group}
    end

    test "create_invite/3 creates invite with code", %{owner: owner, group: group} do
      assert {:ok, invite} = Groups.create_invite(group, owner, %{})
      assert is_binary(invite.code)
      assert String.length(invite.code) >= 6
    end

    test "create_invite/3 supports max uses", %{owner: owner, group: group} do
      assert {:ok, invite} = Groups.create_invite(group, owner, %{max_uses: 10})
      assert invite.max_uses == 10
    end

    test "create_invite/3 supports expiration", %{owner: owner, group: group} do
      expires = DateTime.add(DateTime.utc_now(), 86400, :second) # 1 day
      
      assert {:ok, invite} = Groups.create_invite(group, owner, %{expires_at: expires})
      assert invite.expires_at != nil
    end

    test "get_invite_by_code/1 returns invite by code", %{owner: owner, group: group} do
      {:ok, invite} = Groups.create_invite(group, owner, %{})
      
      assert {:ok, found} = Groups.get_invite_by_code(invite.code)
      assert found.id == invite.id
    end

    test "join_via_invite/2 adds user to group", %{owner: owner, group: group} do
      {:ok, invite} = Groups.create_invite(group, owner, %{})
      
      {:ok, joiner} = Accounts.create_user(%{
        username: "joiner",
        email: "joiner@example.com",
        password: "ValidPassword123!"
      })
      
      assert {:ok, member} = Groups.join_via_invite(joiner, invite)
      assert member.user_id == joiner.id
    end

    test "join_via_invite/2 increments uses count", %{owner: owner, group: group} do
      {:ok, invite} = Groups.create_invite(group, owner, %{})
      
      {:ok, joiner} = Accounts.create_user(%{
        username: "joiner2",
        email: "joiner2@example.com",
        password: "ValidPassword123!"
      })
      
      {:ok, _} = Groups.join_via_invite(joiner, invite)
      
      {:ok, updated_invite} = Groups.get_invite_by_code(invite.code)
      assert updated_invite.uses == 1
    end
  end

  describe "audit log" do
    setup %{owner: owner} do
      {:ok, group} = Groups.create_group(owner, %{name: "Test Group"})
      %{owner: owner, group: group}
    end

    test "log_audit_event/4 creates audit entry", %{owner: owner, group: group} do
      assert {:ok, entry} = Groups.log_audit_event(group, owner, :channel_create, %{
        channel_name: "new-channel"
      })
      
      assert entry.action_type == "channel_create"
    end

    test "list_audit_log/2 returns audit entries", %{owner: owner, group: group} do
      {:ok, _} = Groups.log_audit_event(group, owner, :channel_create, %{})
      
      {entries, _meta} = Groups.list_audit_log(group)
      assert length(entries) >= 1
    end
  end
end
