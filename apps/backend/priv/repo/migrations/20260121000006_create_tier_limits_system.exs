defmodule CGraph.Repo.Migrations.CreateTierLimitsSystem do
  @moduledoc """
  Creates a comprehensive tier limits system for subscription tiers.
  
  This migration establishes:
  - tier_limits: Configurable limits per subscription tier
  - tier_features: Feature flags per tier
  - user_tier_overrides: Per-user limit overrides
  
  Designed for extensibility with AI moderation and future features.
  """
  use Ecto.Migration

  def change do
    # ==========================================================================
    # Tier Limits - Core subscription tier configuration
    # ==========================================================================
    create table(:tier_limits, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :tier, :string, null: false  # free, starter, pro, business, enterprise
      add :display_name, :string, null: false
      add :description, :text
      add :is_active, :boolean, default: true
      add :position, :integer, default: 0  # For ordering in UI
      
      # Pricing (monthly in cents, for display purposes)
      add :price_monthly_cents, :integer, default: 0
      add :price_yearly_cents, :integer, default: 0
      add :stripe_price_id_monthly, :string
      add :stripe_price_id_yearly, :string
      
      # =======================================================================
      # Forum Limits
      # =======================================================================
      add :max_forums_owned, :integer, default: 1  # null = unlimited
      add :max_forums_joined, :integer  # null = unlimited
      add :max_boards_per_forum, :integer, default: 10
      add :max_threads_per_day, :integer, default: 10
      add :max_posts_per_day, :integer, default: 100
      add :max_comments_per_hour, :integer, default: 30
      
      # Forum Customization
      add :custom_css_enabled, :boolean, default: false
      add :custom_themes_enabled, :boolean, default: false
      add :custom_emojis_enabled, :boolean, default: false
      add :max_custom_emojis, :integer, default: 0
      add :custom_domain_enabled, :boolean, default: false
      add :forum_analytics_enabled, :boolean, default: false
      add :advanced_permissions_enabled, :boolean, default: false
      
      # =======================================================================
      # Storage Limits
      # =======================================================================
      add :max_storage_bytes, :bigint, default: 104_857_600  # 100MB default
      add :max_file_size_bytes, :bigint, default: 10_485_760  # 10MB default
      add :max_avatar_size_bytes, :integer, default: 2_097_152  # 2MB
      add :max_banner_size_bytes, :integer, default: 5_242_880  # 5MB
      add :max_attachments_per_post, :integer, default: 5
      add :allowed_file_types, {:array, :string}, default: ["image/jpeg", "image/png", "image/gif", "image/webp"]
      add :video_uploads_enabled, :boolean, default: false
      add :max_video_duration_seconds, :integer, default: 0
      
      # =======================================================================
      # Messaging Limits
      # =======================================================================
      add :max_conversations, :integer  # null = unlimited
      add :max_group_size, :integer, default: 50
      add :max_messages_per_minute, :integer, default: 30
      add :message_retention_days, :integer  # null = forever
      add :voice_messages_enabled, :boolean, default: true
      add :max_voice_message_seconds, :integer, default: 60
      add :video_calls_enabled, :boolean, default: false
      add :max_call_participants, :integer, default: 2
      add :screen_sharing_enabled, :boolean, default: false
      
      # =======================================================================
      # Social Limits
      # =======================================================================
      add :max_friends, :integer  # null = unlimited
      add :max_blocked_users, :integer, default: 100
      add :max_private_messages_per_day, :integer, default: 50
      
      # =======================================================================
      # Gamification Limits
      # =======================================================================
      add :gamification_enabled, :boolean, default: true
      add :battle_pass_enabled, :boolean, default: false
      add :marketplace_enabled, :boolean, default: true
      add :trading_enabled, :boolean, default: false
      add :max_daily_trades, :integer, default: 0
      add :cosmetics_enabled, :boolean, default: true
      add :premium_cosmetics_enabled, :boolean, default: false
      
      # =======================================================================
      # AI Features (Future - v1.1+)
      # =======================================================================
      add :ai_moderation_enabled, :boolean, default: false
      add :ai_moderation_auto_action, :boolean, default: false  # Auto-remove flagged content
      add :ai_moderation_requests_per_day, :integer, default: 0
      add :ai_suggestions_enabled, :boolean, default: false
      add :ai_suggestions_requests_per_day, :integer, default: 0
      add :ai_search_enabled, :boolean, default: false
      add :ai_custom_model_enabled, :boolean, default: false  # Enterprise: custom fine-tuned models
      
      # =======================================================================
      # Support & Priority
      # =======================================================================
      add :support_level, :string, default: "community"  # community, email, priority, dedicated
      add :support_response_hours, :integer, default: 72
      add :api_access_enabled, :boolean, default: false
      add :api_requests_per_hour, :integer, default: 0
      add :webhook_enabled, :boolean, default: false
      add :max_webhooks, :integer, default: 0
      add :priority_queue, :boolean, default: false  # Priority processing
      add :early_access, :boolean, default: false  # Access to beta features
      
      # =======================================================================
      # Rate Limits
      # =======================================================================
      add :rate_limit_multiplier, :float, default: 1.0  # Multiplier for all rate limits
      add :concurrent_sessions, :integer, default: 3
      add :max_devices, :integer, default: 5
      
      # =======================================================================
      # Branding
      # =======================================================================
      add :badge_icon, :string  # Icon to display next to tier name
      add :badge_color, :string  # Color for tier badge
      add :profile_frame_enabled, :boolean, default: false
      add :exclusive_themes, {:array, :string}, default: []
      
      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:tier_limits, [:tier])
    create index(:tier_limits, [:is_active])
    create index(:tier_limits, [:position])

    # ==========================================================================
    # Tier Features - Granular feature flags per tier
    # ==========================================================================
    create table(:tier_features, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :tier_id, references(:tier_limits, type: :binary_id, on_delete: :delete_all), null: false
      add :feature_key, :string, null: false  # e.g., "forums.custom_css", "ai.moderation"
      add :enabled, :boolean, default: true
      add :config, :map, default: %{}  # Feature-specific configuration
      add :description, :string
      
      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:tier_features, [:tier_id, :feature_key])
    create index(:tier_features, [:feature_key])

    # ==========================================================================
    # User Tier Overrides - Per-user limit adjustments
    # ==========================================================================
    create table(:user_tier_overrides, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :limit_key, :string, null: false  # e.g., "max_forums_owned", "max_storage_bytes"
      add :override_value, :string, null: false  # Stored as string, parsed based on limit type
      add :reason, :string  # Why this override was granted
      add :granted_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :expires_at, :utc_datetime_usec  # null = permanent
      
      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:user_tier_overrides, [:user_id, :limit_key])
    create index(:user_tier_overrides, [:user_id])
    create index(:user_tier_overrides, [:expires_at])

    # ==========================================================================
    # AI Moderation Queue - Prepared for v1.1
    # ==========================================================================
    create table(:ai_moderation_queue, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :content_type, :string, null: false  # thread, post, comment, user_profile
      add :content_id, :binary_id, null: false
      add :content_text, :text  # Cached content for AI analysis
      add :content_metadata, :map, default: %{}
      
      # AI Analysis Results
      add :ai_model, :string  # e.g., "claude-3-haiku-20240307"
      add :ai_analysis, :map, default: %{}  # Full AI response
      add :confidence_score, :float  # 0.0 - 1.0
      add :categories, {:array, :string}, default: []  # spam, toxicity, nsfw, etc.
      add :severity, :string  # low, medium, high, critical
      add :suggested_action, :string  # approve, flag, hide, remove, ban
      add :auto_actioned, :boolean, default: false
      
      # Human Review
      add :status, :string, default: "pending"  # pending, approved, rejected, escalated
      add :reviewed_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :reviewed_at, :utc_datetime_usec
      add :review_notes, :text
      add :final_action, :string
      
      # Tracking
      add :reported_count, :integer, default: 0
      add :false_positive, :boolean  # For AI training feedback
      
      timestamps(type: :utc_datetime_usec)
    end

    create index(:ai_moderation_queue, [:forum_id])
    create index(:ai_moderation_queue, [:status, :inserted_at])
    create index(:ai_moderation_queue, [:content_type, :content_id])
    create index(:ai_moderation_queue, [:severity, :status])

    # ==========================================================================
    # AI Moderation Settings - Per-forum AI configuration
    # ==========================================================================
    create table(:ai_moderation_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      
      # Enable/Disable
      add :enabled, :boolean, default: false
      add :auto_moderation_enabled, :boolean, default: false
      
      # Thresholds (0.0 - 1.0)
      add :spam_threshold, :float, default: 0.9
      add :toxicity_threshold, :float, default: 0.85
      add :nsfw_threshold, :float, default: 0.95
      add :low_quality_threshold, :float, default: 0.7
      
      # Auto-actions
      add :auto_remove_spam, :boolean, default: true
      add :auto_remove_spam_threshold, :float, default: 0.95
      add :auto_hide_toxicity, :boolean, default: false
      add :auto_hide_toxicity_threshold, :float, default: 0.9
      add :auto_flag_nsfw, :boolean, default: true
      add :notify_on_auto_action, :boolean, default: true
      
      # Exemptions
      add :exempt_roles, {:array, :string}, default: ["admin", "moderator"]
      add :exempt_karma_threshold, :integer, default: 1000
      
      # Custom Rules
      add :custom_banned_words, {:array, :string}, default: []
      add :custom_allowed_words, {:array, :string}, default: []
      add :custom_rules, :map, default: %{}
      
      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:ai_moderation_settings, [:forum_id])

    # ==========================================================================
    # AI Training Data - For improving AI models (Enterprise)
    # ==========================================================================
    create table(:ai_training_data, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      add :moderation_queue_id, references(:ai_moderation_queue, type: :binary_id, on_delete: :delete_all)
      
      add :content_text, :text, null: false
      add :content_type, :string, null: false
      add :ai_prediction, :map  # What AI predicted
      add :human_decision, :string, null: false  # What human decided
      add :was_correct, :boolean  # Did AI match human decision?
      add :feedback_notes, :text
      
      add :used_for_training, :boolean, default: false
      add :training_batch_id, :string
      
      timestamps(type: :utc_datetime_usec)
    end

    create index(:ai_training_data, [:forum_id])
    create index(:ai_training_data, [:was_correct])
    create index(:ai_training_data, [:used_for_training])

    # ==========================================================================
    # Seed default tier data
    # ==========================================================================
    execute(&seed_default_tiers/0, &drop_default_tiers/0)
  end

  defp seed_default_tiers do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond) |> DateTime.to_iso8601()
    
    """
    INSERT INTO tier_limits (
      id, tier, display_name, description, is_active, position,
      price_monthly_cents, price_yearly_cents,
      -- Forum limits
      max_forums_owned, max_boards_per_forum, max_threads_per_day, max_posts_per_day, max_comments_per_hour,
      custom_css_enabled, custom_themes_enabled, custom_emojis_enabled, max_custom_emojis,
      custom_domain_enabled, forum_analytics_enabled, advanced_permissions_enabled,
      -- Storage
      max_storage_bytes, max_file_size_bytes, max_attachments_per_post, video_uploads_enabled,
      -- Messaging
      max_group_size, max_messages_per_minute, voice_messages_enabled, max_voice_message_seconds,
      video_calls_enabled, max_call_participants, screen_sharing_enabled,
      -- Social
      max_private_messages_per_day,
      -- Gamification
      gamification_enabled, battle_pass_enabled, marketplace_enabled, trading_enabled, cosmetics_enabled, premium_cosmetics_enabled,
      -- AI (disabled for now)
      ai_moderation_enabled, ai_suggestions_enabled,
      -- Support
      support_level, support_response_hours, api_access_enabled, webhook_enabled, priority_queue, early_access,
      -- Rate limits
      rate_limit_multiplier, concurrent_sessions, max_devices,
      -- Branding
      badge_color, profile_frame_enabled,
      inserted_at, updated_at
    ) VALUES
    -- FREE TIER (1 forum, 100MB storage, basic features)
    (
      '#{Ecto.UUID.generate()}', 'free', 'Free', 'Get started with CGraph for free', true, 0,
      0, 0,
      1, 5, 5, 50, 20,
      false, false, false, 0,
      false, false, false,
      104857600, 10485760, 3, false,
      20, 20, true, 30,
      false, 2, false,
      25,
      true, false, true, false, true, false,
      false, false,
      'community', 72, false, false, false, false,
      1.0, 2, 3,
      '#6B7280', false,
      '#{now}', '#{now}'
    ),
    -- PREMIUM TIER (5 forums, 5GB storage, advanced AI moderation)
    (
      '#{Ecto.UUID.generate()}', 'premium', 'Premium', 'For growing communities with advanced features', true, 1,
      999, 9990,
      5, 25, 50, 300, 100,
      true, true, true, 100,
      false, true, true,
      5368709120, 52428800, 10, true,
      100, 60, true, 120,
      true, 8, true,
      500,
      true, true, true, true, true, true,
      true, true,
      'priority', 24, true, true, true, true,
      1.5, 5, 10,
      '#8B5CF6', true,
      '#{now}', '#{now}'
    ),
    -- ENTERPRISE TIER (unlimited forums, unlimited storage, custom AI models)
    (
      '#{Ecto.UUID.generate()}', 'enterprise', 'Enterprise', 'Custom solutions for large organizations', true, 2,
      0, 0,
      NULL, NULL, NULL, NULL, NULL,
      true, true, true, NULL,
      true, true, true,
      NULL, NULL, 100, true,
      1000, NULL, true, NULL,
      true, 50, true,
      NULL,
      true, true, true, true, true, true,
      true, true,
      'dedicated', 4, true, true, true, true,
      5.0, 50, 100,
      '#10B981', true,
      '#{now}', '#{now}'
    );
    """
  end

  defp drop_default_tiers do
    "DELETE FROM tier_limits WHERE tier IN ('free', 'premium', 'enterprise');"
  end
end
