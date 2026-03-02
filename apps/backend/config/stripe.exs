# Stripe Configuration for CGraph
#
# This file configures the Stripe integration for subscription management.
# IMPORTANT: Stripe secrets MUST be set in runtime.exs for production releases.
# This file only provides compile-time defaults for dev/test.

import Config

# Stripe API Configuration (dev/test defaults — overridden in runtime.exs for prod)
# In dev, read from env vars if available, otherwise use placeholders
config :stripity_stripe,
  api_key: System.get_env("STRIPE_SECRET_KEY") || "sk_test_placeholder",
  signing_secret: System.get_env("STRIPE_WEBHOOK_SECRET") || "whsec_test_placeholder",
  hackney_opts: [
    recv_timeout: 30_000,
    connect_timeout: 10_000
  ]

# CGraph Subscription Configuration
config :cgraph, CGraph.Subscriptions,
  # Stripe Price IDs for each tier (set in runtime.exs for prod)
  stripe_price_ids: %{
    premium: System.get_env("STRIPE_PRICE_PREMIUM"),
    enterprise: System.get_env("STRIPE_PRICE_ENTERPRISE")
  },

  # URLs for Stripe Checkout redirects
  success_url: "http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "http://localhost:3000/billing/cancel",
  portal_return_url: "http://localhost:3000/settings/billing"
