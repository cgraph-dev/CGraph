defmodule CGraphWeb.Router.CreatorRoutes do
  @moduledoc """
  Creator monetization routes.

  Includes Stripe Connect onboarding, paid forum management,
  subscriptions, earnings, payouts, and analytics.
  """

  defmacro creator_routes do
    quote do
      # Creator API routes (authenticated)
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        # ── Connect Onboarding ─────────────────────────────────
        post "/creator/onboard", CreatorController, :onboard
        get "/creator/status", CreatorController, :status
        post "/creator/onboard/refresh", CreatorController, :refresh_onboard

        # ── Forum Monetization Configuration ───────────────────
        put "/forums/:id/monetization", CreatorController, :update_monetization

        # ── Paid Forum Subscriptions ───────────────────────────
        post "/forums/:id/subscribe", CreatorController, :subscribe
        delete "/forums/:id/subscribe", CreatorController, :unsubscribe

        # ── Balance & Payouts ──────────────────────────────────
        get "/creator/balance", CreatorController, :balance
        post "/creator/payout", CreatorController, :request_payout
        get "/creator/payouts", CreatorController, :list_payouts

        # ── Analytics ──────────────────────────────────────────
        get "/creator/analytics/overview", CreatorAnalyticsController, :overview
        get "/creator/analytics/earnings", CreatorAnalyticsController, :earnings
        get "/creator/analytics/subscribers", CreatorAnalyticsController, :subscribers
        get "/creator/analytics/content", CreatorAnalyticsController, :content

        # ── Premium Content ────────────────────────────────────
        post "/creator/premium-threads", CreatorController, :create_premium_thread
        put "/threads/:id/purchase", CreatorController, :purchase_access
        get "/creator/tiers", CreatorController, :list_tiers
        post "/creator/tiers", CreatorController, :create_tier
        put "/creator/tiers/:id", CreatorController, :update_tier
        get "/creator/revenue-splits", CreatorController, :revenue_splits
      end
    end
  end
end
