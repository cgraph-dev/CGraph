defmodule CGraph.ReadRepoTest do
  @moduledoc "Tests for read-only Ecto Repo (read replica)."
  use ExUnit.Case, async: true

  alias CGraph.ReadRepo

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(ReadRepo)
    end

    test "has standard Ecto.Repo query functions" do
      assert function_exported?(ReadRepo, :all, 1)
      assert function_exported?(ReadRepo, :one, 1)
      assert function_exported?(ReadRepo, :get, 2)
    end
  end
end
