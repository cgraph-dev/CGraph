defmodule CGraph.Gamification do
  @moduledoc """
  The Gamification context.

  Handles achievements, titles, shop items, and cosmetics.

  Domain sub-systems delegate to:
  - `CGraph.Gamification.AchievementSystem` — achievement progress & unlocking
  - `CGraph.Gamification.TitleShopSystem` — titles, shop items, purchases

  Currency (Nodes) is handled by `CGraph.Nodes`.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User

  alias CGraph.Gamification.{
    AchievementSystem,
    AchievementTriggers,
    TitleShopSystem
  }

  alias CGraph.Repo

  # ==================== ACHIEVEMENTS (delegated) ====================

  defdelegate list_achievements(opts \\ []), to: AchievementSystem
  defdelegate list_user_achievements(user_id, opts \\ []), to: AchievementSystem
  defdelegate get_or_create_user_achievement(user_id, achievement_id), to: AchievementSystem
  defdelegate increment_achievement_progress(user_id, slug, increment \\ 1), to: AchievementSystem
  defdelegate try_unlock_achievement(user_id, achievement_id), to: AchievementSystem
  defdelegate unlock_achievement_by_slug(user, slug), to: AchievementSystem
  defdelegate check_achievement_triggers(user_id, action_type), to: AchievementTriggers, as: :check_all

  # ==================== TITLES & SHOP (delegated) ====================

  defdelegate list_titles(), to: TitleShopSystem
  defdelegate list_user_titles(user_id), to: TitleShopSystem
  defdelegate unlock_title_by_slug(user, slug), to: TitleShopSystem
  defdelegate unlock_title(user_id, title_id), to: TitleShopSystem
  defdelegate equip_title(user_id, title_id), to: TitleShopSystem
  defdelegate purchase_title(user, title_id), to: TitleShopSystem
  defdelegate list_shop_items(opts \\ []), to: TitleShopSystem
  defdelegate get_shop_item(id), to: TitleShopSystem
  defdelegate purchase_shop_item(user, item_id, quantity \\ 1), to: TitleShopSystem
  defdelegate list_user_purchases(user_id, opts \\ []), to: TitleShopSystem

  # ==================== DEPRECATED XP STUBS ====================
  # XP progression was removed in Phase 26. These stubs exist only to prevent
  # runtime crashes from any lingering callers (e.g. achievement_system.ex).
  # They are no-ops and will be fully removed in a future cleanup.

  @doc false
  @deprecated "XP system removed — no-op stub"
  def award_xp(%User{} = user, _amount, _source, _opts \\ []), do: {:ok, {user, false}}

  @doc false
  @deprecated "XP system removed — no-op stub"
  def add_xp(_user_id, _amount), do: {:ok, :noop}

  @doc false
  @deprecated "XP system removed — no-op stub"
  def xp_for_level(_level), do: 0

  @doc false
  @deprecated "XP system removed — no-op stub"
  def level_from_xp(_xp), do: 1

  @doc false
  @deprecated "XP system removed — no-op stub"
  def level_progress(_xp), do: 0

  @doc false
  @deprecated "Streak system removed — no-op stub"
  def claim_daily_streak(%User{} = _user), do: {:error, :deprecated}

  # ==================== USER STATS ====================

  @doc "Get complete gamification stats for a user."
  @spec get_user_stats(String.t()) :: map()
  def get_user_stats(user_id) do
    alias CGraph.Gamification.{Achievement, UserAchievement}

    # get! safe: called with authenticated user.id from controller
    user = Repo.get!(User, user_id)

    unlocked_achievements =
      from(ua in UserAchievement, where: ua.user_id == ^user_id and ua.unlocked == true)
      |> Repo.aggregate(:count)

    total_achievements = Repo.aggregate(Achievement, :count)

    %{
      xp: user.xp,
      level: user.level,
      level_progress: level_progress(user.xp),
      xp_to_next_level: xp_for_level(user.level + 1) - user.xp,
      streak_days: user.streak_days,
      streak_longest: user.streak_longest,
      achievements_unlocked: unlocked_achievements,
      achievements_total: total_achievements,
      active_quests: 0,
      subscription_tier: user.subscription_tier,
      equipped_title_id: user.equipped_title_id
    }
  end

  # ==================== MISC ====================

  @doc "Unlock a border for a user."
  @spec unlock_border(String.t(), String.t()) :: {:ok, map()}
  def unlock_border(user_id, border_id) do
    {:ok, %{user_id: user_id, border_id: border_id}}
  end
end
