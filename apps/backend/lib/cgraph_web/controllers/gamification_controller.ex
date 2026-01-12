defmodule CgraphWeb.GamificationController do
  @moduledoc """
  Controller for gamification-related endpoints.
  Handles XP, levels, achievements, streaks, and user stats.

  ## Security

  - All endpoints require authentication
  - Pagination parameters are validated and safely parsed
  """
  use CgraphWeb, :controller

  import Ecto.Query, warn: false
  import CgraphWeb.Helpers.ParamParser

  alias Cgraph.Gamification
  alias Cgraph.Repo

  action_fallback CgraphWeb.FallbackController

  @max_leaderboard_limit 100

  @doc """
  GET /api/v1/gamification/stats
  Get current user's gamification stats.
  """
  def stats(conn, _params) do
    user = conn.assigns.current_user
    stats = Gamification.get_user_stats(user.id)

    conn
    |> put_status(:ok)
    |> render(:stats, stats: stats)
  end

  @doc """
  GET /api/v1/gamification/achievements
  List all achievements with user progress.
  """
  def achievements(conn, params) do
    user = conn.assigns.current_user
    category = params["category"]

    achievements = Gamification.list_achievements(category: category)
    user_achievements = Gamification.list_user_achievements(user.id)

    # Merge user progress with achievement definitions
    user_progress_map =
      user_achievements
      |> Enum.map(fn ua -> {ua.achievement_id, ua} end)
      |> Map.new()

    achievements_with_progress = Enum.map(achievements, fn achievement ->
      progress = Map.get(user_progress_map, achievement.id)
      %{
        achievement: achievement,
        progress: progress && progress.progress || 0,
        unlocked: progress && progress.unlocked || false,
        unlocked_at: progress && progress.unlocked_at
      }
    end)

    conn
    |> put_status(:ok)
    |> render(:achievements, achievements: achievements_with_progress)
  end

  @doc """
  GET /api/v1/gamification/achievements/:id
  Get a specific achievement with user progress.
  """
  def show_achievement(conn, %{"id" => achievement_id}) do
    user = conn.assigns.current_user

    achievement = Cgraph.Repo.get!(Gamification.Achievement, achievement_id)
    {:ok, user_achievement} = Gamification.get_or_create_user_achievement(user.id, achievement_id)

    conn
    |> put_status(:ok)
    |> render(:achievement, achievement: achievement, user_achievement: user_achievement)
  end

  @doc """
  POST /api/v1/gamification/streak/claim
  Claim daily login streak bonus.
  """
  def claim_streak(conn, _params) do
    user = conn.assigns.current_user

    case Gamification.claim_daily_streak(user) do
      {:ok, {updated_user, coins, streak}} ->
        conn
        |> put_status(:ok)
        |> render(:streak_claimed, user: updated_user, coins: coins, streak: streak)

      {:error, :already_claimed} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "already_claimed", message: "You have already claimed your daily bonus today"})
    end
  end

  @doc """
  GET /api/v1/gamification/leaderboard/:category
  Get leaderboard for a specific category.

  ## Parameters

  - `limit` - Max entries to return (1-100, default: 100)
  - `offset` - Offset for pagination (default: 0)
  """
  def leaderboard(conn, %{"category" => category} = params) do
    limit = parse_int(params["limit"], 100, min: 1, max: @max_leaderboard_limit)
    offset = parse_int(params["offset"], 0, min: 0)
    user = conn.assigns.current_user

    entries = Gamification.get_leaderboard(category, limit: limit, offset: offset)
    user_rank = Gamification.get_user_rank(user.id, category)

    conn
    |> put_status(:ok)
    |> render(:leaderboard, entries: entries, category: category, user_rank: user_rank)
  end

  @doc """
  GET /api/v1/gamification/xp/history
  Get XP transaction history.

  ## Parameters

  - `limit` - Max entries to return (1-100, default: 50)
  - `offset` - Offset for pagination (default: 0)
  """
  def xp_history(conn, params) do
    user = conn.assigns.current_user
    query_limit = parse_int(params["limit"], 50, min: 1, max: 100)
    query_offset = parse_int(params["offset"], 0, min: 0)

    transactions =
      from(t in Cgraph.Gamification.XpTransaction,
        where: t.user_id == ^user.id,
        order_by: [desc: t.inserted_at],
        limit: ^query_limit,
        offset: ^query_offset
      )
      |> Repo.all()

    conn
    |> put_status(:ok)
    |> render(:xp_history, transactions: transactions)
  end

  @doc """
  GET /api/v1/gamification/level-info
  Get level progression information.
  """
  def level_info(conn, _params) do
    user = conn.assigns.current_user

    current_level = user.level
    current_xp = user.xp
    xp_for_current = if current_level == 1, do: 0, else: Gamification.xp_for_level(current_level)
    xp_for_next = Gamification.xp_for_level(current_level + 1)

    conn
    |> put_status(:ok)
    |> json(%{
      level: current_level,
      xp: current_xp,
      xp_for_current_level: xp_for_current,
      xp_for_next_level: xp_for_next,
      xp_in_level: current_xp - xp_for_current,
      xp_needed: xp_for_next - current_xp,
      progress_percent: Gamification.level_progress(current_xp)
    })
  end
end
