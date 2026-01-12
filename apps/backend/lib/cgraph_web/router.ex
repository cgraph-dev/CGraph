defmodule CgraphWeb.Router do
  @moduledoc """
  Main router for CGraph API.

  Defines all API routes organized by feature domain.
  Uses pipeline-based middleware for authentication and authorization.

  ## Security Features

  - Rate limiting on all pipelines (strict for auth, relaxed for reads)
  - Security headers (HSTS, CSP, X-Frame-Options, etc.)
  - JWT authentication with token revocation support
  """
  use CgraphWeb, :router

  import CgraphWeb.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {CgraphWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug CgraphWeb.Plugs.SecurityHeaders, mode: :browser
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
    # Security headers for API responses
    plug CgraphWeb.Plugs.SecurityHeaders, mode: :api
    # Enhanced rate limiter with sliding window algorithm
    # See CgraphWeb.Plugs.RateLimiterV2 for tier documentation
    plug CgraphWeb.Plugs.RateLimiterV2, tier: :standard
  end

  # Strict rate limiting for authentication endpoints (prevent brute force)
  pipeline :api_auth_strict do
    plug :accepts, ["json"]
    plug CgraphWeb.Plugs.SecurityHeaders, mode: :api
    plug CgraphWeb.Plugs.RateLimiterV2, tier: :strict
  end

  # Relaxed rate limiting for read-heavy endpoints
  pipeline :api_relaxed do
    plug :accepts, ["json"]
    plug CgraphWeb.Plugs.SecurityHeaders, mode: :api
    plug CgraphWeb.Plugs.RateLimiterV2, tier: :relaxed
  end

  pipeline :api_auth do
    # Check for JWT in HTTP-only cookies (XSS-safe) before checking Authorization header
    plug CgraphWeb.Plugs.CookieAuth
    plug CgraphWeb.Plugs.AuthPipeline
    plug CgraphWeb.Plugs.CurrentUser
  end

  # Health check endpoint (no auth required, relaxed rate limiting)
  scope "/", CgraphWeb do
    pipe_through :api_relaxed

    get "/health", HealthController, :index
    get "/ready", HealthController, :ready
  end

  # Public API routes (authentication endpoints - strict rate limiting)
  scope "/api/v1", CgraphWeb.API.V1 do
    pipe_through :api_auth_strict

    # Authentication - strict rate limiting to prevent brute force attacks
    post "/auth/register", AuthController, :register
    post "/auth/login", AuthController, :login
    post "/auth/refresh", AuthController, :refresh
    post "/auth/wallet/challenge", AuthController, :wallet_challenge
    post "/auth/wallet/verify", AuthController, :wallet_verify
    post "/auth/forgot-password", AuthController, :forgot_password
    post "/auth/reset-password", AuthController, :reset_password
    post "/auth/verify-email", AuthController, :verify_email
  end

  # OAuth Authentication Routes (public - strict rate limiting)
  scope "/api/v1/auth/oauth", CgraphWeb.API.V1 do
    pipe_through :api_auth_strict

    # Get available OAuth providers
    get "/providers", OAuthController, :list_providers

    # OAuth flow - authorization and callback
    get "/:provider", OAuthController, :authorize
    get "/:provider/callback", OAuthController, :callback
    post "/:provider/callback", OAuthController, :callback  # Apple uses POST with form_post

    # Mobile OAuth - verify tokens from native SDKs
    post "/:provider/mobile", OAuthController, :mobile
  end

  # OAuth account linking (requires auth)
  scope "/api/v1/auth/oauth", CgraphWeb.API.V1 do
    pipe_through [:api, :api_auth]

    post "/:provider/link", OAuthController, :link
    delete "/:provider/link", OAuthController, :unlink
  end

  # Anonymous Wallet Authentication (CGraph-style) - strict rate limiting
  scope "/api/v1/auth/wallet", CgraphWeb do
    pipe_through :api_auth_strict

    post "/generate", WalletAuthController, :generate
    post "/validate-pin", WalletAuthController, :validate_pin
    post "/register", WalletAuthController, :register
    post "/login", WalletAuthController, :login
    post "/recover/code", WalletAuthController, :recover_with_code
    post "/recover/file", WalletAuthController, :recover_with_file
  end

  # Wallet linking (requires auth)
  scope "/api/v1/auth/wallet", CgraphWeb do
    pipe_through [:api, :api_auth]

    post "/link", WalletAuthController, :link_wallet
    put "/pin", WalletAuthController, :update_pin
    delete "/unlink", WalletAuthController, :unlink_wallet
  end

  # Public API routes (no auth required, allows anonymous browsing)
  scope "/api/v1", CgraphWeb.API.V1 do
    pipe_through :api_relaxed

    # Public forum browsing - forums are public by default
    get "/forums", ForumController, :index
    get "/forums/leaderboard", ForumController, :leaderboard
    get "/forums/top", ForumController, :top
    get "/forums/:id", ForumController, :show
    get "/forums/:id/contributors", ForumController, :contributors

    # Public posts browsing
    get "/forums/:forum_id/posts", PostController, :index
    get "/forums/:forum_id/posts/:id", PostController, :show

    # Public post feed (aggregated from all public forums)
    get "/posts/feed", PostController, :feed
  end

  # Authenticated API routes
  scope "/api/v1", CgraphWeb.API.V1 do
    pipe_through [:api, :api_auth]

    # Authentication - logout and email verification require auth
    post "/auth/logout", AuthController, :logout
    post "/auth/resend-verification", AuthController, :resend_verification

    # Two-factor authentication
    get "/auth/2fa/status", TwoFactorController, :status
    post "/auth/2fa/setup", TwoFactorController, :setup
    post "/auth/2fa/enable", TwoFactorController, :enable
    post "/auth/2fa/verify", TwoFactorController, :verify
    post "/auth/2fa/disable", TwoFactorController, :disable
    post "/auth/2fa/backup-codes", TwoFactorController, :regenerate_backup_codes
    post "/auth/2fa/backup-codes/use", TwoFactorController, :use_backup_code

    # Current user
    get "/me", UserController, :me
    put "/me", UserController, :update
    put "/me/username", UserController, :change_username
    delete "/me", UserController, :delete
    post "/me/avatar", UserController, :upload_avatar
    get "/me/sessions", UserController, :sessions
    delete "/me/sessions/:id", UserController, :revoke_session
    post "/me/export", UserController, :request_data_export

    # User Settings
    get "/settings", SettingsController, :show
    put "/settings", SettingsController, :update
    put "/settings/notifications", SettingsController, :update_notifications
    put "/settings/privacy", SettingsController, :update_privacy
    put "/settings/appearance", SettingsController, :update_appearance
    put "/settings/locale", SettingsController, :update_locale
    post "/settings/reset", SettingsController, :reset

    # Users
    get "/users/leaderboard", UserController, :leaderboard
    resources "/users", UserController, only: [:index, :show]
    get "/users/:username/profile", UserController, :profile
    get "/users/:id/presence", UserController, :presence
    post "/users/presence/bulk", UserController, :bulk_presence

    # Direct Messages (1:1)
    resources "/conversations", ConversationController, only: [:index, :show, :create] do
      resources "/messages", MessageController, only: [:index, :create]
      post "/messages/:id/read", MessageController, :mark_read
      post "/typing", MessageController, :typing
    end

    # Group Channels (Discord-style)
    resources "/groups", GroupController do
      resources "/channels", ChannelController do
        resources "/messages", ChannelMessageController, only: [:index, :create]
        post "/typing", ChannelMessageController, :typing
      end

      resources "/members", GroupMemberController, only: [:index, :create, :update, :delete]
      post "/members/:id/kick", GroupMemberController, :kick
      post "/members/:id/ban", GroupMemberController, :ban
      post "/members/:id/mute", GroupMemberController, :mute

      resources "/roles", RoleController
      resources "/invites", InviteController, only: [:index, :create, :delete]
      get "/audit-log", GroupController, :audit_log
    end

    # Join group via invite
    post "/invites/:code/join", InviteController, :join

    # Plugin marketplace (global, not forum-specific)
    get "/plugins/marketplace", PluginController, :marketplace
    get "/plugins/marketplace/:plugin_id", PluginController, :marketplace_show

    # Forums (Reddit-style discovery + MyBB-style hosting)
    # Note: GET /forums, /forums/:id, /forums/leaderboard, /forums/top are public (no auth required)

    # Vote eligibility check
    get "/forums/vote-eligibility", ForumController, :vote_eligibility

    resources "/forums", ForumController, except: [:index, :show] do
      resources "/posts", PostController do
        post "/vote", PostController, :vote
        post "/save", PostController, :save
        resources "/comments", CommentController do
          post "/vote", CommentController, :vote
        end
      end

      resources "/categories", CategoryController
      get "/modqueue", ForumController, :mod_queue

      # Forum voting (competition)
      post "/vote", ForumController, :vote
      get "/vote", ForumController, :get_vote
      delete "/vote", ForumController, :remove_vote

      # MyBB-style boards
      resources "/boards", BoardController, except: [:new, :edit] do
        get "/by-slug/:slug", BoardController, :show_by_slug
      end

      # Forum threads (all threads across all boards for a forum)
      get "/threads", ThreadController, :forum_threads

      # Forum plugins
      resources "/plugins", PluginController, except: [:new, :edit] do
        post "/toggle", PluginController, :toggle
      end
    end

    # Boards -> Threads (nested outside forums for cleaner URLs)
    resources "/boards", BoardController, only: [] do
      resources "/threads", ThreadController, except: [:new, :edit] do
        get "/by-slug/:slug", ThreadController, :show_by_slug
        post "/pin", ThreadController, :pin
        post "/lock", ThreadController, :lock
        post "/vote", ThreadController, :vote
      end
    end

    # Threads -> Posts (replies)
    resources "/threads", ThreadController, only: [] do
      resources "/posts", ThreadPostController, except: [:new, :edit] do
        post "/vote", ThreadPostController, :vote
      end
    end

    # Reactions (for messages)
    post "/messages/:id/reactions", ReactionController, :create
    delete "/messages/:id/reactions/:emoji", ReactionController, :delete

    # File uploads
    post "/upload", UploadController, :create
    get "/files/:id", UploadController, :show

    # Voice Messages
    post "/voice-messages", VoiceMessageController, :create
    get "/voice-messages/:id", VoiceMessageController, :show
    get "/voice-messages/:id/waveform", VoiceMessageController, :waveform
    delete "/voice-messages/:id", VoiceMessageController, :delete

    # End-to-End Encryption (E2EE) Key Management
    # Note: Specific routes must come before parameterized routes
    post "/e2ee/keys", E2EEController, :register_keys
    post "/e2ee/keys/prekeys", E2EEController, :replenish_prekeys
    get "/e2ee/keys/count", E2EEController, :prekey_count
    get "/e2ee/keys/:user_id", E2EEController, :get_prekey_bundle
    get "/e2ee/devices", E2EEController, :list_devices
    delete "/e2ee/devices/:device_id", E2EEController, :remove_device
    get "/e2ee/safety-number/:user_id", E2EEController, :safety_number
    post "/e2ee/keys/:key_id/verify", E2EEController, :verify_key
    post "/e2ee/keys/:key_id/revoke", E2EEController, :revoke_key

    # Search
    get "/search/users", SearchController, :users
    get "/search/messages", SearchController, :messages
    get "/search/posts", SearchController, :posts

    # Notifications
    get "/notifications", NotificationController, :index
    post "/notifications/read", NotificationController, :mark_all_read
    post "/notifications/:id/read", NotificationController, :mark_read

    # Push notification tokens
    post "/push-tokens", PushTokenController, :create
    delete "/push-tokens/:token", PushTokenController, :delete

    # Friends - specific routes MUST come before resources to avoid being matched as :show
    get "/friends/requests", FriendController, :incoming_requests
    get "/friends/sent", FriendController, :outgoing_requests
    get "/friends/pending", FriendController, :pending
    get "/friends/suggestions", FriendController, :suggestions
    post "/friends/:id/accept", FriendController, :accept
    post "/friends/:id/decline", FriendController, :decline
    post "/friends/:id/block", FriendController, :block
    delete "/friends/:id/block", FriendController, :unblock
    get "/friends/:id/mutual", FriendController, :mutual
    resources "/friends", FriendController, only: [:index, :show, :create, :delete]

    # Content Reports (users can report content/users)
    resources "/reports", ReportController, only: [:index, :show, :create]

    # ========================================
    # MyBB Feature: Private Messages (PM)
    # ========================================
    get "/pm/folders", PMController, :list_folders
    post "/pm/folders", PMController, :create_folder
    put "/pm/folders/:id", PMController, :update_folder
    delete "/pm/folders/:id", PMController, :delete_folder
    get "/pm/messages", PMController, :list_messages
    get "/pm/messages/:id", PMController, :show_message
    post "/pm/messages", PMController, :send_message
    put "/pm/messages/:id", PMController, :update_message
    delete "/pm/messages/:id", PMController, :delete_message
    post "/pm/messages/:id/read", PMController, :mark_read
    post "/pm/messages/:id/move", PMController, :move_to_folder
    get "/pm/drafts", PMController, :list_drafts
    post "/pm/drafts", PMController, :save_draft
    put "/pm/drafts/:id", PMController, :update_draft
    delete "/pm/drafts/:id", PMController, :delete_draft
    post "/pm/drafts/:id/send", PMController, :send_draft
    get "/pm/stats", PMController, :stats
    post "/pm/export", PMController, :export

    # ========================================
    # MyBB Feature: Announcements
    # ========================================
    get "/announcements", AnnouncementController, :index
    get "/announcements/:id", AnnouncementController, :show
    post "/announcements/:id/read", AnnouncementController, :mark_read
    post "/announcements/:id/dismiss", AnnouncementController, :dismiss

    # ========================================
    # MyBB Feature: Calendar & Events
    # ========================================
    get "/calendar/events", CalendarController, :list_events
    get "/calendar/events/:id", CalendarController, :show_event
    post "/calendar/events", CalendarController, :create_event
    put "/calendar/events/:id", CalendarController, :update_event
    delete "/calendar/events/:id", CalendarController, :delete_event
    get "/calendar/categories", CalendarController, :list_categories
    post "/calendar/categories", CalendarController, :create_category
    put "/calendar/categories/:id", CalendarController, :update_category
    delete "/calendar/categories/:id", CalendarController, :delete_category
    get "/calendar/events/:id/rsvps", CalendarController, :list_rsvps
    post "/calendar/events/:id/rsvp", CalendarController, :rsvp
    delete "/calendar/events/:id/rsvp", CalendarController, :cancel_rsvp

    # ========================================
    # MyBB Feature: Referral System
    # ========================================
    get "/referrals/code", ReferralController, :get_code
    post "/referrals/code/regenerate", ReferralController, :regenerate_code
    get "/referrals", ReferralController, :list_referrals
    get "/referrals/pending", ReferralController, :list_pending
    get "/referrals/stats", ReferralController, :stats
    get "/referrals/leaderboard", ReferralController, :leaderboard
    get "/referrals/rewards", ReferralController, :list_reward_tiers
    post "/referrals/rewards/:id/claim", ReferralController, :claim_reward
    get "/referrals/validate/:code", ReferralController, :validate_code
    post "/referrals/apply", ReferralController, :apply_code

    # ========================================
    # MyBB Feature: Member List & Discovery
    # ========================================
    get "/members", MemberController, :index
    get "/members/:id", MemberController, :show
    get "/user-groups", MemberController, :list_groups

    # ========================================
    # MyBB Feature: Presence & Who's Online
    # ========================================
    get "/presence/online", PresenceController, :online_users
    post "/presence/heartbeat", PresenceController, :heartbeat
    get "/presence/stats", PresenceController, :stats

    # ========================================
    # MyBB Feature: User Profile Enhancements
    # ========================================
    get "/profiles/:username", ProfileController, :show
    put "/profiles/signature", ProfileController, :update_signature
    put "/profiles/bio", ProfileController, :update_bio
    get "/profiles/:username/posts", ProfileController, :posts
    get "/profiles/:username/threads", ProfileController, :threads
    get "/profiles/:username/reputation", ProfileController, :reputation
    post "/profiles/:username/reputation", ProfileController, :give_reputation
  end

  # Gamification API routes (authenticated)
  scope "/api/v1", CgraphWeb do
    pipe_through [:api, :api_auth]

    # User gamification stats
    get "/gamification/stats", GamificationController, :stats
    get "/gamification/level-info", GamificationController, :level_info
    get "/gamification/xp/history", GamificationController, :xp_history

    # Achievements
    get "/gamification/achievements", GamificationController, :achievements
    get "/gamification/achievements/:id", GamificationController, :show_achievement

    # Leaderboards
    get "/gamification/leaderboard/:category", GamificationController, :leaderboard

    # Streaks
    post "/gamification/streak/claim", GamificationController, :claim_streak

    # Quests
    get "/quests", QuestController, :index
    get "/quests/active", QuestController, :active
    get "/quests/daily", QuestController, :daily
    get "/quests/weekly", QuestController, :weekly
    get "/quests/:id", QuestController, :show
    post "/quests/:id/accept", QuestController, :accept
    post "/quests/:id/claim", QuestController, :claim

    # Titles
    get "/titles", TitleController, :index
    get "/titles/owned", TitleController, :owned
    post "/titles/:id/equip", TitleController, :equip
    post "/titles/unequip", TitleController, :unequip
    post "/titles/:id/purchase", TitleController, :purchase

    # Shop
    get "/shop", ShopController, :index
    get "/shop/categories", ShopController, :categories
    get "/shop/purchases", ShopController, :purchases
    get "/shop/:id", ShopController, :show
    post "/shop/:id/purchase", ShopController, :purchase

    # Coins
    get "/coins", CoinsController, :balance
    get "/coins/history", CoinsController, :history
    get "/coins/packages", CoinsController, :packages
    get "/coins/earn", CoinsController, :earn_methods

    # Premium subscriptions
    get "/premium/status", PremiumController, :status
    get "/premium/tiers", PremiumController, :tiers
    get "/premium/features", PremiumController, :features
    post "/premium/subscribe", PremiumController, :subscribe
    post "/premium/cancel", PremiumController, :cancel
  end

  # Admin/Moderator API routes
  scope "/api/admin", CgraphWeb.API.Admin do
    pipe_through [:api, :api_auth]

    # Moderation queue
    get "/reports", ModerationController, :list_reports
    get "/reports/:id", ModerationController, :show_report
    post "/reports/:id/review", ModerationController, :review_report

    # Appeals
    get "/appeals", ModerationController, :list_appeals
    post "/appeals/:id/review", ModerationController, :review_appeal

    # Moderation stats
    get "/moderation/stats", ModerationController, :stats
  end

  # LiveDashboard (dev/admin only)
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: CgraphWeb.Telemetry
    end
  end

  # Enable Swoosh mailbox preview in development
  if Application.compile_env(:cgraph, :dev_routes) do
    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
