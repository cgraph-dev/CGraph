# Stripe Configuration for CGraph
#
# This file configures the Stripe integration for subscription management.
# All sensitive values should be set via environment variables.

import Config

# Stripe API Configuration
config :stripity_stripe,
  api_key: System.get_env("STRIPE_SECRET_KEY"),
  signing_secret: System.get_env("STRIPE_WEBHOOK_SECRET"),
  hackney_opts: [
    recv_timeout: 30_000,
    connect_timeout: 10_000
  ]

# CGraph Subscription Configuration
config :cgraph, CGraph.Subscriptions,
  # Stripe Price IDs for each tier
  stripe_price_ids: %{
    plus: System.get_env("STRIPE_PRICE_PLUS"),
    pro: System.get_env("STRIPE_PRICE_PRO"),
    business: System.get_env("STRIPE_PRICE_BUSINESS"),
    enterprise: System.get_env("STRIPE_PRICE_ENTERPRISE")
  },

  # URLs for Stripe Checkout redirects
  success_url: System.get_env("APP_URL", "http://localhost:3000") <> "/billing/success?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: System.get_env("APP_URL", "http://localhost:3000") <> "/billing/cancel",
  portal_return_url: System.get_env("APP_URL", "http://localhost:3000") <> "/settings/billing"
