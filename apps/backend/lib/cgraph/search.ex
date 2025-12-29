defmodule Cgraph.Search do
  @moduledoc """
  The Search context.
  
  Provides unified search functionality across users, messages, posts, and groups.
  Supports full-text search, filtering, and relevance ranking.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  alias Cgraph.Messaging.Message
  alias Cgraph.Forums.Post
  alias Cgraph.Groups.Group

  @doc """
  Search users by username, display name, or bio.
  """
  def search_users(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)
    current_user = Keyword.get(opts, :current_user)
    
    search_term = "%#{sanitize_query(query)}%"
    
    base_query = from u in User,
      where: u.is_active == true,
      where: ilike(u.username, ^search_term) or 
             ilike(u.display_name, ^search_term) or
             ilike(u.bio, ^search_term),
      order_by: [
        desc: fragment("CASE WHEN ? ILIKE ? THEN 2 WHEN ? ILIKE ? THEN 1 ELSE 0 END",
                       u.username, ^"#{sanitize_query(query)}%",
                       u.display_name, ^"#{sanitize_query(query)}%")
      ],
      limit: ^limit,
      offset: ^offset

    # Exclude blocked users if current_user provided
    base_query = if current_user do
      from u in base_query,
        where: u.id not in subquery(
          from b in "blocks",
          where: b.blocker_id == ^current_user.id,
          select: b.blocked_id
        )
    else
      base_query
    end

    users = Repo.all(base_query)
    
    # Get total count
    count_query = from u in User,
      where: u.is_active == true,
      where: ilike(u.username, ^search_term) or 
             ilike(u.display_name, ^search_term) or
             ilike(u.bio, ^search_term),
      select: count(u.id)

    total = Repo.one(count_query)

    {users, %{total: total, limit: limit, offset: offset}}
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
    
    base_query = from p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      limit: ^limit,
      offset: ^offset,
      preload: [:user, :forum]

    # Apply forum filter
    base_query = if forum_id do
      from p in base_query, where: p.forum_id == ^forum_id
    else
      base_query
    end

    # Apply time range
    base_query = apply_time_range(base_query, time_range)

    # Apply sorting
    base_query = case sort do
      "relevance" ->
        from p in base_query,
          order_by: [
            desc: fragment("CASE WHEN ? ILIKE ? THEN 2 ELSE 0 END + CASE WHEN ? ILIKE ? THEN 1 ELSE 0 END",
                          p.title, ^search_term, p.content, ^search_term),
            desc: p.score
          ]
      "new" ->
        from p in base_query, order_by: [desc: p.inserted_at]
      "top" ->
        from p in base_query, order_by: [desc: p.score]
      "comments" ->
        from p in base_query, order_by: [desc: p.comment_count]
      _ ->
        from p in base_query, order_by: [desc: p.inserted_at]
    end

    posts = Repo.all(base_query)
    
    # Get total count
    count_query = from p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      select: count(p.id)

    count_query = if forum_id do
      from p in count_query, where: p.forum_id == ^forum_id
    else
      count_query
    end

    total = Repo.one(count_query)

    {posts, %{total: total, limit: limit, offset: offset}}
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
