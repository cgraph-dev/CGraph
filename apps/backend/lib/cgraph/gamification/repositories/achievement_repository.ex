defmodule CGraph.Gamification.Repositories.AchievementRepository do
  @moduledoc """
  Repository for Achievement entity data access.
  """

  import Ecto.Query, warn: false, except: [update: 2]

  alias CGraph.Cache
  alias CGraph.Gamification.Achievement
  alias CGraph.Gamification.UserAchievement
  alias CGraph.Repo

  @cache_ttl :timer.hours(1)

  @doc """
  Get all achievements (cached).
  """
  @spec list_all() :: list(Achievement.t())
  def list_all do
    cache_key = "achievements:all"

    Cache.fetch(cache_key, fn ->
      from(a in Achievement, order_by: [asc: a.category, asc: a.tier])
      |> Repo.all()
    end, ttl: @cache_ttl)
  end

  @doc """
  Get an achievement by ID.
  """
  @spec get(String.t()) :: Achievement.t() | nil
  def get(id) do
    Repo.get(Achievement, id)
  end

  @doc """
  Get achievements by category.
  """
  @spec list_by_category(String.t()) :: list(Achievement.t())
  def list_by_category(category) do
    from(a in Achievement,
      where: a.category == ^category,
      order_by: [asc: a.tier]
    )
    |> Repo.all()
  end

  @doc """
  Get user's achievements.
  """
  @spec list_for_user(String.t()) :: list(UserAchievement.t())
  def list_for_user(user_id) do
    from(ua in UserAchievement,
      where: ua.user_id == ^user_id,
      preload: [:achievement]
    )
    |> Repo.all()
  end

  @doc """
  Get user's unlocked achievements.
  """
  @spec list_unlocked_for_user(String.t()) :: list(Achievement.t())
  def list_unlocked_for_user(user_id) do
    from(a in Achievement,
      join: ua in UserAchievement,
      on: ua.achievement_id == a.id,
      where: ua.user_id == ^user_id and ua.is_unlocked == true,
      order_by: [desc: ua.unlocked_at]
    )
    |> Repo.all()
  end

  @doc """
  Get user achievement progress.
  """
  @spec get_user_achievement(String.t(), String.t()) :: UserAchievement.t() | nil
  def get_user_achievement(user_id, achievement_id) do
    from(ua in UserAchievement,
      where: ua.user_id == ^user_id and ua.achievement_id == ^achievement_id,
      preload: [:achievement]
    )
    |> Repo.one()
  end

  @doc """
  Create or update user achievement progress.
  """
  @spec upsert_progress(String.t(), String.t(), integer()) ::
    {:ok, UserAchievement.t()} | {:error, Ecto.Changeset.t()}
  def upsert_progress(user_id, achievement_id, progress) do
    achievement = get(achievement_id)

    attrs = %{
      user_id: user_id,
      achievement_id: achievement_id,
      current_progress: progress,
      is_unlocked: achievement && progress >= achievement.target_progress,
      unlocked_at: if(achievement && progress >= achievement.target_progress, do: DateTime.utc_now(), else: nil)
    }

    %UserAchievement{}
    |> UserAchievement.changeset(attrs)
    |> Repo.insert(
      on_conflict: {:replace, [:current_progress, :is_unlocked, :unlocked_at, :updated_at]},
      conflict_target: [:user_id, :achievement_id]
    )
  end

  @doc """
  Increment achievement progress.
  """
  @spec increment_progress(String.t(), String.t(), integer()) ::
    {:ok, UserAchievement.t()} | {:error, term()}
  def increment_progress(user_id, achievement_id, delta \\ 1) do
    case get_user_achievement(user_id, achievement_id) do
      nil ->
        upsert_progress(user_id, achievement_id, delta)

      existing ->
        new_progress = existing.current_progress + delta
        upsert_progress(user_id, achievement_id, new_progress)
    end
  end

  @doc """
  Get recent achievement unlocks.
  """
  @spec list_recent_unlocks(keyword()) :: list(UserAchievement.t())
  def list_recent_unlocks(opts \\ []) do
    limit = Keyword.get(opts, :limit, 10)
    user_id = Keyword.get(opts, :user_id)

    base_query =
      from ua in UserAchievement,
        where: ua.is_unlocked == true,
        order_by: [desc: ua.unlocked_at],
        limit: ^limit,
        preload: [:achievement, :user]

    query =
      if user_id do
        from ua in base_query, where: ua.user_id == ^user_id
      else
        base_query
      end

    Repo.all(query)
  end

  @doc """
  Get achievement leaderboard.
  """
  @spec leaderboard(keyword()) :: list(map())
  def leaderboard(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)

    from(ua in UserAchievement,
      where: ua.is_unlocked == true,
      group_by: ua.user_id,
      select: %{
        user_id: ua.user_id,
        achievement_count: count(ua.id)
      },
      order_by: [desc: count(ua.id)],
      limit: ^limit
    )
    |> Repo.all()
  end
end
