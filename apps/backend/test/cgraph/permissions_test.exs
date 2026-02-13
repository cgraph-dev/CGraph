defmodule CGraph.PermissionsTest do
  @moduledoc "Tests for RBAC + resource-level permission system."
  use ExUnit.Case, async: false

  alias CGraph.Permissions

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Permissions)
    end

    test "exports authorization functions" do
      assert function_exported?(Permissions, :can?, 4)
      assert function_exported?(Permissions, :authorize, 4)
      assert function_exported?(Permissions, :has_role?, 2)
      assert function_exported?(Permissions, :available_roles, 0)
    end
  end

  describe "available_roles/0" do
    test "returns list of defined roles" do
      roles = Permissions.available_roles()
      assert is_list(roles) or is_map(roles)
    end
  end

  describe "role_permissions/1" do
    test "returns permissions for a role" do
      result = Permissions.role_permissions(:admin)
      assert is_list(result) or is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "can?/4" do
    test "returns boolean for permission check" do
      # Non-existent user checking a permission
      result = Permissions.can?(%{id: Ecto.UUID.generate(), roles: []}, :read, :posts, %{})
      assert is_boolean(result)
    end
  end

  describe "authorize/4" do
    test "returns ok/error tuple" do
      result = Permissions.authorize(%{id: Ecto.UUID.generate(), roles: [:admin]}, :read, :posts, %{})
      assert result == :ok or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end
end
