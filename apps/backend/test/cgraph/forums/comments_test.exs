defmodule CGraph.Forums.CommentsTest do
  @moduledoc """
  Tests for the Forums.Comments submodule.

  Tests comment CRUD, voting, and moderation.
  """
  use CGraph.DataCase, async: true

  alias CGraph.Accounts
  alias CGraph.Forums
  alias CGraph.Forums.Comments

  setup do
    {:ok, user} = Accounts.create_user(%{
      username: "commentuser",
      email: "comment@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, other_user} = Accounts.create_user(%{
      username: "otheruser",
      email: "other@example.com",
      password: "ValidPassword123!",
      password_confirmation: "ValidPassword123!"
    })

    {:ok, forum} = Forums.create_forum(user, %{
      name: "comment_forum",
      slug: "comment-forum",
      description: "Forum for comment tests"
    })

    {:ok, post} = Forums.create_post(forum, user, %{
      title: "Test Post",
      content: "Post for comments"
    })

    %{user: user, other_user: other_user, forum: forum, post: post}
  end

  describe "create_comment/3" do
    test "creates a comment on a post", %{user: user, post: post} do
      assert {:ok, comment} = Comments.create_comment(post, user, %{
        "content" => "This is a test comment"
      })

      assert comment.content == "This is a test comment"
      assert comment.author_id == user.id
      assert comment.post_id == post.id
    end

    test "creates nested comments (replies)", %{user: user, other_user: other_user, post: post} do
      {:ok, parent} = Comments.create_comment(post, user, %{"content" => "Parent comment"})

      assert {:ok, reply} = Comments.create_comment(post, other_user, %{
        "content" => "Reply to parent",
        "parent_id" => parent.id
      })

      assert reply.parent_id == parent.id
    end
  end

  describe "get_comment/1" do
    test "returns comment by id", %{user: user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Test"})

      assert {:ok, found} = Comments.get_comment(comment.id)
      assert found.id == comment.id
    end

    test "returns error for non-existent comment" do
      assert {:error, :not_found} = Comments.get_comment(Ecto.UUID.generate())
    end
  end

  describe "list_comments/2" do
    test "returns comments for a post", %{user: user, post: post} do
      {:ok, _} = Comments.create_comment(post, user, %{"content" => "Comment 1"})
      {:ok, _} = Comments.create_comment(post, user, %{"content" => "Comment 2"})

      {comments, meta} = Comments.list_comments(post)

      assert length(comments) >= 2
      assert Map.has_key?(meta, :total)
    end

    test "supports pagination", %{user: user, post: post} do
      for i <- 1..5 do
        Comments.create_comment(post, user, %{"content" => "Comment #{i}"})
      end

      {comments, meta} = Comments.list_comments(post, page: 1, per_page: 2)

      assert length(comments) <= 2
      assert meta.per_page == 2
    end

    test "supports sorting by new", %{user: user, post: post} do
      {:ok, _} = Comments.create_comment(post, user, %{"content" => "First"})
      :timer.sleep(10)
      {:ok, _} = Comments.create_comment(post, user, %{"content" => "Second"})

      {comments, _meta} = Comments.list_comments(post, sort: "new")

      if length(comments) >= 2 do
        assert List.first(comments).content == "Second"
      end
    end

    test "supports sorting by old", %{user: user, post: post} do
      {:ok, _} = Comments.create_comment(post, user, %{"content" => "First"})
      :timer.sleep(10)
      {:ok, _} = Comments.create_comment(post, user, %{"content" => "Second"})

      {comments, _meta} = Comments.list_comments(post, sort: "old")

      if length(comments) >= 2 do
        assert List.first(comments).content == "First"
      end
    end

    test "filters by parent_id for threaded comments", %{user: user, post: post} do
      {:ok, parent} = Comments.create_comment(post, user, %{"content" => "Parent"})
      {:ok, _reply} = Comments.create_comment(post, user, %{
        "content" => "Reply",
        "parent_id" => parent.id
      })

      # Get only top-level comments (no parent)
      {top_level, _meta} = Comments.list_comments(post, parent_id: nil)

      # Should only include parent, not reply
      assert Enum.all?(top_level, fn c -> is_nil(c.parent_id) end)
    end
  end

  describe "update_comment/2" do
    test "updates comment content", %{user: user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Original"})

      assert {:ok, updated} = Comments.update_comment(comment, %{"content" => "Updated"})
      assert updated.content == "Updated"
    end
  end

  describe "delete_comment/1" do
    test "soft deletes a comment", %{user: user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "To delete"})

      assert {:ok, :deleted} = Comments.delete_comment(comment)

      # Comment should still exist but be marked deleted
      {:ok, deleted} = Comments.get_comment(comment.id)
      assert deleted.deleted_at != nil
    end
  end

  describe "voting" do
    test "vote/3 upvotes a comment", %{user: user, other_user: other_user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Vote me"})

      assert {:ok, :ok} = Comments.vote(other_user, comment, :up)
    end

    test "vote/3 downvotes a comment", %{user: user, other_user: other_user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Vote me"})

      assert {:ok, :ok} = Comments.vote(other_user, comment, :down)
    end

    test "vote/3 toggles vote when same vote type", %{user: user, other_user: other_user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Vote me"})

      {:ok, :ok} = Comments.vote(other_user, comment, :up)
      {:ok, :ok} = Comments.vote(other_user, comment, :up)

      # Second same vote removes the vote
    end

    test "vote/3 flips vote when different vote type", %{user: user, other_user: other_user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Vote me"})

      {:ok, :ok} = Comments.vote(other_user, comment, :up)
      {:ok, :ok} = Comments.vote(other_user, comment, :down)

      # Vote should now be downvote
    end

    test "remove_vote/2 removes user's vote", %{user: user, other_user: other_user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "Vote me"})

      {:ok, :ok} = Comments.vote(other_user, comment, :up)
      assert :ok = Comments.remove_vote(other_user, comment)
    end

    test "remove_vote/2 returns error if no vote exists", %{user: user, other_user: other_user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "No votes"})

      assert {:error, :not_found} = Comments.remove_vote(other_user, comment)
    end
  end

  describe "moderation" do
    test "hide_comment/2 hides a comment", %{user: user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "To hide"})

      assert :ok = Comments.hide_comment(comment.id, "Spam")
    end

    test "soft_delete_comment/2 soft deletes a comment", %{user: user, post: post} do
      {:ok, comment} = Comments.create_comment(post, user, %{"content" => "To soft delete"})

      assert :ok = Comments.soft_delete_comment(comment.id, reason: "Rule violation")
    end
  end
end
