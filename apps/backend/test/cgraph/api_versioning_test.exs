defmodule CGraph.ApiVersioningTest do
  @moduledoc "Tests for API versioning infrastructure."
  use ExUnit.Case, async: false

  alias CGraph.ApiVersioning

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(ApiVersioning)
    end

    test "exports version functions" do
      assert function_exported?(ApiVersioning, :list_versions, 0)
      assert function_exported?(ApiVersioning, :version_supported?, 1)
      assert function_exported?(ApiVersioning, :get_version_info, 1)
    end
  end

  describe "list_versions/0" do
    test "returns list of supported versions" do
      result = ApiVersioning.list_versions()
      assert is_list(result) or is_map(result)
    end
  end

  describe "version_supported?/1" do
    test "returns true for v1" do
      result = ApiVersioning.version_supported?("v1")
      assert result == true or match?({:ok, true}, result)
    end

    test "returns false for unknown version" do
      result = ApiVersioning.version_supported?("v999")
      assert result == false or match?({:ok, false}, result) or match?({:error, _}, result)
    end
  end
end
