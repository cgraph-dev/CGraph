defmodule CGraph.Search.Users do
  @moduledoc """
  User search with Meilisearch primary and PostgreSQL fallback.

  Searches users by username, display name, bio, or user_id (identity number).
  Supports `#0001`-style ID search and fuzzy matching via Meilisearch.
  """

  import Ecto.Query, warn: false
  require Logger
  import CGraph.Query.SoftDelete

  alias CGraph.Accounts.User
  alias CGraph.Repo
  alias CGraph.Search.Engine, as: SearchEngine

  @doc """
  Search users by username, display name, bio, or user_id (identity number).
  Supports searching by #0001 format or plain number.

  Attempts Meilisearch first, falls back to PostgreSQL on failure.
  """
  @spec search_users(binary(), keyword()) :: {list(), map()}
  def search_users(query, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
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

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp fetch_users_by_ids([], _current_user), do: []
  defp fetch_users_by_ids(user_ids, current_user) do
    from(u in User,
      where: u.id in ^user_ids,
      where: not_deleted(u) and is_nil(u.banned_at)
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
      where: not_deleted(u) and is_nil(u.banned_at),
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
      where: not_deleted(u) and is_nil(u.banned_at),
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
    blocker_id = current_user.id
    from u in query,
      where: u.id not in subquery(
        from b in "blocks",
        where: b.blocker_id == type(^blocker_id, Ecto.UUID),
        select: b.blocked_id
      )
  end

  defp count_user_results(true, users, _query), do: length(users)
  defp count_user_results(false, _users, query) do
    search_term = "%#{sanitize_query(query)}%"
    from(u in User,
      where: not_deleted(u) and is_nil(u.banned_at),
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

  # Cursor helpers for Meilisearch offset-based pagination
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
end
