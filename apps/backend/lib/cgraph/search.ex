defmodule CGraph.Search do
  @moduledoc """
  The Search context.

  Provides unified search functionality across users, messages, posts, and groups.
  Uses Meilisearch for high-performance fuzzy search with PostgreSQL fallback.

  ## Search Backends

  - **Primary**: Meilisearch via `CGraph.Search.SearchEngine`
    - Sub-50ms response times
    - Typo-tolerant fuzzy matching
    - Relevance ranking

  - **Fallback**: PostgreSQL ILIKE queries
    - Automatically used when Meilisearch is unavailable
    - Ensures search never fails completely

  ## Performance

  | Scale | Meilisearch | PostgreSQL |
  |-------|-------------|------------|
  | 10K messages | <10ms | ~50ms |
  | 100K messages | <20ms | ~200ms |
  | 1M messages | <50ms | >1s |
  | 10M messages | <100ms | timeout |
  """

  import Ecto.Query, warn: false
  require Logger

  alias CGraph.Accounts.User
  alias CGraph.Forums.Post
  alias CGraph.Groups.Group
  alias CGraph.Repo
  alias CGraph.Search.{Messages, Users}

  @doc """
  Search users by username, display name, bio, or user_id (identity number).
  Supports searching by #0001 format or plain number.

  Attempts Meilisearch first, falls back to PostgreSQL on failure.
  """
  @spec search_users(String.t(), keyword()) :: {[User.t()], map()}
  def search_users(query, opts \\ []), do: Users.search_users(query, opts)

  @doc """
  Search messages within user's conversations.

  Attempts Meilisearch first for fuzzy matching, falls back to PostgreSQL.
  """
  @spec search_messages(map() | Ecto.UUID.t(), String.t(), keyword()) :: {[map()], map()}
  def search_messages(user, query, opts \\ []), do: Messages.search_messages(user, query, opts)

  @doc """
  Search posts in forums using cursor-based pagination.
  """
  @spec search_posts(String.t(), keyword()) :: {[Post.t()], map()}
  def search_posts(query, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    limit = Keyword.get(opts, :limit, 20)
    cursor = Keyword.get(opts, :cursor)
    forum_id = Keyword.get(opts, :forum_id)
    sort = Keyword.get(opts, :sort, "relevance")
    time_range = Keyword.get(opts, :time_range, "all")

    search_term = "%#{sanitize_query(query)}%"

    base_query = from(p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      preload: [:author, :forum]
    )
    |> maybe_filter_by_forum(forum_id)
    |> apply_time_range(time_range)
    |> apply_post_sort(sort, search_term)

    # Use cursor pagination for large result sets
    pagination_opts = %{
      cursor: cursor,
      after_cursor: nil,
      before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :inserted_at,
      sort_direction: :desc,
      include_total: true
    }

    {posts, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)

    {posts, %{
      total: page_info[:total_count],
      limit: limit,
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor
    }}
  end

  defp maybe_filter_by_forum(query, nil), do: query
  defp maybe_filter_by_forum(query, forum_id) do
    from p in query, where: p.forum_id == ^forum_id
  end

  defp apply_post_sort(query, "relevance", search_term) do
    from p in query,
      order_by: [
        desc: fragment("CASE WHEN ? ILIKE ? THEN 2 ELSE 0 END + CASE WHEN ? ILIKE ? THEN 1 ELSE 0 END",
                      p.title, ^search_term, p.content, ^search_term),
        desc: p.score
      ]
  end
  defp apply_post_sort(query, "new", _search_term) do
    from p in query, order_by: [desc: p.inserted_at]
  end
  defp apply_post_sort(query, "top", _search_term) do
    from p in query, order_by: [desc: p.score]
  end
  defp apply_post_sort(query, "comments", _search_term) do
    from p in query, order_by: [desc: p.comment_count]
  end
  defp apply_post_sort(query, _unknown, _search_term) do
    from p in query, order_by: [desc: p.inserted_at]
  end

  @doc """
  Search groups/servers using cursor-based pagination.
  """
  @spec search_groups(String.t(), keyword()) :: {[Group.t()], map()}
  def search_groups(query, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    limit = Keyword.get(opts, :limit, 20)
    cursor = Keyword.get(opts, :cursor)

    search_term = "%#{sanitize_query(query)}%"

    base_query = from g in Group,
      where: g.is_public == true,
      where: ilike(g.name, ^search_term) or ilike(g.description, ^search_term)

    pagination_opts = %{
      cursor: cursor,
      after_cursor: nil,
      before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :member_count,
      sort_direction: :desc,
      include_total: true
    }

    {groups, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)

    {groups, %{
      total: page_info[:total_count],
      limit: limit,
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor
    }}
  end

  @doc """
  Unified search across all content types.
  """
  @spec search_all(String.t(), keyword()) :: map()
  def search_all(query, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    current_user = Keyword.get(opts, :current_user)

    # Search in parallel using supervised tasks
    tasks = [
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> search_users(query, limit: 5, current_user: current_user) end),
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> search_posts(query, limit: 5) end),
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> search_groups(query, limit: 5) end)
    ]

    # Add message search if user is provided
    tasks = if current_user do
      tasks ++ [Task.Supervisor.async(CGraph.TaskSupervisor, fn -> search_messages(current_user, query, limit: 5) end)]
    else
      tasks
    end

    results = Task.await_many(tasks, 5000)

    %{
      users: elem(Enum.at(results, 0), 0),
      posts: elem(Enum.at(results, 1), 0),
      groups: elem(Enum.at(results, 2), 0),
      messages: if(current_user, do: elem(Enum.at(results, 3), 0), else: [])
    }
  end

  @doc """
  Get search suggestions based on partial query.
  """
  @spec get_suggestions(String.t(), keyword()) :: [map()]
  def get_suggestions(query, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    limit = Keyword.get(opts, :limit, 10)

    search_term = "#{sanitize_query(query)}%"

    # Get username suggestions
    users =
      from(u in User,
        where: u.is_active == true,
        where: ilike(u.username, ^search_term),
        select: %{type: "user", text: u.username, id: u.id},
        limit: ^limit)
      |> Repo.all()

    # Get forum name suggestions
    forums =
      from(f in CGraph.Forums.Forum,
        where: ilike(f.name, ^search_term),
        select: %{type: "forum", text: f.name, id: f.id},
        limit: ^limit)
      |> Repo.all()

    # Get group name suggestions
    groups =
      from(g in Group,
        where: g.is_public == true,
        where: ilike(g.name, ^search_term),
        select: %{type: "group", text: g.name, id: g.id},
        limit: ^limit)
      |> Repo.all()

    (users ++ forums ++ groups)
    |> Enum.take(limit)
  end

  @doc """
  Get recent search queries for a user.
  Delegates to `CGraph.Accounts.Search`.
  """
  defdelegate get_recent_searches(user, opts \\ []), to: CGraph.Accounts.Search

  @doc """
  Clear a user's search history.
  Delegates to `CGraph.Accounts.Search`.
  """
  defdelegate clear_search_history(user), to: CGraph.Accounts.Search

  @doc """
  Get user suggestions for autocomplete.
  Delegates to `CGraph.Accounts.Search`.
  """
  defdelegate get_user_suggestions(query, opts \\ []), to: CGraph.Accounts.Search

  @doc """
  Get group suggestions for autocomplete.
  Delegates to `CGraph.Groups`, :get_group_suggestions.
  """
  defdelegate get_group_suggestions(query, opts \\ []), to: CGraph.Groups

  @doc """
  Record a search query for analytics.
  Delegates to `CGraph.Accounts.Search`.
  """
  defdelegate record_search(user, query, result_count), to: CGraph.Accounts.Search

  # Private helpers

  defp sanitize_query(query) do
    query
    |> String.trim()
    |> String.replace(~r/[%_\\]/, fn
      "%" -> "\\%"
      "_" -> "\\_"
      "\\" -> "\\\\"
    end)
  end

  defp apply_time_range(query, time_range) do
    case time_range do
      "day" ->
        from p in query, where: p.inserted_at > ago(1, "day")
      "week" ->
        from p in query, where: p.inserted_at > ago(7, "day")
      "month" ->
        from p in query, where: p.inserted_at > ago(30, "day")
      "year" ->
        from p in query, where: p.inserted_at > ago(365, "day")
      _ ->
        query
    end
  end
end
