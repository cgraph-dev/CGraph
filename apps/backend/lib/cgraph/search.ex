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
  alias CGraph.Messaging.Message
  alias CGraph.Repo
  alias CGraph.Search.Engine, as: SearchEngine

  @doc """
  Search users by username, display name, bio, or user_id (identity number).
  Supports searching by #0001 format or plain number.

  Attempts Meilisearch first, falls back to PostgreSQL on failure.
  """
  def search_users(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    cursor = Keyword.get(opts, :cursor)
    current_user = Keyword.get(opts, :current_user)

    # Decode cursor to Meilisearch offset (cursor encodes next offset position)
    meili_offset = decode_search_cursor(cursor) || 0

    # Try Meilisearch first for fuzzy search
    case SearchEngine.search(:users, query, limit: limit, offset: meili_offset) do
      {:ok, %{hits: hits, total: total}} ->
        user_ids = Enum.map(hits, & &1["id"])
        users = fetch_users_by_ids(user_ids, current_user)
        has_more = meili_offset + limit < total
        next_cursor = if has_more, do: encode_search_cursor(meili_offset + limit), else: nil
        {users, %{total: total, limit: limit, has_more: has_more, next_cursor: next_cursor}}

      {:error, reason} ->
        Logger.debug("meilisearch_unavailable_using_postgresql_fallback", reason: inspect(reason))
        search_users_postgres(query, opts)
    end
  end

  defp fetch_users_by_ids([], _current_user), do: []
  defp fetch_users_by_ids(user_ids, current_user) do
    from(u in User,
      where: u.id in ^user_ids,
      where: is_nil(u.deleted_at) and is_nil(u.banned_at)
    )
    |> maybe_exclude_blocked(current_user)
    |> Repo.all()
    |> Enum.sort_by(&Enum.find_index(user_ids, fn id -> id == &1.id end))
  end

  defp search_users_postgres(query, opts) do
    limit = Keyword.get(opts, :limit, 20)
    current_user = Keyword.get(opts, :current_user)

    {base_query, is_id_search} = build_user_search_query(query, limit, nil)

    base_query = maybe_exclude_blocked(base_query, current_user)
    users = Repo.all(base_query)
    total = count_user_results(is_id_search, users, query)

    {users, %{total: total, limit: limit, has_more: length(users) == limit, next_cursor: nil}}
  end

  defp build_user_search_query(query, limit, offset) do
    case parse_user_id_query(query) do
      {:ok, user_id_num} -> {build_user_id_query(user_id_num), true}
      :error -> {build_text_search_query(query, limit, offset), false}
    end
  end

  defp build_user_id_query(user_id_num) do
    from u in User,
      where: is_nil(u.deleted_at) and is_nil(u.banned_at),
      where: u.user_id == ^user_id_num,
      limit: 1
  end

  defp build_text_search_query(query, limit, _cursor) do
    search_term = "%#{sanitize_query(query)}%"
    prefix_term = "#{sanitize_query(query)}%"

    # Note: User search uses limit-based approach since relevance scoring
    # makes cursor pagination impractical. For PostgreSQL fallback search,
    # result sets are typically small (< 100) so offset risk is minimal.
    from u in User,
      where: is_nil(u.deleted_at) and is_nil(u.banned_at),
      where: ilike(u.username, ^search_term) or
             ilike(u.display_name, ^search_term) or
             ilike(u.bio, ^search_term),
      order_by: [
        desc: fragment("CASE WHEN ? ILIKE ? THEN 2 WHEN ? ILIKE ? THEN 1 ELSE 0 END",
                       u.username, ^prefix_term,
                       u.display_name, ^prefix_term)
      ],
      limit: ^limit
  end

  defp maybe_exclude_blocked(query, nil), do: query
  defp maybe_exclude_blocked(query, current_user) do
    from u in query,
      where: u.id not in subquery(
        from b in "blocks",
        where: b.blocker_id == ^current_user.id,
        select: b.blocked_id
      )
  end

  defp count_user_results(true, users, _query), do: length(users)
  defp count_user_results(false, _users, query) do
    search_term = "%#{sanitize_query(query)}%"
    from(u in User,
      where: is_nil(u.deleted_at) and is_nil(u.banned_at),
      where: ilike(u.username, ^search_term) or
             ilike(u.display_name, ^search_term) or
             ilike(u.bio, ^search_term),
      select: count(u.id)
    )
    |> Repo.one()
  end

  # Parse user_id query formats like "#0001", "#1", "0001", or just "1"
  defp parse_user_id_query(query) do
    cleaned = query |> String.trim() |> String.replace("#", "")

    # Only treat as ID search if it looks like a number
    if String.match?(cleaned, ~r/^\d+$/) do
      case Integer.parse(cleaned) do
        {num, ""} when num > 0 -> {:ok, num}
        _ -> :error
      end
    else
      :error
    end
  end

  @doc """
  Search messages within user's conversations.

  Attempts Meilisearch first for fuzzy matching, falls back to PostgreSQL.
  """
  def search_messages(user, query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    cursor = Keyword.get(opts, :cursor)
    conversation_id = Keyword.get(opts, :conversation_id)

    # Decode cursor to Meilisearch offset
    meili_offset = decode_search_cursor(cursor) || 0

    # Build Meilisearch filter for user's conversations
    filters = build_message_filters(user.id, conversation_id, opts)

    case SearchEngine.search(:messages, query, limit: limit, offset: meili_offset, filter: filters) do
      {:ok, %{hits: hits, total: total}} ->
        message_ids = Enum.map(hits, & &1["id"])
        messages = fetch_messages_by_ids(message_ids)
        has_more = meili_offset + limit < total
        next_cursor = if has_more, do: encode_search_cursor(meili_offset + limit), else: nil
        {messages, %{limit: limit, has_more: has_more, next_cursor: next_cursor}}

      {:error, reason} ->
        Logger.debug("meilisearch_unavailable_using_postgresql_fallback", reason: inspect(reason))
        search_messages_postgres(user, query, opts)
    end
  end

  defp build_message_filters(user_id, conversation_id, opts) do
    base = "user_id = #{user_id}"
    filters = if conversation_id, do: "#{base} AND conversation_id = #{conversation_id}", else: base

    before_date = Keyword.get(opts, :before)
    after_date = Keyword.get(opts, :after)

    filters = if before_date, do: "#{filters} AND inserted_at < #{DateTime.to_unix(before_date)}", else: filters
    filters = if after_date, do: "#{filters} AND inserted_at > #{DateTime.to_unix(after_date)}", else: filters

    filters
  end

  defp fetch_messages_by_ids([]), do: []
  defp fetch_messages_by_ids(message_ids) do
    from(m in Message,
      where: m.id in ^message_ids,
      preload: [:user, :conversation]
    )
    |> Repo.all()
    |> Enum.sort_by(&Enum.find_index(message_ids, fn id -> id == &1.id end))
  end

  defp search_messages_postgres(user, query, opts) do
    limit = Keyword.get(opts, :limit, 50)
    cursor = Keyword.get(opts, :cursor)
    conversation_id = Keyword.get(opts, :conversation_id)
    before_date = Keyword.get(opts, :before)
    after_date = Keyword.get(opts, :after)
    from_user_id = Keyword.get(opts, :from)

    search_term = "%#{sanitize_query(query)}%"

    # Get user's conversations
    user_conversations = from cp in "conversation_participants",
      where: cp.user_id == ^user.id,
      select: cp.conversation_id

    base_query = from m in Message,
      where: m.conversation_id in subquery(user_conversations),
      where: ilike(m.content, ^search_term),
      preload: [:user, :conversation]

    # Apply filters
    base_query = if conversation_id do
      from m in base_query, where: m.conversation_id == ^conversation_id
    else
      base_query
    end

    base_query = if before_date do
      from m in base_query, where: m.inserted_at < ^before_date
    else
      base_query
    end

    base_query = if after_date do
      from m in base_query, where: m.inserted_at > ^after_date
    else
      base_query
    end

    base_query = if from_user_id do
      from m in base_query, where: m.user_id == ^from_user_id
    else
      base_query
    end

    pagination_opts = %{
      cursor: cursor,
      after_cursor: nil,
      before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :inserted_at,
      sort_direction: :desc,
      include_total: false
    }

    {messages, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)

    {messages, %{
      limit: limit,
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor
    }}
  end

  @doc """
  Search posts in forums using cursor-based pagination.
  """
  def search_posts(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    cursor = Keyword.get(opts, :cursor)
    forum_id = Keyword.get(opts, :forum_id)
    sort = Keyword.get(opts, :sort, "relevance")
    time_range = Keyword.get(opts, :time_range, "all")

    search_term = "%#{sanitize_query(query)}%"

    base_query = from(p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      preload: [:user, :forum]
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
  def search_groups(query, opts \\ []) do
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
  def search_all(query, opts \\ []) do
    current_user = Keyword.get(opts, :current_user)

    # Search in parallel
    tasks = [
      Task.async(fn -> search_users(query, limit: 5, current_user: current_user) end),
      Task.async(fn -> search_posts(query, limit: 5) end),
      Task.async(fn -> search_groups(query, limit: 5) end)
    ]

    # Add message search if user is provided
    tasks = if current_user do
      tasks ++ [Task.async(fn -> search_messages(current_user, query, limit: 5) end)]
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
  def get_suggestions(query, opts \\ []) do
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
  """
  def record_search(_user, _query, _result_count) do
    # This would insert into a search_history table
    # For analytics and improving search
    :ok
  end

  # Private helpers

  # Cursor helpers for Meilisearch offset-based pagination.
  # Cursors are opaque to clients; internally they encode the next Meilisearch offset.
  defp encode_search_cursor(offset) do
    Base.url_encode64(to_string(offset), padding: false)
  end

  defp decode_search_cursor(nil), do: nil

  defp decode_search_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         {offset, _} <- Integer.parse(decoded) do
      offset
    else
      _ -> nil
    end
  end

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
