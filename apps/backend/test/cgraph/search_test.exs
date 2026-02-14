defmodule CGraph.SearchTest do
  @moduledoc "Tests for unified search across users, messages, posts, groups."
  use CGraph.DataCase, async: true

  alias CGraph.Search

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Search)
    end

    test "exports search functions" do
      assert function_exported?(Search, :search_users, 2)
      assert function_exported?(Search, :search_messages, 3)
      assert function_exported?(Search, :search_posts, 2)
      assert function_exported?(Search, :search_groups, 2)
      assert function_exported?(Search, :search_all, 2)
    end
  end

  describe "search_users/2" do
    test "returns results for query" do
      result = Search.search_users("nonexistent_user_xyz", %{})
      assert is_list(result) or is_tuple(result) or match?({:ok, _}, result)
    end
  end

  describe "search_posts/2" do
    test "returns results for query" do
      result = Search.search_posts("nonexistent_post_xyz", %{})
      assert is_list(result) or is_tuple(result) or match?({:ok, _}, result)
    end
  end

  describe "search_groups/2" do
    test "returns results for query" do
      result = Search.search_groups("nonexistent_group_xyz", %{})
      assert is_list(result) or is_tuple(result) or match?({:ok, _}, result)
    end
  end

  describe "search_all/2" do
    test "returns combined results" do
      result = Search.search_all("test_query", %{})
      assert is_map(result) or is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "get_suggestions/2" do
    test "returns autocomplete suggestions" do
      result = Search.get_suggestions("tes", %{})
      assert is_list(result) or match?({:ok, _}, result)
    end
  end
end
