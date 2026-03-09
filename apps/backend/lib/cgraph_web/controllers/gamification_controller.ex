defmodule CGraphWeb.GamificationController do
  @moduledoc """
  Controller for achievement endpoints.

  ## Security

  - All endpoints require authentication
  """
  use CGraphWeb, :controller

  alias CGraph.Gamification

  action_fallback CGraphWeb.FallbackController

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
end
