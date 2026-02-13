defmodule CGraph.Gamification do
  @moduledoc """
  The Gamification context.

  Handles XP progression, achievements, quests, titles, shop items,
  coin transactions, and leaderboards.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Gamification.{Achievement, CoinTransaction, Quest, ShopItem, Title, UserAchievement, UserPurchase, UserQuest, UserTitle, XpTransaction}
  alias CGraph.ReadRepo
  alias CGraph.Repo

  # ==================== LEVEL SYSTEM ====================

  @doc """
  XP required to reach a given level.
  Uses a polynomial curve: 100 * level^1.5
  """
  def xp_for_level(level) when level >= 1 do
    round(100 * :math.pow(level, 1.5))
  end

  @doc """
  Calculate level from total XP.
  """
  def level_from_xp(xp) when xp >= 0 do
    # Binary search for the level
    find_level(xp, 1, 100)
  end

  defp find_level(_xp, min_level, max_level) when min_level >= max_level, do: min_level
  defp find_level(xp, min_level, max_level) do
    mid = div(min_level + max_level, 2)
    xp_at_mid = xp_for_level(mid + 1)

    if xp >= xp_at_mid do
      find_level(xp, mid + 1, max_level)
    else
      find_level(xp, min_level, mid)
    end
  end

  @doc """
  Get XP progress within current level as percentage (0-100).
  """
  def level_progress(xp) do
    level = level_from_xp(xp)
    current_level_xp = if level == 1, do: 0, else: xp_for_level(level)
    next_level_xp = xp_for_level(level + 1)
    xp_in_level = xp - current_level_xp
    xp_needed = next_level_xp - current_level_xp

    round(xp_in_level / xp_needed * 100)
  end

  # ==================== XP MANAGEMENT ====================

  @doc """
  Award XP to a user and create a transaction record.
  Returns {:ok, %User{}, level_up?} or {:error, changeset}
  """
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
      # Update user XP and level
      {:ok, updated_user} =
        user
        |> Ecto.Changeset.change(%{xp: new_xp, level: new_level})
        |> Repo.update()

      # Create transaction record
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

      # Check for level-based achievements and title unlocks
      if level_up do
        check_level_achievements(updated_user, new_level)
        check_level_titles(updated_user, new_level)
      end

      {updated_user, level_up}
    end)
    |> case do
      {:ok, {updated_user, level_up}} ->
        # Sync Redis leaderboard scores (fire-and-forget, non-blocking)
        CGraph.Gamification.Leaderboard.sync_scores(updated_user, [:xp, :level])
        {:ok, {updated_user, level_up}}

      error ->
        error
    end
  end

  defp get_xp_multiplier(%User{subscription_tier: "premium"}), do: Decimal.new("1.5")
  defp get_xp_multiplier(%User{subscription_tier: "premium_plus"}), do: Decimal.new("2.0")
  defp get_xp_multiplier(_user), do: Decimal.new("1.0")

  # ==================== COIN MANAGEMENT ====================

  @doc """
  Award coins to a user.
  """
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
  Returns {:ok, user} or {:error, :insufficient_funds}

  ## Race Condition Prevention

  The balance check happens INSIDE the transaction with a row-level lock,
  ensuring two concurrent requests cannot both pass the check before either
  commits, which would result in a negative balance.
  """
  def spend_coins(%User{} = user, amount, type, opts \\ []) when amount > 0 do
    description = Keyword.get(opts, :description)
    reference_type = Keyword.get(opts, :reference_type)
    reference_id = Keyword.get(opts, :reference_id)

    Repo.transaction(fn ->
      # Lock the user row for update to prevent race conditions
      # This ensures only one transaction can modify the balance at a time
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

  @doc """
  Get coin transaction history for a user.
  """
  def list_coin_transactions(user_id, opts \\ []) do
    query =
      CoinTransaction
      |> where([t], t.user_id == ^user_id)

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  # ==================== STREAK MANAGEMENT ====================

  @doc """
  Claim daily login streak bonus.
  Returns {:ok, user, coins_awarded, new_streak} or {:error, :already_claimed}
  """
  def claim_daily_streak(%User{} = user) do
    today = Date.utc_today()
    yesterday = Date.add(today, -1)

    cond do
      # Already claimed today
      user.daily_bonus_claimed_at == today ->
        {:error, :already_claimed}

      # Continuing streak from yesterday
      user.streak_last_claimed == yesterday ->
        new_streak = user.streak_days + 1
        longest = max(new_streak, user.streak_longest)
        coins = calculate_streak_bonus(new_streak)

        do_claim_streak(user, today, new_streak, longest, coins)

      # Streak broken or first claim
      true ->
        new_streak = 1
        coins = calculate_streak_bonus(new_streak)

        do_claim_streak(user, today, new_streak, user.streak_longest, coins)
    end
  end

  defp calculate_streak_bonus(streak_days) do
    # Base 10 coins + 5 coins per day, max 100
    min(10 + (streak_days * 5), 100)
  end

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

      # Award XP for daily login
      {:ok, {final_user, _level_up}} = award_xp(updated_user, 25, "daily_login",
        description: "Daily login bonus")

      # Check streak achievements
      check_streak_achievements(final_user, new_streak)

      {final_user, coins, new_streak}
    end)
  end

  defp check_streak_achievements(user, streak) do
    # Check for streak-based achievements
    achievements_to_check = [
      {"week_warrior", 7},
      {"month_master", 30},
      {"year_legend", 365}
    ]

    for {slug, required_streak} <- achievements_to_check do
      if streak >= required_streak do
        unlock_achievement_by_slug(user, slug)
      end
    end
  end

  # ==================== ACHIEVEMENTS ====================

  @doc """
  List all achievements, optionally filtered by category.
  """
  def list_achievements(opts \\ []) do
    category = Keyword.get(opts, :category)
    include_hidden = Keyword.get(opts, :include_hidden, false)

    Achievement
    |> maybe_filter_category(category)
    |> maybe_hide_hidden(include_hidden)
    |> order_by([a], [a.sort_order, a.category, a.title])
    |> Repo.all()
  end

  defp maybe_filter_category(query, nil), do: query
  defp maybe_filter_category(query, category) do
    where(query, [a], a.category == ^category)
  end

  defp maybe_hide_hidden(query, true), do: query
  defp maybe_hide_hidden(query, false) do
    where(query, [a], a.is_hidden == false)
  end

  @doc """
  Get a user's achievement progress.
  """
  def list_user_achievements(user_id, opts \\ []) do
    include_locked = Keyword.get(opts, :include_locked, true)

    query = from ua in UserAchievement,
      where: ua.user_id == ^user_id,
      join: a in Achievement, on: ua.achievement_id == a.id,
      preload: [achievement: a],
      order_by: [desc: ua.unlocked, desc: ua.unlocked_at, asc: a.sort_order]

    query = if include_locked do
      query
    else
      where(query, [ua], ua.unlocked == true)
    end

    Repo.all(query)
  end

  @doc """
  Get or create a user achievement record.
  """
  def get_or_create_user_achievement(user_id, achievement_id) do
    case Repo.get_by(UserAchievement, user_id: user_id, achievement_id: achievement_id) do
      nil ->
        %UserAchievement{}
        |> UserAchievement.changeset(%{user_id: user_id, achievement_id: achievement_id})
        |> Repo.insert()
      ua ->
        {:ok, ua}
    end
  end

  @doc """
  Increment achievement progress and unlock if complete.
  """
  def increment_achievement_progress(user_id, achievement_slug, increment \\ 1) do
    achievement = Repo.get_by(Achievement, slug: achievement_slug)

    if achievement do
      {:ok, ua} = get_or_create_user_achievement(user_id, achievement.id)

      if ua.unlocked do
        {:ok, ua}  # Already unlocked
      else
        new_progress = ua.progress + increment

        if new_progress >= achievement.max_progress do
          # Unlock the achievement
          unlock_user_achievement(ua, achievement)
        else
          # Just update progress
          ua
          |> UserAchievement.progress_changeset(increment)
          |> Repo.update()
        end
      end
    else
      {:error, :achievement_not_found}
    end
  end

  @doc """
  Try to unlock an achievement by ID.
  Validates the achievement exists and checks if requirements are met.
  Returns {:ok, user_achievement} on success, or an error tuple.
  """
  def try_unlock_achievement(user_id, achievement_id) do
    case Repo.get(Achievement, achievement_id) do
      nil ->
        {:error, :not_found}

      achievement ->
        {:ok, ua} = get_or_create_user_achievement(user_id, achievement_id)

        cond do
          ua.unlocked ->
            {:error, :already_unlocked}

          ua.progress >= achievement.max_progress ->
            # Requirements met, unlock it
            unlock_user_achievement(ua, achievement)

          true ->
            # Requirements not yet met
            {:error, :not_met}
        end
    end
  end

  @doc """
  Directly unlock an achievement by slug.
  """
  def unlock_achievement_by_slug(%User{} = user, achievement_slug) do
    achievement = Repo.get_by(Achievement, slug: achievement_slug)

    if achievement do
      {:ok, ua} = get_or_create_user_achievement(user.id, achievement.id)
      if ua.unlocked do
        {:ok, ua}
      else
        unlock_user_achievement(ua, achievement)
      end
    else
      {:error, :achievement_not_found}
    end
  end

  defp unlock_user_achievement(ua, achievement) do
    Repo.transaction(fn ->
      # Update user achievement
      {:ok, updated_ua} =
        ua
        |> Ecto.Changeset.change(%{
          progress: achievement.max_progress,
          unlocked: true,
          unlocked_at: DateTime.utc_now()
        })
        |> Repo.update()

      # Award XP and coins
      user = Repo.get!(User, ua.user_id)

      if achievement.xp_reward > 0 do
        award_xp(user, achievement.xp_reward, "achievement",
          description: "Unlocked: #{achievement.title}",
          reference_type: "achievement",
          reference_id: achievement.id)
      end

      if achievement.coin_reward > 0 do
        award_coins(user, achievement.coin_reward, "achievement",
          description: "Unlocked: #{achievement.title}",
          reference_type: "achievement",
          reference_id: achievement.id)
      end

      # Unlock associated title if any
      if achievement.title_reward do
        unlock_title_by_slug(user, achievement.title_reward)
      end

      updated_ua
    end)
  end

  defp check_level_achievements(_user, _level) do
    # Level achievements are checked on level up
    # Implementation depends on specific achievement definitions
    :ok
  end

  # ==================== QUESTS ====================

  @doc """
  List available quests for a user.
  """
  def list_available_quests(opts \\ []) do
    quest_type = Keyword.get(opts, :type)

    query = from q in Quest,
      where: q.is_active == true,
      order_by: [q.type, q.sort_order]

    query = if quest_type do
      where(query, [q], q.type == ^quest_type)
    else
      query
    end

    # Filter by time constraints
    now = DateTime.utc_now()

    query
    |> where([q], is_nil(q.starts_at) or q.starts_at <= ^now)
    |> where([q], is_nil(q.ends_at) or q.ends_at > ^now)
    |> Repo.all()
  end

  @doc """
  Get a user's active quests with progress.
  """
  def list_user_quests(user_id, opts \\ []) do
    include_completed = Keyword.get(opts, :include_completed, false)

    query = from uq in UserQuest,
      where: uq.user_id == ^user_id,
      join: q in Quest, on: uq.quest_id == q.id,
      preload: [quest: q],
      order_by: [asc: uq.completed, asc: q.sort_order]

    query = if include_completed do
      query
    else
      where(query, [uq], uq.claimed == false)
    end

    Repo.all(query)
  end

  @doc """
  Accept a quest for a user.
  """
  def accept_quest(user_id, quest_id) do
    quest = Repo.get!(Quest, quest_id)

    # Check if already accepted
    case Repo.get_by(UserQuest, user_id: user_id, quest_id: quest_id) do
      nil ->
        expires_at = calculate_quest_expiry(quest)

        %UserQuest{}
        |> UserQuest.changeset(%{
          user_id: user_id,
          quest_id: quest_id,
          expires_at: expires_at
        })
        |> Repo.insert()

      existing ->
        {:ok, existing}
    end
  end

  defp calculate_quest_expiry(quest) do
    now = DateTime.utc_now()

    case quest.type do
      "daily" -> DateTime.add(now, 24 * 60 * 60, :second)
      "weekly" -> DateTime.add(now, 7 * 24 * 60 * 60, :second)
      "monthly" -> DateTime.add(now, 30 * 24 * 60 * 60, :second)
      _ -> quest.ends_at
    end
  end

  @doc """
  Update quest progress for a user.
  """
  def update_quest_progress(user_id, objective_type, increment \\ 1) do
    # Find all active user quests with matching objectives
    user_quests =
      from(uq in UserQuest,
        where: uq.user_id == ^user_id and uq.completed == false,
        join: q in Quest, on: uq.quest_id == q.id,
        preload: [quest: q])
      |> Repo.all()

    for uq <- user_quests do
      objectives = get_in(uq.quest.objectives, ["objectives"]) || []

      matching_objectives = Enum.filter(objectives, fn obj ->
        obj["id"] == objective_type or obj["type"] == objective_type
      end)

      for obj <- matching_objectives do
        obj_id = obj["id"]
        current = Map.get(uq.progress, obj_id, 0)
        target = obj["target"] || 1
        new_value = min(current + increment, target)

        new_progress = Map.put(uq.progress, obj_id, new_value)

        # Check if all objectives completed
        all_complete = Enum.all?(objectives, fn o ->
          Map.get(new_progress, o["id"], 0) >= (o["target"] || 1)
        end)

        if all_complete do
          uq
          |> Ecto.Changeset.change(%{
            progress: new_progress,
            completed: true,
            completed_at: DateTime.utc_now()
          })
          |> Repo.update()
        else
          uq
          |> Ecto.Changeset.change(%{progress: new_progress})
          |> Repo.update()
        end
      end
    end

    :ok
  end

  @doc """
  Claim rewards for a completed quest.
  """
  def claim_quest_rewards(user_id, user_quest_id) do
    user_quest =
      UserQuest
      |> where([uq], uq.id == ^user_quest_id and uq.user_id == ^user_id)
      |> preload(:quest)
      |> Repo.one()

    cond do
      is_nil(user_quest) ->
        {:error, :not_found}

      not user_quest.completed ->
        {:error, :not_completed}

      user_quest.claimed ->
        {:error, :already_claimed}

      true ->
        Repo.transaction(fn ->
          # Mark as claimed
          {:ok, _} =
            user_quest
            |> UserQuest.claim_changeset()
            |> Repo.update()

          user = Repo.get!(User, user_id)
          quest = user_quest.quest

          # Award XP
          if quest.xp_reward > 0 do
            award_xp(user, quest.xp_reward, "quest",
              description: "Completed: #{quest.title}",
              reference_type: "quest",
              reference_id: quest.id)
          end

          # Award coins
          if quest.coin_reward > 0 do
            award_coins(user, quest.coin_reward, "quest",
              description: "Completed: #{quest.title}",
              reference_type: "quest",
              reference_id: quest.id)
          end

          %{xp: quest.xp_reward, coins: quest.coin_reward}
        end)
    end
  end

  # ==================== TITLES ====================

  @doc """
  List all available titles.
  """
  def list_titles do
    Title
    |> order_by([t], [t.sort_order, t.name])
    |> Repo.all()
  end

  @doc """
  Get a user's unlocked titles.
  """
  def list_user_titles(user_id) do
    from(ut in UserTitle,
      where: ut.user_id == ^user_id,
      join: t in Title, on: ut.title_id == t.id,
      preload: [title: t],
      order_by: [desc: ut.unlocked_at])
    |> Repo.all()
  end

  @doc """
  Unlock a title for a user by slug.
  """
  def unlock_title_by_slug(%User{} = user, title_slug) do
    title = Repo.get_by(Title, slug: title_slug)

    if title do
      # Check if already unlocked
      case Repo.get_by(UserTitle, user_id: user.id, title_id: title.id) do
        nil ->
          %UserTitle{}
          |> UserTitle.changeset(%{
            user_id: user.id,
            title_id: title.id,
            unlocked_at: DateTime.utc_now()
          })
          |> Repo.insert()

        existing ->
          {:ok, existing}
      end
    else
      {:error, :title_not_found}
    end
  end

  defp check_level_titles(user, new_level) do
    # Unlock titles based on level
    level_titles =
      from(t in Title,
        where: t.unlock_type == "level")
      |> Repo.all()

    for title <- level_titles do
      required_level = String.to_integer(title.unlock_requirement || "1")
      if new_level >= required_level do
        unlock_title_by_slug(user, title.slug)
      end
    end
  end

  @doc """
  Equip a title for a user.
  """
  def equip_title(user_id, title_id) do
    user = Repo.get!(User, user_id)

    # Verify user owns this title
    case Repo.get_by(UserTitle, user_id: user_id, title_id: title_id) do
      nil ->
        {:error, :not_owned}

      _ ->
        user
        |> Ecto.Changeset.change(%{equipped_title_id: title_id})
        |> Repo.update()
    end
  end

  @doc """
  Purchase a title with coins.
  """
  def purchase_title(%User{} = user, title_id) do
    title = Repo.get!(Title, title_id)

    cond do
      not title.is_purchasable ->
        {:error, :not_purchasable}

      user.coins < title.coin_cost ->
        {:error, :insufficient_funds}

      Repo.get_by(UserTitle, user_id: user.id, title_id: title.id) != nil ->
        {:error, :already_owned}

      true ->
        Repo.transaction(fn ->
          {:ok, updated_user} = spend_coins(user, title.coin_cost, "purchase",
            description: "Purchased title: #{title.name}",
            reference_type: "title",
            reference_id: title.id)

          {:ok, _} = unlock_title_by_slug(updated_user, title.slug)

          updated_user
        end)
    end
  end

  # ==================== SHOP ====================

  @doc """
  List all available shop items.
  """
  def list_shop_items(opts \\ []) do
    category = Keyword.get(opts, :category)

    query = from s in ShopItem,
      where: s.is_active == true,
      order_by: [s.category, s.sort_order]

    query = if category do
      where(query, [s], s.category == ^category)
    else
      query
    end

    Repo.all(query)
  end

  @doc """
  Get a shop item by ID.
  """
  def get_shop_item(id) do
    Repo.get(ShopItem, id)
  end

  @doc """
  Purchase a shop item.
  """
  def purchase_shop_item(%User{} = user, item_id, quantity \\ 1) do
    item = Repo.get!(ShopItem, item_id)
    total_cost = item.coin_cost * quantity

    cond do
      not ShopItem.available?(item) ->
        {:error, :not_available}

      item.premium_only and user.subscription_tier == "free" ->
        {:error, :premium_required}

      user.coins < total_cost ->
        {:error, :insufficient_funds}

      # Check if already owns permanent item
      item.type == "permanent" and user_owns_item?(user.id, item_id) ->
        {:error, :already_owned}

      true ->
        Repo.transaction(fn ->
          # Spend coins
          {:ok, updated_user} = spend_coins(user, total_cost, "purchase",
            description: "Purchased: #{item.name} x#{quantity}",
            reference_type: "shop_item",
            reference_id: item_id)

          # Create purchase record
          {:ok, _purchase} =
            %UserPurchase{}
            |> UserPurchase.changeset(%{
              user_id: user.id,
              item_id: item_id,
              quantity: quantity,
              coin_spent: total_cost,
              purchased_at: DateTime.utc_now()
            })
            |> Repo.insert()

          # Update sold count
          {:ok, _} =
            item
            |> Ecto.Changeset.change(%{sold_count: item.sold_count + quantity})
            |> Repo.update()

          updated_user
        end)
    end
  end

  defp user_owns_item?(user_id, item_id) do
    from(p in UserPurchase,
      where: p.user_id == ^user_id and p.item_id == ^item_id)
    |> Repo.exists?()
  end

  @doc """
  Get a user's purchased items.
  """
  def list_user_purchases(user_id, opts \\ []) do
    category = Keyword.get(opts, :category)

    query = from p in UserPurchase,
      where: p.user_id == ^user_id,
      join: i in ShopItem, on: p.item_id == i.id,
      preload: [item: i],
      order_by: [desc: p.purchased_at]

    query = if category do
      where(query, [p, i], i.category == ^category)
    else
      query
    end

    Repo.all(query)
  end

  # ==================== LEADERBOARDS ====================

  @doc """
  Get global leaderboard by category.

  ## Options

  - `:limit` - Maximum number of entries to return (default: 100)
  - `:cursor` - Opaque cursor for pagination (default: nil)

  ## Categories

  - "xp" - Total experience points
  - "level" - User level
  - "karma" - Forum reputation
  - "streak" - Login streak days
  - "messages" - Total messages sent
  - "posts" - Total forum posts
  - "friends" - Friend connections count

  Returns `{entries, meta}` where entries is a list of maps with `:id`,
  `:username`, `:value`, `:rank` and additional fields based on category.
  Meta contains `:has_more`, `:next_cursor`, and `:limit` for cursor-based
  pagination.
  """
  def get_leaderboard(category, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)
    cursor = Keyword.get(opts, :cursor)

    cursor_data = decode_leaderboard_cursor(cursor)
    rank_start = if cursor_data, do: cursor_data.rank, else: 1

    # Try Redis sorted set first (O(log N + M)), fall back to DB
    case category do
      "friends" ->
        # Friends leaderboard uses subquery join, keep DB-only
        results = get_friends_leaderboard(limit + 1, cursor_data)
        finalize_leaderboard(results, limit, rank_start)

      _ ->
        redis_offset = rank_start - 1

        case CGraph.Gamification.Leaderboard.get_top(category, limit + 1, redis_offset) do
          {:ok, entries} when entries != [] ->
            finalize_leaderboard(entries, limit, rank_start)

          _ ->
            # Redis unavailable or empty — fall back to DB query with cursor
            results = get_standard_leaderboard(category, limit + 1, cursor_data)
            finalize_leaderboard(results, limit, rank_start)
        end
    end
  end

  defp finalize_leaderboard(results, limit, rank_start) do
    has_more = length(results) > limit
    items = Enum.take(results, limit)

    items_with_rank = items
    |> Enum.with_index(rank_start)
    |> Enum.map(fn {entry, rank} -> Map.put(entry, :rank, rank) end)

    next_cursor = if has_more && items != [] do
      last = List.last(items)
      encode_leaderboard_cursor(
        rank_start + length(items),
        Map.get(last, :value, 0),
        Map.get(last, :inserted_at, DateTime.utc_now())
      )
    else
      nil
    end

    {items_with_rank, %{has_more: has_more, next_cursor: next_cursor, limit: limit}}
  end

  defp encode_leaderboard_cursor(rank, value, %DateTime{} = dt) do
    "#{rank}|#{value}|#{DateTime.to_iso8601(dt)}" |> Base.url_encode64(padding: false)
  end

  defp encode_leaderboard_cursor(rank, value, %NaiveDateTime{} = ndt) do
    "#{rank}|#{value}|#{NaiveDateTime.to_iso8601(ndt)}" |> Base.url_encode64(padding: false)
  end

  defp encode_leaderboard_cursor(rank, value, ts) do
    "#{rank}|#{value}|#{ts}" |> Base.url_encode64(padding: false)
  end

  defp decode_leaderboard_cursor(nil), do: nil

  defp decode_leaderboard_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         [rank_str, value_str, ts] <- String.split(decoded, "|", parts: 3),
         {rank, _} <- Integer.parse(rank_str),
         {value, _} <- Integer.parse(value_str) do
      %{rank: rank, value: value, inserted_at: ts}
    else
      _ -> nil
    end
  end

  defp parse_cursor_datetime(ts_string) do
    case DateTime.from_iso8601(ts_string) do
      {:ok, dt, _} ->
        dt

      _ ->
        case NaiveDateTime.from_iso8601(ts_string) do
          {:ok, ndt} -> ndt
          _ -> ~N[2000-01-01 00:00:00]
        end
    end
  end

  defp value_field_for_category("xp"), do: :xp
  defp value_field_for_category("level"), do: :level
  defp value_field_for_category("karma"), do: :karma
  defp value_field_for_category("streak"), do: :streak_days
  defp value_field_for_category("messages"), do: :total_messages_sent
  defp value_field_for_category("posts"), do: :total_posts_created
  defp value_field_for_category(_), do: :xp

  # Standard leaderboard queries for user-field-based categories
  defp get_standard_leaderboard(category, limit, cursor_data) do
    vf = value_field_for_category(category)

    query = case category do
      "xp" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.xp, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.xp,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }

      "level" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.level, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.level,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }

      "streak" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.streak_days, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.streak_days,
            longest: u.streak_longest,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }

      "karma" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.karma, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.karma,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }

      "messages" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.total_messages_sent, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.total_messages_sent,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }

      "posts" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.total_posts_created, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.total_posts_created,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }

      _ ->
        # Default to XP
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.xp, asc: u.inserted_at],
          select: %{
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            level: u.level,
            value: u.xp,
            inserted_at: u.inserted_at,
            is_premium: u.subscription_tier in ["premium", "premium_plus"],
            is_verified: u.is_verified
          }
    end

    query = query |> limit(^limit)

    query = if cursor_data do
      cursor_dt = parse_cursor_datetime(cursor_data.inserted_at)

      from u in query,
        where: field(u, ^vf) < ^cursor_data.value or
               (field(u, ^vf) == ^cursor_data.value and u.inserted_at > ^cursor_dt)
    else
      query
    end

    ReadRepo.all(query)
  end

  # Friends leaderboard - ranks users by friend count
  defp get_friends_leaderboard(limit, cursor_data) do
    alias CGraph.Accounts.Friendship

    # Subquery to count accepted friendships per user
    friend_counts = from f in Friendship,
      where: f.status == "accepted",
      group_by: f.user_id,
      select: %{user_id: f.user_id, count: count(f.id)}

    query = from(u in User,
      left_join: fc in subquery(friend_counts), on: fc.user_id == u.id,
      where: u.is_active == true,
      order_by: [desc: coalesce(fc.count, 0), asc: u.inserted_at],
      limit: ^limit,
      select: %{
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        level: u.level,
        value: coalesce(fc.count, 0),
        inserted_at: u.inserted_at,
        is_premium: u.subscription_tier in ["premium", "premium_plus"],
        is_verified: u.is_verified
      }
    )

    query = if cursor_data do
      cursor_dt = parse_cursor_datetime(cursor_data.inserted_at)

      from [u, fc] in query,
        where: coalesce(fc.count, 0) < ^cursor_data.value or
               (coalesce(fc.count, 0) == ^cursor_data.value and u.inserted_at > ^cursor_dt)
    else
      query
    end

    ReadRepo.all(query)
  end

  @doc """
  Get total count of users for leaderboard pagination.

  Returns the count of active users eligible for leaderboards.
  """
  def get_leaderboard_count(_category) do
    from(u in User, where: u.is_active == true)
    |> ReadRepo.aggregate(:count)
  end

  @doc """
  Get a user's rank in a specific leaderboard category.
  """
  def get_user_rank(user_id, category) do
    case category do
      "friends" ->
        get_user_friends_rank(user_id)

      _ ->
        get_user_standard_rank(user_id, category)
    end
  end

  defp get_user_standard_rank(user_id, category) do
    user = Repo.get!(User, user_id)

    {field, value} = case category do
      "xp" -> {:xp, user.xp}
      "level" -> {:level, user.level}
      "streak" -> {:streak_days, user.streak_days}
      "karma" -> {:karma, user.karma}
      "messages" -> {:total_messages_sent, user.total_messages_sent}
      "posts" -> {:total_posts_created, user.total_posts_created}
      _ -> {:xp, user.xp}
    end

    count = from(u in User,
      where: u.is_active == true and field(u, ^field) > ^value)
    |> Repo.aggregate(:count)

    count + 1
  end

  defp get_user_friends_rank(user_id) do
    alias CGraph.Accounts.Friendship

    # Get user's friend count
    user_friend_count =
      from(f in Friendship,
        where: (f.user_id == ^user_id or f.friend_id == ^user_id) and f.status == "accepted"
      )
      |> Repo.aggregate(:count)

    # Count users with more friends
    friend_counts = from f in Friendship,
      where: f.status == "accepted",
      group_by: f.user_id,
      select: %{user_id: f.user_id, count: count(f.id)}

    count_with_more =
      from(u in User,
        left_join: fc in subquery(friend_counts), on: fc.user_id == u.id,
        where: u.is_active == true and coalesce(fc.count, 0) > ^user_friend_count
      )
      |> Repo.aggregate(:count)

    count_with_more + 1
  end

  # ==================== USER STATS ====================

  @doc """
  Get complete gamification stats for a user.
  """
  def get_user_stats(user_id) do
    user = Repo.get!(User, user_id)

    unlocked_achievements =
      from(ua in UserAchievement,
        where: ua.user_id == ^user_id and ua.unlocked == true)
      |> Repo.aggregate(:count)

    total_achievements = Repo.aggregate(Achievement, :count)

    active_quests =
      from(uq in UserQuest,
        where: uq.user_id == ^user_id and uq.claimed == false)
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

  # ==================== CURRENCY MANAGEMENT ====================

  @doc """
  Add currency to a user's account.
  """
  def add_currency(%User{} = user, amount, currency_type) when amount > 0 do
    case currency_type do
      :coins ->
        new_coins = user.coins + amount
        user
        |> Ecto.Changeset.change(%{coins: new_coins})
        |> Repo.update()
      _ ->
        {:error, :invalid_currency_type}
    end
  end

  def add_currency(user_id, amount, currency_type) when is_binary(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> add_currency(user, amount, currency_type)
    end
  end

  @doc """
  Deduct currency from a user's account.
  """
  def deduct_currency(%User{} = user, amount, currency_type) when amount > 0 do
    case currency_type do
      :coins when user.coins >= amount ->
        new_coins = user.coins - amount
        user
        |> Ecto.Changeset.change(%{coins: new_coins})
        |> Repo.update()
      :coins ->
        {:error, :insufficient_funds}
      _ ->
        {:error, :invalid_currency_type}
    end
  end

  def deduct_currency(user_id, amount, currency_type) when is_binary(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> deduct_currency(user, amount, currency_type)
    end
  end

  @doc """
  Add XP to a user (simplified version).
  """
  def add_xp(user_id, amount) when is_binary(user_id) and amount > 0 do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> award_xp(user, amount, :manual)
    end
  end

  # ==================== TITLE & BORDER UNLOCKS ====================

  @doc """
  Unlock a title for a user.
  """
  def unlock_title(user_id, title_id) do
    case Repo.get(Title, title_id) do
      nil -> {:error, :title_not_found}
      _title ->
        %UserTitle{}
        |> UserTitle.changeset(%{user_id: user_id, title_id: title_id})
        |> Repo.insert(on_conflict: :nothing)
    end
  end

  @doc """
  Unlock a border for a user.
  """
  def unlock_border(user_id, border_id) do
    # Placeholder - would need UserBorder schema
    {:ok, %{user_id: user_id, border_id: border_id}}
  end

  # ==================== EVENTS ====================

  @doc """
  List active events.
  """
  def list_active_events do
    alias CGraph.Gamification.SeasonalEvent

    now = DateTime.utc_now()

    query = from e in SeasonalEvent,
      where: e.is_active == true,
      where: e.starts_at <= ^now,
      where: e.ends_at > ^now,
      order_by: [asc: e.sort_order, desc: e.featured]

    Repo.all(query)
  end

  @doc """
  List upcoming events.
  """
  def list_upcoming_events(days \\ 7) do
    alias CGraph.Gamification.SeasonalEvent

    now = DateTime.utc_now()
    future = DateTime.add(now, days * 24 * 60 * 60, :second)

    query = from e in SeasonalEvent,
      where: e.is_active == true,
      where: e.starts_at > ^now,
      where: e.starts_at <= ^future,
      order_by: [asc: e.starts_at]

    Repo.all(query)
  end

  @doc """
  Get an event by ID.
  """
  def get_event(event_id) do
    alias CGraph.Gamification.SeasonalEvent
    Repo.get(SeasonalEvent, event_id)
  end

  @doc """
  Get user's progress in an event.
  """
  def get_user_event_progress(user_id, event_id) do
    alias CGraph.Gamification.UserEventProgress

    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil ->
        {:error, :not_found}
      progress ->
        {:ok, %{
          joined: true,
          event_points: progress.event_points || 0,
          battle_pass_tier: progress.battle_pass_tier || 0,
          has_battle_pass: progress.has_battle_pass || false,
          quests_completed: length(progress.quests_completed || []),
          rewards_claimed: progress.rewards_claimed || [],
          leaderboard_points: progress.leaderboard_points || 0
        }}
    end
  end

  @doc """
  Get user's rank in an event.
  """
  def get_user_event_rank(user_id, event_id) do
    alias CGraph.Gamification.UserEventProgress

    query = """
    SELECT rank FROM (
      SELECT user_id, RANK() OVER (ORDER BY leaderboard_points DESC) as rank
      FROM user_event_progress
      WHERE seasonal_event_id = $1
    ) ranked
    WHERE user_id = $2
    """

    case Repo.query(query, [Ecto.UUID.dump!(event_id), Ecto.UUID.dump!(user_id)]) do
      {:ok, %{rows: [[rank]]}} -> {:ok, rank}
      _ -> {:ok, nil}
    end
  end

  @doc """
  Get event quests for a user.
  """
  def get_event_quests(_user_id, _event_id) do
    []
  end

  @doc """
  Get battle pass info for a user.
  """
  def get_battle_pass_info(event_id, user_id) do
    alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}

    case {Repo.get(SeasonalEvent, event_id), Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id)} do
      {nil, _} ->
        {:error, :event_not_found}
      {event, nil} ->
        {:ok, %{
          current_tier: 0,
          max_tier: length(event.battle_pass_tiers || []),
          xp: 0,
          xp_to_next_tier: 1000,
          is_premium: false,
          rewards_available: [],
          tiers: event.battle_pass_tiers || []
        }}
      {event, progress} ->
        {:ok, %{
          current_tier: progress.battle_pass_tier || 0,
          max_tier: length(event.battle_pass_tiers || []),
          xp: progress.battle_pass_xp || 0,
          xp_to_next_tier: calculate_xp_to_next_tier(progress.battle_pass_xp || 0),
          is_premium: progress.has_battle_pass || false,
          rewards_available: get_available_tier_rewards(progress, event),
          tiers: event.battle_pass_tiers || []
        }}
    end
  end

  defp calculate_xp_to_next_tier(current_xp) do
    xp_per_tier = 1000
    tier = div(current_xp, xp_per_tier)
    next_tier_xp = (tier + 1) * xp_per_tier
    next_tier_xp - current_xp
  end

  defp get_available_tier_rewards(progress, event) do
    tiers = event.battle_pass_tiers || []
    current_tier = progress.battle_pass_tier || 0
    claimed_free = progress.claimed_free_rewards || []
    claimed_premium = progress.claimed_premium_rewards || []

    0..current_tier
    |> Enum.flat_map(fn tier_idx ->
      tier_data = Enum.at(tiers, tier_idx) || %{}
      free_rewards = if tier_idx in claimed_free, do: [], else: tier_data["free_rewards"] || []
      premium_rewards = if progress.has_battle_pass and tier_idx not in claimed_premium do
        tier_data["premium_rewards"] || []
      else
        []
      end
      free_rewards ++ premium_rewards
    end)
  end

  @doc """
  Claim an event reward.
  """
  def claim_event_reward(user_id, event_id, tier, reward_type) do
    alias CGraph.Gamification.UserEventProgress

    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil ->
        {:error, :not_joined}
      progress when progress.battle_pass_tier < tier ->
        {:error, :tier_not_reached}
      progress ->
        case reward_type do
          "free" ->
            if tier in (progress.claimed_free_rewards || []) do
              {:error, :already_claimed}
            else
              new_claimed = [tier | progress.claimed_free_rewards || []]
              {:ok, _} = progress
              |> Ecto.Changeset.change(%{claimed_free_rewards: new_claimed})
              |> Repo.update()
              {:ok, %{tier: tier, type: "free", claimed: true}}
            end
          "premium" when progress.has_battle_pass ->
            if tier in (progress.claimed_premium_rewards || []) do
              {:error, :already_claimed}
            else
              new_claimed = [tier | progress.claimed_premium_rewards || []]
              {:ok, _} = progress
              |> Ecto.Changeset.change(%{claimed_premium_rewards: new_claimed})
              |> Repo.update()
              {:ok, %{tier: tier, type: "premium", claimed: true}}
            end
          "premium" ->
            {:error, :no_battle_pass}
          _ ->
            {:error, :invalid_reward_type}
        end
    end
  end

  @doc """
  Get event leaderboard (2-arg version for backward compatibility).
  """
  def get_event_leaderboard(event_id, limit) when is_integer(limit) do
    get_event_leaderboard(event_id, limit, 0)
  end

  # ==================== PRESTIGE ====================

  @doc """
  Get user's prestige info.
  """
  def get_user_prestige(user_id) do
    alias CGraph.Gamification.UserPrestige

    case Repo.get_by(UserPrestige, user_id: user_id) do
      nil ->
        {:ok, %{
          level: 0,
          total_prestiges: 0,
          xp_multiplier: 1.0,
          coin_multiplier: 1.0,
          karma_multiplier: 1.0,
          bonuses: [],
          prestige_xp: 0,
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

  @doc """
  Get prestige leaderboard.
  """
  def get_prestige_leaderboard(_opts \\ []) do
    []
  end

  # ==================== COMMUNITY ====================

  @doc """
  Get community milestones.
  """
  def get_community_milestones(event_id) when is_binary(event_id) do
    alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}

    # Get event to retrieve milestone config
    case Repo.get(SeasonalEvent, event_id) do
      nil ->
        {:ok, %{current_total: 0, milestones: [], next_milestone: nil}}
      event ->
        # Calculate total points from all participants
        total_query = from p in UserEventProgress,
          where: p.seasonal_event_id == ^event_id,
          select: sum(p.event_points)

        total_points = Repo.one(total_query) || 0

        milestones = event.milestone_rewards || []

        # Find the next uncompleted milestone
        next_milestone = Enum.find(milestones, fn m ->
          m["points_required"] > total_points
        end)

        {:ok, %{
          current_total: total_points,
          milestones: milestones,
          next_milestone: next_milestone
        }}
    end
  end

  def get_community_milestones(_opts) do
    {:ok, %{
      current_total: 0,
      milestones: [],
      next_milestone: nil
    }}
  end

  # ==================== ADDITIONAL MISSING FUNCTIONS ====================

  @doc """
  Get XP leaderboard.
  """
  def get_xp_leaderboard(_limit \\ 10) do
    []
  end

  @doc """
  Purchase battle pass for an event.
  """
  def purchase_battle_pass(user_id, event_id) do
    alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}

    with event when not is_nil(event) <- Repo.get(SeasonalEvent, event_id),
         true <- event.has_battle_pass,
         progress when not is_nil(progress) <- Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id),
         false <- progress.has_battle_pass,
         {:ok, _} <- deduct_currency(user_id, "gems", event.battle_pass_cost) do

      {:ok, updated} = progress
      |> UserEventProgress.purchase_battle_pass_changeset()
      |> Repo.update()

      {:ok, %{
        success: true,
        has_battle_pass: true,
        tier: updated.battle_pass_tier
      }}
    else
      nil -> {:error, :not_found}
      false -> {:error, :no_battle_pass_available}
      true -> {:error, :already_purchased}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Update quest progress (4-arg version).
  """
  def update_quest_progress(user_id, event_id, quest_id, progress_increment) do
    alias CGraph.Gamification.UserEventProgress

    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil ->
        {:error, :not_joined}
      progress ->
        # Check if quest is already completed
        if quest_id in (progress.quests_completed || []) do
          {:ok, %{quest_id: quest_id, status: :already_completed}}
        else
          # For now, mark as completed immediately
          # In a full implementation, you'd track incremental progress
          new_completed = [quest_id | progress.quests_completed || []]
          new_points = (progress.event_points || 0) + progress_increment

          {:ok, _} = progress
          |> Ecto.Changeset.change(%{
            quests_completed: new_completed,
            event_points: new_points,
            leaderboard_points: (progress.leaderboard_points || 0) + progress_increment
          })
          |> Repo.update()

          {:ok, %{quest_id: quest_id, status: :completed, points_earned: progress_increment}}
        end
    end
  end

  @doc """
  Get event leaderboard using cursor-based pagination.

  For leaderboard display, accepts cursor for stable pagination.
  Rank is computed from cursor position + result index.
  """
  def get_event_leaderboard(event_id, limit, cursor_or_offset) when is_integer(limit) do
    alias CGraph.Gamification.UserEventProgress

    base_query = from p in UserEventProgress,
      join: u in assoc(p, :user),
      where: p.seasonal_event_id == ^event_id,
      select: %{
        id: p.id,
        user_id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        points: p.leaderboard_points,
        battle_pass_tier: p.battle_pass_tier
      }

    pagination_opts = %{
      cursor: if(is_binary(cursor_or_offset), do: cursor_or_offset, else: nil),
      after_cursor: nil,
      before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :leaderboard_points,
      sort_direction: :desc,
      include_total: false
    }

    {entries, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)

    entries_with_rank = entries
    |> Enum.with_index(1)
    |> Enum.map(fn {entry, idx} -> Map.put(entry, :rank, idx) end)

    {entries_with_rank, page_info}
  end
end
