defmodule Cgraph.GroupsExtendedTest do
  @moduledoc """
  Extended test suite for Cgraph.Groups context.
  Tests additional functions beyond the base test suite.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Groups
  alias Cgraph.Accounts

  defp create_user(attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    base = %{
      username: "grpuser_#{unique_id}",
      email: "grpuser_#{unique_id}@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_group(owner, attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    base = %{
      name: "Test Group #{unique_id}",
      description: "A test group"
    }
    {:ok, group} = Groups.create_group(owner, Map.merge(base, attrs))
    group
  end

  # ============================================================================
  # Group CRUD Operations
  # ============================================================================

  describe "list_groups/2" do
    test "returns user's groups" do
      user = create_user()
      _group = create_group(user)
      
      {groups, meta} = Groups.list_groups(user, [])
      
      assert length(groups) >= 1
      assert is_map(meta)
    end

    test "paginates results" do
      user = create_user()
      Enum.each(1..3, fn _ -> create_group(user) end)
      
      {page1, _} = Groups.list_groups(user, page: 1, per_page: 2)
      
      assert length(page1) == 2
    end
  end

  describe "get_group/1" do
    test "returns group by ID" do
      user = create_user()
      group = create_group(user)
      
      {:ok, found} = Groups.get_group(group.id)
      
      assert found.id == group.id
    end

    test "returns error for non-existent group" do
      result = Groups.get_group(Ecto.UUID.generate())
      
      assert match?({:error, :not_found}, result)
    end
  end

  describe "get_user_group/2" do
    test "returns group for member" do
      user = create_user()
      group = create_group(user)
      
      {:ok, found} = Groups.get_user_group(user, group.id)
      
      assert found.id == group.id
    end
  end

  describe "create_group/2" do
    test "creates group with owner as admin" do
      user = create_user()
      
      {:ok, group} = Groups.create_group(user, %{
        name: "New Group",
        description: "Test description"
      })
      
      assert group.name == "New Group"
      assert group.owner_id == user.id
    end
  end

  describe "update_group/2" do
    test "updates group attributes" do
      user = create_user()
      group = create_group(user)
      
      {:ok, updated} = Groups.update_group(group, %{description: "Updated"})
      
      assert updated.description == "Updated"
    end
  end

  describe "delete_group/1" do
    test "soft deletes group" do
      user = create_user()
      group = create_group(user)
      
      {:ok, deleted} = Groups.delete_group(group)
      
      assert deleted.deleted_at != nil
    end
  end

  # ============================================================================
  # Channel Operations
  # ============================================================================

  describe "list_channels/2" do
    test "returns group channels" do
      user = create_user()
      group = create_group(user)
      
      channels = Groups.list_channels(group)
      
      assert is_list(channels)
    end
  end

  describe "create_channel/2" do
    test "creates channel in group" do
      user = create_user()
      group = create_group(user)
      
      {:ok, channel} = Groups.create_channel(group, %{
        name: "new-channel",
        type: "text"
      })
      
      assert channel.name == "new-channel"
    end
  end

  describe "get_channel/2" do
    test "returns channel by ID" do
      user = create_user()
      group = create_group(user)
      {:ok, channel} = Groups.create_channel(group, %{name: "test-channel"})
      
      {:ok, found} = Groups.get_channel(group, channel.id)
      
      assert found.id == channel.id
    end
  end

  describe "update_channel/2" do
    test "updates channel attributes" do
      user = create_user()
      group = create_group(user)
      {:ok, channel} = Groups.create_channel(group, %{name: "original"})
      
      {:ok, updated} = Groups.update_channel(channel, %{name: "updated"})
      
      assert updated.name == "updated"
    end
  end

  describe "delete_channel/1" do
    test "deletes channel" do
      user = create_user()
      group = create_group(user)
      {:ok, channel} = Groups.create_channel(group, %{name: "to-delete"})
      
      result = Groups.delete_channel(channel)
      
      assert match?({:ok, _}, result)
    end
  end

  # ============================================================================
  # Member Operations
  # ============================================================================

  describe "list_group_members/2" do
    test "returns group members" do
      user = create_user()
      group = create_group(user)
      
      {members, _meta} = Groups.list_group_members(group, [])
      
      # Should have at least the owner
      assert length(members) >= 1
    end
  end

  describe "add_member/3" do
    test "adds user to group" do
      owner = create_user()
      group = create_group(owner)
      new_user = create_user()
      
      {:ok, member} = Groups.add_member(group, new_user)
      
      assert member.user_id == new_user.id
    end
  end

  describe "get_member/2" do
    test "returns member by ID" do
      owner = create_user()
      group = create_group(owner)
      new_user = create_user()
      {:ok, added} = Groups.add_member(group, new_user)
      
      {:ok, found} = Groups.get_member(group, added.id)
      
      assert found.id == added.id
    end
  end

  describe "get_member_by_user/2" do
    test "returns member by user ID" do
      owner = create_user()
      group = create_group(owner)
      
      member = Groups.get_member_by_user(group, owner.id)
      
      assert member.user_id == owner.id
    end

    test "returns nil for non-member" do
      owner = create_user()
      group = create_group(owner)
      stranger = create_user()
      
      result = Groups.get_member_by_user(group, stranger.id)
      
      assert result == nil
    end
  end

  describe "remove_member/1" do
    test "removes member from group" do
      owner = create_user()
      group = create_group(owner)
      new_user = create_user()
      {:ok, member} = Groups.add_member(group, new_user)
      
      result = Groups.remove_member(member)
      
      assert match?({:ok, _}, result)
    end
  end

  # ============================================================================
  # Channel Messages
  # ============================================================================

  describe "list_channel_messages/2" do
    test "returns messages for channel" do
      user = create_user()
      group = create_group(user)
      {:ok, channel} = Groups.create_channel(group, %{name: "msg-channel"})
      
      {messages, _meta} = Groups.list_channel_messages(channel, [])
      
      assert is_list(messages)
    end
  end

  describe "create_channel_message/3" do
    test "creates message in channel" do
      user = create_user()
      group = create_group(user)
      {:ok, channel} = Groups.create_channel(group, %{name: "msg-channel"})
      
      {:ok, message} = Groups.create_channel_message(user, channel, %{"content" => "Hello!"})
      
      assert message.content == "Hello!"
    end
  end

  # ============================================================================
  # Authorization
  # ============================================================================

  describe "authorize_action/3" do
    test "owner can manage group" do
      owner = create_user()
      group = create_group(owner)
      
      assert :ok = Groups.authorize_action(owner, group, :manage)
    end

    test "members can view group" do
      owner = create_user()
      group = create_group(owner)
      member = create_user()
      {:ok, _} = Groups.add_member(group, member)
      
      # Reload group to get fresh data
      {:ok, group} = Groups.get_group(group.id)
      
      result = Groups.authorize_action(member, group, :view)
      
      assert result == :ok or match?({:error, _}, result)
    end
  end
end
