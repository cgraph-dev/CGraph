defmodule CGraphWeb.API.V1.SearchController do
  @moduledoc """
  Handles search across the platform.
  Supports searching users, messages, posts, and groups.

  All search operations route through the `CGraph.Search` context which
  uses Meilisearch for sub-50ms fuzzy search with automatic PostgreSQL
  ILIKE fallback when Meilisearch is unavailable.
  """
  use CGraphWeb, :controller
  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Search
  alias CGraph.Forums.Search, as: ForumSearch

  action_fallback CGraphWeb.FallbackController

  @max_limit 50
  @max_per_page 50
  @max_suggestions 20

  @doc """
  Global search across all content types.
  GET /api/v1/search
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user
    query = Map.get(params, "q", "")
    types = Map.get(params, "types", "all") |> parse_types()
    limit = parse_int(params["limit"], 20, min: 1, max: @max_limit)

    if String.length(query) < 2 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Query must be at least 2 characters"})
    else
      results = perform_search(user, query, types, limit)
      render(conn, :index, results: results, query: query)
    end
  end

  @doc """
  Search for users.
  GET /api/v1/search/users
  """
  @spec users(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def users(conn, params) do
    user = conn.assigns.current_user
    query = Map.get(params, "q", "")
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: @max_per_page)

    if String.length(query) < 2 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Query must be at least 2 characters"})
    else
      {users, meta} = Search.search_users(query,
        current_user: user,
        limit: per_page,
        page: page,
        per_page: per_page
      )
      render(conn, :users, users: users, meta: meta)
    end
  end

  @doc """
  Search messages in user's conversations.
  GET /api/v1/search/messages
  """
  @spec messages(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def messages(conn, params) do
    user = conn.assigns.current_user
    query = Map.get(params, "q", "")
    conversation_id = Map.get(params, "conversation_id")
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: @max_per_page)
    before = Map.get(params, "before") # Date filter
    after_date = Map.get(params, "after")
    from_user_id = Map.get(params, "from")
    has_attachment = Map.get(params, "has_attachment")

    if String.length(query) < 2 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Query must be at least 2 characters"})
    else
      {messages, meta} = Search.search_messages(user, query,
        conversation_id: conversation_id,
        limit: per_page,
        page: page,
        per_page: per_page,
        before: before,
        after: after_date,
        from_user_id: from_user_id,
        has_attachment: has_attachment
      )
      render(conn, :messages, messages: messages, meta: meta)
    end
  end

  @doc """
  Search posts in forums.
  GET /api/v1/search/posts
  """
  @spec posts(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def posts(conn, params) do
    user = conn.assigns.current_user
    query = Map.get(params, "q", "")
    forum_id = Map.get(params, "forum_id")
    category_id = Map.get(params, "category_id")
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: @max_per_page)
    sort = Map.get(params, "sort", "relevance") # relevance, new, top

    if String.length(query) < 2 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Query must be at least 2 characters"})
    else
      cursor = Map.get(params, "cursor")
      {posts, meta} = Search.search_posts(query,
        user: user,
        cursor: cursor,
        forum_id: forum_id,
        category_id: category_id,
        limit: per_page,
        page: page,
        per_page: per_page,
        sort: sort
      )
      render(conn, :posts, posts: posts, meta: meta)
    end
  end

  @doc """
  Search groups/servers.
  GET /api/v1/search/groups
  """
  @spec groups(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def groups(conn, params) do
    user = conn.assigns.current_user
    query = Map.get(params, "q", "")
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: @max_per_page)

    if String.length(query) < 2 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Query must be at least 2 characters"})
    else
      {groups, meta} = Search.search_groups(query,
        user: user,
        limit: per_page,
        page: page,
        per_page: per_page
      )
      render(conn, :groups, groups: groups, meta: meta)
    end
  end

  @doc """
  Get search suggestions/autocomplete.
  GET /api/v1/search/suggestions
  """
  @spec suggestions(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def suggestions(conn, params) do
    user = conn.assigns.current_user
    query = Map.get(params, "q", "")
    types = Map.get(params, "types", "users,groups") |> parse_types()
    limit = parse_int(params["limit"], 10, min: 1, max: @max_suggestions)

    if String.length(query) < 1 do
      render(conn, :suggestions, suggestions: [])
    else
      suggestions = get_suggestions(user, query, types, limit)
      render(conn, :suggestions, suggestions: suggestions)
    end
  end

  @doc """
  Get recent searches.
  GET /api/v1/search/recent
  """
  @spec recent(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def recent(conn, _params) do
    user = conn.assigns.current_user

    recent_searches = Search.get_recent_searches(user, limit: 10)
    render(conn, :recent, searches: recent_searches)
  end

  @doc """
  Clear search history.
  DELETE /api/v1/search/recent
  """
  @spec clear_history(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def clear_history(conn, _params) do
    user = conn.assigns.current_user

    Search.clear_search_history(user)
    send_resp(conn, :no_content, "")
  end

  @doc """
  Search forum content (threads, posts, comments).
  GET /api/v1/search/forums
  """
  @spec forum_search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def forum_search(conn, params) do
    query = Map.get(params, "q", "")
    type = Map.get(params, "type", "all")

    if String.length(query) < 2 do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Query must be at least 2 characters"})
    else
      opts = [
        forum_id: params["forum_id"],
        board_id: params["board_id"],
        author_id: params["author_id"],
        date_from: parse_datetime(params["date_from"]),
        date_to: parse_datetime(params["date_to"]),
        sort: Map.get(params, "sort", "relevance"),
        cursor: params["cursor"],
        per_page: parse_int(params["limit"], 20, min: 1, max: @max_per_page)
      ] |> Enum.reject(fn {_k, v} -> is_nil(v) end)

      {results, meta} = case type do
        "thread" -> ForumSearch.search_threads(query, opts)
        "post" -> ForumSearch.search_posts(query, opts)
        "comment" -> ForumSearch.search_comments(query, opts)
        "thread_post" -> ForumSearch.search_thread_posts(query, opts)
        _ -> ForumSearch.search_all(query, opts)
      end

      render(conn, :forum_search, results: results, meta: meta, type: type)
    end
  end

  # Private helpers

  defp parse_types("all"), do: [:users, :messages, :posts, :groups]
  defp parse_types(types) when is_binary(types) do
    types
    |> String.split(",")
    |> Enum.map(&String.trim/1)
    |> Enum.map(&String.to_existing_atom/1)
    |> Enum.filter(&(&1 in [:users, :messages, :posts, :groups]))
  end
  defp parse_types(_), do: [:users, :messages, :posts, :groups]

  defp perform_search(user, query, types, limit) do
    limit_per_type = div(limit, length(types)) |> max(5)

    Enum.reduce(types, %{}, fn type, acc ->
      results = case type do
        :users ->
          {users, _} = Search.search_users(query, current_user: user, limit: limit_per_type)
          users

        :messages ->
          {messages, _} = Search.search_messages(user, query, limit: limit_per_type)
          messages

        :posts ->
          {posts, _} = Search.search_posts(query, user: user, limit: limit_per_type)
          posts

        :groups ->
          {groups, _} = Search.search_groups(query, user: user, limit: limit_per_type)
          groups
      end

      Map.put(acc, type, results)
    end)
  end

  defp get_suggestions(user, query, types, limit) do
    Enum.flat_map(types, fn type ->
      case type do
        :users ->
          Search.get_user_suggestions(query, current_user: user, limit: div(limit, 2))
          |> Enum.map(&%{type: :user, id: &1.id, name: &1.username, avatar: &1.avatar_url})

        :groups ->
          Search.get_group_suggestions(query, user: user, limit: div(limit, 2))
          |> Enum.map(&%{type: :group, id: &1.id, name: &1.name, icon: &1.icon})

        _ -> []
      end
    end)
    |> Enum.take(limit)
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(str) when is_binary(str) do
    case DateTime.from_iso8601(str) do
      {:ok, dt, _} -> dt
      _ -> nil
    end
  end
  defp parse_datetime(_), do: nil
end
