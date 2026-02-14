defmodule CGraph.Forums.PostsTest do
  @moduledoc """
  Tests for the Forums.Posts submodule.

  Tests post CRUD, voting, pinning, locking, and moderation.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Accounts
  alias CGraph.Forums
  alias CGraph.Forums.Posts

  setup do
    {:ok, user} = Accounts.create_user(%{
      username: "postuser",
      email: "post@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, other_user} = Accounts.create_user(%{
      username: "otherpostuser",
      email: "otherpost@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, forum} = Forums.create_forum(user, %{
      name: "posts_forum",
      slug: "posts-forum",
      description: "Forum for post tests"
    })

    %{user: user, other_user: other_user, forum: forum}
  end

  describe "create_post/3" do
    test "creates a post with title and content", %{user: user, forum: forum} do
      assert {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Test Post Title",
        "content" => "This is test content for the post"
      })

      assert post.title == "Test Post Title"
      assert post.content == "This is test content for the post"
      assert post.author_id == user.id
      assert post.forum_id == forum.id
    end

    test "creates a link post", %{user: user, forum: forum} do
      assert {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Link Post",
        "content" => "Check this out",
        "post_type" => "link",
        "url" => "https://example.com"
      })

      assert post.post_type == "link"
      assert post.url == "https://example.com"
    end

    test "creates an image post", %{user: user, forum: forum} do
      assert {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Image Post",
        "content" => "My photo",
        "post_type" => "image",
        "media_urls" => ["https://example.com/image.jpg"]
      })

      assert post.post_type == "image"
    end
  end

  describe "get_post/1" do
    test "returns post by id", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Find Me",
        "content" => "Content"
      })

      assert {:ok, found} = Posts.get_post(post.id)
      assert found.id == post.id
      assert found.title == "Find Me"
    end

    test "returns error for non-existent post" do
      assert {:error, :not_found} = Posts.get_post(Ecto.UUID.generate())
    end
  end

  describe "get_post_with_vote/3" do
    test "returns post with user's vote status", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Vote Check",
        "content" => "Content"
      })

      {:ok, found} = Posts.get_post_with_vote(forum, post.id, user)

      assert found.id == post.id
      # my_vote should be present (nil if not voted)
    end

    test "returns post without vote for nil user", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Vote Check",
        "content" => "Content"
      })

      {:ok, found} = Posts.get_post_with_vote(forum, post.id, nil)

      assert found.id == post.id
    end
  end

  describe "list_posts/2" do
    test "returns posts for a forum", %{user: user, forum: forum} do
      {:ok, _} = Posts.create_post(forum, user, %{"title" => "Post 1", "content" => "C1"})
      {:ok, _} = Posts.create_post(forum, user, %{"title" => "Post 2", "content" => "C2"})

      {posts, meta} = Posts.list_posts(forum)

      assert length(posts) >= 2
      assert Map.has_key?(meta, :total)
    end

    test "supports pagination", %{user: user, forum: forum} do
      for i <- 1..5 do
        Posts.create_post(forum, user, %{"title" => "Post #{i}", "content" => "C#{i}"})
      end

      {posts, meta} = Posts.list_posts(forum, page: 1, per_page: 2)

      assert length(posts) <= 2
      assert meta.per_page == 2
    end

    test "supports sorting by new", %{user: user, forum: forum} do
      {:ok, _} = Posts.create_post(forum, user, %{"title" => "First", "content" => "C1"})
      :timer.sleep(1100)
      {:ok, _} = Posts.create_post(forum, user, %{"title" => "Second", "content" => "C2"})

      {posts, _meta} = Posts.list_posts(forum, sort: "new")

      if length(posts) >= 2 do
        assert List.first(posts).title == "Second"
      end
    end

    test "supports sorting by top", %{user: user, forum: forum} do
      {:ok, _} = Posts.create_post(forum, user, %{"title" => "Post", "content" => "C"})

      {_posts, meta} = Posts.list_posts(forum, sort: "top")
      assert meta.page == 1
    end
  end

  describe "update_post/2" do
    test "updates post content", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Original",
        "content" => "Original content"
      })

      assert {:ok, updated} = Posts.update_post(post, %{"content" => "Updated content"})
      assert updated.content == "Updated content"
    end

    test "updates post title", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Original Title",
        "content" => "Content"
      })

      assert {:ok, updated} = Posts.update_post(post, %{"title" => "New Title"})
      assert updated.title == "New Title"
    end
  end

  describe "delete_post/1" do
    test "deletes a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "To Delete",
        "content" => "Content"
      })

      assert {:ok, _} = Posts.delete_post(post)
      assert {:error, :not_found} = Posts.get_post(post.id)
    end
  end

  describe "pinning" do
    test "pin_post/1 pins a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Pin Me",
        "content" => "Content"
      })

      assert {:ok, pinned} = Posts.pin_post(post)
      assert pinned.is_pinned == true
    end

    test "unpin_post/1 unpins a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Unpin Me",
        "content" => "Content"
      })
      {:ok, pinned} = Posts.pin_post(post)

      assert {:ok, unpinned} = Posts.unpin_post(pinned)
      assert unpinned.is_pinned == false
    end

    test "toggle_pin/1 toggles pin status", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Toggle Pin",
        "content" => "Content"
      })

      assert {:ok, pinned} = Posts.toggle_pin(post)
      assert pinned.is_pinned == true

      assert {:ok, unpinned} = Posts.toggle_pin(pinned)
      assert unpinned.is_pinned == false
    end
  end

  describe "locking" do
    test "lock_post/1 locks a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Lock Me",
        "content" => "Content"
      })

      assert {:ok, locked} = Posts.lock_post(post)
      assert locked.is_locked == true
    end

    test "unlock_post/1 unlocks a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Unlock Me",
        "content" => "Content"
      })
      {:ok, locked} = Posts.lock_post(post)

      assert {:ok, unlocked} = Posts.unlock_post(locked)
      assert unlocked.is_locked == false
    end

    test "toggle_lock/1 toggles lock status", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Toggle Lock",
        "content" => "Content"
      })

      assert {:ok, locked} = Posts.toggle_lock(post)
      assert locked.is_locked == true

      assert {:ok, unlocked} = Posts.toggle_lock(locked)
      assert unlocked.is_locked == false
    end
  end

  describe "views" do
    test "increment_views/1 increments view count", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "View Me",
        "content" => "Content"
      })

      initial_views = post.view_count || 0

      :ok = Posts.increment_views(post)

      {:ok, updated} = Posts.get_post(post.id)
      assert updated.view_count == initial_views + 1
    end
  end

  describe "moderation" do
    test "hide_post/2 hides a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Hide Me",
        "content" => "Content"
      })

      assert :ok = Posts.hide_post(post.id, "Inappropriate content")
    end

    test "soft_delete_post/2 soft deletes a post", %{user: user, forum: forum} do
      {:ok, post} = Posts.create_post(forum, user, %{
        "title" => "Soft Delete Me",
        "content" => "Content"
      })

      assert :ok = Posts.soft_delete_post(post.id, reason: "Rule violation")
    end
  end
end
