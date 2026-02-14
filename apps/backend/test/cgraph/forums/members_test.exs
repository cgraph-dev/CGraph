defmodule CGraph.Forums.MembersTest do
  @moduledoc """
  Tests for the Forums.Members submodule.

  Tests membership, subscriptions, moderators, and bans.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Accounts
  alias CGraph.Forums
  alias CGraph.Forums.Members

  setup do
    {:ok, owner} = Accounts.create_user(%{
      username: "forumowner",
      email: "owner@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, user} = Accounts.create_user(%{
      username: "forummember",
      email: "member@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, forum} = Forums.create_forum(owner, %{
      name: "test_forum",
      slug: "test-forum",
      description: "A test forum"
    })

    %{owner: owner, user: user, forum: forum}
  end

  describe "membership" do
    test "member?/2 returns false for non-members", %{user: user, forum: forum} do
      refute Members.member?(forum.id, user.id)
    end

    test "member?/2 returns true after subscription", %{user: user, forum: forum} do
      {:ok, _} = Members.subscribe(user, forum)
      assert Members.member?(forum.id, user.id)
    end

    test "get_or_create_member/2 creates member if not exists", %{user: user, forum: forum} do
      assert {:ok, member} = Members.get_or_create_member(forum.id, user.id)
      assert member.user_id == user.id
      assert member.forum_id == forum.id
    end

    test "get_or_create_member/2 returns existing member", %{user: user, forum: forum} do
      {:ok, member1} = Members.get_or_create_member(forum.id, user.id)
      {:ok, member2} = Members.get_or_create_member(forum.id, user.id)
      assert member1.id == member2.id
    end

    test "get_member/2 returns member by forum and user id", %{user: user, forum: forum} do
      {:ok, _} = Members.get_or_create_member(forum.id, user.id)
      member = Members.get_member(forum.id, user.id)
      assert member.user_id == user.id
    end

    test "get_member/2 returns nil for non-member", %{user: user, forum: forum} do
      assert is_nil(Members.get_member(forum.id, user.id))
    end
  end

  describe "subscriptions" do
    test "subscribe/2 creates subscription and membership", %{user: user, forum: forum} do
      assert {:ok, _} = Members.subscribe(user, forum)
      assert Members.subscribed?(user, forum)
      assert Members.member?(forum.id, user.id)
    end

    test "subscribe/2 is idempotent", %{user: user, forum: forum} do
      {:ok, _} = Members.subscribe(user, forum)
      {:ok, _} = Members.subscribe(user, forum)
      assert Members.subscribed?(user, forum)
    end

    test "unsubscribe/2 removes subscription and membership", %{user: user, forum: forum} do
      {:ok, _} = Members.subscribe(user, forum)
      assert {:ok, :unsubscribed} = Members.unsubscribe(user, forum)
      refute Members.subscribed?(user, forum)
    end

    test "unsubscribe/2 prevents owner from leaving own forum", %{owner: owner, forum: forum} do
      assert {:error, :cannot_leave_own_forum} = Members.unsubscribe(owner, forum)
    end

    test "subscribed?/2 returns correct status", %{user: user, forum: forum} do
      refute Members.subscribed?(user, forum)
      {:ok, _} = Members.subscribe(user, forum)
      assert Members.subscribed?(user, forum)
    end
  end

  describe "roles" do
    test "update_role/3 changes member role", %{user: user, forum: forum} do
      {:ok, _} = Members.get_or_create_member(forum.id, user.id)

      assert {:ok, member} = Members.update_role(forum.id, user.id, "moderator")
      assert member.role == "moderator"
    end

    test "update_role/3 validates role values", %{user: user, forum: forum} do
      {:ok, _} = Members.get_or_create_member(forum.id, user.id)

      # Valid roles
      assert {:ok, _} = Members.update_role(forum.id, user.id, "member")
      assert {:ok, _} = Members.update_role(forum.id, user.id, "moderator")
      assert {:ok, _} = Members.update_role(forum.id, user.id, "admin")
    end

    test "update_role/3 returns error for non-member", %{user: user, forum: forum} do
      assert {:error, :not_found} = Members.update_role(forum.id, user.id, "moderator")
    end
  end

  describe "moderators" do
    test "moderator?/2 returns true for forum owner", %{owner: owner, forum: forum} do
      assert Members.moderator?(forum, owner)
    end

    test "moderator?/2 returns false for regular users", %{user: user, forum: forum} do
      refute Members.moderator?(forum, user)
    end

    test "add_moderator/3 adds moderator to forum", %{user: user, forum: forum, owner: owner} do
      assert {:ok, mod} = Members.add_moderator(forum, user, added_by_id: owner.id)
      assert mod.user_id == user.id
      assert mod.forum_id == forum.id
    end

    test "remove_moderator/2 removes moderator from forum", %{user: user, forum: forum, owner: owner} do
      {:ok, _} = Members.add_moderator(forum, user, added_by_id: owner.id)
      assert {:ok, _} = Members.remove_moderator(forum, user)
    end

    test "remove_moderator/2 returns error if not a moderator", %{user: user, forum: forum} do
      assert {:error, :not_found} = Members.remove_moderator(forum, user)
    end
  end

  describe "bans" do
    test "ban_member/5 bans a user from forum", %{user: user, forum: forum, owner: owner} do
      assert {:ok, ban} = Members.ban_member(forum.id, user.id, "Spam", owner.id)
      assert ban.user_id == user.id
      assert ban.reason == "Spam"
    end

    test "banned?/2 returns true for banned users", %{user: user, forum: forum, owner: owner} do
      refute Members.banned?(forum.id, user.id)
      {:ok, _} = Members.ban_member(forum.id, user.id, "Spam", owner.id)
      assert Members.banned?(forum.id, user.id)
    end

    test "unban_member/2 removes ban", %{user: user, forum: forum, owner: owner} do
      {:ok, _} = Members.ban_member(forum.id, user.id, "Spam", owner.id)
      assert :ok = Members.unban_member(forum.id, user.id)
      refute Members.banned?(forum.id, user.id)
    end

    test "ban_member/5 supports expiration", %{user: user, forum: forum, owner: owner} do
      expires_at = DateTime.utc_now() |> DateTime.add(86400, :second) |> DateTime.truncate(:second)
      assert {:ok, ban} = Members.ban_member(forum.id, user.id, "Temp ban", owner.id, expires_at)
      assert DateTime.compare(ban.expires_at, expires_at) == :eq
    end
  end

  describe "list_members/2" do
    test "returns paginated members", %{forum: forum, owner: owner} do
      # Owner is automatically a member
      {members, meta} = Members.list_members(forum.id)
      assert is_list(members)
      assert Map.has_key?(meta, :page)
      assert Map.has_key?(meta, :per_page)
    end

    test "supports pagination options", %{forum: forum} do
      {_members, meta} = Members.list_members(forum.id, page: 2, per_page: 10)
      assert meta.page == 2
      assert meta.per_page == 10
    end
  end
end
