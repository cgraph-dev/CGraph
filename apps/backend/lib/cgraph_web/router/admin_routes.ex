defmodule CGraphWeb.Router.AdminRoutes do
  @moduledoc """
  Admin and moderation routes.

  Includes system metrics, user management, content moderation,
  audit logs, GDPR compliance, event management, marketplace moderation,
  and LiveDashboard (dev/test only).
  """

  defmacro admin_routes do
    quote do
      # Admin Dashboard API routes (requires admin role)
      scope "/api/v1/admin", CGraphWeb.API.V1 do
        pipe_through [:api, :api_admin]

        # System metrics and real-time stats
        get "/metrics", AdminController, :metrics
        get "/stats", AdminController, :metrics
        get "/realtime", AdminController, :realtime

        # User management
        get "/users", AdminController, :list_users
        get "/users/:id", AdminController, :show_user
        post "/users/:id/ban", AdminController, :ban_user
        delete "/users/:id/ban", AdminController, :unban_user
        post "/users/:id/verify", AdminController, :verify_user

        # Content reports
        get "/reports", AdminController, :list_reports
        post "/reports/:id/resolve", AdminController, :resolve_report

        # Audit log
        get "/audit", AdminController, :list_audit_log

        # System configuration
        get "/config", AdminController, :get_config
        put "/config", AdminController, :update_config

        # Maintenance mode
        post "/maintenance/enable", AdminController, :enable_maintenance
        post "/maintenance/disable", AdminController, :disable_maintenance

        # GDPR / User data
        post "/users/:id/export", AdminController, :export_user_data
        delete "/users/:id/data", AdminController, :delete_user_data

        # Custom Emoji Moderation
        get "/emojis/pending", CustomEmojiController, :pending
        post "/emojis/:id/approve", CustomEmojiController, :approve
        post "/emojis/:id/reject", CustomEmojiController, :reject
      end

      # Admin/Moderator API routes
      scope "/api/admin", CGraphWeb.API.Admin do
        pipe_through [:api, :api_admin]

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

      # Admin Events & Marketplace management (requires admin role)
      scope "/api/v1/admin", CGraphWeb.Admin do
        pipe_through [:api, :api_admin]

        # Event Management (Admin)
        resources "/events", EventsController, except: [:new, :edit]
        post "/events/:id/start", EventsController, :start
        post "/events/:id/pause", EventsController, :pause
        post "/events/:id/resume", EventsController, :resume
        post "/events/:id/end", EventsController, :end_event
        get "/events/:event_id/tiers", EventsController, :list_tiers
        post "/events/:event_id/tiers", EventsController, :create_tier
        post "/events/:event_id/tiers/bulk", EventsController, :bulk_create_tiers
        put "/events/:event_id/tiers/:tier_id", EventsController, :update_tier
        get "/events/:event_id/quests", EventsController, :list_quests
        post "/events/:event_id/quests", EventsController, :create_quest
        put "/events/:event_id/quests/:quest_id", EventsController, :update_quest
        get "/events/:event_id/leaderboard", EventsController, :leaderboard
        get "/events/:event_id/analytics", EventsController, :analytics
        post "/events/:event_id/export", EventsController, :export

        # Marketplace Moderation (Admin)
        get "/marketplace/flagged", MarketplaceController, :flagged_listings
        get "/marketplace/listings/:id", MarketplaceController, :show_listing
        post "/marketplace/listings/:id/approve", MarketplaceController, :approve_listing
        post "/marketplace/listings/:id/reject", MarketplaceController, :reject_listing
        delete "/marketplace/listings/:id", MarketplaceController, :remove_listing
        post "/marketplace/listings/bulk-approve", MarketplaceController, :bulk_approve
        post "/marketplace/listings/bulk-reject", MarketplaceController, :bulk_reject
        get "/marketplace/transactions/disputed", MarketplaceController, :disputed_transactions
        get "/marketplace/transactions/:id", MarketplaceController, :show_transaction
        post "/marketplace/transactions/:id/resolve", MarketplaceController, :resolve_transaction
        get "/marketplace/users/:user_id", MarketplaceController, :user_profile
        post "/marketplace/users/:user_id/ban", MarketplaceController, :ban_user
        delete "/marketplace/users/:user_id/ban", MarketplaceController, :unban_user
        get "/marketplace/analytics", MarketplaceController, :analytics
        get "/marketplace/live-metrics", MarketplaceController, :live_metrics
        get "/marketplace/price-trends", MarketplaceController, :price_trends
        get "/marketplace/settings", MarketplaceController, :get_settings
        put "/marketplace/settings", MarketplaceController, :update_settings
        get "/marketplace/banned-items", MarketplaceController, :banned_items
        post "/marketplace/banned-items", MarketplaceController, :ban_item
      end

      # LiveDashboard (dev/admin only)
      if Mix.env() in [:dev, :test] do
        import Phoenix.LiveDashboard.Router

        scope "/" do
          pipe_through :browser

          live_dashboard "/dashboard", metrics: CGraphWeb.Telemetry
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
  end
end
