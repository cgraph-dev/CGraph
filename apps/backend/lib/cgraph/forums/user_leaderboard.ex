defmodule CGraph.Forums.UserLeaderboard do
  @moduledoc """
  Forum-specific user leaderboard functionality.

  Calculates and displays top contributors for a specific forum
  based on their post and comment scores within that forum.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Comment, Post}
  alias CGraph.Repo

  @doc """
  Get top contributors for a specific forum based on their post/comment scores.

  ## Options
  - `:page` - Page number (default: 1)
  - `:per_page` - Items per page (default: 10, max: 50)
  - `:time_range` - Filter by time: :all, :week, :month, :year (default: :all)
  """
  def get_forum_user_leaderboard(forum_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = min(Keyword.get(opts, :per_page, 10), 50)
    time_range = Keyword.get(opts, :time_range, :all)

    time_filter = build_time_filter(time_range)

    post_scores = forum_id |> build_post_karma_query(time_filter) |> Repo.all()
    comment_scores = forum_id |> build_comment_karma_query(time_filter) |> Repo.all()

    combined_scores = combine_karma_scores(post_scores, comment_scores)
    total = length(combined_scores)

    users_with_karma = combined_scores
      |> paginate_scores(page, per_page)
      |> hydrate_users()

    meta = %{
      page: page,
      per_page: per_page,
      total: total,
      total_pages: max(ceil(total / per_page), 1),
      forum_id: forum_id,
      time_range: time_range
    }

    {users_with_karma, meta}
  end

  defp build_time_filter(:week), do: DateTime.add(DateTime.utc_now(), -7, :day)
  defp build_time_filter(:month), do: DateTime.add(DateTime.utc_now(), -30, :day)
  defp build_time_filter(:year), do: DateTime.add(DateTime.utc_now(), -365, :day)
  defp build_time_filter(_all), do: nil

  defp build_post_karma_query(forum_id, nil) do
    from p in Post,
      where: p.forum_id == ^forum_id and is_nil(p.deleted_at),
      group_by: p.author_id,
      select: %{user_id: p.author_id, karma: sum(p.score)}
  end
  defp build_post_karma_query(forum_id, time_filter) do
    from p in Post,
      where: p.forum_id == ^forum_id and is_nil(p.deleted_at) and p.inserted_at >= ^time_filter,
      group_by: p.author_id,
      select: %{user_id: p.author_id, karma: sum(p.score)}
  end

  defp build_comment_karma_query(forum_id, nil) do
    from c in Comment,
      join: p in Post, on: c.post_id == p.id,
      where: p.forum_id == ^forum_id and is_nil(c.deleted_at),
      group_by: c.author_id,
      select: %{user_id: c.author_id, karma: sum(c.score)}
  end
  defp build_comment_karma_query(forum_id, time_filter) do
    from c in Comment,
      join: p in Post, on: c.post_id == p.id,
      where: p.forum_id == ^forum_id and is_nil(c.deleted_at) and c.inserted_at >= ^time_filter,
      group_by: c.author_id,
      select: %{user_id: c.author_id, karma: sum(c.score)}
  end

  defp combine_karma_scores(post_scores, comment_scores) do
    (post_scores ++ comment_scores)
    |> Enum.group_by(& &1.user_id)
    |> Enum.map(fn {user_id, scores} ->
      total_karma = Enum.reduce(scores, 0, fn %{karma: k}, acc -> acc + (k || 0) end)
      %{user_id: user_id, forum_karma: total_karma}
    end)
    |> Enum.filter(& &1.user_id != nil)
    |> Enum.sort_by(& -(&1.forum_karma))
  end

  defp paginate_scores(scores, page, per_page) do
    scores
    |> Enum.drop((page - 1) * per_page)
    |> Enum.take(per_page)
    |> Enum.with_index(((page - 1) * per_page) + 1)
  end

  defp hydrate_users(paginated_scores) do
    user_ids = Enum.map(paginated_scores, fn {%{user_id: uid}, _rank} -> uid end)

    users_by_id =
      from(u in CGraph.Accounts.User, where: u.id in ^user_ids)
      |> Repo.all()
      |> Map.new(&{&1.id, &1})

    paginated_scores
    |> Enum.map(fn {%{user_id: user_id, forum_karma: forum_karma}, rank} ->
      %{rank: rank, user: Map.get(users_by_id, user_id), forum_karma: forum_karma}
    end)
    |> Enum.filter(& &1.user != nil)
  end
end
