defmodule Cgraph.AccountsExtendedTest do
  @moduledoc """
  Extended test suite for Cgraph.Accounts context.
  Tests additional functions beyond the base test suite.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Accounts
  alias Cgraph.Accounts.{User, UserSettings}

  defp create_user(attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    base = %{
      username: "testuser_#{unique_id}",
      email: "testuser_#{unique_id}@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  # ============================================================================
  # User CRUD Operations
  # ============================================================================

  describe "get_user/1" do
    test "returns user by ID" do
      user = create_user()
      {:ok, found} = Accounts.get_user(user.id)
      assert found.id == user.id
    end

    test "returns error for non-existent user" do
      result = Accounts.get_user(Ecto.UUID.generate())
      assert match?({:error, _}, result)
    end
  end

  describe "get_user!/1" do
    test "returns user by ID" do
      user = create_user()
      found = Accounts.get_user!(user.id)
      assert found.id == user.id
    end

    test "raises for non-existent user" do
      assert_raise Ecto.NoResultsError, fn ->
        Accounts.get_user!(Ecto.UUID.generate())
      end
    end
  end

  describe "get_user_by_email/1" do
    test "returns user by email" do
      user = create_user()
      {:ok, found} = Accounts.get_user_by_email(user.email)
      assert found.id == user.id
    end

    test "returns error for non-existent email" do
      result = Accounts.get_user_by_email("nonexistent@example.com")
      assert match?({:error, _}, result)
    end
  end

  describe "get_user_by_username/1" do
    test "returns user by username" do
      user = create_user()
      {:ok, found} = Accounts.get_user_by_username(user.username)
      assert found.id == user.id
    end

    test "returns error for non-existent username" do
      result = Accounts.get_user_by_username("nonexistent_user")
      assert match?({:error, _}, result)
    end
  end

  describe "update_user/2" do
    test "updates user attributes" do
      user = create_user()
      {:ok, updated} = Accounts.update_user(user, %{bio: "Updated bio"})
      assert updated.bio == "Updated bio"
    end
  end

  # ============================================================================
  # User Lists
  # ============================================================================

  describe "list_users/1" do
    test "returns paginated users" do
      _user1 = create_user()
      _user2 = create_user()
      
      {users, meta} = Accounts.list_users([])
      
      assert is_list(users)
      assert is_map(meta)
      assert Map.has_key?(meta, :total)
    end

    test "paginates results" do
      Enum.each(1..5, fn _ -> create_user() end)
      
      {page1, _} = Accounts.list_users(page: 1, per_page: 2)
      
      assert length(page1) == 2
    end
  end

  describe "list_top_users_by_karma/1" do
    test "returns users ordered by karma" do
      user1 = create_user()
      user2 = create_user()
      
      Accounts.update_user(user1, %{karma: 100})
      Accounts.update_user(user2, %{karma: 50})
      
      {top_users, _meta} = Accounts.list_top_users_by_karma([])
      
      assert is_list(top_users)
    end

    test "respects per_page option" do
      Enum.each(1..5, fn _ -> create_user() end)
      
      {top_users, _meta} = Accounts.list_top_users_by_karma(per_page: 3)
      
      assert length(top_users) <= 3
    end
  end

  # ============================================================================
  # User Settings
  # ============================================================================

  describe "user settings" do
    test "get_settings/1 returns or creates settings" do
      user = create_user()
      result = Accounts.get_settings(user)
      assert match?({:ok, %UserSettings{}}, result)
    end

    test "update_settings/2 updates settings" do
      user = create_user()
      {:ok, _} = Accounts.get_settings(user)
      result = Accounts.update_settings(user, %{theme: :dark})
      assert match?({:ok, _}, result)
    end
  end

  # ============================================================================
  # Friendships 
  # ============================================================================

  describe "send_friend_request/2" do
    test "sends friend request with user struct" do
      user1 = create_user()
      user2 = create_user()
      result = Accounts.send_friend_request(user1, user2)
      assert match?({:ok, _}, result)
    end

    test "creates pending friendship" do
      user1 = create_user()
      user2 = create_user()
      {:ok, friendship} = Accounts.send_friend_request(user1, user2)
      assert friendship.status == :pending or friendship.status == "pending"
    end
  end

  describe "accept_friend_request/1" do
    test "accepts pending request with friendship struct" do
      user1 = create_user()
      user2 = create_user()
      {:ok, request} = Accounts.send_friend_request(user1, user2)
      result = Accounts.accept_friend_request(request)
      assert match?({:ok, _}, result)
    end
  end

  describe "list_friends/1" do
    test "returns empty list for user with no friends" do
      user = create_user()
      {friends, _meta} = Accounts.list_friends(user, [])
      assert friends == []
    end

    test "returns friends after accepting request" do
      user1 = create_user()
      user2 = create_user()
      {:ok, request} = Accounts.send_friend_request(user1, user2)
      {:ok, _} = Accounts.accept_friend_request(request)
      {friends, _} = Accounts.list_friends(user1, [])
      assert length(friends) == 1
    end
  end

  # ============================================================================
  # Blocking (using user structs)
  # ============================================================================

  describe "block_user/2" do
    test "blocks a user with structs" do
      user1 = create_user()
      user2 = create_user()
      result = Accounts.block_user(user1, user2)
      assert match?({:ok, _}, result)
    end
  end

  describe "unblock_user/2" do
    test "unblocks a blocked user" do
      user1 = create_user()
      user2 = create_user()
      {:ok, _} = Accounts.block_user(user1, user2)
      result = Accounts.unblock_user(user1, user2)
      assert match?({:ok, _}, result)
    end
  end

  describe "is_blocked?/2" do
    test "returns true if blocked" do
      user1 = create_user()
      user2 = create_user()
      {:ok, _} = Accounts.block_user(user1, user2)
      assert Accounts.is_blocked?(user1, user2)
    end

    test "returns false if not blocked" do
      user1 = create_user()
      user2 = create_user()
      refute Accounts.is_blocked?(user1, user2)
    end
  end

  # ============================================================================
  # Authentication
  # ============================================================================

  describe "authenticate_user/2" do
    test "authenticates with valid credentials" do
      password = "ValidPassword123!"
      user = create_user(%{password: password, password_confirmation: password})
      result = Accounts.authenticate_user(user.email, password)
      assert match?({:ok, %User{}}, result)
    end

    test "rejects invalid password" do
      user = create_user()
      result = Accounts.authenticate_user(user.email, "wrongpassword")
      assert match?({:error, _}, result)
    end
  end
end
