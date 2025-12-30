defmodule CgraphWeb.Router do
  @moduledoc """
  Main router for CGraph API.
  
  Defines all API routes organized by feature domain.
  Uses pipeline-based middleware for authentication and authorization.
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
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
    # Enhanced rate limiter with sliding window algorithm
    # See CgraphWeb.Plugs.RateLimiterV2 for tier documentation
    plug CgraphWeb.Plugs.RateLimiterV2, tier: :standard
  end

  # Strict rate limiting for authentication endpoints (prevent brute force)
  pipeline :api_auth_strict do
    plug :accepts, ["json"]
    plug CgraphWeb.Plugs.RateLimiterV2, tier: :strict
  end

  # Relaxed rate limiting for read-heavy endpoints
  pipeline :api_relaxed do
    plug :accepts, ["json"]
    plug CgraphWeb.Plugs.RateLimiterV2, tier: :relaxed
  end

  pipeline :api_auth do
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
    delete "/unlink", WalletAuthController, :unlink_wallet
  end

  # Authenticated API routes
  scope "/api/v1", CgraphWeb.API.V1 do
    pipe_through [:api, :api_auth]

    # Current user
    get "/me", UserController, :me
    put "/me", UserController, :update
    delete "/me", UserController, :delete
    post "/me/avatar", UserController, :upload_avatar
    get "/me/sessions", UserController, :sessions
    delete "/me/sessions/:id", UserController, :revoke_session

    # User Settings
    get "/settings", SettingsController, :show
    put "/settings", SettingsController, :update
    put "/settings/notifications", SettingsController, :update_notifications
    put "/settings/privacy", SettingsController, :update_privacy
    put "/settings/appearance", SettingsController, :update_appearance
    put "/settings/locale", SettingsController, :update_locale
    post "/settings/reset", SettingsController, :reset

    # Users
    resources "/users", UserController, only: [:index, :show]
    get "/users/:username/profile", UserController, :profile

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

    # Forum leaderboard (before resources to avoid conflict)
    get "/forums/leaderboard", ForumController, :leaderboard
    get "/forums/top", ForumController, :top
    
    # Plugin marketplace (global, not forum-specific)
    get "/plugins/marketplace", PluginController, :marketplace
    get "/plugins/marketplace/:plugin_id", PluginController, :marketplace_show

    # Forums (Reddit-style discovery + MyBB-style hosting)
    resources "/forums", ForumController do
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
    get "/friends/pending", FriendController, :pending
    get "/friends/suggestions", FriendController, :suggestions
    post "/friends/:id/accept", FriendController, :accept
    post "/friends/:id/decline", FriendController, :decline
    post "/friends/:id/block", FriendController, :block
    delete "/friends/:id/block", FriendController, :unblock
    get "/friends/:id/mutual", FriendController, :mutual
    resources "/friends", FriendController, only: [:index, :show, :create, :delete]
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
