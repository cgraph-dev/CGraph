defmodule CGraph.Gamification.LeaderboardSystem do
  @moduledoc """
  Global leaderboard queries with cursor-based pagination.

  Handles XP, level, karma, streak, messages, posts, and friends leaderboards.
  Uses Redis sorted sets when available, falls back to DB queries.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Gamification.Leaderboard
  alias CGraph.ReadRepo
  alias CGraph.Repo

  @doc """
  Get global leaderboard by category.

  Categories: "xp", "level", "karma", "streak", "messages", "posts", "friends"
  Options: :limit (default 100), :cursor (opaque pagination cursor)
  """
  @spec get_leaderboard(String.t(), keyword()) :: {list(), map()}
  def get_leaderboard(category, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)
    cursor = Keyword.get(opts, :cursor)
    cursor_data = decode_cursor(cursor)
    rank_start = if cursor_data, do: cursor_data.rank, else: 1

    case category do
      "friends" ->
        results = get_friends_leaderboard(limit + 1, cursor_data)
        finalize(results, limit, rank_start)
      _ ->
        redis_offset = rank_start - 1
        case Leaderboard.get_top(category, limit + 1, redis_offset) do
          {:ok, entries} when entries != [] ->
            finalize(entries, limit, rank_start)
          _ ->
            results = get_standard_leaderboard(category, limit + 1, cursor_data)
            finalize(results, limit, rank_start)
        end
    end
  end

  @doc "Get total count for leaderboard pagination."
  @spec get_leaderboard_count(String.t()) :: non_neg_integer()
  def get_leaderboard_count(_category) do
    from(u in User, where: u.is_active == true) |> ReadRepo.aggregate(:count)
  end

  @doc "Get a user's rank in a category."
  @spec get_user_rank(binary(), String.t()) :: non_neg_integer()
  def get_user_rank(user_id, category) do
    case category do
      "friends" -> get_user_friends_rank(user_id)
      _ -> get_user_standard_rank(user_id, category)
    end
  end

  @doc "Get XP leaderboard (simple version)."
  @spec get_xp_leaderboard(pos_integer()) :: list()
  def get_xp_leaderboard(limit \\ 10) do
    from(u in User,
      where: u.is_active == true,
      order_by: [desc: u.xp],
      limit: ^limit,
      select: %{
        user_id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        xp: u.xp,
        level: u.level
      }
    )
    |> ReadRepo.all()
  end

  @doc """
  Get forum-specific leaderboard using unified scoring (forum karma + XP).

  Delegates to `RankingEngine.get_unified_leaderboard/2`.
  Returns ranked entries with rank badge info attached.
  """
  @spec get_forum_leaderboard(String.t(), keyword()) :: [map()]
  def get_forum_leaderboard(forum_id, opts \\ []) do
    alias CGraph.Forums.{RankingEngine, ForumRank}

    entries = RankingEngine.get_unified_leaderboard(forum_id, opts)

    # Attach rank badge info to each entry
    Enum.map(entries, fn entry ->
      rank = ForumRank.get_rank_for_score(forum_id, trunc(entry.score))

      rank_info =
        if rank do
          %{
            id: rank.id,
            name: rank.name,
            color: rank.color,
            image_url: rank.image_url,
            min_score: rank.min_score,
            max_score: rank.max_score
          }
        end

      Map.put(entry, :rank, rank_info)
    end)
  end

  @doc """
  Get a scoped leaderboard (e.g. per-board) with cursor-based pagination.

  Uses Redis sorted sets scoped by `scope:scope_id:category`.

  ## Options
  - `:limit` — max entries (default 100)
  - `:cursor` — opaque cursor for pagination
  """
  @spec get_scoped_leaderboard(String.t(), String.t(), String.t(), keyword()) :: {list(), map()}
  def get_scoped_leaderboard(scope, scope_id, category, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)
    cursor = Keyword.get(opts, :cursor)
    cursor_data = decode_cursor(cursor)
    rank_start = if cursor_data, do: cursor_data.rank, else: 1

    redis_offset = rank_start - 1

    case Leaderboard.get_scoped_top(
           String.to_existing_atom(scope),
           scope_id,
           category,
           limit + 1,
           redis_offset
         ) do
      {:ok, entries} when entries != [] ->
        finalize(entries, limit, rank_start)

      _ ->
        # No Redis data available — return empty
        {[], %{has_more: false, next_cursor: nil, limit: limit}}
    end
  end

  # ============================================================================
  # Private
  # ============================================================================

  defp finalize(results, limit, rank_start) do
    has_more = length(results) > limit
    items = Enum.take(results, limit)
    items_with_rank = items |> Enum.with_index(rank_start) |> Enum.map(fn {e, r} -> Map.put(e, :rank, r) end)

    next_cursor = if has_more && items != [] do
      last = List.last(items)
      encode_cursor(rank_start + length(items), Map.get(last, :value, 0), Map.get(last, :inserted_at, DateTime.utc_now()))
    end

    {items_with_rank, %{has_more: has_more, next_cursor: next_cursor, limit: limit}}
  end

  defp encode_cursor(rank, value, %DateTime{} = dt),
    do: "#{rank}|#{value}|#{DateTime.to_iso8601(dt)}" |> Base.url_encode64(padding: false)
  defp encode_cursor(rank, value, %NaiveDateTime{} = ndt),
    do: "#{rank}|#{value}|#{NaiveDateTime.to_iso8601(ndt)}" |> Base.url_encode64(padding: false)
  defp encode_cursor(rank, value, ts),
    do: "#{rank}|#{value}|#{ts}" |> Base.url_encode64(padding: false)

  defp decode_cursor(nil), do: nil
  defp decode_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         [rank_str, value_str, ts] <- String.split(decoded, "|", parts: 3),
         {rank, _} <- Integer.parse(rank_str),
         {value, _} <- Integer.parse(value_str) do
      %{rank: rank, value: value, inserted_at: ts}
    else
      _ -> nil
    end
  end

  defp parse_cursor_datetime(ts_string) do
    case DateTime.from_iso8601(ts_string) do
      {:ok, dt, _} -> dt
      _ ->
        case NaiveDateTime.from_iso8601(ts_string) do
          {:ok, ndt} -> ndt
          _ -> ~N[2000-01-01 00:00:00]
        end
    end
  end

  defp value_field_for_category("xp"), do: :xp
  defp value_field_for_category("level"), do: :level
  defp value_field_for_category("karma"), do: :karma
  defp value_field_for_category("streak"), do: :streak_days
  defp value_field_for_category("messages"), do: :total_messages_sent
  defp value_field_for_category("posts"), do: :total_posts_created
  defp value_field_for_category(_), do: :xp

  defp get_standard_leaderboard(category, limit, cursor_data) do
    vf = value_field_for_category(category)

    query = from u in User,
      where: u.is_active == true,
      order_by: [{:desc, field(u, ^vf)}, {:asc, u.inserted_at}],
      limit: ^limit,
      select: %{
        id: u.id, username: u.username, display_name: u.display_name,
        avatar_url: u.avatar_url, level: u.level, value: field(u, ^vf),
        inserted_at: u.inserted_at,
        is_premium: u.subscription_tier in ["premium", "enterprise"],
        is_verified: u.is_verified
      }

    query = if cursor_data do
      cursor_dt = parse_cursor_datetime(cursor_data.inserted_at)
      from u in query,
        where: field(u, ^vf) < ^cursor_data.value or
               (field(u, ^vf) == ^cursor_data.value and u.inserted_at > ^cursor_dt)
    else
      query
    end

    ReadRepo.all(query)
  end

  defp get_friends_leaderboard(limit, cursor_data) do
    alias CGraph.Accounts.Friendship

    friend_counts = from f in Friendship,
      where: f.status == "accepted",
      group_by: f.user_id,
      select: %{user_id: f.user_id, count: count(f.id)}

    query = from u in User,
      left_join: fc in subquery(friend_counts), on: fc.user_id == u.id,
      where: u.is_active == true,
      order_by: [desc: coalesce(fc.count, 0), asc: u.inserted_at],
      limit: ^limit,
      select: %{
        id: u.id, username: u.username, display_name: u.display_name,
        avatar_url: u.avatar_url, level: u.level, value: coalesce(fc.count, 0),
        inserted_at: u.inserted_at,
        is_premium: u.subscription_tier in ["premium", "enterprise"],
        is_verified: u.is_verified
      }

    query = if cursor_data do
      cursor_dt = parse_cursor_datetime(cursor_data.inserted_at)
      from [u, fc] in query,
        where: coalesce(fc.count, 0) < ^cursor_data.value or
               (coalesce(fc.count, 0) == ^cursor_data.value and u.inserted_at > ^cursor_dt)
    else
      query
    end

    ReadRepo.all(query)
  end

  defp get_user_standard_rank(user_id, category) do
    # get! safe: user_id from authenticated session via controller
    user = Repo.get!(User, user_id)
    {field, value} = case category do
      "xp" -> {:xp, user.xp}
      "level" -> {:level, user.level}
      "streak" -> {:streak_days, user.streak_days}
      "karma" -> {:karma, user.karma}
      "messages" -> {:total_messages_sent, user.total_messages_sent}
      "posts" -> {:total_posts_created, user.total_posts_created}
      _ -> {:xp, user.xp}
    end
    count = from(u in User, where: u.is_active == true and field(u, ^field) > ^value) |> Repo.aggregate(:count)
    count + 1
  end

  defp get_user_friends_rank(user_id) do
    alias CGraph.Accounts.Friendship

    user_friend_count = from(f in Friendship,
      where: (f.user_id == ^user_id or f.friend_id == ^user_id) and f.status == "accepted"
    ) |> Repo.aggregate(:count)

    friend_counts = from f in Friendship,
      where: f.status == "accepted", group_by: f.user_id,
      select: %{user_id: f.user_id, count: count(f.id)}

    count_with_more = from(u in User,
      left_join: fc in subquery(friend_counts), on: fc.user_id == u.id,
      where: u.is_active == true and coalesce(fc.count, 0) > ^user_friend_count
    ) |> Repo.aggregate(:count)

    count_with_more + 1
  end
end
