defmodule CGraph.Forums.SearchTest do
  @moduledoc """
  Tests for full-text search across forum entities.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Accounts
  alias CGraph.Forums
  alias CGraph.Forums.Search

  setup do
    {:ok, owner} = Accounts.create_user(%{
      username: "searchowner",
      email: "searchowner@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, forum} = Forums.create_forum(owner, %{
      name: "search_test_forum",
      slug: "search-test-forum",
      description: "Forum for search tests"
    })

    %{owner: owner, forum: forum}
  end

  describe "to_tsquery/1" do
    test "converts simple query" do
      assert Search.to_tsquery("hello world") == "hello:* & world:*"
    end

    test "strips special characters" do
      assert Search.to_tsquery("hello! world?") == "hello:* & world:*"
    end

    test "handles empty string gracefully" do
      assert Search.to_tsquery("") == "a"
    end

    test "handles single word" do
      assert Search.to_tsquery("elixir") == "elixir:*"
    end
  end

  describe "search_posts/2" do
    test "returns tuple of {posts, meta}", %{owner: owner, forum: forum} do
      # Create a post first
      {:ok, _post} = Forums.create_post(owner, forum, %{
        title: "Elixir GenServer patterns",
        content: "Using GenServer for state management",
        post_type: "text"
      })

      {results, meta} = Search.search_posts("GenServer")
      assert is_list(results)
      assert is_map(meta)
      assert Map.has_key?(meta, :per_page)
    end

    test "filters by forum_id", %{owner: owner, forum: forum} do
      {:ok, _post} = Forums.create_post(owner, forum, %{
        title: "Searchable post title",
        content: "Some searchable content here",
        post_type: "text"
      })

      {results, _meta} = Search.search_posts("searchable", forum_id: forum.id)
      assert is_list(results)
    end

    test "supports sort option", %{owner: _owner, forum: _forum} do
      {results, _meta} = Search.search_posts("nonexistent", sort: "new")
      assert results == []
    end
  end

  describe "search_threads/2" do
    test "returns tuple of {threads, meta}" do
      {results, meta} = Search.search_threads("discussion")
      assert is_list(results)
      assert is_map(meta)
    end
  end

  describe "search_thread_posts/2" do
    test "returns tuple of {posts, meta}" do
      {results, meta} = Search.search_thread_posts("reply")
      assert is_list(results)
      assert is_map(meta)
    end
  end

  describe "search_comments/2" do
    test "returns tuple of {comments, meta}" do
      {results, meta} = Search.search_comments("comment")
      assert is_list(results)
      assert is_map(meta)
    end
  end

  describe "search_all/2" do
    test "returns mixed results with type indicators" do
      {results, meta} = Search.search_all("test")
      assert is_list(results)
      assert Map.has_key?(meta, :result_count)
    end

    test "each result has a type field" do
      {results, _meta} = Search.search_all("test")

      Enum.each(results, fn result ->
        assert result.type in ["thread", "thread_post", "post", "comment"]
      end)
    end
  end
end
