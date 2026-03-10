defmodule CGraphWeb.GamificationJSON do
  @moduledoc """
  JSON rendering for achievement endpoints.
  """
  @spec achievements(map()) :: map()
  def achievements(%{achievements: achievements}) do
    %{
      data: Enum.map(achievements, &render_achievement_with_progress/1)
    }
  end

  @doc "Renders a single achievement as JSON."
  @spec achievement(map()) :: map()
  def achievement(%{achievement: achievement, user_achievement: ua}) do
    %{
      data: %{
        id: achievement.id,
        slug: achievement.slug,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity,
        icon: achievement.icon,
        xp_reward: achievement.xp_reward,
        coin_reward: achievement.coin_reward,
        max_progress: achievement.max_progress,
        is_hidden: achievement.is_hidden,
        progress: ua.progress,
        unlocked: ua.unlocked,
        unlocked_at: ua.unlocked_at
      }
    }
  end

  defp render_achievement_with_progress(item) do
    %{
      id: item.achievement.id,
      slug: item.achievement.slug,
      title: item.achievement.title,
      description: item.achievement.description,
      category: item.achievement.category,
      rarity: item.achievement.rarity,
      icon: item.achievement.icon,
      xp_reward: item.achievement.xp_reward,
      coin_reward: item.achievement.coin_reward,
      max_progress: item.achievement.max_progress,
      is_hidden: item.achievement.is_hidden,
      progress: item.progress,
      unlocked: item.unlocked,
      unlocked_at: item.unlocked_at
    }
  end
end
