defmodule CGraphWeb.GamificationController do
  @moduledoc """
  Controller for gamification-related endpoints.
  Handles XP, levels, achievements, streaks, and user stats.

  ## Security

  - All endpoints require authentication
  - Pagination parameters are validated and safely parsed
  """
  use CGraphWeb, :controller

  import Ecto.Query, warn: false
  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Gamification

  action_fallback CGraphWeb.FallbackController

  @max_leaderboard_limit 100

  @doc """
  GET /api/v1/gamification/feature-gates
  Get the user's feature gate status (unlocked/locked per feature).
  """
  @spec feature_gates(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def feature_gates(conn, _params) do
    user = conn.assigns.current_user
    gates = CGraph.Gamification.FeatureGates.get_user_gates(user.level)

    conn
    |> put_status(:ok)
    |> json(%{data: gates})
  end

  @doc """
  GET /api/v1/gamification/stats
  Get current user's gamification stats.
  """
  @spec stats(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec achievements(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec show_achievement(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show_achievement(conn, %{"id" => achievement_id}) do
    user = conn.assigns.current_user

    case CGraph.Repo.get(Gamification.Achievement, achievement_id) do
      nil ->
        {:error, :not_found}

      achievement ->
        {:ok, user_achievement} = Gamification.get_or_create_user_achievement(user.id, achievement_id)

        conn
        |> put_status(:ok)
        |> render(:achievement, achievement: achievement, user_achievement: user_achievement)
    end
  end

  @doc """
  POST /api/v1/gamification/achievements/:id/unlock
  Manually trigger achievement unlock check.
  This is typically called when client detects a potential unlock condition.
  The server validates and awards the achievement if criteria are met.
  """
  @spec unlock_achievement(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def unlock_achievement(conn, %{"id" => achievement_id}) do
    user = conn.assigns.current_user

    case Gamification.try_unlock_achievement(user.id, achievement_id) do
      {:ok, user_achievement} ->
        case CGraph.Repo.get(Gamification.Achievement, achievement_id) do
          nil ->
            conn |> put_status(:not_found) |> json(%{error: "Achievement not found"})

          achievement ->
            conn
            |> put_status(:ok)
            |> json(%{
              success: true,
              unlocked: user_achievement.unlocked,
              achievement: %{
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                xp_reward: achievement.xp_reward,
                coin_reward: achievement.coin_reward
              },
              unlocked_at: user_achievement.unlocked_at
            })
        end

      {:error, :already_unlocked} ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, unlocked: true, message: "Achievement already unlocked"})

      {:error, :not_met} ->
        conn
        |> put_status(:ok)
        |> json(%{success: false, unlocked: false, message: "Achievement requirements not met"})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_found", message: "Achievement not found"})
    end
  end

  @doc """
  GET /api/v1/gamification/streak
  Get current user's streak information.
  """
  @spec streak_info(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def streak_info(conn, _params) do
    user = conn.assigns.current_user
    today = Date.utc_today()

    already_claimed = user.daily_bonus_claimed_at == today
    can_claim = !already_claimed

    conn
    |> put_status(:ok)
    |> json(%{
      streak_days: user.streak_days || 0,
      streak_last_claimed: user.streak_last_claimed,
      streak_longest: user.streak_longest || 0,
      daily_bonus_claimed_today: already_claimed,
      can_claim: can_claim,
      next_bonus: calculate_next_bonus(user.streak_days || 0, can_claim)
    })
  end

  defp calculate_next_bonus(current_streak, can_claim) do
    next_streak = if can_claim, do: current_streak + 1, else: current_streak
    min(10 + (next_streak * 5), 100)
  end

  @doc """
  POST /api/v1/gamification/streak/claim
  Claim daily login streak bonus.
  """
  @spec claim_streak(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  - `cursor` - Cursor for pagination
  """
  @spec leaderboard(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def leaderboard(conn, %{"category" => category} = params) do
    limit = parse_int(params["limit"], 100, min: 1, max: @max_leaderboard_limit)
    cursor = params["cursor"]
    user = conn.assigns.current_user

    {entries, meta} = Gamification.get_leaderboard(category, limit: limit, cursor: cursor)
    user_rank = Gamification.get_user_rank(user.id, category)

    conn
    |> put_status(:ok)
    |> render(:leaderboard, entries: entries, category: category, user_rank: user_rank, meta: meta)
  end

  @doc """
  GET /api/v1/gamification/xp/history
  Get XP transaction history using cursor-based pagination.

  ## Parameters

  - `limit` - Max entries to return (1-100, default: 50)
  - `cursor` - Opaque cursor for pagination
  """
  @spec xp_history(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def xp_history(conn, params) do
    user = conn.assigns.current_user
    query_limit = parse_int(params["limit"], 50, min: 1, max: 100)
    cursor = params["cursor"]

    base_query =
      from(t in CGraph.Gamification.XpTransaction,
        where: t.user_id == ^user.id
      )

    pagination_opts = CGraph.Pagination.parse_params(
      %{"cursor" => cursor, "limit" => query_limit},
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 50
    )

    {transactions, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)

    conn
    |> put_status(:ok)
    |> render(:xp_history,
      transactions: transactions,
      page_info: page_info
    )
  end

  @doc """
  GET /api/v1/gamification/level-info
  Get level progression information.
  """
  @spec level_info(Plug.Conn.t(), map()) :: Plug.Conn.t()
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

  @doc """
  GET /api/v1/gamification/leaderboard/:scope/:scope_id/:category
  Get a scoped leaderboard (e.g. per-board XP).

  ## Parameters

  - `scope` - Scope type (e.g. "board")
  - `scope_id` - The scoped entity ID
  - `category` - Leaderboard category (e.g. "xp")
  - `limit` - Max entries (1-100, default 100)
  - `cursor` - Cursor for pagination
  """
  @spec scoped_leaderboard(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def scoped_leaderboard(conn, %{"scope" => scope, "scope_id" => scope_id, "category" => category} = params) do
    limit = parse_int(params["limit"], 100, min: 1, max: @max_leaderboard_limit)
    cursor = params["cursor"]

    alias CGraph.Gamification.LeaderboardSystem

    {entries, meta} = LeaderboardSystem.get_scoped_leaderboard(scope, scope_id, category, limit: limit, cursor: cursor)

    conn
    |> put_status(:ok)
    |> json(%{
      data: entries,
      scope: scope,
      scope_id: scope_id,
      category: category,
      meta: meta
    })
  end
end
