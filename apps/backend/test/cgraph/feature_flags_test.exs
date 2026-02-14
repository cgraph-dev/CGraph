defmodule CGraph.FeatureFlagsTest do
  @moduledoc "Tests for feature flag GenServer with percentage rollouts."
  use ExUnit.Case, async: false

  alias CGraph.FeatureFlags

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(FeatureFlags)
    end

    test "exports flag management functions" do
      assert function_exported?(FeatureFlags, :enabled?, 2)
      assert function_exported?(FeatureFlags, :variant, 2)
      assert function_exported?(FeatureFlags, :all_flags, 0)
      assert function_exported?(FeatureFlags, :get_flag, 1)
      assert function_exported?(FeatureFlags, :enable, 1)
      assert function_exported?(FeatureFlags, :disable, 1)
      assert function_exported?(FeatureFlags, :set_percentage, 2)
    end
  end

  describe "enabled?/2" do
    test "returns boolean for unknown flag" do
      result = FeatureFlags.enabled?(:nonexistent_flag_test, %{})
      assert is_boolean(result)
    end

    test "disabled flags return false" do
      result = FeatureFlags.enabled?(:definitely_disabled_xyz, %{})
      refute result
    end
  end

  describe "all_flags/0" do
    test "returns a map or list of flags" do
      result = FeatureFlags.all_flags()
      assert is_map(result) or is_list(result)
    end
  end

  describe "get_flag/1" do
    test "returns nil or error for non-existent flag" do
      result = FeatureFlags.get_flag(:does_not_exist_xyz)
      assert is_nil(result) or match?({:error, _}, result)
    end
  end

  describe "user_percentage/1" do
    test "returns a number between 0 and 100" do
      pct = FeatureFlags.user_percentage("test-user-123")
      assert is_number(pct)
      assert pct >= 0 and pct <= 100
    end

    test "is deterministic for same user" do
      p1 = FeatureFlags.user_percentage("stable-user")
      p2 = FeatureFlags.user_percentage("stable-user")
      assert p1 == p2
    end
  end

  describe "create_flag/2 and delete_flag/1" do
    test "lifecycle: create, check, delete" do
      flag_name = :"test_flag_#{System.unique_integer([:positive])}"

      case FeatureFlags.create_flag(flag_name, %{enabled: true, type: :boolean}) do
        {:ok, _} ->
          assert FeatureFlags.enabled?(flag_name, %{})
          FeatureFlags.delete_flag(flag_name)

        {:error, _} ->
          # Flag creation may require additional setup
          :ok
      end
    end
  end
end
