defmodule CGraph.ChaosTest do
  @moduledoc "Tests for chaos testing facade."
  use ExUnit.Case, async: true

  alias CGraph.Chaos

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Chaos)
    end

    test "exports enabled?/0" do
      assert function_exported?(Chaos, :enabled?, 0)
    end
  end

  describe "enabled?/0" do
    test "returns boolean" do
      result = Chaos.enabled?()
      assert is_boolean(result)
    end

    test "returns false in test env by default" do
      refute Chaos.enabled?()
    end
  end
end
