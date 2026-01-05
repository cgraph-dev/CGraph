defmodule Cgraph.Search do
  @moduledoc """
  The Search context.

  Provides unified search functionality across users, messages, posts, and groups.
  Supports full-text search, filtering, and relevance ranking.
  """

  import Ecto.Query, warn: false

  alias Cgraph.Accounts.User
  alias Cgraph.Forums.Post
  alias Cgraph.Groups.Group
  alias Cgraph.Messaging.Message
  alias Cgraph.Repo

  @doc """
  Search users by username, display name, bio, or user_id (identity number).
  Supports searching by #0001 format or plain number.
  """
  def search_users(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)
    current_user = Keyword.get(opts, :current_user)

    {base_query, is_id_search} = build_user_search_query(query, limit, offset)

    base_query = maybe_exclude_blocked(base_query, current_user)
    users = Repo.all(base_query)
    total = count_user_results(is_id_search, users, query)

    {users, %{total: total, limit: limit, offset: offset}}
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

  defp build_text_search_query(query, limit, offset) do
    search_term = "%#{sanitize_query(query)}%"
    prefix_term = "#{sanitize_query(query)}%"

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
      limit: ^limit,
      offset: ^offset
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
  """
  def search_messages(user, query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)
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
      order_by: [desc: m.inserted_at],
      limit: ^limit,
      offset: ^offset,
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

    messages = Repo.all(base_query)

    {messages, %{limit: limit, offset: offset}}
  end

  @doc """
  Search posts in forums.
  """
  def search_posts(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)
    forum_id = Keyword.get(opts, :forum_id)
    sort = Keyword.get(opts, :sort, "relevance")
    time_range = Keyword.get(opts, :time_range, "all")

    search_term = "%#{sanitize_query(query)}%"

    base_query = from(p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      limit: ^limit,
      offset: ^offset,
      preload: [:user, :forum]
    )
    |> maybe_filter_by_forum(forum_id)
    |> apply_time_range(time_range)
    |> apply_post_sort(sort, search_term)

    posts = Repo.all(base_query)
    total = count_post_results(search_term, forum_id)

    {posts, %{total: total, limit: limit, offset: offset}}
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

  defp count_post_results(search_term, forum_id) do
    from(p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      select: count(p.id)
    )
    |> maybe_filter_by_forum(forum_id)
    |> Repo.one()
  end

  @doc """
  Search groups/servers.
  """
  def search_groups(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)

    search_term = "%#{sanitize_query(query)}%"

    base_query = from g in Group,
      where: g.is_public == true,
      where: ilike(g.name, ^search_term) or ilike(g.description, ^search_term),
      order_by: [
        desc: fragment("CASE WHEN ? ILIKE ? THEN 2 ELSE 1 END",
                      g.name, ^"#{sanitize_query(query)}%"),
        desc: g.member_count
      ],
      limit: ^limit,
      offset: ^offset

    groups = Repo.all(base_query)

    count_query = from g in Group,
      where: g.is_public == true,
      where: ilike(g.name, ^search_term) or ilike(g.description, ^search_term),
      select: count(g.id)

    total = Repo.one(count_query)

    {groups, %{total: total, limit: limit, offset: offset}}
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
      from(f in Cgraph.Forums.Forum,
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
  Record a search query for analytics.
  """
  def record_search(_user, _query, _result_count) do
    # This would insert into a search_history table
    # For analytics and improving search
    :ok
  end

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
