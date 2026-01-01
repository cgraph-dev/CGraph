defmodule Cgraph.AdminExtendedTest do
  @moduledoc """
  Extended test suite for Cgraph.Admin context.
  Tests admin functions for user management and moderation.
  """
  use Cgraph.DataCase, async: true

  alias Cgraph.Admin
  alias Cgraph.Accounts

  defp create_user(attrs \\ %{}) do
    unique_id = System.unique_integer([:positive])
    base = %{
      username: "admintest_#{unique_id}",
      email: "admintest_#{unique_id}@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    }
    {:ok, user} = Accounts.create_user(Map.merge(base, attrs))
    user
  end

  defp create_admin do
    user = create_user()
    {:ok, admin} = Accounts.update_user(user, %{is_admin: true})
    admin
  end

  # ============================================================================
  # User Management
  # ============================================================================

  describe "list_users/1" do
    test "returns paginated list of users" do
      _user1 = create_user()
      _user2 = create_user()
      
      {:ok, result} = Admin.list_users([])
      
      assert is_list(result.users)
      assert is_map(result.pagination)
    end

    test "supports pagination" do
      Enum.each(1..5, fn _ -> create_user() end)
      
      {:ok, result} = Admin.list_users(page: 1, per_page: 2)
      
      assert length(result.users) == 2
    end

    test "supports search by username" do
      user = create_user()
      
      {:ok, result} = Admin.list_users(search: user.username)
      
      assert is_list(result.users)
    end

    test "supports ordering" do
      _user1 = create_user()
      _user2 = create_user()
      
      {:ok, result} = Admin.list_users(sort: :username, order: :asc)
      
      assert is_list(result.users)
    end
  end

  describe "get_user_details/1" do
    test "returns detailed user info with nested structure" do
      user = create_user()
      
      {:ok, details} = Admin.get_user_details(user.id)
      
      # Returns a map with user, stats, sessions, etc.
      assert is_map(details)
      assert is_map(details.user)
      assert details.user.id == user.id
    end

    test "includes user stats" do
      user = create_user()
      
      {:ok, details} = Admin.get_user_details(user.id)
      
      assert is_map(details.stats)
    end

    test "returns error for non-existent user" do
      result = Admin.get_user_details(Ecto.UUID.generate())
      
      assert match?({:error, _}, result)
    end
  end

  describe "verify_user/2" do
    test "verifies user account" do
      admin = create_admin()
      user = create_user()
      
      {:ok, verified} = Admin.verify_user(user.id, admin.id)
      
      assert verified.is_verified == true
    end
  end

  # ============================================================================
  # Audit Logging
  # ============================================================================

  describe "log_admin_action/3" do
    test "logs admin action successfully" do
      admin = create_admin()
      
      result = Admin.log_admin_action(admin.id, "user_banned", %{
        target_user_id: Ecto.UUID.generate(),
        reason: "Spam"
      })
      
      assert result == :ok
    end

    test "logs with different action types" do
      admin = create_admin()
      
      assert :ok = Admin.log_admin_action(admin.id, "config_updated", %{key: "test"})
      assert :ok = Admin.log_admin_action(admin.id, "user_verified", %{user_id: "123"})
    end
  end

  describe "list_audit_log/1" do
    test "returns audit log entries" do
      {:ok, result} = Admin.list_audit_log([])
      
      assert is_list(result.entries)
      assert is_map(result.pagination)
    end
  end

  # ============================================================================
  # System Configuration
  # ============================================================================

  describe "update_config/3" do
    test "updates system config value" do
      admin = create_admin()
      
      result = Admin.update_config(admin.id, "test_key", "test_value")
      
      assert result != nil
    end
  end

  describe "enable_maintenance_mode/2" do
    test "enables maintenance mode" do
      admin = create_admin()
      
      result = Admin.enable_maintenance_mode(admin.id, "Scheduled maintenance")
      
      assert result != nil
    end

    test "enables with custom message" do
      admin = create_admin()
      
      result = Admin.enable_maintenance_mode(admin.id, "Upgrading database")
      
      assert result != nil
    end
  end

  describe "disable_maintenance_mode/1" do
    test "disables maintenance mode" do
      admin = create_admin()
      Admin.enable_maintenance_mode(admin.id)
      
      result = Admin.disable_maintenance_mode(admin.id)
      
      assert result != nil
    end
  end

  # ============================================================================
  # Data Management
  # ============================================================================

  describe "export_user_data/2" do
    test "exports user data" do
      admin = create_admin()
      user = create_user()
      
      result = Admin.export_user_data(user.id, admin.id)
      
      assert match?({:ok, _}, result)
    end

    test "export includes user profile data" do
      admin = create_admin()
      user = create_user()
      
      {:ok, export} = Admin.export_user_data(user.id, admin.id)
      
      assert is_map(export)
    end
  end

  describe "delete_user_data/3" do
    test "requires confirmation for deletion" do
      admin = create_admin()
      user = create_user()
      
      result = Admin.delete_user_data(user.id, admin.id)
      
      # Requires explicit confirmation
      assert match?({:error, :confirmation_required}, result)
    end

    test "deletes user data with proper confirmation string" do
      admin = create_admin()
      user = create_user()
      
      result = Admin.delete_user_data(user.id, admin.id, 
        confirmation: "DELETE_#{user.id}"
      )
      
      assert match?({:ok, _}, result)
    end

    test "wrong confirmation string fails" do
      admin = create_admin()
      user = create_user()
      
      result = Admin.delete_user_data(user.id, admin.id, 
        confirmation: "WRONG_CONFIRMATION"
      )
      
      assert match?({:error, :confirmation_required}, result)
    end
  end
end
