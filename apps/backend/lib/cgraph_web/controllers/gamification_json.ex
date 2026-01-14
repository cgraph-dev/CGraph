defmodule CGraphWeb.GamificationJSON do
  @moduledoc """
  JSON rendering for gamification endpoints.
  """

  def stats(%{stats: stats}) do
    %{
      data: %{
        xp: stats.xp,
        level: stats.level,
        level_progress: stats.level_progress,
        xp_to_next_level: stats.xp_to_next_level,
        coins: stats.coins,
        streak_days: stats.streak_days,
        streak_longest: stats.streak_longest,
        achievements_unlocked: stats.achievements_unlocked,
        achievements_total: stats.achievements_total,
        active_quests: stats.active_quests,
        subscription_tier: stats.subscription_tier,
        equipped_title_id: stats.equipped_title_id
      }
    }
  end

  def achievements(%{achievements: achievements}) do
    %{
      data: Enum.map(achievements, &render_achievement_with_progress/1)
    }
  end

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

  def streak_claimed(%{user: user, coins: coins, streak: streak}) do
    %{
      data: %{
        success: true,
        coins_earned: coins,
        streak_days: streak,
        total_coins: user.coins,
        streak_longest: user.streak_longest
      }
    }
  end

  def leaderboard(%{entries: entries, category: category, user_rank: user_rank}) do
    %{
      data: %{
        category: category,
        entries: Enum.map(entries, &render_leaderboard_entry/1),
        user_rank: user_rank
      }
    }
  end

  def xp_history(%{transactions: transactions}) do
    %{
      data: Enum.map(transactions, &render_xp_transaction/1)
    }
  end

  # Private helpers

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

  defp render_leaderboard_entry(entry) do
    %{
      rank: entry.rank,
      id: entry.id,
      username: entry.username,
      value: entry.value,
      level: Map.get(entry, :level),
      xp: Map.get(entry, :xp),
      longest: Map.get(entry, :longest)
    }
  end

  defp render_xp_transaction(transaction) do
    %{
      id: transaction.id,
      amount: transaction.amount,
      total_after: transaction.total_after,
      level_after: transaction.level_after,
      source: transaction.source,
      description: transaction.description,
      multiplier: transaction.multiplier,
      created_at: transaction.inserted_at
    }
  end
end
