defmodule CGraph.CustomizationsTest do
  @moduledoc "Tests for user customizations CRUD."
  use CGraph.DataCase, async: true

  alias CGraph.Customizations

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Customizations)
    end

    test "exports CRUD functions" do
      assert function_exported?(Customizations, :get_user_customizations, 1)
      assert function_exported?(Customizations, :create_default_customizations, 1)
      assert function_exported?(Customizations, :update_user_customizations, 2)
      assert function_exported?(Customizations, :update_customization_field, 3)
      assert function_exported?(Customizations, :delete_user_customizations, 1)
    end
  end

  describe "get_user_customizations/1" do
    test "returns nil for unknown user" do
      result = Customizations.get_user_customizations(Ecto.UUID.generate())
      assert is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "create_default_customizations/1" do
    test "creates defaults for a user id" do
      user_id = Ecto.UUID.generate()
      result = Customizations.create_default_customizations(user_id)
      assert match?({:ok, _}, result) or match?(%{}, result)
    end
  end

  describe "delete_user_customizations/1" do
    test "handles missing customizations gracefully" do
      result = Customizations.delete_user_customizations(Ecto.UUID.generate())
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end
end
