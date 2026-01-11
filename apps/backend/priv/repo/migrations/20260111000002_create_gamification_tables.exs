defmodule Cgraph.Repo.Migrations.CreateGamificationTables do
  @moduledoc """
  Creates gamification system tables for achievements, quests, and user progression.
  
  Features:
  - User XP and level progression
  - Achievement definitions and user unlocks
  - Daily/weekly quest system
  - Streak tracking
  - Virtual currency (coins)
  - Premium subscriptions
  """
  use Ecto.Migration

  def up do
    # ==================== USER PROGRESSION ====================
    # Extend users table with gamification fields
    alter table(:users) do
      add :xp, :integer, default: 0, null: false
      add :level, :integer, default: 1, null: false
      add :coins, :integer, default: 0, null: false
      add :streak_days, :integer, default: 0, null: false
      add :streak_last_claimed, :date
      add :streak_longest, :integer, default: 0, null: false
      add :equipped_title_id, :binary_id
      add :equipped_badge_ids, {:array, :binary_id}, default: []
      add :subscription_tier, :string, default: "free"
      add :subscription_expires_at, :utc_datetime
      add :daily_bonus_claimed_at, :date
      add :total_messages_sent, :integer, default: 0, null: false
      add :total_posts_created, :integer, default: 0, null: false
    end

    create index(:users, [:xp], name: :users_xp_index)
    create index(:users, [:level], name: :users_level_index)
    create index(:users, [:streak_days], name: :users_streak_index)
    create index(:users, [:subscription_tier], name: :users_subscription_index)

    # ==================== ACHIEVEMENTS ====================
    create table(:achievements, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :title, :string, null: false
      add :description, :text, null: false
      add :category, :string, null: false  # social, content, exploration, mastery, legendary, secret
      add :rarity, :string, null: false    # common, uncommon, rare, epic, legendary, mythic
      add :icon, :string, null: false
      add :xp_reward, :integer, default: 0, null: false
      add :coin_reward, :integer, default: 0, null: false
      add :max_progress, :integer, default: 1, null: false
      add :is_hidden, :boolean, default: false, null: false
      add :title_reward, :string  # Optional unlockable title
      add :badge_reward, :string  # Optional unlockable badge
      add :sort_order, :integer, default: 0, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:achievements, [:slug])
    create index(:achievements, [:category])
    create index(:achievements, [:rarity])

    # ==================== USER ACHIEVEMENTS ====================
    create table(:user_achievements, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :achievement_id, references(:achievements, type: :binary_id, on_delete: :delete_all), null: false
      add :progress, :integer, default: 0, null: false
      add :unlocked, :boolean, default: false, null: false
      add :unlocked_at, :utc_datetime
      add :notified, :boolean, default: false, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:user_achievements, [:user_id, :achievement_id])
    create index(:user_achievements, [:user_id])
    create index(:user_achievements, [:achievement_id])
    create index(:user_achievements, [:unlocked])

    # ==================== QUESTS ====================
    create table(:quests, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :title, :string, null: false
      add :description, :text, null: false
      add :type, :string, null: false  # daily, weekly, monthly, seasonal, special
      add :xp_reward, :integer, default: 0, null: false
      add :coin_reward, :integer, default: 0, null: false
      add :objectives, :map, default: %{}, null: false  # JSON array of objectives
      add :is_active, :boolean, default: true, null: false
      add :starts_at, :utc_datetime
      add :ends_at, :utc_datetime
      add :repeatable, :boolean, default: false, null: false
      add :sort_order, :integer, default: 0, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:quests, [:slug])
    create index(:quests, [:type])
    create index(:quests, [:is_active])
    create index(:quests, [:starts_at, :ends_at])

    # ==================== USER QUESTS ====================
    create table(:user_quests, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :quest_id, references(:quests, type: :binary_id, on_delete: :delete_all), null: false
      add :progress, :map, default: %{}, null: false  # JSON object with objective progress
      add :completed, :boolean, default: false, null: false
      add :completed_at, :utc_datetime
      add :claimed, :boolean, default: false, null: false
      add :claimed_at, :utc_datetime
      add :expires_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:user_quests, [:user_id])
    create index(:user_quests, [:quest_id])
    create index(:user_quests, [:user_id, :completed])
    create index(:user_quests, [:expires_at])

    # ==================== TITLES ====================
    create table(:titles, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :name, :string, null: false
      add :description, :text
      add :color, :string, default: "#ffffff", null: false
      add :rarity, :string, null: false
      add :unlock_type, :string, null: false  # achievement, level, purchase, event
      add :unlock_requirement, :string  # achievement_slug, level number, or coin cost
      add :is_purchasable, :boolean, default: false, null: false
      add :coin_cost, :integer, default: 0
      add :sort_order, :integer, default: 0, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:titles, [:slug])

    # ==================== USER TITLES ====================
    create table(:user_titles, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :title_id, references(:titles, type: :binary_id, on_delete: :delete_all), null: false
      add :unlocked_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:user_titles, [:user_id, :title_id])
    create index(:user_titles, [:user_id])

    # ==================== SHOP ITEMS ====================
    create table(:shop_items, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :name, :string, null: false
      add :description, :text
      add :category, :string, null: false  # theme, badge, effect, boost, bundle
      add :type, :string, null: false      # consumable, permanent, subscription
      add :icon, :string
      add :preview_url, :string
      add :coin_cost, :integer, default: 0, null: false
      add :premium_only, :boolean, default: false, null: false
      add :is_active, :boolean, default: true, null: false
      add :limited_quantity, :integer  # null = unlimited
      add :sold_count, :integer, default: 0, null: false
      add :metadata, :map, default: %{}
      add :sort_order, :integer, default: 0, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:shop_items, [:slug])
    create index(:shop_items, [:category])
    create index(:shop_items, [:is_active])

    # ==================== USER PURCHASES ====================
    create table(:user_purchases, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :item_id, references(:shop_items, type: :binary_id, on_delete: :restrict), null: false
      add :quantity, :integer, default: 1, null: false
      add :coin_spent, :integer, null: false
      add :purchased_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:user_purchases, [:user_id])
    create index(:user_purchases, [:item_id])

    # ==================== COIN TRANSACTIONS ====================
    create table(:coin_transactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :amount, :integer, null: false  # Positive = earned, Negative = spent
      add :balance_after, :integer, null: false
      add :type, :string, null: false  # purchase, reward, daily_bonus, achievement, quest, gift, refund
      add :description, :string
      add :reference_type, :string  # shop_item, achievement, quest, etc.
      add :reference_id, :binary_id
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    create index(:coin_transactions, [:user_id])
    create index(:coin_transactions, [:type])
    create index(:coin_transactions, [:inserted_at])

    # ==================== XP TRANSACTIONS ====================
    create table(:xp_transactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :amount, :integer, null: false
      add :total_after, :integer, null: false
      add :level_after, :integer, null: false
      add :source, :string, null: false  # message, post, comment, achievement, quest, daily_login, etc.
      add :description, :string
      add :multiplier, :decimal, default: 1.0
      add :reference_type, :string
      add :reference_id, :binary_id

      timestamps(type: :utc_datetime)
    end

    create index(:xp_transactions, [:user_id])
    create index(:xp_transactions, [:source])
    create index(:xp_transactions, [:inserted_at])

    # ==================== SEED DEFAULT ACHIEVEMENTS ====================
    execute """
    INSERT INTO achievements (id, slug, title, description, category, rarity, icon, xp_reward, coin_reward, max_progress, is_hidden, sort_order, inserted_at, updated_at) VALUES
    (gen_random_uuid(), 'first_message', 'Hello World', 'Send your first message', 'social', 'common', '💬', 50, 10, 1, false, 1, NOW(), NOW()),
    (gen_random_uuid(), 'conversation_starter', 'Conversation Starter', 'Start 10 conversations', 'social', 'uncommon', '🗣️', 150, 25, 10, false, 2, NOW(), NOW()),
    (gen_random_uuid(), 'social_butterfly', 'Social Butterfly', 'Make 25 friends', 'social', 'rare', '🦋', 500, 100, 25, false, 3, NOW(), NOW()),
    (gen_random_uuid(), 'first_post', 'Voice Heard', 'Create your first forum post', 'content', 'common', '📝', 75, 15, 1, false, 10, NOW(), NOW()),
    (gen_random_uuid(), 'prolific_writer', 'Prolific Writer', 'Create 50 forum posts', 'content', 'rare', '✍️', 750, 150, 50, false, 11, NOW(), NOW()),
    (gen_random_uuid(), 'helpful_soul', 'Helpful Soul', 'Receive 100 upvotes on comments', 'content', 'epic', '🌟', 1500, 300, 100, false, 12, NOW(), NOW()),
    (gen_random_uuid(), 'week_warrior', 'Week Warrior', 'Maintain a 7-day login streak', 'mastery', 'uncommon', '🔥', 200, 50, 7, false, 20, NOW(), NOW()),
    (gen_random_uuid(), 'month_master', 'Month Master', 'Maintain a 30-day login streak', 'mastery', 'epic', '💎', 1000, 500, 30, false, 21, NOW(), NOW()),
    (gen_random_uuid(), 'year_legend', 'Year Legend', 'Maintain a 365-day login streak', 'mastery', 'legendary', '👑', 10000, 5000, 365, false, 22, NOW(), NOW()),
    (gen_random_uuid(), 'explorer', 'Explorer', 'Visit 10 different forums', 'exploration', 'common', '🧭', 100, 20, 10, false, 30, NOW(), NOW()),
    (gen_random_uuid(), 'night_owl', 'Night Owl', 'Be active between 2-4 AM', 'secret', 'rare', '🦉', 250, 100, 1, true, 100, NOW(), NOW()),
    (gen_random_uuid(), 'early_adopter', 'Early Adopter', 'Join during the first year', 'legendary', 'legendary', '🚀', 5000, 1000, 1, false, 200, NOW(), NOW())
    """

    # ==================== SEED DEFAULT QUESTS ====================
    execute """
    INSERT INTO quests (id, slug, title, description, type, xp_reward, coin_reward, objectives, is_active, repeatable, sort_order, inserted_at, updated_at) VALUES
    (gen_random_uuid(), 'daily_messenger', 'Daily Messenger', 'Send messages to stay connected', 'daily', 100, 25, '{"objectives": [{"id": "send_messages", "description": "Send 5 messages", "type": "count", "target": 5}]}', true, true, 1, NOW(), NOW()),
    (gen_random_uuid(), 'daily_reader', 'Daily Reader', 'Browse the forums', 'daily', 50, 10, '{"objectives": [{"id": "view_posts", "description": "View 3 forum posts", "type": "count", "target": 3}]}', true, true, 2, NOW(), NOW()),
    (gen_random_uuid(), 'daily_voter', 'Community Supporter', 'Vote on content', 'daily', 75, 15, '{"objectives": [{"id": "cast_votes", "description": "Vote on 5 posts or comments", "type": "count", "target": 5}]}', true, true, 3, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_creator', 'Weekly Creator', 'Share your thoughts', 'weekly', 300, 75, '{"objectives": [{"id": "create_posts", "description": "Create 3 forum posts", "type": "count", "target": 3}]}', true, true, 10, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_helper', 'Weekly Helper', 'Help the community', 'weekly', 400, 100, '{"objectives": [{"id": "helpful_comments", "description": "Get 10 upvotes on comments", "type": "count", "target": 10}]}', true, true, 11, NOW(), NOW()),
    (gen_random_uuid(), 'weekly_socializer', 'Social Week', 'Make new connections', 'weekly', 250, 50, '{"objectives": [{"id": "add_friends", "description": "Add 2 new friends", "type": "count", "target": 2}]}', true, true, 12, NOW(), NOW())
    """

    # ==================== SEED DEFAULT TITLES ====================
    execute """
    INSERT INTO titles (id, slug, name, description, color, rarity, unlock_type, unlock_requirement, is_purchasable, coin_cost, sort_order, inserted_at, updated_at) VALUES
    (gen_random_uuid(), 'newcomer', 'Newcomer', 'Just getting started', '#9CA3AF', 'common', 'level', '1', false, 0, 1, NOW(), NOW()),
    (gen_random_uuid(), 'regular', 'Regular', 'An active community member', '#10B981', 'common', 'level', '5', false, 0, 2, NOW(), NOW()),
    (gen_random_uuid(), 'veteran', 'Veteran', 'A seasoned member', '#8B5CF6', 'uncommon', 'level', '15', false, 0, 3, NOW(), NOW()),
    (gen_random_uuid(), 'elite', 'Elite', 'Among the best', '#F59E0B', 'rare', 'level', '30', false, 0, 4, NOW(), NOW()),
    (gen_random_uuid(), 'legend', 'Legend', 'A true legend', '#EF4444', 'legendary', 'level', '50', false, 0, 5, NOW(), NOW()),
    (gen_random_uuid(), 'night_owl', 'Night Owl', 'Burns the midnight oil', '#6366F1', 'rare', 'achievement', 'night_owl', false, 0, 10, NOW(), NOW()),
    (gen_random_uuid(), 'helper', 'Helper', 'Always ready to assist', '#22D3EE', 'rare', 'achievement', 'helpful_soul', false, 0, 11, NOW(), NOW()),
    (gen_random_uuid(), 'cosmic', 'Cosmic', 'Otherworldly presence', '#EC4899', 'epic', 'purchase', '', true, 5000, 50, NOW(), NOW()),
    (gen_random_uuid(), 'shadow', 'Shadow', 'Mysterious and elusive', '#1F2937', 'epic', 'purchase', '', true, 5000, 51, NOW(), NOW())
    """

    # ==================== SEED SHOP ITEMS ====================
    execute """
    INSERT INTO shop_items (id, slug, name, description, category, type, icon, coin_cost, premium_only, is_active, sort_order, inserted_at, updated_at) VALUES
    (gen_random_uuid(), 'theme_midnight', 'Midnight Theme', 'A sleek dark theme with purple accents', 'theme', 'permanent', '🌙', 500, false, true, 1, NOW(), NOW()),
    (gen_random_uuid(), 'theme_ocean', 'Ocean Breeze', 'Calming blue tones inspired by the sea', 'theme', 'permanent', '🌊', 500, false, true, 2, NOW(), NOW()),
    (gen_random_uuid(), 'theme_forest', 'Forest Grove', 'Natural greens and earthy tones', 'theme', 'permanent', '🌲', 500, false, true, 3, NOW(), NOW()),
    (gen_random_uuid(), 'theme_sunset', 'Sunset Glow', 'Warm orange and pink gradients', 'theme', 'permanent', '🌅', 750, false, true, 4, NOW(), NOW()),
    (gen_random_uuid(), 'theme_neon', 'Neon Dreams', 'Vibrant cyberpunk aesthetics', 'theme', 'permanent', '💜', 1000, true, true, 5, NOW(), NOW()),
    (gen_random_uuid(), 'badge_verified', 'Verified Badge', 'Show everyone you are legit', 'badge', 'permanent', '✓', 2500, false, true, 20, NOW(), NOW()),
    (gen_random_uuid(), 'badge_star', 'Star Badge', 'Shine bright', 'badge', 'permanent', '⭐', 1500, false, true, 21, NOW(), NOW()),
    (gen_random_uuid(), 'badge_fire', 'Fire Badge', 'You are on fire', 'badge', 'permanent', '🔥', 1500, false, true, 22, NOW(), NOW()),
    (gen_random_uuid(), 'effect_sparkle', 'Sparkle Effect', 'Add sparkles to your messages', 'effect', 'permanent', '✨', 2000, true, true, 40, NOW(), NOW()),
    (gen_random_uuid(), 'boost_xp_2x', '2x XP Boost (24h)', 'Double your XP for 24 hours', 'boost', 'consumable', '⚡', 300, false, true, 60, NOW(), NOW()),
    (gen_random_uuid(), 'boost_xp_2x_week', '2x XP Boost (7 days)', 'Double your XP for a week', 'boost', 'consumable', '⚡', 1500, false, true, 61, NOW(), NOW())
    """
  end

  def down do
    drop_if_exists table(:xp_transactions)
    drop_if_exists table(:coin_transactions)
    drop_if_exists table(:user_purchases)
    drop_if_exists table(:shop_items)
    drop_if_exists table(:user_titles)
    drop_if_exists table(:titles)
    drop_if_exists table(:user_quests)
    drop_if_exists table(:quests)
    drop_if_exists table(:user_achievements)
    drop_if_exists table(:achievements)

    alter table(:users) do
      remove_if_exists :xp, :integer
      remove_if_exists :level, :integer
      remove_if_exists :coins, :integer
      remove_if_exists :streak_days, :integer
      remove_if_exists :streak_last_claimed, :date
      remove_if_exists :streak_longest, :integer
      remove_if_exists :equipped_title_id, :binary_id
      remove_if_exists :equipped_badge_ids, {:array, :binary_id}
      remove_if_exists :subscription_tier, :string
      remove_if_exists :subscription_expires_at, :utc_datetime
      remove_if_exists :daily_bonus_claimed_at, :date
      remove_if_exists :total_messages_sent, :integer
      remove_if_exists :total_posts_created, :integer
    end
  end
end
