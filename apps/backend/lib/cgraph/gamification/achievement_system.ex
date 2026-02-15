defmodule CGraph.Gamification.AchievementSystem do
  @moduledoc """
  Achievement tracking, progress, and unlocking.
  """

  import Ecto.Query, warn: false
  alias CGraph.Gamification.{Achievement, UserAchievement}
  alias CGraph.Repo

  @doc "List all achievements, optionally filtered by category."
  def list_achievements(opts \\ []) do
    category = Keyword.get(opts, :category)
    include_hidden = Keyword.get(opts, :include_hidden, false)

    Achievement
    |> maybe_filter_category(category)
    |> maybe_hide_hidden(include_hidden)
    |> order_by([a], [a.sort_order, a.category, a.title])
    |> Repo.all()
  end

  @doc "Get a user's achievement progress."
  def list_user_achievements(user_id, opts \\ []) do
    include_locked = Keyword.get(opts, :include_locked, true)

    query = from ua in UserAchievement,
      where: ua.user_id == ^user_id,
      join: a in Achievement, on: ua.achievement_id == a.id,
      preload: [achievement: a],
      order_by: [desc: ua.unlocked, desc: ua.unlocked_at, asc: a.sort_order]

    query = if include_locked, do: query, else: where(query, [ua], ua.unlocked == true)
    Repo.all(query)
  end

  @doc "Get or create a user achievement record."
  def get_or_create_user_achievement(user_id, achievement_id) do
    case Repo.get_by(UserAchievement, user_id: user_id, achievement_id: achievement_id) do
      nil ->
        %UserAchievement{}
        |> UserAchievement.changeset(%{user_id: user_id, achievement_id: achievement_id})
        |> Repo.insert()
      ua -> {:ok, ua}
    end
  end

  @doc "Increment achievement progress and unlock if complete."
  def increment_achievement_progress(user_id, achievement_slug, increment \\ 1) do
    case Repo.get_by(Achievement, slug: achievement_slug) do
      nil -> {:error, :achievement_not_found}
      achievement ->
        {:ok, ua} = get_or_create_user_achievement(user_id, achievement.id)
        if ua.unlocked do
          {:ok, ua}
        else
          new_progress = ua.progress + increment
          if new_progress >= achievement.max_progress do
            unlock_user_achievement(ua, achievement)
          else
            ua |> UserAchievement.progress_changeset(increment) |> Repo.update()
          end
        end
    end
  end

  @doc "Try to unlock an achievement by ID."
  def try_unlock_achievement(user_id, achievement_id) do
    case Repo.get(Achievement, achievement_id) do
      nil -> {:error, :not_found}
      achievement ->
        {:ok, ua} = get_or_create_user_achievement(user_id, achievement_id)
        cond do
          ua.unlocked -> {:error, :already_unlocked}
          ua.progress >= achievement.max_progress -> unlock_user_achievement(ua, achievement)
          true -> {:error, :not_met}
        end
    end
  end

  @doc "Directly unlock an achievement by slug."
  def unlock_achievement_by_slug(user, achievement_slug) do
    case Repo.get_by(Achievement, slug: achievement_slug) do
      nil -> {:error, :achievement_not_found}
      achievement ->
        {:ok, ua} = get_or_create_user_achievement(user.id, achievement.id)
        if ua.unlocked, do: {:ok, ua}, else: unlock_user_achievement(ua, achievement)
    end
  end

  @doc "Unlock a user achievement and grant rewards."
  def unlock_user_achievement(ua, achievement) do
    alias CGraph.Accounts.User

    Repo.transaction(fn ->
      {:ok, updated_ua} = ua
        |> Ecto.Changeset.change(%{progress: achievement.max_progress, unlocked: true, unlocked_at: DateTime.utc_now()})
        |> Repo.update()

      user = Repo.get!(User, ua.user_id)

      if achievement.xp_reward > 0 do
        CGraph.Gamification.award_xp(user, achievement.xp_reward, "achievement",
          description: "Unlocked: #{achievement.title}", reference_type: "achievement", reference_id: achievement.id)
      end
      if achievement.coin_reward > 0 do
        CGraph.Gamification.award_coins(user, achievement.coin_reward, "achievement",
          description: "Unlocked: #{achievement.title}", reference_type: "achievement", reference_id: achievement.id)
      end
      if achievement.title_reward do
        CGraph.Gamification.unlock_title_by_slug(user, achievement.title_reward)
      end

      updated_ua
    end)
  end

  @doc "Check level achievements (called on level up)."
  def check_level_achievements(_user, _level), do: :ok

  @doc "Check streak achievements."
  def check_streak_achievements(user, streak) do
    for {slug, required} <- [{"week_warrior", 7}, {"month_master", 30}, {"year_legend", 365}] do
      if streak >= required, do: unlock_achievement_by_slug(user, slug)
    end
  end

  # Private helpers
  defp maybe_filter_category(query, nil), do: query
  defp maybe_filter_category(query, category), do: where(query, [a], a.category == ^category)
  defp maybe_hide_hidden(query, true), do: query
  defp maybe_hide_hidden(query, false), do: where(query, [a], a.is_hidden == false)
end
