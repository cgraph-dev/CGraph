defmodule Cgraph.Repo.Migrations.CreateCosmeticsSystem do
  @moduledoc """
  Creates comprehensive cosmetics system tables for avatar borders, profile themes,
  and chat effects. Designed for horizontal scaling to 100M+ users.
  
  Architecture Principles:
  - UUIDv7 for time-ordered, globally unique IDs (shard-friendly)
  - Strategic denormalization for read-heavy paths
  - Composite indexes for common query patterns
  - Partial indexes to reduce index bloat
  - JSONB with GIN indexes for flexible metadata queries
  - Foreign key constraints with appropriate ON DELETE actions
  - Soft deletes via deactivated_at for audit trails
  
  Performance Targets:
  - Equipped cosmetics lookup: <5ms p99
  - User collection queries: <20ms p99
  - Catalog browsing with filters: <50ms p99
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # ==================== AVATAR BORDERS ====================
    create_if_not_exists table(:avatar_borders, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :description, :text
      
      # Categorization
      add :theme, :string, size: 50, null: false  # 8bit, cyberpunk, fantasy, etc.
      add :rarity, :string, size: 20, null: false  # common, uncommon, rare, epic, legendary, mythic, unique
      add :tier, :integer, default: 1, null: false  # 1-10 tier within rarity
      
      # Visual configuration (JSONB for flexibility)
      add :border_style, :map, default: %{}, null: false
      add :animation_type, :string, size: 50  # rotate, pulse, glow, shimmer, wave, etc.
      add :animation_config, :map, default: %{}
      add :particle_config, :map, default: %{}  # type, count, speed, color
      add :glow_config, :map, default: %{}  # color, intensity, spread
      
      # Preview assets (CDN URLs)
      add :preview_static_url, :string, size: 500
      add :preview_animated_url, :string, size: 500
      
      # Acquisition
      add :unlock_type, :string, size: 30, null: false  # achievement, level, purchase, event, battle_pass, prestige, gift, airdrop
      add :unlock_requirement, :map, default: %{}  # Flexible requirements: {level: 50}, {achievement: "slug"}, {event_id: "x"}
      add :coin_cost, :integer, default: 0, null: false
      add :gem_cost, :integer, default: 0, null: false
      add :is_purchasable, :boolean, default: false, null: false
      add :is_tradeable, :boolean, default: true, null: false
      add :is_limited, :boolean, default: false, null: false
      add :limited_quantity, :integer  # null = unlimited
      add :sold_count, :integer, default: 0, null: false
      
      # Time-limited availability
      add :season_id, :binary_id  # References seasonal_events
      add :event_id, :binary_id   # References seasonal_events
      add :available_from, :utc_datetime
      add :available_until, :utc_datetime
      
      # Metadata
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false
      add :deactivated_at, :utc_datetime
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_slug_idx ON avatar_borders (slug) WHERE deactivated_at IS NULL"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_theme_idx ON avatar_borders (theme) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_rarity_idx ON avatar_borders (rarity) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_unlock_type_idx ON avatar_borders (unlock_type) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_purchasable_idx ON avatar_borders (is_purchasable, coin_cost) WHERE is_active = true AND is_purchasable = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_availability_idx ON avatar_borders (available_from, available_until) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_season_idx ON avatar_borders (season_id) WHERE season_id IS NOT NULL"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS avatar_borders_metadata_idx ON avatar_borders USING GIN (metadata jsonb_path_ops)"

    # ==================== USER AVATAR BORDERS ====================
    create_if_not_exists table(:user_avatar_borders, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :border_id, references(:avatar_borders, type: :binary_id, on_delete: :restrict), null: false
      
      # State
      add :is_equipped, :boolean, default: false, null: false
      add :acquired_at, :utc_datetime, null: false
      add :acquisition_type, :string, size: 30, null: false  # purchase, achievement, event, gift, trade, airdrop
      add :acquisition_source, :map, default: %{}  # Details: {from_user_id: "x"}, {event_id: "y"}
      
      # Customization overlay
      add :custom_primary_color, :string, size: 20
      add :custom_secondary_color, :string, size: 20
      add :custom_glow_color, :string, size: 20
      add :custom_animation_speed, :decimal, precision: 4, scale: 2  # Multiplier
      add :custom_particle_density, :integer  # Override particle count
      
      # Expiration (for time-limited borders)
      add :expires_at, :utc_datetime
      add :is_expired, :boolean, default: false, null: false
      
      # Trading
      add :is_tradeable, :boolean, default: true, null: false
      add :trade_locked_until, :utc_datetime  # Anti-fraud cooldown
      
      # Analytics
      add :equip_count, :integer, default: 0, null: false
      add :last_equipped_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_avatar_borders_user_border_idx ON user_avatar_borders (user_id, border_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_avatar_borders_user_idx ON user_avatar_borders (user_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_avatar_borders_equipped_idx ON user_avatar_borders (user_id) WHERE is_equipped = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_avatar_borders_expires_idx ON user_avatar_borders (expires_at) WHERE expires_at IS NOT NULL AND is_expired = false"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_avatar_borders_tradeable_idx ON user_avatar_borders (is_tradeable, trade_locked_until) WHERE is_tradeable = true"

    # ==================== PROFILE THEMES ====================
    create_if_not_exists table(:profile_themes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :description, :text
      add :preview_url, :string, size: 500
      
      # Categorization
      add :category, :string, size: 50, null: false  # minimal, vibrant, animated, premium, seasonal
      add :rarity, :string, size: 20, null: false
      
      # Theme configuration (comprehensive JSONB)
      add :colors, :map, default: %{}, null: false  # primary, secondary, accent, text, background, etc.
      add :background_config, :map, default: %{}  # type (solid, gradient, image, video), value, animation
      add :card_layout, :string, size: 30, default: "detailed"  # minimal, compact, detailed, gaming, social, creator, custom
      add :typography, :map, default: %{}  # fontFamily, fontSize, fontWeight, letterSpacing
      add :glassmorphism, :map, default: %{}  # enabled, blur, opacity, border
      add :hover_effects, :map, default: %{}  # type, intensity, duration
      add :custom_css, :text  # Premium feature: custom CSS injection
      add :animations, :map, default: %{}  # Entry, hover, and idle animations
      
      # Acquisition (same pattern as borders)
      add :unlock_type, :string, size: 30, null: false
      add :unlock_requirement, :map, default: %{}
      add :coin_cost, :integer, default: 0, null: false
      add :gem_cost, :integer, default: 0, null: false
      add :is_purchasable, :boolean, default: false, null: false
      add :is_tradeable, :boolean, default: true, null: false
      
      # Time-limited
      add :season_id, :binary_id
      add :event_id, :binary_id
      add :available_from, :utc_datetime
      add :available_until, :utc_datetime
      
      # Metadata
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false
      add :deactivated_at, :utc_datetime
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS profile_themes_slug_idx ON profile_themes (slug) WHERE deactivated_at IS NULL"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS profile_themes_category_idx ON profile_themes (category) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS profile_themes_rarity_idx ON profile_themes (rarity) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS profile_themes_purchasable_idx ON profile_themes (is_purchasable, coin_cost) WHERE is_active = true"

    # ==================== USER PROFILE THEMES ====================
    create_if_not_exists table(:user_profile_themes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :theme_id, references(:profile_themes, type: :binary_id, on_delete: :restrict), null: false
      
      # State
      add :is_active, :boolean, default: false, null: false
      add :acquired_at, :utc_datetime, null: false
      add :acquisition_type, :string, size: 30, null: false
      add :acquisition_source, :map, default: %{}
      
      # User customization overrides (layered on top of theme defaults)
      add :custom_colors, :map, default: %{}
      add :custom_background, :map, default: %{}
      add :custom_layout, :string, size: 30
      add :custom_typography, :map, default: %{}
      add :custom_effects, :map, default: %{}
      add :custom_css, :text  # User's custom CSS additions
      
      # Expiration
      add :expires_at, :utc_datetime
      add :is_expired, :boolean, default: false, null: false
      
      # Trading
      add :is_tradeable, :boolean, default: true, null: false
      add :trade_locked_until, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_profile_themes_user_theme_idx ON user_profile_themes (user_id, theme_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_profile_themes_user_idx ON user_profile_themes (user_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_profile_themes_active_idx ON user_profile_themes (user_id) WHERE is_active = true"

    # ==================== CHAT EFFECTS ====================
    create_if_not_exists table(:chat_effects, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :description, :text
      add :preview_url, :string, size: 500
      
      # Categorization
      add :effect_type, :string, size: 30, null: false  # message, bubble, typing, reaction, entrance
      add :rarity, :string, size: 20, null: false
      
      # Effect configuration
      add :effect_id, :string, size: 50, null: false  # Internal effect identifier
      add :effect_config, :map, default: %{}, null: false  # Animation params, colors, timing
      add :particle_config, :map, default: %{}
      add :sound_config, :map, default: %{}  # Sound effect: {url, volume, trigger}
      
      # Acquisition
      add :unlock_type, :string, size: 30, null: false
      add :unlock_requirement, :map, default: %{}
      add :coin_cost, :integer, default: 0, null: false
      add :gem_cost, :integer, default: 0, null: false
      add :is_purchasable, :boolean, default: false, null: false
      add :is_tradeable, :boolean, default: true, null: false
      
      # Time-limited
      add :season_id, :binary_id
      add :event_id, :binary_id
      add :available_from, :utc_datetime
      add :available_until, :utc_datetime
      
      # Metadata
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false
      add :deactivated_at, :utc_datetime
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS chat_effects_slug_idx ON chat_effects (slug) WHERE deactivated_at IS NULL"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_effects_type_idx ON chat_effects (effect_type) WHERE is_active = true"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_effects_rarity_idx ON chat_effects (rarity) WHERE is_active = true"

    # ==================== USER CHAT EFFECTS ====================
    create_if_not_exists table(:user_chat_effects, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :effect_id, references(:chat_effects, type: :binary_id, on_delete: :restrict), null: false
      
      # State (users can have multiple effects active by type)
      add :is_active, :boolean, default: false, null: false
      add :acquired_at, :utc_datetime, null: false
      add :acquisition_type, :string, size: 30, null: false
      add :acquisition_source, :map, default: %{}
      
      # Customization
      add :custom_config, :map, default: %{}  # User overrides for effect params
      add :custom_colors, :map, default: %{}
      
      # Usage tracking
      add :times_used, :integer, default: 0, null: false
      add :last_used_at, :utc_datetime
      
      # Expiration
      add :expires_at, :utc_datetime
      add :is_expired, :boolean, default: false, null: false
      
      # Trading
      add :is_tradeable, :boolean, default: true, null: false
      add :trade_locked_until, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    execute "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_chat_effects_user_effect_idx ON user_chat_effects (user_id, effect_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_chat_effects_user_idx ON user_chat_effects (user_id)"
    execute "CREATE INDEX CONCURRENTLY IF NOT EXISTS user_chat_effects_active_idx ON user_chat_effects (user_id) WHERE is_active = true"
  end

  def down do
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_chat_effects_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_chat_effects_user_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_chat_effects_user_effect_idx"
    drop_if_exists table(:user_chat_effects)

    execute "DROP INDEX CONCURRENTLY IF EXISTS chat_effects_rarity_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS chat_effects_type_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS chat_effects_slug_idx"
    drop_if_exists table(:chat_effects)

    execute "DROP INDEX CONCURRENTLY IF EXISTS user_profile_themes_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_profile_themes_user_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_profile_themes_user_theme_idx"
    drop_if_exists table(:user_profile_themes)

    execute "DROP INDEX CONCURRENTLY IF EXISTS profile_themes_purchasable_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS profile_themes_rarity_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS profile_themes_category_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS profile_themes_slug_idx"
    drop_if_exists table(:profile_themes)

    execute "DROP INDEX CONCURRENTLY IF EXISTS user_avatar_borders_tradeable_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_avatar_borders_expires_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_avatar_borders_equipped_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_avatar_borders_user_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS user_avatar_borders_user_border_idx"
    drop_if_exists table(:user_avatar_borders)

    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_metadata_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_season_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_availability_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_purchasable_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_unlock_type_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_rarity_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_theme_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS avatar_borders_slug_idx"
    drop_if_exists table(:avatar_borders)
  end
end
