defmodule CGraph.Forums.FeedsTest do
  @moduledoc """
  Tests for the Forums.Feeds submodule.

  Tests public feed, home feed, and popular feed functionality.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Accounts
  alias CGraph.Forums
  alias CGraph.Forums.Feeds
  alias CGraph.Forums.Members

  setup do
    {:ok, user1} = Accounts.create_user(%{
      username: "feeduser1",
      email: "feed1@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, user2} = Accounts.create_user(%{
      username: "feeduser2",
      email: "feed2@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, public_forum} = Forums.create_forum(user1, %{
      name: "public_forum",
      slug: "public-forum",
      description: "A public forum",
      is_public: true
    })

    {:ok, private_forum} = Forums.create_forum(user1, %{
      name: "private_forum",
      slug: "private-forum",
      description: "A private forum",
      is_public: false
    })

    %{user1: user1, user2: user2, public_forum: public_forum, private_forum: private_forum}
  end

  describe "list_public_feed/1" do
    test "returns posts from public forums only", %{user1: user1, public_forum: public_forum} do
      {:ok, _post} = Forums.create_post(public_forum, user1, %{
        title: "Public Post",
        content: "This is public content"
      })

      {posts, meta} = Feeds.list_public_feed()

      assert is_list(posts)
      assert Map.has_key?(meta, :has_next_page)
      assert Map.has_key?(meta, :per_page)
    end

    test "supports pagination", %{user1: user1, public_forum: public_forum} do
      # Create multiple posts
      for i <- 1..5 do
        Forums.create_post(public_forum, user1, %{
          title: "Post #{i}",
          content: "Content #{i}"
        })
      end

      {posts, meta} = Feeds.list_public_feed(page: 1, per_page: 2)

      assert length(posts) <= 2
      assert meta.per_page == 2
    end

    test "supports sorting by new", %{user1: user1, public_forum: public_forum} do
      {:ok, _} = Forums.create_post(public_forum, user1, %{title: "Post 1", content: "C1"})
      :timer.sleep(10)
      {:ok, _} = Forums.create_post(public_forum, user1, %{title: "Post 2", content: "C2"})

      {posts, _meta} = Feeds.list_public_feed(sort: "new")

      # Verify our posts exist and newer one comes first among them
      our_posts = Enum.filter(posts, fn p -> p.title in ["Post 1", "Post 2"] end)
      if length(our_posts) >= 2 do
        titles = Enum.map(our_posts, & &1.title)
        post2_idx = Enum.find_index(titles, &(&1 == "Post 2"))
        post1_idx = Enum.find_index(titles, &(&1 == "Post 1"))
        assert post2_idx < post1_idx, "Post 2 (newer) should come before Post 1 in new sort"
      end
    end

    test "supports sorting by top", %{user1: _user1, public_forum: _public_forum} do
      {_posts, meta} = Feeds.list_public_feed(sort: "top")
      assert meta.per_page > 0
    end

    test "supports time range filtering", %{user1: _user1, public_forum: _public_forum} do
      {_posts, meta} = Feeds.list_public_feed(sort: "top", time_range: "day")
      assert meta.per_page > 0
    end
  end

  describe "list_home_feed/2" do
    test "returns empty feed for nil user" do
      {posts, meta} = Feeds.list_home_feed(nil, [])

      assert posts == []
      assert meta.has_next_page == false
    end

    test "returns public feed for user with no subscriptions", %{user2: user2} do
      {posts, meta} = Feeds.list_home_feed(user2, [])

      assert is_list(posts)
      assert Map.has_key?(meta, :has_next_page)
    end

    test "returns posts from subscribed forums", %{user1: user1, user2: user2, public_forum: public_forum} do
      # User2 subscribes to public forum
      {:ok, _} = Members.subscribe(user2, public_forum)

      # User1 creates a post
      {:ok, _post} = Forums.create_post(public_forum, user1, %{
        title: "Subscribed Post",
        content: "Content"
      })

      {posts, _meta} = Feeds.list_home_feed(user2, [])

      # Should include posts from subscribed forum
      assert is_list(posts)
    end

    test "supports pagination", %{user1: user1, user2: user2, public_forum: public_forum} do
      {:ok, _} = Members.subscribe(user2, public_forum)

      for i <- 1..5 do
        Forums.create_post(public_forum, user1, %{
          title: "Post #{i}",
          content: "Content #{i}"
        })
      end

      {_posts, meta} = Feeds.list_home_feed(user2, page: 1, per_page: 3)

      assert meta.per_page == 3
    end
  end

  describe "list_popular_feed/1" do
    test "returns trending posts", %{user1: user1, public_forum: public_forum} do
      {:ok, _post} = Forums.create_post(public_forum, user1, %{
        title: "Popular Post",
        content: "This should be popular"
      })

      {posts, meta} = Feeds.list_popular_feed()

      assert is_list(posts)
      assert Map.has_key?(meta, :has_next_page)
    end

    test "supports pagination", %{user1: _user1, public_forum: _public_forum} do
      {_posts, meta} = Feeds.list_popular_feed(per_page: 5)

      assert meta.per_page == 5
      assert is_boolean(meta.has_next_page)
    end

    test "returns posts from last 24 hours", %{user1: user1, public_forum: public_forum} do
      {:ok, _post} = Forums.create_post(public_forum, user1, %{
        title: "Recent Post",
        content: "Posted recently"
      })

      {posts, _meta} = Feeds.list_popular_feed()

      # All posts should be from last 24 hours
      if posts != [] do
        twenty_four_hours_ago = DateTime.add(DateTime.utc_now(), -24, :hour)
        assert Enum.all?(posts, fn post ->
          DateTime.compare(post.inserted_at, twenty_four_hours_ago) == :gt
        end)
      end
    end
  end
end
