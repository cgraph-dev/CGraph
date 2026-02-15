defmodule CGraphWeb.Router.HealthRoutes do
  @moduledoc """
  Health check and operational monitoring routes.

  These endpoints are public and use relaxed rate limiting.
  Used by load balancers, monitoring systems, and Fly.io health checks.
  """

  defmacro health_routes do
    quote do
      # Health check endpoint (no auth required, relaxed rate limiting)
      scope "/", CGraphWeb do
        pipe_through :api_relaxed

        get "/health", HealthController, :index
        get "/ready", HealthController, :ready
        get "/metrics", MetricsController, :index
      end

      # Stripe webhook endpoint (no auth - uses Stripe signature verification)
      # Must have raw body preserved for signature verification
      scope "/api/webhooks", CGraphWeb do
        pipe_through :api

        post "/stripe", StripeWebhookController, :webhook
      end

      # Telemetry endpoints (relaxed rate limiting, minimal auth)
      scope "/api/v1/telemetry", CGraphWeb.API.V1 do
        pipe_through :api_relaxed

        # Error reporting from clients (unauthenticated allowed for error tracking)
        post "/errors", TelemetryController, :create_error
        post "/metrics", TelemetryController, :create_metric
      end
    end
  end
end
