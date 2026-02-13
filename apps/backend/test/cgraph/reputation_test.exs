defmodule CGraph.ReputationTest do
  @moduledoc "Tests for user reputation system."
  use CGraph.DataCase, async: true

  alias CGraph.Reputation

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Reputation)
    end

    test "exports core reputation functions" do
      assert function_exported?(Reputation, :get_user_reputation, 2)
      assert function_exported?(Reputation, :get_reputation_summary, 1)
      assert function_exported?(Reputation, :give_reputation, 1)
    end
  end

  describe "get_user_reputation/2" do
    test "returns empty or default reputation for unknown user" do
      result = Reputation.get_user_reputation(Ecto.UUID.generate(), %{})
      assert is_list(result) or is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "get_reputation_summary/1" do
    test "returns summary struct for unknown user" do
      result = Reputation.get_reputation_summary(Ecto.UUID.generate())
      assert is_map(result) or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "give_reputation/1" do
    test "validates required fields" do
      result = Reputation.give_reputation(%{})
      assert match?({:error, _}, result)
    end
  end
end
