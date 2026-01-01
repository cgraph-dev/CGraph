defmodule Cgraph.ForumsTest do
  use Cgraph.DataCase, async: true

  alias Cgraph.Forums
  alias Cgraph.Forums.Forum
  alias Cgraph.Forums.Post
  alias Cgraph.Forums.Comment
  alias Cgraph.Accounts

  setup do
    {:ok, user} = Accounts.create_user(%{
      username: "forumuser",
      email: "forum@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })
    
    %{user: user}
  end

  describe "forums" do
    test "create_forum/2 creates a new forum", %{user: user} do
      assert {:ok, %Forum{} = forum} = Forums.create_forum(user, %{
        name: "test_forum",
        slug: "test-forum",
        description: "A test forum"
      })
      
      assert forum.name == "test_forum"
      assert forum.slug == "test-forum"
    end

    test "get_forum/1 returns forum by id", %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      
      assert {:ok, found} = Forums.get_forum(forum.id)
      assert found.id == forum.id
    end

    test "get_forum_by_slug/1 returns forum by slug", %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      
      assert {:ok, found} = Forums.get_forum_by_slug("test-forum")
      assert found.id == forum.id
    end

    test "list_forums/1 returns all forums", %{user: user} do
      {:ok, _} = Forums.create_forum(user, %{name: "forum_1", slug: "forum-1"})
      {:ok, _} = Forums.create_forum(user, %{name: "forum_2", slug: "forum-2"})
      
      {forums, _meta} = Forums.list_forums()
      assert length(forums) >= 2
    end

    test "update_forum/2 updates forum attributes", %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "original_forum", slug: "original"})
      
      assert {:ok, updated} = Forums.update_forum(forum, %{name: "updated_forum"})
      assert updated.name == "updated_forum"
    end
  end

  describe "posts" do
    setup %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      %{user: user, forum: forum}
    end

    test "create_post/3 creates a new post", %{user: user, forum: forum} do
      assert {:ok, %Post{} = post} = Forums.create_post(forum, user, %{
        title: "Test Post",
        content: "This is test content"
      })
      
      assert post.title == "Test Post"
      assert post.author_id == user.id
      assert post.forum_id == forum.id
    end

    test "create_post/3 creates post with provided title", %{user: user, forum: forum} do
      {:ok, post} = Forums.create_post(forum, user, %{
        title: "My Awesome Post Title",
        content: "Content"
      })
      
      # Post is created with the correct title (Post schema doesn't have slug field)
      assert post.title == "My Awesome Post Title"
      assert post.author_id == user.id
    end

    test "get_post/2 returns post by id", %{user: user, forum: forum} do
      {:ok, post} = Forums.create_post(forum, user, %{title: "Test", content: "Content"})
      
      assert {:ok, found} = Forums.get_post(forum, post.id)
      assert found.id == post.id
    end

    test "list_posts/2 returns forum posts", %{user: user, forum: forum} do
      {:ok, _} = Forums.create_post(forum, user, %{title: "Post 1", content: "Content 1"})
      {:ok, _} = Forums.create_post(forum, user, %{title: "Post 2", content: "Content 2"})
      
      {posts, _meta} = Forums.list_posts(forum)
      assert length(posts) >= 2
    end

    test "list_posts/2 supports sorting", %{user: user, forum: forum} do
      {:ok, _} = Forums.create_post(forum, user, %{title: "Post 1", content: "Content"})
      {:ok, _} = Forums.create_post(forum, user, %{title: "Post 2", content: "Content"})
      
      {posts_new, _} = Forums.list_posts(forum, sort: "new")
      {posts_hot, _} = Forums.list_posts(forum, sort: "hot")
      
      assert is_list(posts_new)
      assert is_list(posts_hot)
    end

    test "update_post/2 updates post and sets is_edited", %{user: user, forum: forum} do
      {:ok, post} = Forums.create_post(forum, user, %{title: "Original", content: "Content"})
      
      assert {:ok, updated} = Forums.update_post(post, %{content: "Edited content"})
      assert updated.content == "Edited content"
      assert updated.is_edited == true
    end

    test "delete_post/1 soft deletes post", %{user: user, forum: forum} do
      {:ok, post} = Forums.create_post(forum, user, %{title: "To Delete", content: "Content"})
      
      assert {:ok, deleted} = Forums.delete_post(post)
      assert deleted.deleted_at != nil
    end

    test "increment_views/1 increments view count", %{user: user, forum: forum} do
      {:ok, post} = Forums.create_post(forum, user, %{title: "Viewable", content: "Content"})
      original_views = post.view_count || 0
      
      Forums.increment_views(post)
      
      {:ok, updated} = Forums.get_post(forum, post.id)
      assert updated.view_count == original_views + 1
    end
  end

  describe "comments" do
    setup %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      {:ok, post} = Forums.create_post(forum, user, %{title: "Test Post", content: "Content"})
      %{user: user, forum: forum, post: post}
    end

    test "create_comment/3 creates a new comment", %{user: user, post: post} do
      assert {:ok, %Comment{} = comment} = Forums.create_comment(post, user, %{
        content: "This is a comment"
      })
      
      assert comment.content == "This is a comment"
      assert comment.author_id == user.id
      assert comment.post_id == post.id
    end

    test "create_comment/3 creates nested comment", %{user: user, post: post} do
      {:ok, parent} = Forums.create_comment(post, user, %{content: "Parent"})
      
      {:ok, child} = Forums.create_comment(post, user, %{
        content: "Reply",
        parent_id: parent.id
      })
      
      assert child.parent_id == parent.id
    end

    test "list_comments/2 returns threaded comments", %{user: user, post: post} do
      {:ok, _} = Forums.create_comment(post, user, %{content: "Comment 1"})
      {:ok, _} = Forums.create_comment(post, user, %{content: "Comment 2"})
      
      {comments, _meta} = Forums.list_comments(post)
      assert length(comments) >= 2
    end

    test "update_comment/2 updates comment and sets is_edited", %{user: user, post: post} do
      {:ok, comment} = Forums.create_comment(post, user, %{content: "Original"})
      
      assert {:ok, updated} = Forums.update_comment(comment, %{content: "Edited"})
      assert updated.content == "Edited"
      assert updated.is_edited == true
    end

    test "delete_comment/1 soft deletes but preserves structure", %{user: user, post: post} do
      {:ok, comment} = Forums.create_comment(post, user, %{content: "To Delete"})
      
      assert {:ok, deleted} = Forums.delete_comment(comment)
      assert deleted.deleted_at != nil
      assert deleted.content == "[deleted]"
    end
  end

  describe "voting" do
    setup %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      {:ok, post} = Forums.create_post(forum, user, %{title: "Votable Post", content: "Content"})
      
      {:ok, voter} = Accounts.create_user(%{
        username: "voter",
        email: "voter@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      %{user: user, forum: forum, post: post, voter: voter}
    end

    test "vote_post/3 adds upvote", %{voter: voter, post: post} do
      assert {:ok, vote} = Forums.vote_post(post, voter, "up")
      assert vote.value == 1
    end

    test "vote_post/3 adds downvote", %{voter: voter, post: post} do
      assert {:ok, vote} = Forums.vote_post(post, voter, "down")
      assert vote.value == -1
    end

    test "vote_post/3 changes existing vote", %{voter: voter, post: post} do
      {:ok, _} = Forums.vote_post(post, voter, "up")
      
      assert {:ok, changed} = Forums.vote_post(post, voter, "down")
      assert changed.value == -1
    end

    test "remove_vote/2 removes vote", %{voter: voter, post: post} do
      {:ok, _} = Forums.vote_post(post, voter, "up")
      
      assert {:ok, _} = Forums.remove_vote(post, voter)
    end

    test "voting updates post score", %{voter: voter, post: post, forum: forum} do
      original_score = post.score || 0
      
      {:ok, _} = Forums.vote_post(post, voter, "up")
      
      {:ok, updated} = Forums.get_post(forum, post.id)
      assert updated.score == original_score + 1
    end
  end

  describe "moderation" do
    setup %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      {:ok, post} = Forums.create_post(forum, user, %{title: "Moderatable", content: "Content"})
      %{user: user, forum: forum, post: post}
    end

    test "toggle_pin/1 pins/unpins post", %{post: post} do
      assert {:ok, pinned} = Forums.toggle_pin(post)
      assert pinned.is_pinned == true
      
      assert {:ok, unpinned} = Forums.toggle_pin(pinned)
      assert unpinned.is_pinned == false
    end

    test "toggle_lock/1 locks/unlocks post", %{post: post} do
      assert {:ok, locked} = Forums.toggle_lock(post)
      assert locked.is_locked == true
      
      assert {:ok, unlocked} = Forums.toggle_lock(locked)
      assert unlocked.is_locked == false
    end

    test "report_post/3 creates report", %{post: post} do
      {:ok, reporter} = Accounts.create_user(%{
        username: "reporter",
        email: "reporter@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      # Note: Function signature is report_post(user, post, reason)
      # Currently stubbed - only returns %{id, status}
      assert {:ok, report} = Forums.report_post(reporter, post, "This is spam")
      assert report.status == "pending"
      assert report.id != nil
    end

    test "is_moderator?/2 checks moderator status", %{user: user, forum: forum} do
      # Forum creator is automatically a moderator
      assert Forums.is_moderator?(forum, user) == true
      
      # Create a different user who is not a moderator
      {:ok, other_user} = Accounts.create_user(%{
        username: "otheruser",
        email: "other@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      assert Forums.is_moderator?(forum, other_user) == false
      
      # After granting mod status to other user
      {:ok, _} = Forums.add_moderator(forum, other_user)
      assert Forums.is_moderator?(forum, other_user) == true
    end
  end

  describe "subscriptions" do
    setup %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "test_forum", slug: "test-forum"})
      
      # Create a separate user for subscription tests (not the forum owner)
      {:ok, subscriber} = Accounts.create_user(%{
        username: "subscriber_user",
        email: "subscriber@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      %{user: user, forum: forum, subscriber: subscriber}
    end

    test "subscribe/2 subscribes user to forum", %{subscriber: subscriber, forum: forum} do
      assert {:ok, subscription} = Forums.subscribe(forum, subscriber)
      assert subscription.user_id == subscriber.id
      assert subscription.forum_id == forum.id
    end

    test "unsubscribe/2 removes subscription", %{subscriber: subscriber, forum: forum} do
      {:ok, _} = Forums.subscribe(forum, subscriber)
      
      assert {:ok, _} = Forums.unsubscribe(forum, subscriber)
    end

    test "is_subscribed?/2 checks subscription status", %{subscriber: subscriber, forum: forum} do
      assert Forums.is_subscribed?(forum, subscriber) == false
      
      {:ok, _} = Forums.subscribe(forum, subscriber)
      
      assert Forums.is_subscribed?(forum, subscriber) == true
    end
  end

  describe "forum voting with anti-abuse protection" do
    setup %{user: user} do
      # Create a forum for voting tests
      {:ok, forum} = Forums.create_forum(user, %{name: "votable_forum", slug: "votable-forum"})
      
      # Create an established user (has karma and old account for voting)
      {:ok, established_voter} = Accounts.create_user(%{
        username: "established_voter",
        email: "established@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      # Manually update the user to have karma and an older account
      {:ok, established_voter} = Cgraph.Repo.update(
        Ecto.Changeset.change(established_voter, %{
          karma: 100,
          inserted_at: DateTime.add(DateTime.utc_now(), -7 * 24 * 60 * 60, :second)
        })
      )
      
      # Create a brand new user (no karma, fresh account)
      {:ok, new_voter} = Accounts.create_user(%{
        username: "new_voter",
        email: "newvoter@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      %{user: user, forum: forum, established_voter: established_voter, new_voter: new_voter}
    end

    test "vote_forum/3 allows upvotes from established users", %{forum: forum, established_voter: voter} do
      result = Forums.vote_forum(voter, forum.id, 1)
      assert {:ok, status} = result
      assert status in [:upvoted, :removed]
    end

    test "vote_forum/3 allows downvotes from users with sufficient karma", %{forum: forum, established_voter: voter} do
      result = Forums.vote_forum(voter, forum.id, -1)
      assert {:ok, status} = result
      assert status in [:downvoted, :removed]
    end

    test "vote_forum/3 rejects votes from accounts less than 1 day old", %{forum: forum, new_voter: voter} do
      result = Forums.vote_forum(voter, forum.id, 1)
      assert {:error, :account_too_new} = result
    end

    test "vote_forum/3 rejects downvotes from users with insufficient karma", %{forum: forum} do
      # Create a user with old enough account but low karma
      {:ok, low_karma_user} = Accounts.create_user(%{
        username: "lowkarma",
        email: "lowkarma@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      # Make account old enough (2 days)
      {:ok, low_karma_user} = Cgraph.Repo.update(
        Ecto.Changeset.change(low_karma_user, %{
          karma: 5,  # Less than 10 required
          inserted_at: DateTime.add(DateTime.utc_now(), -2 * 24 * 60 * 60, :second)
        })
      )
      
      result = Forums.vote_forum(low_karma_user, forum.id, -1)
      assert {:error, :insufficient_karma_for_downvote} = result
    end

    test "vote_forum/3 prevents forum owners from voting on their own forums", %{user: owner, forum: forum} do
      # Make owner's account old enough
      {:ok, owner} = Cgraph.Repo.update(
        Ecto.Changeset.change(owner, %{
          karma: 100,
          inserted_at: DateTime.add(DateTime.utc_now(), -7 * 24 * 60 * 60, :second)
        })
      )
      
      result = Forums.vote_forum(owner, forum.id, 1)
      assert {:error, :cannot_vote_own_forum} = result
    end

    test "vote_forum/3 prevents moderators from voting on forums they moderate", %{forum: forum} do
      # Create a moderator
      {:ok, mod} = Accounts.create_user(%{
        username: "moderator",
        email: "mod@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      # Make account eligible for voting
      {:ok, mod} = Cgraph.Repo.update(
        Ecto.Changeset.change(mod, %{
          karma: 100,
          inserted_at: DateTime.add(DateTime.utc_now(), -7 * 24 * 60 * 60, :second)
        })
      )
      
      # Add as moderator
      {:ok, _} = Forums.add_moderator(forum, mod)
      
      result = Forums.vote_forum(mod, forum.id, 1)
      assert {:error, :moderators_cannot_vote} = result
    end

    test "vote_forum/3 enforces cooldown between vote changes", %{forum: forum, established_voter: voter} do
      # First vote should succeed
      {:ok, _} = Forums.vote_forum(voter, forum.id, 1)
      
      # Immediate second vote should fail due to cooldown
      result = Forums.vote_forum(voter, forum.id, -1)
      assert {:error, {:vote_cooldown, remaining}} = result
      assert remaining > 0 and remaining <= 60
    end

    test "vote_forum/3 allows vote changes after cooldown expires", %{forum: forum} do
      # Create voter with old account
      {:ok, voter} = Accounts.create_user(%{
        username: "cooldownvoter",
        email: "cooldown@example.com",
        password: "ValidPassword123!",
        password_confirmation: "ValidPassword123!"
      })
      
      {:ok, voter} = Cgraph.Repo.update(
        Ecto.Changeset.change(voter, %{
          karma: 100,
          inserted_at: DateTime.add(DateTime.utc_now(), -7 * 24 * 60 * 60, :second)
        })
      )
      
      # First vote
      {:ok, _} = Forums.vote_forum(voter, forum.id, 1)
      
      # Manually update the vote timestamp to simulate cooldown expiry
      forum_vote = Forums.get_user_forum_vote(voter.id, forum.id)
      old_time = DateTime.add(DateTime.utc_now(), -120, :second)  # 2 minutes ago
      Cgraph.Repo.update(Ecto.Changeset.change(forum_vote, %{updated_at: old_time}))
      
      # Vote change should now work
      result = Forums.vote_forum(voter, forum.id, -1)
      assert {:ok, :downvoted} = result
    end

    test "vote_forum/3 returns :removed when voting same value twice", %{forum: forum, established_voter: voter} do
      # First upvote
      {:ok, :upvoted} = Forums.vote_forum(voter, forum.id, 1)
      
      # Update vote time to bypass cooldown
      forum_vote = Forums.get_user_forum_vote(voter.id, forum.id)
      old_time = DateTime.add(DateTime.utc_now(), -120, :second)
      Cgraph.Repo.update(Ecto.Changeset.change(forum_vote, %{updated_at: old_time}))
      
      # Second upvote should remove the vote
      {:ok, :removed} = Forums.vote_forum(voter, forum.id, 1)
    end

    test "vote_forum/3 returns error for non-existent forum", %{established_voter: voter} do
      fake_id = Ecto.UUID.generate()
      result = Forums.vote_forum(voter, fake_id, 1)
      assert {:error, :forum_not_found} = result
    end
  end

  describe "forum contributors leaderboard" do
    setup %{user: user} do
      {:ok, forum} = Forums.create_forum(user, %{name: "contributor_forum", slug: "contributor-forum"})
      
      # Create multiple users who will post in the forum
      contributors = for i <- 1..5 do
        {:ok, contributor} = Accounts.create_user(%{
          username: "contributor#{i}",
          email: "contributor#{i}@example.com",
          password: "ValidPassword123!",
          password_confirmation: "ValidPassword123!"
        })
        contributor
      end
      
      # Have contributors create posts
      Enum.each(contributors, fn contributor ->
        Forums.create_post(forum, contributor, %{
          title: "Post by #{contributor.username}",
          content: "Test content"
        })
      end)
      
      %{user: user, forum: forum, contributors: contributors}
    end

    test "get_forum_user_leaderboard/2 returns users with karma from posts", %{forum: forum, contributors: contributors} do
      {entries, meta} = Forums.get_forum_user_leaderboard(forum.id)
      
      assert is_list(entries)
      assert is_map(meta)
      assert Map.has_key?(meta, :page)
      assert Map.has_key?(meta, :total)
      
      # Each contributor created a post, so they should appear
      user_ids = Enum.map(entries, & &1.user.id)
      Enum.each(contributors, fn contributor ->
        assert contributor.id in user_ids
      end)
    end
  end
end
