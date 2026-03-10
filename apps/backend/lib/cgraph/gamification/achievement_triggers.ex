defmodule CGraph.Gamification.AchievementTriggers do
  @moduledoc """
  Centralized achievement trigger evaluation.

  Maps user actions to achievement slugs and checks milestone progress.
  Called after every XP-earning action to evaluate whether the user has
  reached a new achievement threshold.

  ## Architecture

  - `check_all/2` — evaluates all achievements relevant to the action type
  - `check_level_achievements/2` — evaluates level-based achievements on level-up
  - `check_streak_achievements/2` — delegates to AchievementSystem for streak checks

  The `@action_achievement_map` defines which achievements are checked for each
  action type. When an action fires, we increment progress on all mapped
  achievements. AchievementSystem handles duplicate-safe progress tracking
  and auto-unlock when progress >= max_progress.
  """

  alias CGraph.Gamification.AchievementSystem

  require Logger

  @action_achievement_map %{
    message_sent: [
      "first_message",
      "chatterbox",
      "motor_mouth",
      "megaphone",
      "legendary_talker"
    ],
    forum_thread: [
      "first_thread",
      "forum_regular",
      "forum_veteran"
    ],
    forum_thread_created: [
      "first_thread",
      "forum_regular",
      "forum_veteran"
    ],
    forum_post: [
      "first_thread",
      "forum_regular"
    ],
    forum_post_created: [
      "first_thread",
      "forum_regular"
    ],
    forum_upvote_received: [
      "helpful_poster",
      "respected_voice",
      "forum_legend"
    ],
    friend_added: [
      "first_friend",
      "social_butterfly",
      "social_maven",
      "networking_legend"
    ],
    group_joined: [
      "group_explorer",
      "community_builder"
    ],
    quest_completed: [
      "first_quest",
      "quest_master"
    ],
    conversation_started: [
      "conversation_starter"
    ],
    shop_purchase: [
      "first_purchase"
    ],
    border_acquired: [
      "border_collector"
    ],
    title_acquired: [
      "title_collector"
    ],
    pulse_tier_reached: [
      "trusted_voice",
      "expert_contributor",
      "authority_figure"
    ]
  }

  @level_thresholds [
    {5, "level_5"},
    {10, "level_10"},
    {25, "level_25"},
    {50, "level_50"}
  ]

  # ── Public API ──────────────────────────────────────────────────────────

  @doc """
  Check all achievements relevant to the given action type.

  Increments progress on each mapped achievement slug. AchievementSystem
  handles idempotency: already-unlocked achievements are skipped, progress
  is capped at max_progress, and auto-unlock fires when threshold is met.

  Returns `:ok`.
  """
  @spec check_all(String.t(), atom()) :: :ok
  def check_all(user_id, action_type) when is_binary(user_id) and is_atom(action_type) do
    slugs = Map.get(@action_achievement_map, action_type, [])

    for slug <- slugs do
      case AchievementSystem.increment_achievement_progress(user_id, slug, 1) do
        {:ok, ua} ->
          if ua.unlocked do
            broadcast_achievement_unlocked(user_id, ua)
          end

        {:error, :achievement_not_found} ->
          Logger.debug("AchievementTriggers: achievement #{slug} not found, skipping")

        {:error, reason} ->
          Logger.warning("AchievementTriggers: failed to check #{slug}",
            user_id: user_id,
            reason: inspect(reason)
          )
      end
    end

    :ok
  end

  def check_all(_user_id, _action_type), do: :ok

  @doc """
  Check level-based achievements when a user levels up.

  Level achievements are unlocked directly (not incremented) because
  the user's level is the threshold — there's no incremental progress.
  """
  @spec check_level_achievements(map() | struct(), integer()) :: :ok
  def check_level_achievements(user, level) when is_integer(level) do
    for {required_level, slug} <- @level_thresholds do
      if level >= required_level do
        case AchievementSystem.unlock_achievement_by_slug(user, slug) do
          {:ok, ua} ->
            if ua.unlocked do
              broadcast_achievement_unlocked(user.id, ua)
            end

          {:error, _} ->
            :ok
        end
      end
    end

    :ok
  end

  def check_level_achievements(_user, _level), do: :ok

  @doc """
  Check streak-based achievements. Delegates to AchievementSystem for
  the original streak slugs, then also checks the new streak slugs.
  """
  @spec check_streak_achievements(map() | struct(), integer()) :: :ok
  def check_streak_achievements(user, streak) when is_integer(streak) do
    # Original streak slugs (week_warrior, month_master, year_legend)
    AchievementSystem.check_streak_achievements(user, streak)

    # New streak slugs (week_streak, month_streak, hundred_days)
    new_streak_thresholds = [
      {7, "week_streak"},
      {30, "month_streak"},
      {100, "hundred_days"}
    ]

    for {required, slug} <- new_streak_thresholds do
      if streak >= required do
        AchievementSystem.unlock_achievement_by_slug(user, slug)
      end
    end

    :ok
  end

  def check_streak_achievements(_user, _streak), do: :ok

  @doc "Returns the list of action types that trigger achievement checks."
  @spec supported_actions() :: [atom()]
  def supported_actions, do: Map.keys(@action_achievement_map)

  # ── Private ─────────────────────────────────────────────────────────────

  defp broadcast_achievement_unlocked(user_id, user_achievement) do
    achievement = user_achievement.achievement || load_achievement(user_achievement.achievement_id)

    if achievement do
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "gamification:#{user_id}",
        {:achievement_unlocked, %{
          achievement_id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          category: achievement.category,
          xp_reward: achievement.xp_reward,
          coin_reward: achievement.coin_reward
        }}
      )
    end
  rescue
    error ->
      Logger.warning("AchievementTriggers: broadcast failed",
        error: inspect(error),
        user_id: user_id
      )
  end

  defp load_achievement(achievement_id) do
    CGraph.Repo.get(CGraph.Gamification.Achievement, achievement_id)
  end
end
