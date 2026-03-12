defmodule CGraph.Forums.ForumAnalytics do
  @moduledoc """
  Forum analytics: top threads, engagement metrics, and growth stats.

  Provides aggregate analytics queries for forum dashboards. The
  `ForumAnalyticsWorker` can be used to materialise expensive aggregates
  on a schedule.
  """

  import Ecto.Query, warn: false

  alias CGraph.Forums.{Thread, ThreadPost}
  alias CGraph.Repo

  # ── Top threads ──────────────────────────────────────────────────────

  @doc """
  Return top threads for a forum ordered by different criteria.

  ## Options
  - `:sort` — "views" (default), "replies", or "upvotes"
  - `:limit` — max results (default 10)
  - `:since` — only threads created after this `DateTime`
  """
  @spec top_threads(String.t(), keyword()) :: [Thread.t()]
  def top_threads(forum_id, opts \\ []) do
    sort = Keyword.get(opts, :sort, "views")
    limit = Keyword.get(opts, :limit, 10)
    since = Keyword.get(opts, :since)

    base =
      from(t in Thread,
        join: b in assoc(t, :board),
        where: b.forum_id == ^forum_id,
        limit: ^limit,
        preload: [:author, :board]
      )

    base
    |> maybe_since(since)
    |> apply_thread_sort(sort)
    |> Repo.all()
  end

  defp apply_thread_sort(query, "replies") do
    from(t in query, order_by: [desc: t.reply_count])
  end

  defp apply_thread_sort(query, "upvotes") do
    from(t in query, order_by: [desc: t.score])
  end

  defp apply_thread_sort(query, _views) do
    from(t in query, order_by: [desc: t.view_count])
  end

  defp maybe_since(query, nil), do: query

  defp maybe_since(query, since) do
    from(t in query, where: t.inserted_at >= ^since)
  end

  # ── Engagement metrics ───────────────────────────────────────────────

  @doc """
  Engagement metrics for a forum over a given period.

  Returns a map with:
  - `:dau` — distinct authors active in the period
  - `:posts_per_day` — average posts per day
  - `:avg_replies` — average reply count per thread
  """
  @spec engagement_metrics(String.t(), keyword()) :: map()
  def engagement_metrics(forum_id, opts \\ []) do
    days = Keyword.get(opts, :days, 30)
    since = DateTime.add(DateTime.utc_now(), -days * 86_400, :second)

    # Distinct active users (thread authors)
    dau =
      from(t in Thread,
        join: b in assoc(t, :board),
        where: b.forum_id == ^forum_id and t.inserted_at >= ^since,
        select: count(t.author_id, :distinct)
      )
      |> Repo.one() || 0

    # Total threads in period
    thread_count =
      from(t in Thread,
        join: b in assoc(t, :board),
        where: b.forum_id == ^forum_id and t.inserted_at >= ^since,
        select: count(t.id)
      )
      |> Repo.one() || 0

    # Total thread posts in period
    post_count =
      from(tp in ThreadPost,
        join: t in assoc(tp, :thread),
        join: b in assoc(t, :board),
        where: b.forum_id == ^forum_id and tp.inserted_at >= ^since,
        select: count(tp.id)
      )
      |> Repo.one() || 0

    # Average replies per thread
    avg_replies =
      from(t in Thread,
        join: b in assoc(t, :board),
        where: b.forum_id == ^forum_id and t.inserted_at >= ^since,
        select: avg(t.reply_count)
      )
      |> Repo.one()

    posts_per_day = if days > 0, do: Float.round(post_count / days, 1), else: 0.0

    %{
      dau: dau,
      posts_per_day: posts_per_day,
      avg_replies: avg_replies || 0.0,
      thread_count: thread_count,
      post_count: post_count,
      period_days: days
    }
  end

  # ── Growth stats ─────────────────────────────────────────────────────

  @doc """
  Growth statistics for a forum: new users, new threads trend.

  Returns a map with:
  - `:new_threads_7d` — threads created in last 7 days
  - `:new_threads_30d` — threads created in last 30 days
  - `:new_members_7d` — distinct new thread authors in last 7 days
  - `:new_members_30d` — distinct new thread authors in last 30 days
  - `:growth_rate` — percentage change (30d vs prior 30d)
  """
  @spec growth_stats(String.t()) :: map()
  def growth_stats(forum_id) do
    now = DateTime.utc_now()
    seven_days_ago = DateTime.add(now, -7 * 86_400, :second)
    thirty_days_ago = DateTime.add(now, -30 * 86_400, :second)
    sixty_days_ago = DateTime.add(now, -60 * 86_400, :second)

    new_threads_7d = count_threads_since(forum_id, seven_days_ago)
    new_threads_30d = count_threads_since(forum_id, thirty_days_ago)
    prev_30d = count_threads_between(forum_id, sixty_days_ago, thirty_days_ago)

    new_members_7d = count_distinct_authors_since(forum_id, seven_days_ago)
    new_members_30d = count_distinct_authors_since(forum_id, thirty_days_ago)

    growth_rate =
      if prev_30d > 0 do
        Float.round((new_threads_30d - prev_30d) / prev_30d * 100, 1)
      else
        0.0
      end

    %{
      new_threads_7d: new_threads_7d,
      new_threads_30d: new_threads_30d,
      new_members_7d: new_members_7d,
      new_members_30d: new_members_30d,
      growth_rate: growth_rate
    }
  end

  # ── Private helpers ──────────────────────────────────────────────────

  defp count_threads_since(forum_id, since) do
    from(t in Thread,
      join: b in assoc(t, :board),
      where: b.forum_id == ^forum_id and t.inserted_at >= ^since,
      select: count(t.id)
    )
    |> Repo.one() || 0
  end

  defp count_threads_between(forum_id, from_dt, to_dt) do
    from(t in Thread,
      join: b in assoc(t, :board),
      where:
        b.forum_id == ^forum_id and
          t.inserted_at >= ^from_dt and
          t.inserted_at < ^to_dt,
      select: count(t.id)
    )
    |> Repo.one() || 0
  end

  defp count_distinct_authors_since(forum_id, since) do
    from(t in Thread,
      join: b in assoc(t, :board),
      where: b.forum_id == ^forum_id and t.inserted_at >= ^since,
      select: count(t.author_id, :distinct)
    )
    |> Repo.one() || 0
  end
end
