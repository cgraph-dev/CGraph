defmodule CGraph.ReleaseTest do
  @moduledoc "Tests for release tasks (migrations)."
  use ExUnit.Case, async: true

  alias CGraph.Release

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Release)
    end

    test "exports migrate/0" do
      assert function_exported?(Release, :migrate, 0)
    end

    test "exports rollback/2" do
      assert function_exported?(Release, :rollback, 2)
    end
  end
end
