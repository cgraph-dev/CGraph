defmodule CGraphWeb.Router do
  @moduledoc """
  Main router for CGraph API.

  Routes are organized by domain into separate modules for maintainability:
  - `HealthRoutes`       — Health checks, webhooks, telemetry
  - `AuthRoutes`         — Registration, login, OAuth, wallet, 2FA
  - `PublicRoutes`       — Public forum browsing, tiers, RSS, emojis
  - `UserRoutes`         — User profiles, settings, friends, notifications
  - `MessagingRoutes`    — Conversations, groups, channels, reactions
  - `ForumRoutes`        — Forum CRUD, boards, threads, permissions
  - `GamificationRoutes` — XP, quests, shop, cosmetics, marketplace
  - `AdminRoutes`        — Admin dashboard, moderation, GDPR

  ## Security Features

  - Rate limiting on all pipelines (strict for auth, relaxed for reads)
  - Security headers (HSTS, CSP, X-Frame-Options, etc.)
  - JWT authentication with token revocation support
  """
  use CGraphWeb, :router

  import CGraphWeb.UserAuth

  # Import route modules
  import CGraphWeb.Router.HealthRoutes
  import CGraphWeb.Router.AuthRoutes
  import CGraphWeb.Router.PublicRoutes
  import CGraphWeb.Router.UserRoutes
  import CGraphWeb.Router.MessagingRoutes
  import CGraphWeb.Router.ForumRoutes
  import CGraphWeb.Router.GamificationRoutes
  import CGraphWeb.Router.AdminRoutes

  # ============================================================================
  # Pipelines
  # ============================================================================

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {CGraphWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug CGraphWeb.Plugs.SecurityHeaders, mode: :browser
    plug :fetch_current_user
  end

  pipeline :api do
    plug :accepts, ["json"]
    # Security headers for API responses
    plug CGraphWeb.Plugs.SecurityHeaders, mode: :api
    # Cookie-to-Bearer translation for web clients
    plug CGraphWeb.Plugs.CookieAuth
    # End-to-end request tracing
    plug CGraphWeb.Plugs.RequestTracing
    # Enhanced rate limiter with sliding window algorithm
    # See CGraphWeb.Plugs.RateLimiterV2 for tier documentation
    plug CGraphWeb.Plugs.RateLimiterV2, tier: :standard
    plug CGraphWeb.Plugs.ApiVersion
    plug CGraphWeb.Plugs.IdempotencyPlug
    plug CGraphWeb.Plugs.SentryContext
  end

  # Strict rate limiting for authentication endpoints (prevent brute force)
  pipeline :api_auth_strict do
    plug :accepts, ["json"]
    plug CGraphWeb.Plugs.SecurityHeaders, mode: :api
    plug CGraphWeb.Plugs.CookieAuth
    plug CGraphWeb.Plugs.RequestTracing
    plug CGraphWeb.Plugs.RateLimiterV2, tier: :strict
    plug CGraphWeb.Plugs.ApiVersion
    plug CGraphWeb.Plugs.IdempotencyPlug
    plug CGraphWeb.Plugs.SentryContext
  end

  # Relaxed rate limiting for read-heavy public endpoints
  pipeline :api_relaxed do
    plug :accepts, ["json"]
    plug CGraphWeb.Plugs.SecurityHeaders, mode: :api
    plug CGraphWeb.Plugs.RequestTracing
    plug CGraphWeb.Plugs.RateLimiterV2, tier: :relaxed
    plug CGraphWeb.Plugs.ApiVersion
    plug CGraphWeb.Plugs.SentryContext
  end

  # Authenticated API pipeline
  pipeline :api_auth do
    plug :accepts, ["json"]
    plug CGraphWeb.Plugs.SecurityHeaders, mode: :api
    plug CGraphWeb.Plugs.RequestTracing
    plug CGraphWeb.Plugs.RateLimiterV2, tier: :standard
    plug CGraphWeb.Plugs.ApiVersion
    plug CGraphWeb.Plugs.IdempotencyPlug
    plug CGraphWeb.Plugs.SentryContext
    plug CGraphWeb.Plugs.RequireAuth
  end

  # Admin pipeline (requires admin role)
  pipeline :api_admin do
    plug :accepts, ["json"]
    plug CGraphWeb.Plugs.SecurityHeaders, mode: :api
    plug CGraphWeb.Plugs.RequestTracing
    plug CGraphWeb.Plugs.RateLimiterV2, tier: :standard
    plug CGraphWeb.Plugs.RequireAuth
    plug CGraphWeb.Plugs.RequireAdmin
    plug CGraphWeb.Plugs.ApiVersion
    plug CGraphWeb.Plugs.IdempotencyPlug
    plug CGraphWeb.Plugs.SentryContext
  end

  # ============================================================================
  # Routes (organized by domain)
  # ============================================================================

  health_routes()
  auth_routes()
  user_routes()
  public_routes()
  messaging_routes()
  forum_routes()
  gamification_routes()
  admin_routes()
end
