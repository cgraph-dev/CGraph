defmodule CGraph.RepoTest do
  @moduledoc "Tests for primary Ecto Repo with soft_delete/restore."
  use CGraph.DataCase, async: true

  alias CGraph.Repo

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Repo)
    end

    test "exports soft_delete/1" do
      assert function_exported?(Repo, :soft_delete, 1)
    end

    test "exports restore/1" do
      assert function_exported?(Repo, :restore, 1)
    end

    test "has standard Ecto.Repo functions" do
      assert function_exported?(Repo, :all, 1)
      assert function_exported?(Repo, :get, 2)
      assert function_exported?(Repo, :insert, 1)
    end
  end
end
