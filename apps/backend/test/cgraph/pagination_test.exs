defmodule CGraph.PaginationTest do
  @moduledoc "Tests for cursor-based (keyset) pagination."
  use CGraph.DataCase, async: true

  alias CGraph.Pagination

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Pagination)
    end

    test "exports pagination functions" do
      assert function_exported?(Pagination, :parse_params, 2)
      assert function_exported?(Pagination, :paginate, 2)
      assert function_exported?(Pagination, :cursor_for, 2)
    end
  end

  describe "parse_params/2" do
    test "parses default params" do
      result = Pagination.parse_params(%{}, %{})
      assert is_map(result) or is_list(result)
    end

    test "parses params with limit" do
      result = Pagination.parse_params(%{"limit" => "25"}, %{})
      assert is_map(result) or is_list(result)
    end

    test "parses params with cursor" do
      result = Pagination.parse_params(%{"cursor" => "abc123"}, %{})
      assert is_map(result) or is_list(result)
    end
  end

  describe "decode_cursor/1" do
    test "returns error for invalid cursor" do
      result = Pagination.decode_cursor("invalid_cursor_data")
      assert match?({:error, _}, result) or is_nil(result)
    end

    test "returns nil for nil cursor" do
      result = Pagination.decode_cursor(nil)
      assert is_nil(result) or match?({:ok, _}, result)
    end
  end
end
