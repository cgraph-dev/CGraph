defmodule Cgraph.Repo.Migrations.CreateForumHostingPlatform do
  @moduledoc """
  Creates the complete forum hosting platform structure.
  
  This migration adds:
  - Boards (forum sections/categories)
  - Threads (discussion topics)
  - Posts (replies within threads)
  - Forum memberships (forum-specific user data)
  - Forum user groups (permissions)
  - Forum themes and plugins
  - Subscriptions (paid tiers)
  
  This transforms the simple Reddit-style forum into a full
  MyBB-style forum hosting platform with discovery.
  """
  use Ecto.Migration

  def up do
    # =========================================================================
    # Forum Themes (MUST be created before altering forums table)
    # =========================================================================
    
    create_if_not_exists table(:forum_themes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :slug, :string
      add :description, :text
      add :thumbnail_url, :string
      add :preview_url, :string
      add :is_default, :boolean, default: false
      add :is_active, :boolean, default: true
      
      # Color scheme
      add :primary_color, :string, default: "#3B82F6"
      add :secondary_color, :string, default: "#1E40AF"
      add :accent_color, :string, default: "#F59E0B"
      add :background_color, :string, default: "#FFFFFF"
      add :text_color, :string, default: "#1F2937"
      add :link_color, :string, default: "#2563EB"
      
      # Custom CSS
      add :custom_css, :text
      
      # Header customization
      add :header_logo_url, :string
      add :header_background_url, :string
      add :header_height, :integer, default: 80
      
      # Template overrides (JSON map)
      add :template_overrides, :jsonb, default: "{}"
      
      # Font settings
      add :font_family, :string, default: "Inter, system-ui, sans-serif"
      add :font_size_base, :string, default: "16px"
      
      # Layout settings
      add :sidebar_position, :string, default: "right"
      add :content_width, :string, default: "1200px"
      add :show_breadcrumbs, :boolean, default: true
      add :show_forum_stats, :boolean, default: true
      
      # Theme content
      add :css, :text
      add :variables, :jsonb, default: "{}"
      add :templates, :jsonb, default: "{}"
      
      # Status
      add :is_official, :boolean, default: false
      add :is_public, :boolean, default: false
      
      # Relations
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      add :parent_theme_id, references(:forum_themes, type: :binary_id, on_delete: :nilify_all)
      add :created_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:forum_themes, [:forum_id])
    create_if_not_exists index(:forum_themes, [:is_official])
    create_if_not_exists index(:forum_themes, [:is_public])

    # =========================================================================
    # Extend Forums Table
    # =========================================================================
    
    alter table(:forums) do
      # Additional branding
      add_if_not_exists :favicon_url, :string
      add_if_not_exists :logo_url, :string
      add_if_not_exists :tagline, :string  # Short description for cards
      
      # Extended theming
      add_if_not_exists :theme_id, references(:forum_themes, type: :binary_id, on_delete: :nilify_all)
      add_if_not_exists :custom_header_html, :text
      add_if_not_exists :custom_footer_html, :text
      add_if_not_exists :secondary_color, :string
      add_if_not_exists :font_family, :string
      
      # Additional settings
      add_if_not_exists :require_approval, :boolean, default: false
      add_if_not_exists :registration_open, :boolean, default: true
      add_if_not_exists :posting_requires_account, :boolean, default: true
      
      # Extended voting
      add_if_not_exists :monthly_score, :integer, default: 0
      add_if_not_exists :verified, :boolean, default: false
      
      # Extended stats
      add_if_not_exists :thread_count, :integer, default: 0
      add_if_not_exists :active_users_today, :integer, default: 0
      
      # Discovery categorization
      add_if_not_exists :category, :string, default: "other"
      add_if_not_exists :tags, {:array, :string}, default: []
      
      # Subscription tier
      add_if_not_exists :tier, :string, default: "free"
    end

    create_if_not_exists index(:forums, [:category])
    create_if_not_exists index(:forums, [:tier])
    create_if_not_exists index(:forums, [:verified])
    execute "CREATE INDEX IF NOT EXISTS forums_tags_idx ON forums USING gin (tags)"

    # =========================================================================
    # Boards (Forum Sections/Categories)
    # =========================================================================
    
    create_if_not_exists table(:boards, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :slug, :string, null: false
      add :description, :text
      add :icon, :string  # Icon or emoji
      add :position, :integer, default: 0
      
      # Permissions
      add :is_locked, :boolean, default: false
      add :is_hidden, :boolean, default: false
      add :min_posts_to_post, :integer, default: 0
      add :min_reputation_to_post, :integer, default: 0
      
      # Stats (denormalized)
      add :thread_count, :integer, default: 0
      add :post_count, :integer, default: 0
      add :last_post_at, :utc_datetime
      add :last_post_id, :binary_id
      add :last_thread_id, :binary_id
      
      # Soft delete
      add :deleted_at, :utc_datetime
      
      # Relations
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :parent_board_id, references(:boards, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:boards, [:forum_id])
    create_if_not_exists index(:boards, [:parent_board_id])
    create_if_not_exists unique_index(:boards, [:forum_id, :slug])
    create_if_not_exists index(:boards, [:forum_id, :position])

    # =========================================================================
    # Threads (Discussion Topics)
    # =========================================================================
    
    create_if_not_exists table(:threads, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :title, :string, null: false
      add :slug, :string, null: false
      add :content, :text  # First post content
      add :content_html, :text  # Rendered HTML
      
      # Thread type
      add :thread_type, :string, default: "normal"  # normal, sticky, announcement, poll
      
      # Status
      add :is_locked, :boolean, default: false
      add :is_pinned, :boolean, default: false
      add :is_hidden, :boolean, default: false
      add :is_approved, :boolean, default: true
      
      # Prefix/Tags (MyBB-style)
      add :prefix, :string
      add :prefix_color, :string
      
      # Stats
      add :view_count, :integer, default: 0
      add :reply_count, :integer, default: 0
      add :last_post_at, :utc_datetime
      add :last_post_id, :binary_id
      
      # Voting (optional Reddit-style)
      add :score, :integer, default: 0
      add :upvotes, :integer, default: 0
      add :downvotes, :integer, default: 0
      add :hot_score, :float, default: 0.0
      
      # Soft delete
      add :deleted_at, :utc_datetime
      
      # Relations
      add :board_id, references(:boards, type: :binary_id, on_delete: :delete_all), null: false
      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :last_poster_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:threads, [:board_id])
    create_if_not_exists index(:threads, [:author_id])
    create_if_not_exists unique_index(:threads, [:board_id, :slug])
    create_if_not_exists index(:threads, [:board_id, :is_pinned, :last_post_at])
    create_if_not_exists index(:threads, [:board_id, :score])
    create_if_not_exists index(:threads, [:board_id, :hot_score])
    execute "CREATE INDEX IF NOT EXISTS threads_title_trgm_idx ON threads USING gin (title gin_trgm_ops)"

    # =========================================================================
    # Thread Posts (Replies)
    # =========================================================================
    
    create_if_not_exists table(:thread_posts, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :content, :text, null: false  # BBCode/Markdown
      add :content_html, :text  # Rendered HTML
      add :is_edited, :boolean, default: false
      add :edit_count, :integer, default: 0
      add :edit_reason, :string
      add :edited_at, :utc_datetime
      
      # Moderation
      add :is_hidden, :boolean, default: false
      add :is_approved, :boolean, default: true
      add :reported_count, :integer, default: 0
      
      # Attachments
      add :attachments, :jsonb, default: "[]"
      
      # Voting
      add :score, :integer, default: 0
      add :upvotes, :integer, default: 0
      add :downvotes, :integer, default: 0
      
      # Position (for traditional forum ordering)
      add :position, :integer, default: 0
      
      # Soft delete
      add :deleted_at, :utc_datetime
      
      # Relations
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :reply_to_id, references(:thread_posts, type: :binary_id, on_delete: :nilify_all)
      add :edited_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:thread_posts, [:thread_id])
    create_if_not_exists index(:thread_posts, [:author_id])
    create_if_not_exists index(:thread_posts, [:thread_id, :position])
    create_if_not_exists index(:thread_posts, [:thread_id, :inserted_at])

    # =========================================================================
    # Forum User Groups (MyBB-style Permission Groups)
    # =========================================================================
    
    create_if_not_exists table(:forum_user_groups, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :description, :text
      add :color, :string  # Username color
      add :icon, :string   # Group icon/badge
      add :is_staff, :boolean, default: false
      add :is_default, :boolean, default: false
      add :position, :integer, default: 0  # Display priority
      
      # View permissions
      add :can_view_boards, :boolean, default: true
      add :can_view_profiles, :boolean, default: true
      add :can_view_hidden_boards, :boolean, default: false
      
      # Posting permissions
      add :can_create_threads, :boolean, default: true
      add :can_reply, :boolean, default: true
      add :can_edit_own_posts, :boolean, default: true
      add :can_delete_own_posts, :boolean, default: false
      add :can_edit_own_threads, :boolean, default: true
      add :can_delete_own_threads, :boolean, default: false
      
      # Feature permissions
      add :can_upload_attachments, :boolean, default: true
      add :can_use_signature, :boolean, default: true
      add :can_use_bbcode, :boolean, default: true
      add :can_use_images, :boolean, default: true
      add :can_create_polls, :boolean, default: true
      add :can_vote_polls, :boolean, default: true
      
      # Social permissions
      add :can_give_reputation, :boolean, default: true
      add :can_receive_reputation, :boolean, default: true
      add :can_send_pm, :boolean, default: true
      add :can_receive_pm, :boolean, default: true
      
      # Moderation permissions
      add :can_moderate, :boolean, default: false
      add :can_edit_posts, :boolean, default: false
      add :can_delete_posts, :boolean, default: false
      add :can_move_threads, :boolean, default: false
      add :can_merge_threads, :boolean, default: false
      add :can_split_threads, :boolean, default: false
      add :can_lock_threads, :boolean, default: false
      add :can_pin_threads, :boolean, default: false
      add :can_hide_posts, :boolean, default: false
      add :can_approve_posts, :boolean, default: false
      
      # Admin permissions
      add :can_manage_users, :boolean, default: false
      add :can_ban_users, :boolean, default: false
      add :can_warn_users, :boolean, default: false
      add :can_manage_groups, :boolean, default: false
      add :can_manage_boards, :boolean, default: false
      add :can_manage_settings, :boolean, default: false
      add :can_manage_themes, :boolean, default: false
      add :can_manage_plugins, :boolean, default: false
      add :is_admin, :boolean, default: false
      
      # Limits
      add :max_attachments_per_post, :integer, default: 5
      add :max_attachment_size_kb, :integer, default: 2048
      add :max_signature_length, :integer, default: 500
      add :max_signature_lines, :integer, default: 5
      add :post_flood_limit_seconds, :integer, default: 30
      add :search_flood_limit_seconds, :integer, default: 10
      
      # Relations
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:forum_user_groups, [:forum_id])
    create_if_not_exists unique_index(:forum_user_groups, [:forum_id, :name])

    # =========================================================================
    # Forum Members (Forum-Specific User Data)
    # =========================================================================
    
    create_if_not_exists table(:forum_members, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      
      # Forum-specific profile
      add :display_name, :string  # Override username
      add :title, :string         # Custom user title
      add :signature, :text       # Forum signature
      add :signature_html, :text  # Rendered signature
      add :avatar_url, :string    # Forum-specific avatar
      
      # Stats
      add :post_count, :integer, default: 0
      add :thread_count, :integer, default: 0
      add :reputation, :integer, default: 0
      add :reputation_positive, :integer, default: 0
      add :reputation_negative, :integer, default: 0
      add :warnings, :integer, default: 0
      add :warning_points, :integer, default: 0
      
      # Status
      add :role, :string, default: "member"  # member, moderator, admin, owner
      add :is_banned, :boolean, default: false
      add :ban_reason, :text
      add :ban_expires_at, :utc_datetime
      add :banned_by_id, :binary_id
      
      # Activity
      add :last_visit_at, :utc_datetime
      add :last_post_at, :utc_datetime
      add :joined_at, :utc_datetime
      
      # Settings
      add :receive_notifications, :boolean, default: true
      add :show_signature, :boolean, default: true
      add :posts_per_page, :integer, default: 20
      
      # Relations
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :user_group_id, references(:forum_user_groups, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:forum_members, [:forum_id, :user_id])
    create_if_not_exists index(:forum_members, [:forum_id])
    create_if_not_exists index(:forum_members, [:user_id])
    create_if_not_exists index(:forum_members, [:forum_id, :role])
    create_if_not_exists index(:forum_members, [:forum_id, :reputation])
    create_if_not_exists index(:forum_members, [:forum_id, :post_count])

    # =========================================================================
    # Forum Plugins
    # =========================================================================
    
    create_if_not_exists table(:forum_plugins, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :plugin_id, :string, null: false  # Unique plugin identifier
      add :name, :string, null: false
      add :description, :text
      add :version, :string
      add :author, :string
      add :author_url, :string
      add :icon_url, :string
      
      # Plugin type
      add :plugin_type, :string, default: "general"  # widget, moderation, integration, theme, general
      
      # Status
      add :is_enabled, :boolean, default: true
      add :is_official, :boolean, default: false  # CGraph official plugin
      
      # Configuration
      add :settings, :jsonb, default: "{}"
      
      # Relations
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:forum_plugins, [:forum_id, :plugin_id])
    create_if_not_exists index(:forum_plugins, [:forum_id])
    create_if_not_exists index(:forum_plugins, [:plugin_type])

    # =========================================================================
    # Thread Votes
    # =========================================================================
    
    create_if_not_exists table(:thread_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :value, :integer, null: false  # 1 or -1
      
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:thread_votes, [:thread_id, :user_id])
    create_if_not_exists index(:thread_votes, [:thread_id])
    create_if_not_exists index(:thread_votes, [:user_id])

    # =========================================================================
    # Post Votes
    # =========================================================================
    
    create_if_not_exists table(:post_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :value, :integer, null: false  # 1 or -1
      
      add :post_id, references(:thread_posts, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:post_votes, [:post_id, :user_id])
    create_if_not_exists index(:post_votes, [:post_id])
    create_if_not_exists index(:post_votes, [:user_id])

    # =========================================================================
    # Reputation (MyBB-style reputation system)
    # =========================================================================
    
    create_if_not_exists table(:reputation_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :value, :integer, null: false  # +1, 0, -1
      add :comment, :text
      
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :from_user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :to_user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :post_id, references(:thread_posts, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:reputation_entries, [:forum_id])
    create_if_not_exists index(:reputation_entries, [:to_user_id])
    create_if_not_exists index(:reputation_entries, [:from_user_id])
    create_if_not_exists unique_index(:reputation_entries, [:forum_id, :from_user_id, :to_user_id, :post_id], 
      name: :reputation_entries_unique_vote)

    # =========================================================================
    # Subscriptions (Paid Tiers)
    # =========================================================================
    
    create_if_not_exists table(:subscriptions, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      
      add :tier, :string, null: false  # free, basic, pro, enterprise
      add :status, :string, default: "active"  # active, cancelled, past_due, expired
      
      # Limits based on tier
      add :forums_allowed, :integer, default: 1
      add :storage_limit_mb, :integer, default: 100
      add :members_limit, :integer, default: 100
      
      # Billing
      add :current_period_start, :utc_datetime
      add :current_period_end, :utc_datetime
      add :cancel_at_period_end, :boolean, default: false
      add :cancelled_at, :utc_datetime
      
      # Stripe integration
      add :stripe_customer_id, :string
      add :stripe_subscription_id, :string
      add :stripe_price_id, :string
      
      # Relations
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:subscriptions, [:user_id])
    create_if_not_exists index(:subscriptions, [:stripe_customer_id])
    create_if_not_exists index(:subscriptions, [:stripe_subscription_id])
    create_if_not_exists index(:subscriptions, [:status])

    # =========================================================================
    # Thread Prefixes (MyBB-style thread tags)
    # =========================================================================
    
    create_if_not_exists table(:thread_prefixes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :style, :string  # CSS class or inline style
      add :color, :string
      add :background_color, :string
      add :position, :integer, default: 0
      
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:thread_prefixes, [:forum_id])
    create_if_not_exists unique_index(:thread_prefixes, [:forum_id, :name])

    # =========================================================================
    # Thread Polls (MyBB-style polls)
    # =========================================================================
    
    create_if_not_exists table(:thread_polls, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :question, :string, null: false
      add :options, :jsonb, default: "[]"  # Array of {id, text, votes}
      add :is_multiple_choice, :boolean, default: false
      add :max_options, :integer, default: 1
      add :is_public, :boolean, default: true  # Show who voted
      add :closes_at, :utc_datetime
      add :total_votes, :integer, default: 0
      
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:thread_polls, [:thread_id])

    # =========================================================================
    # Poll Votes
    # =========================================================================
    
    create_if_not_exists table(:poll_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :option_ids, {:array, :string}, default: []  # Selected option IDs
      
      add :poll_id, references(:thread_polls, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:poll_votes, [:poll_id, :user_id])
    create_if_not_exists index(:poll_votes, [:poll_id])

    # =========================================================================
    # Warnings (MyBB-style warning system)
    # =========================================================================
    
    create_if_not_exists table(:forum_warnings, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :reason, :text, null: false
      add :points, :integer, default: 1
      add :expires_at, :utc_datetime
      add :is_acknowledged, :boolean, default: false
      add :notes, :text  # Admin notes
      
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :issued_by_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :post_id, references(:thread_posts, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:forum_warnings, [:forum_id])
    create_if_not_exists index(:forum_warnings, [:user_id])
    create_if_not_exists index(:forum_warnings, [:forum_id, :user_id])

    # =========================================================================
    # Moderation Logs
    # =========================================================================
    
    create_if_not_exists table(:forum_mod_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :action, :string, null: false  # edit_post, delete_post, ban_user, etc.
      add :details, :jsonb, default: "{}"
      add :ip_address, :string
      
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :moderator_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :target_user_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :thread_id, references(:threads, type: :binary_id, on_delete: :nilify_all)
      add :post_id, references(:thread_posts, type: :binary_id, on_delete: :nilify_all)
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:forum_mod_logs, [:forum_id])
    create_if_not_exists index(:forum_mod_logs, [:moderator_id])
    create_if_not_exists index(:forum_mod_logs, [:forum_id, :action])
    create_if_not_exists index(:forum_mod_logs, [:forum_id, :inserted_at])

    # =========================================================================
    # Forum Announcements
    # =========================================================================
    
    create_if_not_exists table(:forum_announcements, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :title, :string, null: false
      add :content, :text, null: false
      add :is_global, :boolean, default: false
      add :is_active, :boolean, default: true
      add :priority, :integer, default: 0
      
      # Display settings
      add :style, :string, default: "info"
      add :dismissible, :boolean, default: true
      add :show_icon, :boolean, default: true
      
      # Scheduling
      add :start_date, :utc_datetime
      add :end_date, :utc_datetime
      
      # Targeting
      add :target_groups, {:array, :string}, default: []
      
      # Stats
      add :view_count, :integer, default: 0
      add :dismiss_count, :integer, default: 0
      
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :board_id, references(:boards, type: :binary_id, on_delete: :delete_all)
      add :author_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:forum_announcements, [:forum_id])
    create_if_not_exists index(:forum_announcements, [:board_id])
    create_if_not_exists index(:forum_announcements, [:forum_id, :is_active, :priority])

    # =========================================================================
    # Thread Attachments (File uploads)
    # =========================================================================
    
    create_if_not_exists table(:thread_attachments, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :filename, :string, null: false
      add :original_filename, :string, null: false
      add :content_type, :string, null: false
      add :file_size, :integer, null: false
      add :file_path, :string, null: false
      add :file_url, :string
      
      # Image-specific
      add :is_image, :boolean, default: false
      add :width, :integer
      add :height, :integer
      add :thumbnail_url, :string
      
      # Stats
      add :download_count, :integer, default: 0
      add :is_inline, :boolean, default: false
      
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all)
      add :post_id, references(:thread_posts, type: :binary_id, on_delete: :delete_all)
      add :uploader_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      
      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:thread_attachments, [:thread_id])
    create_if_not_exists index(:thread_attachments, [:post_id])
    create_if_not_exists index(:thread_attachments, [:uploader_id])
  end

  def down do
    drop_if_exists table(:thread_attachments)
    drop_if_exists table(:forum_announcements)
    drop_if_exists table(:forum_mod_logs)
    drop_if_exists table(:forum_warnings)
    drop_if_exists table(:poll_votes)
    drop_if_exists table(:thread_polls)
    drop_if_exists table(:thread_prefixes)
    drop_if_exists table(:subscriptions)
    drop_if_exists table(:reputation_entries)
    drop_if_exists table(:post_votes)
    drop_if_exists table(:thread_votes)
    drop_if_exists table(:forum_plugins)
    drop_if_exists table(:forum_themes)
    drop_if_exists table(:forum_members)
    drop_if_exists table(:forum_user_groups)
    drop_if_exists table(:thread_posts)
    drop_if_exists table(:threads)
    drop_if_exists table(:boards)
    
    alter table(:forums) do
      remove_if_exists :favicon_url, :string
      remove_if_exists :logo_url, :string
      remove_if_exists :tagline, :string
      remove_if_exists :theme_id, :binary_id
      remove_if_exists :custom_header_html, :text
      remove_if_exists :custom_footer_html, :text
      remove_if_exists :secondary_color, :string
      remove_if_exists :font_family, :string
      remove_if_exists :require_approval, :boolean
      remove_if_exists :registration_open, :boolean
      remove_if_exists :posting_requires_account, :boolean
      remove_if_exists :monthly_score, :integer
      remove_if_exists :verified, :boolean
      remove_if_exists :thread_count, :integer
      remove_if_exists :active_users_today, :integer
      remove_if_exists :category, :string
      remove_if_exists :tags, {:array, :string}
      remove_if_exists :tier, :string
    end
  end
end
