defmodule CGraph.Subscriptions.TierLimit do
  @moduledoc """
  Schema for subscription tier limits.
  
  Each tier defines limits and features available to users subscribed to that tier.
  This includes forum limits, storage quotas, messaging caps, AI features, and more.
  
  ## Tiers
  
  - `free` - Basic access with limited features
  - `starter` - Growing communities with more capacity
  - `pro` - Power users with advanced features and AI
  - `business` - Organizations with priority support
  - `enterprise` - Custom limits and dedicated support
  
  ## Usage
  
      # Get a tier's limits
      tier = TierLimits.get_tier("pro")
      
      # Check if user can perform action
      TierLimits.can_create_forum?(user)
      TierLimits.has_feature?(user, "ai.moderation")
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_tiers ~w(free premium enterprise)
  @support_levels ~w(community priority dedicated)

  schema "tier_limits" do
    # Core
    field :tier, :string
    field :display_name, :string
    field :description, :string
    field :is_active, :boolean, default: true
    field :position, :integer, default: 0

    # Pricing
    field :price_monthly_cents, :integer, default: 0
    field :price_yearly_cents, :integer, default: 0
    field :stripe_price_id_monthly, :string
    field :stripe_price_id_yearly, :string

    # Forum Limits
    field :max_forums_owned, :integer
    field :max_forums_joined, :integer
    field :max_boards_per_forum, :integer, default: 10
    field :max_threads_per_day, :integer, default: 10
    field :max_posts_per_day, :integer, default: 100
    field :max_comments_per_hour, :integer, default: 30

    # Forum Customization
    field :custom_css_enabled, :boolean, default: false
    field :custom_themes_enabled, :boolean, default: false
    field :custom_emojis_enabled, :boolean, default: false
    field :max_custom_emojis, :integer, default: 0
    field :custom_domain_enabled, :boolean, default: false
    field :forum_analytics_enabled, :boolean, default: false
    field :advanced_permissions_enabled, :boolean, default: false

    # Storage Limits
    field :max_storage_bytes, :integer
    field :max_file_size_bytes, :integer
    field :max_avatar_size_bytes, :integer, default: 2_097_152
    field :max_banner_size_bytes, :integer, default: 5_242_880
    field :max_attachments_per_post, :integer, default: 5
    field :allowed_file_types, {:array, :string}, default: ["image/jpeg", "image/png", "image/gif", "image/webp"]
    field :video_uploads_enabled, :boolean, default: false
    field :max_video_duration_seconds, :integer, default: 0

    # Messaging Limits
    field :max_conversations, :integer
    field :max_group_size, :integer, default: 50
    field :max_messages_per_minute, :integer, default: 30
    field :message_retention_days, :integer
    field :voice_messages_enabled, :boolean, default: true
    field :max_voice_message_seconds, :integer, default: 60
    field :video_calls_enabled, :boolean, default: false
    field :max_call_participants, :integer, default: 2
    field :screen_sharing_enabled, :boolean, default: false

    # Social Limits
    field :max_friends, :integer
    field :max_blocked_users, :integer, default: 100
    field :max_private_messages_per_day, :integer, default: 50

    # Gamification
    field :gamification_enabled, :boolean, default: true
    field :battle_pass_enabled, :boolean, default: false
    field :marketplace_enabled, :boolean, default: true
    field :trading_enabled, :boolean, default: false
    field :max_daily_trades, :integer, default: 0
    field :cosmetics_enabled, :boolean, default: true
    field :premium_cosmetics_enabled, :boolean, default: false

    # AI Features
    field :ai_moderation_enabled, :boolean, default: false
    field :ai_moderation_auto_action, :boolean, default: false
    field :ai_moderation_requests_per_day, :integer, default: 0
    field :ai_suggestions_enabled, :boolean, default: false
    field :ai_suggestions_requests_per_day, :integer, default: 0
    field :ai_search_enabled, :boolean, default: false
    field :ai_custom_model_enabled, :boolean, default: false

    # Support & Priority
    field :support_level, :string, default: "community"
    field :support_response_hours, :integer, default: 72
    field :api_access_enabled, :boolean, default: false
    field :api_requests_per_hour, :integer, default: 0
    field :webhook_enabled, :boolean, default: false
    field :max_webhooks, :integer, default: 0
    field :priority_queue, :boolean, default: false
    field :early_access, :boolean, default: false

    # Rate Limits
    field :rate_limit_multiplier, :float, default: 1.0
    field :concurrent_sessions, :integer, default: 3
    field :max_devices, :integer, default: 5

    # Branding
    field :badge_icon, :string
    field :badge_color, :string
    field :profile_frame_enabled, :boolean, default: false
    field :exclusive_themes, {:array, :string}, default: []

    # Associations
    has_many :features, CGraph.Subscriptions.TierFeature, foreign_key: :tier_id

    timestamps(type: :utc_datetime_usec)
  end

  @doc """
  Creates a changeset for a tier limit.
  """
  def changeset(tier_limit, attrs) do
    tier_limit
    |> cast(attrs, [
      :tier, :display_name, :description, :is_active, :position,
      :price_monthly_cents, :price_yearly_cents, :stripe_price_id_monthly, :stripe_price_id_yearly,
      :max_forums_owned, :max_forums_joined, :max_boards_per_forum, :max_threads_per_day,
      :max_posts_per_day, :max_comments_per_hour, :custom_css_enabled, :custom_themes_enabled,
      :custom_emojis_enabled, :max_custom_emojis, :custom_domain_enabled, :forum_analytics_enabled,
      :advanced_permissions_enabled, :max_storage_bytes, :max_file_size_bytes, :max_avatar_size_bytes,
      :max_banner_size_bytes, :max_attachments_per_post, :allowed_file_types, :video_uploads_enabled,
      :max_video_duration_seconds, :max_conversations, :max_group_size, :max_messages_per_minute,
      :message_retention_days, :voice_messages_enabled, :max_voice_message_seconds, :video_calls_enabled,
      :max_call_participants, :screen_sharing_enabled, :max_friends, :max_blocked_users,
      :max_private_messages_per_day, :gamification_enabled, :battle_pass_enabled, :marketplace_enabled,
      :trading_enabled, :max_daily_trades, :cosmetics_enabled, :premium_cosmetics_enabled,
      :ai_moderation_enabled, :ai_moderation_auto_action, :ai_moderation_requests_per_day,
      :ai_suggestions_enabled, :ai_suggestions_requests_per_day, :ai_search_enabled,
      :ai_custom_model_enabled, :support_level, :support_response_hours, :api_access_enabled,
      :api_requests_per_hour, :webhook_enabled, :max_webhooks, :priority_queue, :early_access,
      :rate_limit_multiplier, :concurrent_sessions, :max_devices, :badge_icon, :badge_color,
      :profile_frame_enabled, :exclusive_themes
    ])
    |> validate_required([:tier, :display_name])
    |> validate_inclusion(:tier, @valid_tiers)
    |> validate_inclusion(:support_level, @support_levels)
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> validate_number(:rate_limit_multiplier, greater_than: 0)
    |> unique_constraint(:tier)
  end

  @doc """
  Returns valid tier names.
  """
  def valid_tiers, do: @valid_tiers

  @doc """
  Returns valid support levels.
  """
  def support_levels, do: @support_levels

  @doc """
  Checks if a limit value means "unlimited".
  nil is used to represent unlimited in the database.
  """
  def unlimited?(nil), do: true
  def unlimited?(_), do: false

  @doc """
  Checks if a user is within a specific limit.
  Returns true if the limit is unlimited (nil) or current < limit.
  """
  def within_limit?(nil, _current), do: true
  def within_limit?(limit, current), do: current < limit

  @doc """
  Formats a limit value for display.
  """
  def format_limit(nil), do: "Unlimited"
  def format_limit(value) when is_integer(value), do: Integer.to_string(value)
  def format_limit(value), do: to_string(value)

  @doc """
  Formats bytes to human-readable string.
  """
  def format_bytes(nil), do: "Unlimited"
  def format_bytes(bytes) when bytes < 1024, do: "#{bytes} B"
  def format_bytes(bytes) when bytes < 1_048_576, do: "#{Float.round(bytes / 1024, 1)} KB"
  def format_bytes(bytes) when bytes < 1_073_741_824, do: "#{Float.round(bytes / 1_048_576, 1)} MB"
  def format_bytes(bytes), do: "#{Float.round(bytes / 1_073_741_824, 1)} GB"
end
