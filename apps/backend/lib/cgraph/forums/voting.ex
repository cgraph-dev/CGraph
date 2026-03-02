defmodule CGraph.Forums.Voting do
  @moduledoc """
  Voting and karma operations for forums.

  Handles upvotes, downvotes, and karma calculations.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Members, Post, Vote}
  alias CGraph.Repo

  @doc """
  Votes on a post (upvote or downvote).
  """
  @spec vote_on_post(CGraph.Accounts.User.t(), Post.t(), :up | :down | String.t()) :: {:ok, term()} | {:error, term()}
  def vote_on_post(user, post, vote_type) when vote_type in [:up, :down, "up", "down"] do
    vote_value = if vote_type in [:up, "up"], do: 1, else: -1

    result = Repo.transaction(fn ->
      # Check for existing vote
      existing_vote = Repo.get_by(Vote, user_id: user.id, post_id: post.id)

      vote_result = case existing_vote do
        nil ->
          # Create new vote
          %Vote{}
          |> Vote.changeset(%{
            user_id: user.id,
            post_id: post.id,
            value: vote_value
          })
          |> Repo.insert!()
          |> tap(fn _vote ->
            update_post_karma(post, vote_value)
            propagate_post_reputation(user.id, post, vote_value)
          end)

        vote ->
          if vote.value == vote_value do
            # Same vote - remove it
            Repo.delete!(vote)
            update_post_karma(post, -vote_value)
            propagate_post_reputation(user.id, post, -vote_value)
            nil
          else
            # Different vote - update it
            updated = vote
            |> Vote.changeset(%{value: vote_value})
            |> Repo.update!()

            # Adjust karma (remove old, add new)
            update_post_karma(post, vote_value * 2)
            propagate_post_reputation(user.id, post, vote_value)
            propagate_post_reputation(user.id, post, vote_value)
            updated
          end
      end

      vote_result
    end)

    # Award XP to the post author for receiving an upvote (not self-votes)
    maybe_award_upvote_xp(result, user, post, vote_type)

    result
  end

  @doc """
  Removes a vote from a post.
  """
  @spec remove_vote(CGraph.Accounts.User.t(), Post.t()) :: {:ok, Post.t() | nil}
  def remove_vote(user, post) do
    case Repo.get_by(Vote, user_id: user.id, post_id: post.id) do
      nil ->
        {:ok, Repo.get(Post, post.id)}

      vote ->
        Repo.delete!(vote)
        update_post_karma(post, -vote.value)
        {:ok, Repo.get(Post, post.id)}
    end
  end

  @doc """
  Gets the current karma score for a post.
  """
  @spec get_post_karma(Post.t()) :: integer()
  def get_post_karma(post) do
    from(v in Vote,
      where: v.post_id == ^post.id,
      select: coalesce(sum(v.value), 0)
    )
    |> Repo.one()
  end

  @doc """
  Gets a user's vote on a post.
  """
  @spec get_user_vote(CGraph.Accounts.User.t(), Post.t()) :: :up | :down | nil
  def get_user_vote(user, post) do
    case Repo.get_by(Vote, user_id: user.id, post_id: post.id) do
      nil -> nil
      vote -> if vote.value > 0, do: :up, else: :down
    end
  end

  @doc """
  Votes on a comment.
  """
  @spec vote_on_comment(CGraph.Accounts.User.t(), CGraph.Forums.Comment.t(), :up | :down | String.t()) :: {:ok, term()} | {:error, term()}
  def vote_on_comment(user, comment, vote_type) when vote_type in [:up, :down, "up", "down"] do
    vote_value = if vote_type in [:up, "up"], do: 1, else: -1

    existing_vote = Repo.get_by(Vote, user_id: user.id, comment_id: comment.id)

    result = case existing_vote do
      nil ->
        res = %Vote{}
          |> Vote.changeset(%{
            user_id: user.id,
            comment_id: comment.id,
            value: vote_value
          })
          |> Repo.insert()
        propagate_comment_reputation(user.id, comment, vote_value)
        res

      vote ->
        if vote.value == vote_value do
          res = Repo.delete(vote)
          propagate_comment_reputation(user.id, comment, -vote_value)
          res
        else
          res = vote
            |> Vote.changeset(%{value: vote_value})
            |> Repo.update()
          # Changed direction: propagate the new value twice (undo old + apply new)
          propagate_comment_reputation(user.id, comment, vote_value)
          propagate_comment_reputation(user.id, comment, vote_value)
          res
        end
    end

    # Award XP to comment author for receiving an upvote (not self-votes)
    maybe_award_comment_upvote_xp(result, user, comment, vote_type)

    result
  end

  @doc """
  Gets top posts by karma in a time period.
  """
  @spec top_posts_by_karma(keyword()) :: [Post.t()]
  def top_posts_by_karma(opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    since = Keyword.get(opts, :since, DateTime.add(DateTime.utc_now(), -7, :day))

    from(p in Post,
      where: p.inserted_at >= ^since,
      order_by: [desc: p.score],
      limit: ^limit,
      preload: [:author, :forum]
    )
    |> Repo.all()
  end

  # Private helpers

  defp update_post_karma(post, delta) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [score: delta])
  end

  # Propagate reputation to post author (skip self-votes)
  defp propagate_post_reputation(voter_id, post, delta) do
    if voter_id != post.author_id do
      rep_delta = if delta > 0, do: 1, else: -1
      Members.update_reputation(post.forum_id, post.author_id, rep_delta)
    end
  end

  # Propagate reputation to comment author via post -> forum_id (skip self-votes)
  defp propagate_comment_reputation(voter_id, comment, delta) do
    if voter_id != comment.author_id do
      # Load post to get forum_id
      post = Repo.get(Post, comment.post_id)
      if post do
        rep_delta = if delta > 0, do: 1, else: -1
        Members.update_reputation(post.forum_id, comment.author_id, rep_delta)
      end
    end
  end

  # Award XP to post author when they receive an upvote (skip self-votes)
  defp maybe_award_upvote_xp({:ok, _vote_result}, voter, post, vote_type)
       when vote_type in [:up, "up"] and voter.id != post.author_id do
    Task.start(fn ->
      author = CGraph.Repo.get(CGraph.Accounts.User, post.author_id)

      if author do
        CGraph.Gamification.XpEventHandler.handle_action(
          author,
          :forum_upvote_received,
          reference_type: "post",
          reference_id: post.id,
          board_id: post.forum_id
        )
      end
    end)
  end

  defp maybe_award_upvote_xp(_result, _voter, _post, _vote_type), do: :ok

  # Award XP to comment author when they receive an upvote (skip self-votes)
  defp maybe_award_comment_upvote_xp({:ok, _vote_result}, voter, comment, vote_type)
       when vote_type in [:up, "up"] and voter.id != comment.author_id do
    Task.start(fn ->
      author = CGraph.Repo.get(CGraph.Accounts.User, comment.author_id)

      if author do
        CGraph.Gamification.XpEventHandler.handle_action(
          author,
          :forum_upvote_received,
          reference_type: "comment",
          reference_id: comment.id
        )
      end
    end)
  end

  defp maybe_award_comment_upvote_xp(_result, _voter, _comment, _vote_type), do: :ok
end
