defmodule CGraph.Forums.Feeds do
  @moduledoc """
  Feed operations for forums.
  
  Handles public feed, home feed, popular feed, etc.
  """
  
  import Ecto.Query, warn: false
  
  alias CGraph.Repo
  alias CGraph.ReadRepo
  alias CGraph.Forums.{Post, Forum, Subscription}
  
  @doc """
  Lists posts from all public forums (public feed).
  """
  def list_public_feed(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 25)
    sort = Keyword.get(opts, :sort, "hot")
    time_range = Keyword.get(opts, :time_range, "all")
    user = Keyword.get(opts, :user)
    
    query = base_public_feed_query()
    |> maybe_apply_time_filter(sort, time_range)
    |> apply_sort(sort)
    
    total = ReadRepo.aggregate(query, :count, :id)
    
    posts = query
    |> limit(^per_page)
    |> offset(^((page - 1) * per_page))
    |> ReadRepo.all()
    |> maybe_add_user_votes(user)
    
    meta = %{page: page, per_page: per_page, total: total}
    {posts, meta}
  end
  
  @doc """
  Lists posts from user's subscribed forums (home feed).
  """
  def list_home_feed(nil, _opts), do: {[], %{page: 1, per_page: 25, total: 0}}
  def list_home_feed(user, opts) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 25)
    sort = Keyword.get(opts, :sort, "hot")
    
    # Get user's subscribed forum IDs
    subscribed_forum_ids = from(s in Subscription,
      where: s.user_id == ^user.id,
      select: s.forum_id
    )
    |> ReadRepo.all()
    
    if Enum.empty?(subscribed_forum_ids) do
      # No subscriptions - return public feed
      list_public_feed(opts)
    else
      query = from(p in Post,
        where: p.forum_id in ^subscribed_forum_ids,
        where: is_nil(p.deleted_at),
        preload: [:author, :forum]
      )
      |> apply_sort(sort)
      
      total = ReadRepo.aggregate(query, :count, :id)
      
      posts = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> ReadRepo.all()
      |> maybe_add_user_votes(user)
      
      meta = %{page: page, per_page: per_page, total: total}
      {posts, meta}
    end
  end
  
  @doc """
  Lists popular posts (trending).
  """
  def list_popular_feed(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 25)
    user = Keyword.get(opts, :user)
    
    # Get posts from last 24 hours with high engagement
    since = DateTime.add(DateTime.utc_now(), -24, :hour)
    
    query = from(p in Post,
      join: f in Forum, on: p.forum_id == f.id,
      where: f.is_public == true,
      where: is_nil(p.deleted_at),
      where: p.inserted_at >= ^since,
      order_by: [desc: p.hot_score],
      preload: [:author, :forum]
    )
    
    total = ReadRepo.aggregate(query, :count, :id)
    
    posts = query
    |> limit(^per_page)
    |> offset(^((page - 1) * per_page))
    |> ReadRepo.all()
    |> maybe_add_user_votes(user)
    
    meta = %{page: page, per_page: per_page, total: total}
    {posts, meta}
  end
  
  # Private helpers
  
  defp base_public_feed_query do
    from(p in Post,
      join: f in Forum, on: p.forum_id == f.id,
      where: f.is_public == true,
      where: is_nil(p.deleted_at),
      preload: [:author, :forum]
    )
  end
  
  defp maybe_apply_time_filter(query, "top", time_range) do
    case time_range_to_datetime(time_range) do
      nil -> query
      since -> from(p in query, where: p.inserted_at >= ^since)
    end
  end
  defp maybe_apply_time_filter(query, _sort, _time_range), do: query
  
  defp time_range_to_datetime("hour"), do: DateTime.add(DateTime.utc_now(), -1, :hour)
  defp time_range_to_datetime("day"), do: DateTime.add(DateTime.utc_now(), -1, :day)
  defp time_range_to_datetime("week"), do: DateTime.add(DateTime.utc_now(), -7, :day)
  defp time_range_to_datetime("month"), do: DateTime.add(DateTime.utc_now(), -30, :day)
  defp time_range_to_datetime("year"), do: DateTime.add(DateTime.utc_now(), -365, :day)
  defp time_range_to_datetime(_all), do: nil
  
  defp apply_sort(query, "new"), do: from(p in query, order_by: [desc: p.inserted_at])
  defp apply_sort(query, "top"), do: from(p in query, order_by: [desc: p.score])
  defp apply_sort(query, "controversial") do
    from(p in query, order_by: [desc: fragment("? + ?", p.upvotes, p.downvotes)])
  end
  defp apply_sort(query, _hot) do
    from(p in query, order_by: [
      desc: fragment("? / POWER(EXTRACT(EPOCH FROM (NOW() - ?))/3600 + 2, 1.8)", p.score, p.inserted_at)
    ])
  end
  
  defp maybe_add_user_votes(posts, nil), do: posts
  defp maybe_add_user_votes(posts, user) do
    post_ids = Enum.map(posts, & &1.id)
    
    votes = from(v in CGraph.Forums.PostVote,
      where: v.post_id in ^post_ids and v.user_id == ^user.id,
      select: {v.post_id, v.value}
    )
    |> Repo.all()
    |> Map.new()
    
    Enum.map(posts, fn post ->
      vote = Map.get(votes, post.id)
      Map.put(post, :my_vote, vote)
    end)
  end
end
