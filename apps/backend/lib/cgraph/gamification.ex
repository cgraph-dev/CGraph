defmodule Cgraph.Gamification do
  @moduledoc """
  The Gamification context.
  
  Handles XP progression, achievements, quests, titles, shop items,
  coin transactions, and leaderboards.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  alias Cgraph.Gamification.{
    Achievement,
    UserAchievement,
    Quest,
    UserQuest,
    Title,
    UserTitle,
    ShopItem,
    UserPurchase,
    CoinTransaction,
    XpTransaction
  }

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
    
    cond do
      xp >= xp_at_mid -> find_level(xp, mid + 1, max_level)
      true -> find_level(xp, min_level, mid)
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
  Spend coins from a user's balance.
  Returns {:ok, user} or {:error, :insufficient_funds}
  """
  def spend_coins(%User{} = user, amount, type, opts \\ []) when amount > 0 do
    if user.coins < amount do
      {:error, :insufficient_funds}
    else
      description = Keyword.get(opts, :description)
      reference_type = Keyword.get(opts, :reference_type)
      reference_id = Keyword.get(opts, :reference_id)
      
      new_balance = user.coins - amount

      Repo.transaction(fn ->
        {:ok, updated_user} = 
          user
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
      end)
    end
  end

  @doc """
  Get coin transaction history for a user.
  """
  def list_coin_transactions(user_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    CoinTransaction
    |> where([t], t.user_id == ^user_id)
    |> order_by([t], desc: t.inserted_at)
    |> limit(^limit)
    |> offset(^offset)
    |> Repo.all()
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
      {:ok, final_user, _} = award_xp(updated_user, 25, "daily_login", 
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
      not ShopItem.is_available?(item) ->
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
  """
  def get_leaderboard(category, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)
    offset = Keyword.get(opts, :offset, 0)

    query = case category do
      "xp" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.xp],
          select: %{id: u.id, username: u.username, value: u.xp, level: u.level}
      
      "level" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.level, desc: u.xp],
          select: %{id: u.id, username: u.username, value: u.level, xp: u.xp}
      
      "streak" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.streak_days],
          select: %{id: u.id, username: u.username, value: u.streak_days, longest: u.streak_longest}
      
      "karma" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.karma],
          select: %{id: u.id, username: u.username, value: u.karma}
      
      "messages" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.total_messages_sent],
          select: %{id: u.id, username: u.username, value: u.total_messages_sent}
      
      "posts" ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.total_posts_created],
          select: %{id: u.id, username: u.username, value: u.total_posts_created}
      
      _ ->
        from u in User,
          where: u.is_active == true,
          order_by: [desc: u.xp],
          select: %{id: u.id, username: u.username, value: u.xp, level: u.level}
    end

    entries = 
      query
      |> limit(^limit)
      |> offset(^offset)
      |> Repo.all()

    # Add rank numbers
    entries
    |> Enum.with_index(offset + 1)
    |> Enum.map(fn {entry, rank} -> Map.put(entry, :rank, rank) end)
  end

  @doc """
  Get a user's rank in a specific leaderboard category.
  """
  def get_user_rank(user_id, category) do
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
end
