defmodule CGraph.Forums.Voting do
  @moduledoc """
  Voting and karma operations for forums.
  
  Handles upvotes, downvotes, and karma calculations.
  """
  
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.{Post, PostVote, Vote, ForumVote}
  
  @doc """
  Votes on a post (upvote or downvote).
  """
  def vote_on_post(user, post, vote_type) when vote_type in [:up, :down, "up", "down"] do
    vote_value = if vote_type in [:up, "up"], do: 1, else: -1
    
    Repo.transaction(fn ->
      # Check for existing vote
      existing_vote = Repo.get_by(PostVote, user_id: user.id, post_id: post.id)
      
      case existing_vote do
        nil ->
          # Create new vote
          %PostVote{}
          |> PostVote.changeset(%{
            user_id: user.id,
            post_id: post.id,
            value: vote_value
          })
          |> Repo.insert!()
          
          update_post_karma(post, vote_value)
          
        vote ->
          if vote.value == vote_value do
            # Same vote - remove it
            Repo.delete!(vote)
            update_post_karma(post, -vote_value)
          else
            # Different vote - update it
            vote
            |> PostVote.changeset(%{value: vote_value})
            |> Repo.update!()
            
            # Adjust karma (remove old, add new)
            update_post_karma(post, vote_value * 2)
          end
      end
      
      get_post_karma(post)
    end)
  end
  
  @doc """
  Removes a vote from a post.
  """
  def remove_vote(user, post) do
    case Repo.get_by(PostVote, user_id: user.id, post_id: post.id) do
      nil ->
        {:ok, get_post_karma(post)}
        
      vote ->
        Repo.delete!(vote)
        update_post_karma(post, -vote.value)
        {:ok, get_post_karma(post)}
    end
  end
  
  @doc """
  Gets the current karma score for a post.
  """
  def get_post_karma(post) do
    from(v in PostVote,
      where: v.post_id == ^post.id,
      select: coalesce(sum(v.value), 0)
    )
    |> Repo.one()
  end
  
  @doc """
  Gets a user's vote on a post.
  """
  def get_user_vote(user, post) do
    case Repo.get_by(PostVote, user_id: user.id, post_id: post.id) do
      nil -> nil
      vote -> if vote.value > 0, do: :up, else: :down
    end
  end
  
  @doc """
  Votes on a comment.
  """
  def vote_on_comment(user, comment, vote_type) when vote_type in [:up, :down, "up", "down"] do
    vote_value = if vote_type in [:up, "up"], do: 1, else: -1
    
    existing_vote = Repo.get_by(Vote, user_id: user.id, comment_id: comment.id)
    
    case existing_vote do
      nil ->
        %Vote{}
        |> Vote.changeset(%{
          user_id: user.id,
          comment_id: comment.id,
          value: vote_value
        })
        |> Repo.insert()
        
      vote ->
        if vote.value == vote_value do
          Repo.delete(vote)
        else
          vote
          |> Vote.changeset(%{value: vote_value})
          |> Repo.update()
        end
    end
  end
  
  @doc """
  Gets top posts by karma in a time period.
  """
  def top_posts_by_karma(opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    since = Keyword.get(opts, :since, DateTime.add(DateTime.utc_now(), -7, :day))
    
    from(p in Post,
      where: p.inserted_at >= ^since,
      order_by: [desc: p.vote_count],
      limit: ^limit,
      preload: [:author, :forum]
    )
    |> Repo.all()
  end
  
  # Private helpers
  
  defp update_post_karma(post, delta) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [vote_count: delta])
  end
end
