defmodule CGraph.Gamification do
  @moduledoc """
  The Gamification context.

  Handles XP progression, achievements, quests, titles, shop items,
  coin transactions, and leaderboards.

  Core XP/coin/streak engine lives here. Domain sub-systems delegate to:
  - `CGraph.Gamification.AchievementSystem` — achievement progress & unlocking
  - `CGraph.Gamification.QuestSystem` — quest acceptance, progress, rewards
  - `CGraph.Gamification.TitleShopSystem` — titles, shop items, purchases
  - `CGraph.Gamification.LeaderboardSystem` — global leaderboard queries
  - `CGraph.Gamification.EventSystem` — seasonal events, battle passes
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User

  alias CGraph.Gamification.{
    AchievementSystem,
    AchievementTriggers,
    CoinTransaction,
    CurrencySystem,
    EventSystem,
    FeatureGates,
    Leaderboard,
    LeaderboardSystem,
    QuestSystem,
    TitleShopSystem,
    XpTransaction
  }

  alias CGraph.Repo

  # ==================== FEATURE GATES (delegated) ====================

  defdelegate feature_requirements(), to: FeatureGates
  defdelegate required_level(feature), to: FeatureGates
  defdelegate feature_unlocked?(user_level, feature), to: FeatureGates, as: :unlocked?
  defdelegate get_user_gates(user_level), to: FeatureGates
  defdelegate newly_unlocked_features(old_level, new_level), to: FeatureGates

  # ==================== ACHIEVEMENTS (delegated) ====================

  defdelegate list_achievements(opts \\ []), to: AchievementSystem
  defdelegate list_user_achievements(user_id, opts \\ []), to: AchievementSystem
  defdelegate get_or_create_user_achievement(user_id, achievement_id), to: AchievementSystem
  defdelegate increment_achievement_progress(user_id, slug, increment \\ 1), to: AchievementSystem
  defdelegate try_unlock_achievement(user_id, achievement_id), to: AchievementSystem
  defdelegate unlock_achievement_by_slug(user, slug), to: AchievementSystem
  defdelegate check_achievement_triggers(user_id, action_type), to: AchievementTriggers, as: :check_all

  # ==================== QUESTS (delegated) ====================

  defdelegate list_available_quests(opts \\ []), to: QuestSystem
  defdelegate list_user_quests(user_id, opts \\ []), to: QuestSystem
  defdelegate accept_quest(user_id, quest_id), to: QuestSystem
  defdelegate claim_quest_rewards(user_id, user_quest_id), to: QuestSystem

  # 3-arg version (objective-based progress)
  @doc "Update quest progress by objective type."
  @spec update_quest_progress(String.t(), atom(), integer()) :: term()
  def update_quest_progress(user_id, objective_type, increment)
      when not is_integer(increment) or is_integer(increment) do
    QuestSystem.update_quest_progress(user_id, objective_type, increment)
  end

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

  # ==================== LEADERBOARDS (delegated) ====================

  defdelegate get_leaderboard(category, opts \\ []), to: LeaderboardSystem
  defdelegate get_leaderboard_count(category), to: LeaderboardSystem
  defdelegate get_user_rank(user_id, category), to: LeaderboardSystem
  defdelegate get_xp_leaderboard(limit \\ 10), to: LeaderboardSystem

  # ==================== EVENTS (delegated) ====================

  defdelegate list_active_events(), to: EventSystem
  defdelegate list_upcoming_events(days \\ 7), to: EventSystem
  defdelegate get_event(event_id), to: EventSystem
  defdelegate get_user_event_progress(user_id, event_id), to: EventSystem
  defdelegate get_user_event_rank(user_id, event_id), to: EventSystem
  defdelegate get_event_quests(user_id, event_id), to: EventSystem
  defdelegate get_battle_pass_info(event_id, user_id), to: EventSystem
  defdelegate claim_event_reward(user_id, event_id, tier, reward_type), to: EventSystem
  defdelegate purchase_battle_pass(user_id, event_id), to: EventSystem
  defdelegate get_community_milestones(event_id), to: EventSystem

  @doc "Get event leaderboard (2-arg backward-compat)."
  @spec get_event_leaderboard(String.t(), integer()) :: term()
  def get_event_leaderboard(event_id, limit) when is_integer(limit) do
    EventSystem.get_event_leaderboard(event_id, limit, 0)
  end

  @doc "Get event leaderboard with cursor/offset."
  @spec get_event_leaderboard(String.t(), integer(), term()) :: term()
  def get_event_leaderboard(event_id, limit, cursor_or_offset) do
    EventSystem.get_event_leaderboard(event_id, limit, cursor_or_offset)
  end

  # 4-arg quest progress (event-based)
  @doc "Update quest progress for an event-based quest."
  @spec update_quest_progress(String.t(), String.t(), String.t(), integer()) :: term()
  def update_quest_progress(user_id, event_id, quest_id, progress_increment) do
    EventSystem.update_quest_progress(user_id, event_id, quest_id, progress_increment)
  end

  # ==================== LEVEL SYSTEM ====================

  @doc """
  XP required to reach a given level.
  Uses a polynomial curve: 100 * level^1.5
  """
  @spec xp_for_level(pos_integer()) :: non_neg_integer()
  def xp_for_level(level) when level >= 1 do
    round(100 * :math.pow(level, 1.5))
  end

  @doc "Calculate level from total XP."
  @spec level_from_xp(non_neg_integer()) :: pos_integer()
  def level_from_xp(xp) when xp >= 0 do
    find_level(xp, 1, 100)
  end

  defp find_level(_xp, min_level, max_level) when min_level >= max_level, do: min_level

  defp find_level(xp, min_level, max_level) do
    mid = div(min_level + max_level, 2)

    if xp >= xp_for_level(mid + 1) do
      find_level(xp, mid + 1, max_level)
    else
      find_level(xp, min_level, mid)
    end
  end

  @doc "Get XP progress within current level as percentage (0-100)."
  @spec level_progress(non_neg_integer()) :: non_neg_integer()
  def level_progress(xp) do
    level = level_from_xp(xp)
    current_level_xp = if level == 1, do: 0, else: xp_for_level(level)
    next_level_xp = xp_for_level(level + 1)
    round((xp - current_level_xp) / (next_level_xp - current_level_xp) * 100)
  end

  # ==================== XP MANAGEMENT ====================

  @doc """
  Award XP to a user and create a transaction record.
  Returns {:ok, {%User{}, level_up?}} or {:error, changeset}
  """
  @spec award_xp(User.t(), integer(), String.t(), keyword()) :: {:ok, {User.t(), boolean()}} | {:error, term()}
  def award_xp(%User{} = user, amount, source, opts \\ []) do
    description = Keyword.get(opts, :description)
    reference_type = Keyword.get(opts, :reference_type)
    reference_id = Keyword.get(opts, :reference_id)
    multiplier = get_xp_multiplier(user)

    final_amount = round(amount * Decimal.to_float(multiplier))
    new_xp = user.xp + final_amount
    old_level = user.level
    new_level = level_from_xp(new_xp)
    level_up = new_level > old_level

    Repo.transaction(fn ->
      {:ok, updated_user} =
        user
        |> Ecto.Changeset.change(%{xp: new_xp, level: new_level})
        |> Repo.update()

      {:ok, _transaction} =
        %XpTransaction{}
        |> XpTransaction.changeset(%{
          user_id: user.id,
          amount: final_amount,
          total_after: new_xp,
          level_after: new_level,
          source: source,
          description: description,
          multiplier: multiplier,
          reference_type: reference_type,
          reference_id: reference_id
        })
        |> Repo.insert()

      if level_up do
        AchievementSystem.check_level_achievements(updated_user, new_level)
        TitleShopSystem.check_level_titles(updated_user, new_level)
      end

      {updated_user, level_up}
    end)
    |> case do
      {:ok, {updated_user, level_up}} ->
        Leaderboard.sync_scores(updated_user, [:xp, :level])
        {:ok, {updated_user, level_up}}

      error ->
        error
    end
  end

  @doc "Add XP to a user (simplified, by user_id)."
  @spec add_xp(String.t(), pos_integer()) :: {:ok, {User.t(), boolean()}} | {:error, :user_not_found}
  def add_xp(user_id, amount) when is_binary(user_id) and amount > 0 do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> award_xp(user, amount, :manual)
    end
  end

  defp get_xp_multiplier(%User{subscription_tier: "premium"}), do: Decimal.new("2.0")
  defp get_xp_multiplier(%User{subscription_tier: "enterprise"}), do: Decimal.new("3.0")
  defp get_xp_multiplier(_user), do: Decimal.new("1.0")

  # ==================== COIN MANAGEMENT ====================

  @doc "Award coins to a user."
  @spec award_coins(User.t(), integer(), String.t(), keyword()) :: {:ok, User.t()} | {:error, term()}
  def award_coins(%User{} = user, amount, type, opts \\ []) do
    description = Keyword.get(opts, :description)
    reference_type = Keyword.get(opts, :reference_type)
    reference_id = Keyword.get(opts, :reference_id)
    new_balance = user.coins + amount

    Repo.transaction(fn ->
      {:ok, updated_user} =
        user
        |> Ecto.Changeset.change(%{coins: new_balance})
        |> Repo.update()

      {:ok, _transaction} =
        %CoinTransaction{}
        |> CoinTransaction.changeset(%{
          user_id: user.id,
          amount: amount,
          balance_after: new_balance,
          type: type,
          description: description,
          reference_type: reference_type,
          reference_id: reference_id
        })
        |> Repo.insert()

      updated_user
    end)
  end

  @doc """
  Spend coins from a user's balance with race condition protection.
  Uses SELECT FOR UPDATE to prevent concurrent balance modifications.
  """
  @spec spend_coins(User.t(), pos_integer(), String.t(), keyword()) :: {:ok, User.t()} | {:error, :insufficient_funds}
  def spend_coins(%User{} = user, amount, type, opts \\ []) when amount > 0 do
    description = Keyword.get(opts, :description)
    reference_type = Keyword.get(opts, :reference_type)
    reference_id = Keyword.get(opts, :reference_id)

    Repo.transaction(fn ->
      locked_user =
        from(u in User, where: u.id == ^user.id, lock: "FOR UPDATE")
        |> Repo.one!()

      if locked_user.coins < amount do
        Repo.rollback(:insufficient_funds)
      else
        new_balance = locked_user.coins - amount

        {:ok, updated_user} =
          locked_user
          |> Ecto.Changeset.change(%{coins: new_balance})
          |> Repo.update()

        {:ok, _transaction} =
          %CoinTransaction{}
          |> CoinTransaction.changeset(%{
            user_id: user.id,
            amount: -amount,
            balance_after: new_balance,
            type: type,
            description: description,
            reference_type: reference_type,
            reference_id: reference_id
          })
          |> Repo.insert()

        updated_user
      end
    end)
  end

  @doc "Get coin transaction history for a user."
  @spec list_coin_transactions(String.t(), keyword()) :: {[CoinTransaction.t()], map()}
  def list_coin_transactions(user_id, opts \\ []) do
    query = CoinTransaction |> where([t], t.user_id == ^user_id)

    pagination_opts =
      CGraph.Pagination.parse_params(
        Enum.into(opts, %{}),
        sort_field: :inserted_at,
        sort_direction: :desc,
        default_limit: 50
      )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  # ==================== CURRENCY MANAGEMENT (delegated) ====================

  defdelegate add_currency(user_or_id, amount, currency_type), to: CurrencySystem
  defdelegate deduct_currency(user_or_id, amount, currency_type), to: CurrencySystem

  # ==================== STREAK MANAGEMENT ====================

  @doc """
  Claim daily login streak bonus.
  Returns {:ok, {user, coins_awarded, new_streak}} or {:error, :already_claimed}
  """
  @spec claim_daily_streak(User.t()) :: {:ok, {User.t(), non_neg_integer(), pos_integer()}} | {:error, :already_claimed}
  def claim_daily_streak(%User{} = user) do
    today = Date.utc_today()
    yesterday = Date.add(today, -1)

    cond do
      user.daily_bonus_claimed_at == today ->
        {:error, :already_claimed}

      user.streak_last_claimed == yesterday ->
        new_streak = user.streak_days + 1
        longest = max(new_streak, user.streak_longest)
        do_claim_streak(user, today, new_streak, longest, calculate_streak_bonus(new_streak))

      true ->
        do_claim_streak(user, today, 1, user.streak_longest, calculate_streak_bonus(1))
    end
  end

  defp calculate_streak_bonus(streak_days), do: min(10 + streak_days * 5, 100)

  defp do_claim_streak(user, today, new_streak, longest, coins) do
    Repo.transaction(fn ->
      {:ok, updated_user} =
        user
        |> Ecto.Changeset.change(%{
          streak_days: new_streak,
          streak_last_claimed: today,
          streak_longest: longest,
          daily_bonus_claimed_at: today,
          coins: user.coins + coins
        })
        |> Repo.update()

      {:ok, _} =
        %CoinTransaction{}
        |> CoinTransaction.changeset(%{
          user_id: user.id,
          amount: coins,
          balance_after: updated_user.coins,
          type: "daily_bonus",
          description: "Day #{new_streak} login bonus"
        })
        |> Repo.insert()

      {:ok, {final_user, _level_up}} =
        award_xp(updated_user, 25, "daily_login", description: "Daily login bonus")

      AchievementSystem.check_streak_achievements(final_user, new_streak)

      {final_user, coins, new_streak}
    end)
  end

  # ==================== USER STATS ====================

  @doc "Get complete gamification stats for a user."
  @spec get_user_stats(String.t()) :: map()
  def get_user_stats(user_id) do
    alias CGraph.Gamification.{Achievement, UserAchievement, UserQuest}

    user = Repo.get!(User, user_id)

    unlocked_achievements =
      from(ua in UserAchievement, where: ua.user_id == ^user_id and ua.unlocked == true)
      |> Repo.aggregate(:count)

    total_achievements = Repo.aggregate(Achievement, :count)

    active_quests =
      from(uq in UserQuest, where: uq.user_id == ^user_id and uq.claimed == false)
      |> Repo.aggregate(:count)

    %{
      xp: user.xp,
      level: user.level,
      level_progress: level_progress(user.xp),
      xp_to_next_level: xp_for_level(user.level + 1) - user.xp,
      coins: user.coins,
      streak_days: user.streak_days,
      streak_longest: user.streak_longest,
      achievements_unlocked: unlocked_achievements,
      achievements_total: total_achievements,
      active_quests: active_quests,
      subscription_tier: user.subscription_tier,
      equipped_title_id: user.equipped_title_id
    }
  end

  # ==================== PRESTIGE ====================

  @doc "Get user's prestige info."
  @spec get_user_prestige(String.t()) :: {:ok, map()}
  def get_user_prestige(user_id) do
    alias CGraph.Gamification.UserPrestige

    case Repo.get_by(UserPrestige, user_id: user_id) do
      nil ->
        {:ok, %{
          level: 0, total_prestiges: 0, xp_multiplier: 1.0, coin_multiplier: 1.0,
          karma_multiplier: 1.0, bonuses: [], prestige_xp: 0,
          xp_to_next: UserPrestige.xp_required_for_prestige(0)
        }}

      prestige ->
        {:ok, %{
          level: prestige.prestige_level,
          total_prestiges: prestige.total_resets || 0,
          xp_multiplier: 1.0 + (prestige.xp_bonus || 0.0),
          coin_multiplier: 1.0 + (prestige.coin_bonus || 0.0),
          karma_multiplier: 1.0 + (prestige.karma_bonus || 0.0),
          bonuses: [
            %{type: "xp", value: prestige.xp_bonus || 0.0},
            %{type: "coins", value: prestige.coin_bonus || 0.0},
            %{type: "karma", value: prestige.karma_bonus || 0.0},
            %{type: "drop_rate", value: prestige.drop_rate_bonus || 0.0}
          ],
          prestige_xp: prestige.prestige_xp,
          xp_to_next: UserPrestige.xp_required_for_prestige(prestige.prestige_level)
        }}
    end
  end

  @doc "Get prestige leaderboard."
  @spec get_prestige_leaderboard(keyword()) :: list()
  def get_prestige_leaderboard(_opts \\ []), do: []

  # ==================== MISC ====================

  @doc "Unlock a border for a user."
  @spec unlock_border(String.t(), String.t()) :: {:ok, map()}
  def unlock_border(user_id, border_id) do
    {:ok, %{user_id: user_id, border_id: border_id}}
  end
end
