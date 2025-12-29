defmodule Cgraph.AccountsTest do
  use Cgraph.DataCase, async: true

  alias Cgraph.Accounts
  alias Cgraph.Accounts.User

  describe "users" do
    @valid_attrs %{
      username: "testuser",
      email: "test@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }

    test "create_user/1 with valid data creates a user" do
      assert {:ok, %User{} = user} = Accounts.create_user(@valid_attrs)
      assert user.username == "testuser"
      assert user.email == "test@example.com"
      assert user.password_hash != nil
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(%{})
    end

    test "create_user/1 requires unique username" do
      {:ok, _} = Accounts.create_user(@valid_attrs)
      
      assert {:error, changeset} = Accounts.create_user(%{
        @valid_attrs | email: "other@example.com"
      })
      
      assert "has already been taken" in errors_on(changeset).username
    end

    test "create_user/1 requires unique email" do
      {:ok, _} = Accounts.create_user(@valid_attrs)
      
      assert {:error, changeset} = Accounts.create_user(%{
        @valid_attrs | username: "otheruser"
      })
      
      assert "has already been taken" in errors_on(changeset).email
    end

    test "create_user/1 validates password strength" do
      assert {:error, changeset} = Accounts.create_user(%{
        @valid_attrs | password: "weak"
      })
      
      assert errors_on(changeset).password != nil
    end

    test "get_user!/1 returns user by id" do
      {:ok, user} = Accounts.create_user(@valid_attrs)
      assert Accounts.get_user!(user.id).id == user.id
    end

    test "get_user_by_email/1 returns user by email" do
      {:ok, user} = Accounts.create_user(@valid_attrs)
      assert {:ok, found} = Accounts.get_user_by_email(user.email)
      assert found.id == user.id
    end

    test "get_user_by_username/1 returns user by username" do
      {:ok, user} = Accounts.create_user(@valid_attrs)
      assert {:ok, found} = Accounts.get_user_by_username(user.username)
      assert found.id == user.id
    end

    test "update_user/2 updates user attributes" do
      {:ok, user} = Accounts.create_user(@valid_attrs)
      
      assert {:ok, updated} = Accounts.update_user(user, %{display_name: "New Name"})
      assert updated.display_name == "New Name"
    end

    test "authenticate_user/2 with valid credentials returns user" do
      {:ok, user} = Accounts.create_user(@valid_attrs)
      
      assert {:ok, authenticated} = Accounts.authenticate_user(
        @valid_attrs.email, 
        @valid_attrs.password
      )
      assert authenticated.id == user.id
    end

    test "authenticate_user/2 with invalid password returns error" do
      {:ok, _} = Accounts.create_user(@valid_attrs)
      
      assert {:error, :invalid_credentials} = Accounts.authenticate_user(
        @valid_attrs.email,
        "wrongpassword"
      )
    end

    test "deactivate_user/1 soft deletes user" do
      {:ok, user} = Accounts.create_user(@valid_attrs)
      
      assert {:ok, deactivated} = Accounts.deactivate_user(user)
      # User is deactivated when deleted_at is set
      assert not is_nil(deactivated.deleted_at)
    end
  end

  describe "sessions" do
    setup do
      {:ok, user} = Accounts.create_user(%{
        username: "sessionuser",
        email: "session@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      # Create a mock Plug.Conn for session tests
      conn = %Plug.Conn{
        req_headers: [{"user-agent", "Test Agent"}],
        remote_ip: {127, 0, 0, 1}
      }
      
      %{user: user, conn: conn}
    end

    test "create_session/2 creates a new session", %{user: user, conn: conn} do
      assert {:ok, session} = Accounts.create_session(user, conn)
      
      assert session.user_id == user.id
    end

    test "list_sessions/1 returns user's sessions", %{user: user, conn: conn} do
      {:ok, _} = Accounts.create_session(user, conn)
      {:ok, _} = Accounts.create_session(user, conn)
      
      sessions = Accounts.list_sessions(user)
      assert length(sessions) == 2
    end

    test "revoke_session/1 invalidates session", %{user: user, conn: conn} do
      {:ok, session} = Accounts.create_session(user, conn)
      
      assert {:ok, revoked} = Accounts.revoke_session(session)
      assert revoked.revoked_at != nil
    end
  end

  describe "friendships" do
    setup do
      {:ok, user1} = Accounts.create_user(%{
        username: "user1",
        email: "user1@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      {:ok, user2} = Accounts.create_user(%{
        username: "user2",
        email: "user2@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      %{user1: user1, user2: user2}
    end

    test "send_friend_request/2 creates pending friendship", %{user1: user1, user2: user2} do
      assert {:ok, friendship} = Accounts.send_friend_request(user1, user2)
      assert friendship.status == :pending
      assert friendship.user_id == user1.id
      assert friendship.friend_id == user2.id
    end

    test "accept_friend_request/2 accepts pending request", %{user1: user1, user2: user2} do
      {:ok, _} = Accounts.send_friend_request(user1, user2)
      
      assert {:ok, friendship} = Accounts.accept_friend_request(user2, user1)
      assert friendship.status == :accepted
    end

    test "decline_friend_request/2 declines pending request", %{user1: user1, user2: user2} do
      {:ok, _} = Accounts.send_friend_request(user1, user2)
      
      assert {:ok, _} = Accounts.decline_friend_request(user2, user1)
    end

    test "list_friends/1 returns accepted friendships", %{user1: user1, user2: user2} do
      {:ok, _} = Accounts.send_friend_request(user1, user2)
      {:ok, _} = Accounts.accept_friend_request(user2, user1)
      
      {friends, _meta} = Accounts.list_friends(user1)
      assert length(friends) == 1
    end

    test "block_user/2 blocks a user", %{user1: user1, user2: user2} do
      assert {:ok, block} = Accounts.block_user(user1, user2)
      assert block.friend_id == user2.id
    end

    test "unblock_user/2 removes block", %{user1: user1, user2: user2} do
      {:ok, _} = Accounts.block_user(user1, user2)
      
      assert {:ok, _} = Accounts.unblock_user(user1, user2)
    end

    test "is_blocked?/2 returns block status", %{user1: user1, user2: user2} do
      assert Accounts.is_blocked?(user1, user2) == false
      
      {:ok, _} = Accounts.block_user(user1, user2)
      
      assert Accounts.is_blocked?(user1, user2) == true
    end
  end
end
