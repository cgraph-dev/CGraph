defmodule CGraph.Factory do
  @moduledoc """
  ExMachina factory for generating test data.

  Provides a consistent way to generate test data using the Factory Pattern.
  Use `build/2` for unsaved records and `insert/2` for saved records.

  ## Examples

      # Build an unsaved user
      user = build(:user)

      # Build with custom attributes
      user = build(:user, email: "custom@example.com")

      # Insert into database
      user = insert(:user)

      # Build a list
      users = build_list(5, :user)

      # Build with associations
      message = insert(:message, sender: insert(:user))
  """

  use ExMachina.Ecto, repo: CGraph.Repo

  alias CGraph.Accounts.{User, UsernameChange}
  alias CGraph.Messaging.{Conversation, Message, Reaction}
  alias CGraph.Groups.{Group, Member}
  alias CGraph.Forums.{Forum, Board, Thread, Post, Subscription}
  alias CGraph.Gamification.{Achievement, UserAchievement, Quest, UserQuest}

  # ============================================================================
  # User Factories
  # ============================================================================

  def user_factory do
    %User{
      email: sequence(:email, &"user#{&1}@example.com"),
      username: sequence(:username, &"user_#{&1}"),
      password_hash: Argon2.hash_pwd_salt("ValidPassword123!"),
      display_name: sequence(:display_name, &"Test User #{&1}"),
      bio: "This is a test user bio",
      avatar_url: nil,
      is_admin: false,
      is_verified: false,
      is_premium: false,
      xp: 0,
      level: 1,
      coins: 0,
      streak_days: 0,
      last_active_at: DateTime.utc_now(),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def admin_factory do
    build(:user, is_admin: true)
  end

  def premium_user_factory do
    build(:user,
      is_premium: true,
      coins: 1000
    )
  end

  def premium_plus_user_factory do
    build(:user,
      is_premium: true,
      coins: 5000
    )
  end

  def verified_user_factory do
    build(:user, is_verified: true)
  end

  def high_level_user_factory do
    build(:user,
      level: 50,
      xp: 125000,
      streak_days: 30
    )
  end

  def username_change_factory do
    user = build(:user)

    %UsernameChange{
      user: user,
      old_username: user.username,
      new_username: sequence(:new_username, &"new_username_#{&1}"),
      reason: nil,
      changed_by_admin: false
    }
  end

  # ============================================================================
  # Messaging Factories
  # ============================================================================

  def conversation_factory do
    user1 = build(:user)
    user2 = build(:user)
    %Conversation{
      user_one: user1,
      user_two: user2,
      is_encrypted: true,
      last_message_at: DateTime.utc_now(),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def group_conversation_factory do
    user1 = build(:user)
    user2 = build(:user)
    %Conversation{
      user_one: user1,
      user_two: user2,
      is_encrypted: true,
      last_message_at: DateTime.utc_now()
    }
  end

  def message_factory do
    %Message{
      content: sequence(:content, &"Test message content #{&1}"),
      content_type: "text",
      is_encrypted: false,
      is_edited: false,
      is_pinned: false,
      sender: build(:user),
      conversation: build(:conversation),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def encrypted_message_factory do
    build(:message,
      is_encrypted: true,
      content: Base.encode64(:crypto.strong_rand_bytes(64))
    )
  end

  def voice_message_factory do
    build(:message,
      content_type: "voice"
    )
  end

  def reaction_factory do
    %Reaction{
      emoji: Enum.random(["👍", "❤️", "😂", "🎉", "🔥", "👀"]),
      user: build(:user),
      message: build(:message)
    }
  end

  # ============================================================================
  # Group Factories
  # ============================================================================

  def group_factory do
    %Group{
      name: sequence(:group_name, &"Test Group #{&1}"),
      description: "A test group for unit testing",
      slug: sequence(:group_slug, &"test-group-#{&1}"),
      icon_url: nil,
      banner_url: nil,
      is_public: true,
      is_discoverable: true,
      member_count: 1,
      owner: build(:user),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def private_group_factory do
    build(:group, is_public: false)
  end

  def verified_group_factory do
    build(:group, is_discoverable: true)
  end

  def member_factory do
    %Member{
      nickname: nil,
      is_muted: false,
      is_banned: false,
      user: build(:user),
      group: build(:group),
      joined_at: DateTime.utc_now()
    }
  end

  def admin_member_factory do
    build(:member)
  end

  def moderator_member_factory do
    build(:member)
  end

  # ============================================================================
  # Forum Factories
  # ============================================================================

  def forum_factory do
    %Forum{
      name: sequence(:forum_name, &"Test Forum #{&1}"),
      description: "A test forum for unit testing",
      slug: sequence(:forum_slug, &"test-forum-#{&1}"),
      icon_url: nil,
      is_public: true,
      post_count: 0,
      thread_count: 0,
      owner: build(:user),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def private_forum_factory do
    build(:forum, is_public: false)
  end

  def board_factory do
    %Board{
      name: sequence(:board_name, &"Test Board #{&1}"),
      description: "A test board for unit testing",
      slug: sequence(:board_slug, &"test-board-#{&1}"),
      position: sequence(:board_position, & &1),
      is_locked: false,
      thread_count: 0,
      post_count: 0,
      forum: build(:forum),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def locked_board_factory do
    build(:board, is_locked: true)
  end

  def thread_factory do
    %Thread{
      title: sequence(:thread_title, &"Test Thread #{&1}"),
      content: "This is the content of a test thread for unit testing purposes.",
      slug: sequence(:thread_slug, &"test-thread-#{&1}"),
      is_pinned: false,
      is_locked: false,
      thread_type: "normal",
      view_count: 0,
      reply_count: 0,
      score: 0,
      author: build(:user),
      board: build(:board),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def pinned_thread_factory do
    build(:thread, is_pinned: true)
  end

  def locked_thread_factory do
    build(:thread, is_locked: true)
  end

  def announcement_thread_factory do
    build(:thread, thread_type: "announcement", is_pinned: true)
  end

  def popular_thread_factory do
    build(:thread,
      view_count: Enum.random(1000..10_000),
      reply_count: Enum.random(50..500),
      score: Enum.random(100..1000)
    )
  end

  def post_factory do
    %Post{
      content: sequence(:post_content, &"This is test post content #{&1}"),
      is_edited: false,
      score: 0,
      author: build(:user),
      forum: build(:forum),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def reply_post_factory(attrs \\ %{}) do
    parent = Map.get(attrs, :parent) || insert(:post)

    build(:post,
      forum: parent.forum
    )
  end

  def subscription_factory do
    %Subscription{
      notification_level: "all",
      user: build(:user),
      forum: build(:forum)
    }
  end

  def board_subscription_factory do
    build(:subscription)
  end

  def forum_subscription_factory do
    build(:subscription)
  end

  # ============================================================================
  # Gamification Factories
  # ============================================================================

  def achievement_factory do
    %Achievement{
      title: sequence(:achievement_name, &"Test Achievement #{&1}"),
      slug: sequence(:achievement_slug, &"test-achievement-#{&1}"),
      description: "Complete a test action to unlock this achievement",
      icon: "🏆",
      category: Enum.random(["messaging", "forums", "social", "special"]),
      xp_reward: Enum.random([50, 100, 250, 500]),
      coin_reward: Enum.random([0, 10, 25, 50]),
      rarity: Enum.random(["common", "uncommon", "rare", "epic", "legendary"]),
      is_hidden: false,
      max_progress: Enum.random([1, 5, 10, 25, 50]),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def hidden_achievement_factory do
    build(:achievement, is_hidden: true)
  end

  def legendary_achievement_factory do
    build(:achievement,
      rarity: "legendary",
      xp_reward: 1000,
      coin_reward: 100
    )
  end

  def user_achievement_factory do
    %UserAchievement{
      user: build(:user),
      achievement: build(:achievement),
      unlocked_at: DateTime.utc_now(),
      unlocked: true,
      progress: 100
    }
  end

  def featured_achievement_factory do
    build(:user_achievement)
  end

  def quest_factory do
    %Quest{
      title: sequence(:quest_title, &"Daily Quest #{&1}"),
      slug: sequence(:quest_slug, &"daily-quest-#{&1}"),
      description: "Complete this quest to earn rewards",
      type: Enum.random(["daily", "weekly", "special"]),
      xp_reward: Enum.random([25, 50, 100, 250]),
      coin_reward: Enum.random([5, 10, 25]),
      is_active: true,
      starts_at: DateTime.utc_now() |> DateTime.add(-1, :hour),
      ends_at: DateTime.utc_now() |> DateTime.add(23, :hour),
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def weekly_quest_factory do
    build(:quest,
      type: "weekly",
      xp_reward: Enum.random([250, 500, 1000]),
      ends_at: DateTime.utc_now() |> DateTime.add(7, :day)
    )
  end

  def user_quest_factory do
    %UserQuest{
      user: build(:user),
      quest: build(:quest),
      progress: %{},
      completed: false,
      claimed: false
    }
  end

  def completed_quest_factory do
    quest = build(:quest)

    build(:user_quest,
      quest: quest,
      progress: %{},
      completed: true,
      claimed: false,
      completed_at: DateTime.utc_now()
    )
  end

  # ============================================================================
  # Helper Functions
  # ============================================================================

  @doc """
  Create a user with a specific level and XP.
  """
  def user_with_level(level) do
    xp = calculate_xp_for_level(level)
    build(:user, level: level, xp: xp)
  end

  defp calculate_xp_for_level(level) do
    # XP formula: level^2 * 100
    level * level * 100
  end

  @doc """
  Create a conversation with participants already inserted.
  """
  def conversation_with_participants(participant_count \\ 2) do
    participants = insert_list(participant_count, :user)
    conversation = insert(:conversation)

    # Associate participants (implementation depends on your schema)
    # This is a placeholder - adjust based on actual associations
    {conversation, participants}
  end

  @doc """
  Create a thread with a specific number of posts.
  """
  def thread_with_posts(post_count \\ 5) do
    thread = insert(:thread)
    posts = insert_list(post_count, :post, forum: thread.board.forum)

    %{thread: thread, posts: posts}
  end

  @doc """
  Create a user with achievements unlocked.
  """
  def user_with_achievements(achievement_count \\ 3) do
    user = insert(:user)
    achievements = insert_list(achievement_count, :achievement)

    user_achievements = Enum.map(achievements, fn achievement ->
      insert(:user_achievement, user: user, achievement: achievement)
    end)

    %{user: user, achievements: achievements, user_achievements: user_achievements}
  end

  # ============================================================================
  # Cosmetics Factories (Gamification Enhancement)
  # ============================================================================

  def avatar_border_factory do
    %CGraph.Gamification.Cosmetics.AvatarBorder{
      name: sequence(:border_name, &"Border #{&1}"),
      slug: sequence(:border_slug, &"border-#{&1}"),
      description: "A beautiful avatar border",
      border_type: Enum.random([:static, :animated, :particle]),
      theme: Enum.random([:default, :premium, :seasonal, :achievement]),
      rarity: Enum.random([:common, :uncommon, :rare, :epic, :legendary]),
      config: %{
        "color" => "##{:crypto.strong_rand_bytes(3) |> Base.encode16()}",
        "thickness" => Enum.random([2, 3, 4]),
        "glow" => Enum.random([true, false])
      },
      animation_config: nil,
      preview_url: "/borders/preview/#{:rand.uniform(100)}.png",
      coin_price: Enum.random([100, 500, 1000, 2500, 5000]),
      gem_price: nil,
      is_purchasable: true,
      is_tradeable: true,
      is_limited: false,
      is_active: true,
      inserted_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now()
    }
  end

  def user_avatar_border_factory do
    %CGraph.Gamification.Cosmetics.UserAvatarBorder{
      user_id: nil,
      avatar_border_id: nil,
      is_equipped: false,
      is_favorite: false,
      acquired_at: DateTime.utc_now(),
      acquisition_source: Enum.random([:purchase, :achievement, :event, :gift]),
      trade_locked_until: nil
    }
  end

  def profile_theme_factory do
    %CGraph.Gamification.Cosmetics.ProfileTheme{
      name: sequence(:theme_name, &"Theme #{&1}"),
      slug: sequence(:theme_slug, &"theme-#{&1}"),
      description: "A stunning profile theme",
      theme_type: Enum.random([:color, :gradient, :image, :animated]),
      category: Enum.random([:minimal, :vibrant, :dark, :light]),
      rarity: Enum.random([:common, :uncommon, :rare, :epic, :legendary]),
      config: %{
        "background" => "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "accent_color" => "#ffffff"
      },
      preview_url: "/themes/preview/#{:rand.uniform(100)}.png",
      coin_price: Enum.random([500, 1000, 2500, 5000]),
      is_purchasable: true,
      is_tradeable: true,
      is_active: true
    }
  end

  def chat_effect_factory do
    %CGraph.Gamification.Cosmetics.ChatEffect{
      name: sequence(:effect_name, &"Effect #{&1}"),
      slug: sequence(:effect_slug, &"effect-#{&1}"),
      description: "An eye-catching chat effect",
      effect_type: Enum.random([:message, :bubble, :typing, :reaction]),
      category: Enum.random([:fun, :elegant, :festive]),
      rarity: Enum.random([:common, :uncommon, :rare, :epic]),
      config: %{
        "particle_count" => Enum.random([5, 10, 15, 20]),
        "color" => "##{:crypto.strong_rand_bytes(3) |> Base.encode16()}"
      },
      preview_url: "/effects/preview/#{:rand.uniform(100)}.gif",
      coin_price: Enum.random([100, 250, 500, 1000]),
      is_purchasable: true,
      is_active: true
    }
  end

  # ============================================================================
  # Prestige System Factories
  # ============================================================================

  def user_prestige_factory do
    %CGraph.Gamification.Prestige.UserPrestige{
      user_id: nil,
      prestige_level: 0,
      total_prestiges: 0,
      xp_multiplier: Decimal.new("1.00"),
      coin_multiplier: Decimal.new("1.00"),
      total_xp_earned: 0,
      total_coins_earned: 0,
      exclusive_rewards_unlocked: [],
      prestige_title: nil,
      last_prestige_at: nil
    }
  end

  def prestige_reward_factory do
    %CGraph.Gamification.Prestige.PrestigeReward{
      prestige_level: sequence(:prestige_level, & &1),
      reward_type: Enum.random([:avatar_border, :profile_theme, :title, :coins]),
      reward_id: Ecto.UUID.generate(),
      reward_name: sequence(:reward_name, &"Prestige Reward #{&1}"),
      reward_description: "Exclusive prestige reward",
      reward_config: %{},
      is_active: true
    }
  end

  # ============================================================================
  # Seasonal Events Factories
  # ============================================================================

  def seasonal_event_factory do
    start_date = DateTime.add(DateTime.utc_now(), -Enum.random(1..7), :day)
    end_date = DateTime.add(start_date, Enum.random(14..60), :day)

    %CGraph.Gamification.Events.SeasonalEvent{
      name: sequence(:event_name, &"Seasonal Event #{&1}"),
      slug: sequence(:event_slug, &"event-#{&1}"),
      description: "An exciting seasonal event!",
      event_type: Enum.random([:seasonal, :holiday, :anniversary, :competition]),
      status: :draft,
      starts_at: start_date,
      ends_at: end_date,
      config: %{
        "xp_multiplier" => Enum.random([1.5, 2.0, 2.5]),
        "primary_color" => "#8B5CF6",
        "secondary_color" => "#EC4899",
        "battle_pass_enabled" => true,
        "leaderboard_enabled" => true,
        "max_battle_pass_tier" => 50
      },
      exclusive_rewards: [],
      total_participants: 0
    }
  end

  def active_event_factory do
    struct!(
      seasonal_event_factory(),
      %{
        status: :active,
        starts_at: DateTime.add(DateTime.utc_now(), -1, :day),
        ends_at: DateTime.add(DateTime.utc_now(), 14, :day)
      }
    )
  end

  def user_event_progress_factory do
    %CGraph.Gamification.Events.UserEventProgress{
      user_id: nil,
      event_id: nil,
      event_xp: 0,
      battle_pass_tier: 0,
      has_premium_pass: false,
      leaderboard_rank: nil,
      leaderboard_score: 0,
      quests_completed: 0,
      claimed_tiers: [],
      bonus_rewards_claimed: [],
      last_activity_at: DateTime.utc_now()
    }
  end

  def battle_pass_tier_factory do
    %CGraph.Gamification.Events.BattlePassTier{
      event_id: nil,
      tier_number: sequence(:tier_number, & &1),
      xp_required: sequence(:tier_xp, &(&1 * 1000)),
      free_reward_type: Enum.random([:coins, :xp_boost, :cosmetic]),
      free_reward_config: %{"amount" => Enum.random([100, 250, 500])},
      premium_reward_type: Enum.random([:avatar_border, :profile_theme, :chat_effect]),
      premium_reward_config: %{"rarity" => Enum.random(["rare", "epic", "legendary"])},
      is_active: true
    }
  end

  # ============================================================================
  # Marketplace Factories
  # ============================================================================

  def marketplace_listing_factory do
    %CGraph.Gamification.Marketplace.MarketplaceListing{
      seller_id: nil,
      item_type: Enum.random([:avatar_border, :profile_theme, :chat_effect]),
      item_id: Ecto.UUID.generate(),
      item_name: sequence(:item_name, &"Item #{&1}"),
      item_rarity: Enum.random([:common, :uncommon, :rare, :epic, :legendary]),
      item_preview_url: "/items/preview/#{:rand.uniform(100)}.png",
      price: Enum.random([500, 1000, 2500, 5000, 10000]),
      currency: :coins,
      status: :active,
      accepts_trades: Enum.random([true, false]),
      listed_at: DateTime.utc_now(),
      expires_at: DateTime.add(DateTime.utc_now(), 30, :day),
      flagged: false,
      risk_score: 0,
      view_count: 0,
      favorite_count: 0
    }
  end

  def marketplace_transaction_factory do
    %CGraph.Gamification.Marketplace.MarketplaceTransaction{
      listing_id: nil,
      buyer_id: nil,
      seller_id: nil,
      item_type: :avatar_border,
      item_id: Ecto.UUID.generate(),
      item_name: sequence(:tx_item_name, &"Sold Item #{&1}"),
      price: Enum.random([500, 1000, 2500, 5000]),
      currency: :coins,
      fee_amount: 0,
      seller_proceeds: 0,
      status: :completed,
      completed_at: DateTime.utc_now()
    }
  end

  # ============================================================================
  # Helper Functions for Gamification
  # ============================================================================

  @doc """
  Create a user with complete gamification profile.
  """
  def user_with_gamification(opts \\ []) do
    user = insert(:user, opts)
    
    # Add prestige
    insert(:user_prestige, user_id: user.id)
    
    # Add some owned cosmetics
    borders = insert_list(Keyword.get(opts, :border_count, 3), :avatar_border)
    Enum.each(borders, fn border ->
      insert(:user_avatar_border, user_id: user.id, avatar_border_id: border.id)
    end)
    
    user
  end

  @doc """
  Create an event with full battle pass structure.
  """
  def event_with_battle_pass(tier_count \\ 50) do
    event = insert(:active_event)
    
    Enum.each(1..tier_count, fn tier_num ->
      insert(:battle_pass_tier, 
        event_id: event.id, 
        tier_number: tier_num, 
        xp_required: tier_num * 1000
      )
    end)
    
    event
  end

  @doc """
  Create a marketplace with active listings.
  """
  def marketplace_with_listings(listing_count \\ 10) do
    sellers = insert_list(3, :user)
    
    listings = Enum.map(1..listing_count, fn _ ->
      seller = Enum.random(sellers)
      insert(:marketplace_listing, seller_id: seller.id)
    end)
    
    %{sellers: sellers, listings: listings}
  end
end
