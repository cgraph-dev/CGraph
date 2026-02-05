defmodule CGraph.Forums.Leaderboard do
  @moduledoc """
  Forum leaderboard and ranking functionality.
  
  Provides sorted lists of forums for competition and discovery.
  """

  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.Forum

  @doc """
  Get forum leaderboard sorted by various criteria.
  
  ## Options
  - `:sort` - "hot" (default), "top", "new", "rising", "weekly", "members"
  - `:page`, `:per_page` - pagination
  - `:featured_only` - only show featured forums
  """
  def list_forum_leaderboard(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 25)
    sort = Keyword.get(opts, :sort, "hot")
    featured_only = Keyword.get(opts, :featured_only, false)

    query = from(f in Forum,
      where: is_nil(f.deleted_at) and f.is_public == true,
      preload: [:owner]
    )
    |> maybe_filter_featured(featured_only)
    |> apply_forum_sort(sort)

    total = Repo.aggregate(query, :count, :id)

    forums = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total, sort: sort}
    {forums, meta}
  end

  @doc """
  Get top N forums for a quick leaderboard display.
  """
  def get_top_forums(limit \\ 10, sort \\ "hot") do
    from(f in Forum,
      where: is_nil(f.deleted_at) and f.is_public == true,
      preload: [:owner],
      limit: ^limit
    )
    |> apply_forum_sort(sort)
    |> Repo.all()
  end

  defp maybe_filter_featured(query, false), do: query
  defp maybe_filter_featured(query, true) do
    from f in query, where: f.featured == true
  end

  defp apply_forum_sort(query, "hot"), do: from(f in query, order_by: [desc: f.hot_score])
  defp apply_forum_sort(query, "top"), do: from(f in query, order_by: [desc: f.score])
  defp apply_forum_sort(query, "new"), do: from(f in query, order_by: [desc: f.inserted_at])
  defp apply_forum_sort(query, "rising"), do: from(f in query, order_by: [desc: f.weekly_score, desc: f.inserted_at])
  defp apply_forum_sort(query, "weekly"), do: from(f in query, order_by: [desc: f.weekly_score])
  defp apply_forum_sort(query, "members"), do: from(f in query, order_by: [desc: f.member_count])
  defp apply_forum_sort(query, _unknown), do: from(f in query, order_by: [desc: f.hot_score])
end
