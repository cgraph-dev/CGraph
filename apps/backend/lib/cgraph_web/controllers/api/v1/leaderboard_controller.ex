defmodule CGraphWeb.API.V1.LeaderboardController do
  @moduledoc """
  Controller for global leaderboard endpoints.

  Provides a unified leaderboard API that supports multiple categories
  and time periods with proper pagination.

  ## Categories

  - `xp` - Total experience points (default)
  - `level` - User level progression
  - `karma` - Forum reputation score
  - `streak` - Consecutive login days
  - `messages` - Total messages sent
  - `posts` - Forum posts created
  - `friends` - Friend connections count

  ## Time Periods

  - `alltime` - All-time rankings (default)
  - `daily` - Rankings based on today's activity
  - `weekly` - Rankings based on this week's activity
  - `monthly` - Rankings based on this month's activity

  Note: Time period filtering currently shows cumulative totals.
  Activity-based period filtering requires XP transaction aggregation
  and will be added in a future release.

  ## Security

  - All endpoints require authentication
  - Rate limiting applied via standard API pipeline
  - Pagination parameters are validated and clamped
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Gamification
  alias CGraph.Presence

  action_fallback CGraphWeb.FallbackController

  @max_page_size 100
  @default_page_size 25
  @valid_categories ~w(xp level karma streak messages posts friends)
  @valid_periods ~w(daily weekly monthly alltime)

  @doc """
  GET /api/v1/leaderboard

  Fetch global leaderboard with optional category and time period filters.

  ## Query Parameters

  - `category` - Ranking category (default: "xp")
  - `period` - Time period filter (default: "alltime")
  - `limit` - Results per page, max 100 (default: 25)
  - `cursor` - Opaque cursor for pagination

  ## Response

  Returns cursor-paginated leaderboard entries with user rank information.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user

    # Parse and validate parameters
    category = parse_category(params["category"])
    period = parse_period(params["period"])
    limit = parse_int(params["limit"], @default_page_size, min: 1, max: @max_page_size)
    cursor = params["cursor"]

    # Fetch leaderboard data with enriched user info
    {entries, meta} = fetch_leaderboard_entries(category, period, limit, cursor)

    # Get current user's rank in this category
    user_rank = get_user_rank_entry(user, category, period)

    conn
    |> put_status(:ok)
    |> render(:index,
      entries: entries,
      category: category,
      period: period,
      user_rank: user_rank,
      meta: %{
        limit: limit,
        has_more: meta.has_more,
        next_cursor: meta.next_cursor,
        last_updated: DateTime.utc_now()
      }
    )
  end

  # Fetch leaderboard entries with enriched user data
  defp fetch_leaderboard_entries(category, _period, limit, cursor) do
    # Get base leaderboard from gamification context
    {entries, meta} = Gamification.get_leaderboard(category, limit: limit, cursor: cursor)

    # Enrich with presence and additional user data
    enriched = Enum.map(entries, fn entry ->
      is_online = Presence.user_online?(entry.id)

      Map.merge(entry, %{
        is_online: is_online,
        previous_rank: get_previous_rank(entry.id, category)
      })
    end)

    {enriched, meta}
  end

  defp get_previous_rank(user_id, category) do
    key = "prev_rank:#{category}:#{user_id}"
    case CGraph.Redis.command(["GET", key]) do
      {:ok, nil} -> nil
      {:ok, rank} -> String.to_integer(rank)
      {:error, _} -> nil
    end
  end

  # Get the current user's rank entry
  defp get_user_rank_entry(user, category, _period) do
    rank = Gamification.get_user_rank(user.id, category)
    value = get_user_value(user, category)

    %{
      rank: rank,
      previous_rank: nil,
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      level: user.level,
      value: value,
      is_online: true,
      is_premium: user.subscription_tier in ["premium", "enterprise"],
      is_verified: user.is_verified
    }
  end

  # Extract the relevant value for a category from user
  defp get_user_value(user, category) do
    case category do
      "xp" -> user.xp
      "level" -> user.level
      "karma" -> user.karma
      "streak" -> user.streak_days
      "messages" -> user.total_messages_sent
      "posts" -> user.total_posts_created
      "friends" -> get_friend_count(user.id)
    end
  end

  # Get friend count for a user
  defp get_friend_count(user_id) do
    import Ecto.Query
    alias CGraph.Accounts.Friendship
    alias CGraph.Repo

    Repo.aggregate(
      from(f in Friendship,
        where: (f.user_id == ^user_id or f.friend_id == ^user_id) and f.status == "accepted"
      ),
      :count
    )
  end

  # Parse and validate category parameter
  defp parse_category(nil), do: "xp"
  defp parse_category(category) when category in @valid_categories, do: category
  defp parse_category(_), do: "xp"

  # Parse and validate period parameter
  defp parse_period(nil), do: "alltime"
  defp parse_period(period) when period in @valid_periods, do: period
  defp parse_period(_), do: "alltime"
end
