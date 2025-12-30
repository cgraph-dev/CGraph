defmodule Cgraph.Forums.RankingEngine do
  @moduledoc """
  Advanced ranking engine for forum leaderboard competition.
  
  Implements multiple ranking algorithms:
  - Hot: Reddit-style time-decayed score (good for recent activity)
  - Top: Pure score ranking (all-time best)
  - Rising: Score velocity (fast-growing forums)
  - Weekly: Reset weekly for fresh competition
  - Trending: Combination of recent activity + growth rate
  
  Each algorithm is designed to surface different types of content:
  - Hot: Balances recency with popularity
  - Top: Shows proven, popular forums
  - Rising: Discovers new, fast-growing forums
  - Weekly: Fresh weekly competition
  - Trending: Identifies momentum
  """

  import Ecto.Query
  alias Cgraph.Repo
  alias Cgraph.Forums.{Forum, ForumVote}

  @doc """
  Recalculate all ranking scores for all forums.
  Should be run periodically (e.g., every 5-15 minutes).
  """
  def update_all_rankings do
    forums = Repo.all(from f in Forum, where: is_nil(f.deleted_at))
    
    Enum.each(forums, fn forum ->
      update_forum_rankings(forum)
    end)
    
    {:ok, length(forums)}
  end

  @doc """
  Update rankings for a single forum.
  """
  def update_forum_rankings(forum) do
    hot_score = calculate_hot_score(forum)
    trending_score = calculate_trending_score(forum)
    
    from(f in Forum, where: f.id == ^forum.id)
    |> Repo.update_all(set: [
      hot_score: hot_score,
      # Store trending in monthly_score for now (could add dedicated field)
      monthly_score: round(trending_score)
    ])
  end

  @doc """
  Calculate hot score using Reddit's algorithm.
  
  Formula: sign(score) * log10(max(|score|, 1)) + age_in_seconds / 45000
  
  This gives newer content an advantage while still respecting score.
  A forum with 0 votes created now scores higher than one with 100 votes
  created 6 months ago.
  """
  def calculate_hot_score(forum) do
    score = forum.score || 0
    sign = if score >= 0, do: 1, else: -1
    order = :math.log10(max(abs(score), 1))
    
    # Time factor: seconds since epoch / 45000 (roughly 12.5 hours per point)
    seconds = DateTime.to_unix(forum.inserted_at)
    
    sign * order + (seconds / 45000)
  end

  @doc """
  Calculate rising score based on vote velocity.
  
  Measures how fast a forum is gaining votes recently.
  Uses votes from the last 24-48 hours divided by age.
  """
  def calculate_rising_score(forum) do
    # Count votes in the last 24 hours
    yesterday = DateTime.add(DateTime.utc_now(), -24, :hour)
    
    recent_votes = Repo.aggregate(
      from(v in ForumVote,
        where: v.forum_id == ^forum.id and v.inserted_at > ^yesterday
      ),
      :count,
      :id
    )
    
    # Age in hours (minimum 1 to avoid division by zero)
    age_hours = max(
      DateTime.diff(DateTime.utc_now(), forum.inserted_at, :hour),
      1
    )
    
    # Rising score = recent votes / sqrt(age)
    # Sqrt(age) means newer forums have slight advantage
    recent_votes / :math.sqrt(age_hours)
  end

  @doc """
  Calculate trending score combining growth rate with absolute performance.
  
  Trending = (weekly_score * 2) + (recent_vote_velocity * 10) + log10(total_score + 1)
  
  This balances:
  - Weekly performance (temporary, resets)
  - Vote velocity (momentum)
  - Total reputation (stability)
  """
  def calculate_trending_score(forum) do
    weekly_component = (forum.weekly_score || 0) * 2
    velocity = calculate_rising_score(forum) * 10
    total_component = :math.log10(max(forum.score || 0, 0) + 1)
    
    weekly_component + velocity + total_component
  end

  @doc """
  Calculate controversy score.
  Forums with high total votes but low net score are controversial.
  
  Controversy = (upvotes + downvotes) / max(|upvotes - downvotes|, 1)
  """
  def calculate_controversy_score(forum) do
    upvotes = forum.upvotes || 0
    downvotes = forum.downvotes || 0
    
    total = upvotes + downvotes
    diff = abs(upvotes - downvotes)
    
    if total == 0 do
      0
    else
      total / max(diff, 1)
    end
  end

  @doc """
  Reset weekly scores. Should be called weekly (e.g., Monday 00:00 UTC).
  """
  def reset_weekly_scores do
    from(f in Forum)
    |> Repo.update_all(set: [weekly_score: 0])
    
    {:ok, :reset}
  end

  @doc """
  Calculate Wilson score confidence interval lower bound.
  Better for small sample sizes than simple percentage.
  
  Used by Reddit for comment ranking.
  """
  def calculate_wilson_score(upvotes, downvotes) do
    n = upvotes + downvotes
    
    if n == 0 do
      0
    else
      z = 1.96  # 95% confidence
      phat = upvotes / n
      
      (phat + z*z/(2*n) - z * :math.sqrt((phat*(1-phat)+z*z/(4*n))/n)) /
        (1 + z*z/n)
    end
  end

  @doc """
  Get featured forum candidates.
  Returns top forums by various metrics for admin review.
  """
  def get_featured_candidates(limit \\ 10) do
    # Get top by different metrics
    top_hot = get_top_by(:hot, limit)
    top_score = get_top_by(:score, limit)
    top_weekly = get_top_by(:weekly, limit)
    top_members = get_top_by(:members, limit)
    
    %{
      hot: top_hot,
      score: top_score,
      weekly: top_weekly,
      members: top_members,
      # Unique forums across all lists
      unique_count: 
        (top_hot ++ top_score ++ top_weekly ++ top_members)
        |> Enum.map(& &1.id)
        |> Enum.uniq()
        |> length()
    }
  end

  defp get_top_by(metric, limit) do
    base_query = from f in Forum,
      where: is_nil(f.deleted_at) and f.is_public == true,
      limit: ^limit

    query = case metric do
      :hot -> from f in base_query, order_by: [desc: f.hot_score]
      :score -> from f in base_query, order_by: [desc: f.score]
      :weekly -> from f in base_query, order_by: [desc: f.weekly_score]
      :members -> from f in base_query, order_by: [desc: f.member_count]
      _ -> from f in base_query, order_by: [desc: f.hot_score]
    end

    Repo.all(query)
  end

  @doc """
  Auto-feature top forums based on criteria.
  Features forums in top 3 by hot score with minimum thresholds.
  """
  def auto_feature_top_forums do
    # Minimum requirements to be featured
    min_score = 50
    min_members = 10
    
    top_forums = from(f in Forum,
      where: is_nil(f.deleted_at) and 
             f.is_public == true and
             f.score >= ^min_score and
             f.member_count >= ^min_members,
      order_by: [desc: f.hot_score],
      limit: 3
    ) |> Repo.all()
    
    # Clear existing featured
    from(f in Forum)
    |> Repo.update_all(set: [featured: false])
    
    # Feature top forums
    ids = Enum.map(top_forums, & &1.id)
    from(f in Forum, where: f.id in ^ids)
    |> Repo.update_all(set: [featured: true])
    
    {:ok, length(top_forums)}
  end
end
