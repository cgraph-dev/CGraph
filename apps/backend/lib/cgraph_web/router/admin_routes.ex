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

        # Feature Flags Management
        resources "/feature-flags", FeatureFlagController, except: [:new, :edit]
        get "/feature-flags/:id/history", FeatureFlagController, :history

        # Moderation queue
        get "/reports", ModerationController, :list_reports
        post "/reports/batch-review", ModerationController, :batch_review
        get "/reports/:id", ModerationController, :show_report
        post "/reports/:id/review", ModerationController, :review_report

        # Appeals
        get "/appeals", ModerationController, :list_appeals
        post "/appeals/:id/review", ModerationController, :review_appeal

        # Moderation stats
        get "/moderation/stats", ModerationController, :stats
      end

      # Admin management (requires admin role)
      scope "/api/v1/admin", CGraphWeb.Admin do
        pipe_through [:api, :api_admin]
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
