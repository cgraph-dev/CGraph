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

      # ======================================================================
      # Enterprise Routes
      # ======================================================================

      # Enterprise Admin Console (super-admin only)
      scope "/api/v1/admin/enterprise", CGraphWeb.API.V1 do
        pipe_through [:api, :api_admin]

        # Admin user management
        get "/admins", EnterpriseAdminController, :list_admins
        post "/admins", EnterpriseAdminController, :create_admin
        get "/admins/:id", EnterpriseAdminController, :show_admin
        put "/admins/:id", EnterpriseAdminController, :update_admin
        delete "/admins/:id", EnterpriseAdminController, :delete_admin

        # Admin roles
        get "/roles", EnterpriseAdminController, :list_roles
        post "/roles", EnterpriseAdminController, :create_role

        # Audit entries
        get "/audit", EnterpriseAdminController, :list_audit_entries
        get "/audit/export", EnterpriseAdminController, :export_audit
        get "/audit/:id", EnterpriseAdminController, :show_audit_entry

        # Platform stats
        get "/stats", EnterpriseAdminController, :platform_stats

        # SSO provider management (admin)
        get "/sso/providers", SSOController, :list_providers
        post "/sso/providers", SSOController, :create_provider
        put "/sso/providers/:id", SSOController, :update_provider
        delete "/sso/providers/:id", SSOController, :delete_provider

        # Enterprise analytics
        get "/analytics/overview", EnterpriseAnalyticsController, :overview
        get "/analytics/time-series", EnterpriseAnalyticsController, :time_series
        get "/analytics/org/:org_id", EnterpriseAnalyticsController, :org_breakdown
        get "/analytics/org/:org_id/export", EnterpriseAnalyticsController, :export

        # Compliance
        get "/compliance/:org_id/status", ComplianceController, :status
        post "/compliance/:org_id/audit", ComplianceController, :audit
        get "/compliance/regions", ComplianceController, :list_regions
        post "/compliance/regions/verify", ComplianceController, :verify_residency
        get "/compliance/:org_id/branding", ComplianceController, :get_branding
        get "/compliance/:org_id/theme", ComplianceController, :get_theme
        put "/compliance/:org_id/branding", ComplianceController, :update_branding

        # Organization management (admin-level)
        get "/organizations", OrganizationController, :admin_list
        get "/organizations/:id", OrganizationController, :admin_show
        post "/organizations/:id/suspend", OrganizationController, :suspend
        delete "/organizations/:id/suspend", OrganizationController, :unsuspend
      end

      # Organization management (authenticated users)
      scope "/api/v1/organizations", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        get "/", OrganizationController, :index
        post "/", OrganizationController, :create
        get "/:slug", OrganizationController, :show
        put "/:slug", OrganizationController, :update
        delete "/:slug", OrganizationController, :delete

        # Members
        get "/:slug/members", OrganizationController, :list_members
        post "/:slug/members", OrganizationController, :add_member
        delete "/:slug/members/:user_id", OrganizationController, :remove_member

        # Settings
        put "/:slug/settings", OrganizationController, :update_settings

        # Ownership transfer
        post "/:slug/transfer", OrganizationController, :transfer_ownership
      end

      # SSO auth flow (public — no auth required for initiate/callback)
      scope "/api/v1/sso", CGraphWeb.API.V1 do
        pipe_through [:api]

        post "/:provider_id/initiate", SSOController, :initiate
        post "/:provider_id/callback", SSOController, :callback
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
