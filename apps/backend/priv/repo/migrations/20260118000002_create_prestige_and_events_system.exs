defmodule Cgraph.Repo.Migrations.CreatePrestigeAndEventsSystem do
  @moduledoc """
  Creates prestige system and seasonal events tables for advanced gamification.
  Designed for horizontal scaling with time-series optimizations.
  
  Architecture Principles:
  - Prestige history uses append-only pattern for audit trail
  - Event progress partitioned by event for efficient cleanup
  - Leaderboard queries optimized with covering indexes
  - Battle pass tiers denormalized for single-query fetches
  - Event rewards use JSONB for schema flexibility
  
  Performance Targets:
  - Prestige lookup: <3ms p99
  - Event progress update: <10ms p99
  - Leaderboard top 100: <30ms p99
  - Battle pass tier check: <5ms p99
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # ==================== USER PRESTIGE ====================
    create_if_not_exists table(:user_prestiges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      # Current state
      add :prestige_level, :integer, default: 0, null: false
      add :current_xp, :bigint, default: 0, null: false  # bigint for high-level players
      add :total_lifetime_xp, :bigint, default: 0, null: false
      add :prestige_points, :integer, default: 0, null: false  # Earned on prestige reset
      
      # Bonuses (calculated and cached for performance)
      add :xp_bonus_percent, :decimal, precision: 5, scale: 2, default: 0, null: false
      add :coin_bonus_percent, :decimal, precision: 5, scale: 2, default: 0, null: false
      add :karma_bonus_percent, :decimal, precision: 5, scale: 2, default: 0, null: false
      add :drop_rate_bonus_percent, :decimal, precision: 5, scale: 2, default: 0, null: false
      add :queue_priority_bonus, :integer, default: 0, null: false
      
      # Exclusive unlocks (denormalized for fast lookup)
      add :exclusive_border_ids, {:array, :binary_id}, default: [], null: false
      add :exclusive_theme_ids, {:array, :binary_id}, default: [], null: false
      add :exclusive_effect_ids, {:array, :binary_id}, default: [], null: false
      add :exclusive_title_ids, {:array, :binary_id}, default: [], null: false
      
      # Stats
      add :times_prestiged, :integer, default: 0, null: false
      add :first_prestige_at, :utc_datetime
      add :last_prestige_at, :utc_datetime
      add :fastest_prestige_days, :integer  # Speedrun tracking
      add :current_prestige_started_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_prestiges_user_idx ON user_prestiges (user_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_prestiges_level_idx ON user_prestiges (prestige_level DESC)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_prestiges_lifetime_xp_idx ON user_prestiges (total_lifetime_xp DESC)"

    # ==================== PRESTIGE HISTORY (Append-only audit log) ====================
    create_if_not_exists table(:prestige_history, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :from_level, :integer, null: false
      add :to_level, :integer, null: false
      add :xp_at_prestige, :bigint, null: false
      add :prestige_points_earned, :integer, null: false
      add :bonuses_unlocked, :map, default: %{}  # Snapshot of what was unlocked
      add :exclusive_rewards, {:array, :binary_id}, default: []
      add :duration_days, :integer  # Days to reach this prestige
      add :prestiged_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS prestige_history_user_idx ON prestige_history (user_id, prestiged_at DESC)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS prestige_history_date_idx ON prestige_history (prestiged_at DESC)"

    # ==================== SEASONAL EVENTS ====================
    create_if_not_exists table(:seasonal_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :description, :text
      add :short_description, :string, size: 500
      
      # Type and timing
      add :event_type, :string, size: 30, null: false  # seasonal, holiday, special, anniversary, collaboration, community
      add :starts_at, :utc_datetime, null: false
      add :ends_at, :utc_datetime, null: false
      add :grace_period_hours, :integer, default: 24, null: false  # Extra time to claim rewards
      
      # Theme and branding
      add :theme_color_primary, :string, size: 20
      add :theme_color_secondary, :string, size: 20
      add :theme_color_accent, :string, size: 20
      add :banner_url, :string, size: 500
      add :icon_url, :string, size: 500
      add :background_url, :string, size: 500
      add :music_url, :string, size: 500
      
      # Event currency
      add :event_currency_name, :string, size: 50
      add :event_currency_icon, :string, size: 10
      add :event_currency_color, :string, size: 20
      
      # Rewards configuration (JSONB for flexibility)
      add :milestone_rewards, :map, default: %{}  # {1000: {type: "border", id: "x"}, 5000: {...}}
      add :completion_rewards, :map, default: %{}  # Final completion rewards
      add :participation_reward, :map, default: %{}  # Just for joining
      
      # Battle pass integration
      add :has_battle_pass, :boolean, default: false, null: false
      add :battle_pass_free_tiers, :integer, default: 0
      add :battle_pass_premium_tiers, :integer, default: 0
      add :battle_pass_cost_coins, :integer, default: 0
      add :battle_pass_cost_gems, :integer, default: 0
      add :battle_pass_tiers, :map, default: %{}  # {1: {free: {...}, premium: {...}}, 2: {...}}
      add :battle_pass_xp_per_tier, :integer, default: 1000
      
      # Leaderboard
      add :has_leaderboard, :boolean, default: true, null: false
      add :leaderboard_rewards, :map, default: %{}  # {1: {...}, 2: {...}, "top10": {...}}
      add :leaderboard_min_points, :integer, default: 0
      
      # Multipliers and bonuses
      add :xp_multiplier, :decimal, precision: 4, scale: 2, default: 1.0
      add :coin_multiplier, :decimal, precision: 4, scale: 2, default: 1.0
      add :drop_rate_multiplier, :decimal, precision: 4, scale: 2, default: 1.0
      
      # Quests specific to this event
      add :event_quests, :map, default: %{}  # Daily/weekly quests during event
      
      # State
      add :is_active, :boolean, default: false, null: false
      add :is_visible, :boolean, default: false, null: false  # Can be visible before active for teaser
      add :featured, :boolean, default: false, null: false
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS seasonal_events_slug_idx ON seasonal_events (slug)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS seasonal_events_active_idx ON seasonal_events (starts_at, ends_at) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS seasonal_events_visible_idx ON seasonal_events (starts_at) WHERE is_visible = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS seasonal_events_type_idx ON seasonal_events (event_type)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS seasonal_events_featured_idx ON seasonal_events (featured) WHERE featured = true"

    # ==================== USER EVENT PROGRESS ====================
    create_if_not_exists table(:user_event_progress, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :event_id, references(:seasonal_events, type: :binary_id, on_delete: :delete_all), null: false
      
      # Points and currency
      add :event_points, :bigint, default: 0, null: false
      add :event_currency, :bigint, default: 0, null: false
      add :total_earned_currency, :bigint, default: 0, null: false  # Before spending
      
      # Quest progress
      add :daily_quests_completed, :integer, default: 0, null: false
      add :weekly_quests_completed, :integer, default: 0, null: false
      add :total_quests_completed, :integer, default: 0, null: false
      add :quest_progress, :map, default: %{}  # {quest_id: {progress: x, completed: bool}}
      
      # Milestone tracking
      add :milestones_claimed, {:array, :integer}, default: [], null: false  # Point thresholds claimed
      add :highest_milestone, :integer, default: 0, null: false
      
      # Battle pass
      add :has_premium_pass, :boolean, default: false, null: false
      add :premium_pass_purchased_at, :utc_datetime
      add :battle_pass_tier, :integer, default: 0, null: false
      add :battle_pass_xp, :integer, default: 0, null: false
      add :free_rewards_claimed, {:array, :integer}, default: [], null: false  # Tier numbers
      add :premium_rewards_claimed, {:array, :integer}, default: [], null: false
      
      # Leaderboard (denormalized for fast queries)
      add :leaderboard_points, :bigint, default: 0, null: false
      add :leaderboard_rank, :integer  # Updated periodically by background job
      add :leaderboard_rank_updated_at, :utc_datetime
      
      # Engagement metrics
      add :days_participated, :integer, default: 0, null: false
      add :last_activity_at, :utc_datetime
      add :first_activity_at, :utc_datetime
      add :streak_days, :integer, default: 0, null: false
      add :longest_streak, :integer, default: 0, null: false
      
      # Completion
      add :completed, :boolean, default: false, null: false
      add :completed_at, :utc_datetime
      add :completion_rank, :integer  # Position when completed (for speedrun tracking)

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_event_progress_user_event_idx ON user_event_progress (user_id, event_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_event_progress_event_idx ON user_event_progress (event_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_event_progress_leaderboard_idx ON user_event_progress (event_id, leaderboard_points DESC) WHERE leaderboard_points > 0"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_event_progress_tier_idx ON user_event_progress (event_id, battle_pass_tier DESC)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_event_progress_user_active_idx ON user_event_progress (user_id, last_activity_at DESC)"

    # ==================== PRESTIGE REWARDS CATALOG ====================
    create_if_not_exists table(:prestige_rewards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :prestige_level, :integer, null: false
      add :reward_type, :string, size: 30, null: false  # border, theme, effect, title, badge, points, currency
      add :reward_id, :binary_id  # References the specific item, null for points/currency
      add :reward_amount, :integer, default: 1, null: false  # For points/currency
      add :name, :string, size: 200, null: false
      add :description, :text
      add :preview_url, :string, size: 500
      add :is_exclusive, :boolean, default: true, null: false  # Only from prestige
      add :sort_order, :integer, default: 0, null: false

      timestamps(type: :utc_datetime)
    end

    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS prestige_rewards_level_idx ON prestige_rewards (prestige_level)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS prestige_rewards_type_idx ON prestige_rewards (reward_type)"
  end

  def down do
    execute "DROP INDEX CONCURRENTLY IF EXISTS prestige_rewards_type_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS prestige_rewards_level_idx"
    drop_if_exists table(:prestige_rewards)

    execute "DROP INDEX CONCURRENTLY IF EXISTS user_event_progress_user_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_event_progress_tier_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_event_progress_leaderboard_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_event_progress_event_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_event_progress_user_event_idx"
    drop_if_exists table(:user_event_progress)

    execute "DROP INDEX CONCURRENTLY IF EXISTS seasonal_events_featured_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS seasonal_events_type_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS seasonal_events_visible_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS seasonal_events_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS seasonal_events_slug_idx"
    drop_if_exists table(:seasonal_events)

    execute "DROP INDEX CONCURRENTLY IF EXISTS prestige_history_date_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS prestige_history_user_idx"
    drop_if_exists table(:prestige_history)

    execute "DROP INDEX CONCURRENTLY IF EXISTS user_prestiges_lifetime_xp_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_prestiges_level_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_prestiges_user_idx"
    drop_if_exists table(:user_prestiges)
  end
end
