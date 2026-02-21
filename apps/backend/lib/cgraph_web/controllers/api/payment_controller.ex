defmodule CGraphWeb.Api.PaymentController do
  @moduledoc """
  API controller for payment and billing management.

  Provides endpoints for:
  - Creating Stripe Checkout sessions
  - Managing subscriptions via customer portal
  - Getting subscription status
  - Listing available plans
  """

  use CGraphWeb, :controller

  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Guardian
  alias CGraph.Subscriptions

  action_fallback CGraphWeb.FallbackController

  @doc """
  Creates a Stripe Checkout session for subscription.

  ## Parameters
    - `tier`: "premium" or "enterprise"
    - `yearly`: boolean (optional, default: false)

  ## Response
    - `checkout_url`: URL to redirect user to Stripe Checkout
  """
  @spec create_checkout(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_checkout(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    tier = Map.get(params, "tier", "premium")
    yearly = Map.get(params, "yearly", false)

    case Subscriptions.create_checkout_session(user, tier, yearly: yearly) do
      {:ok, url} ->
        render_data(conn, %{checkout_url: url})

      {:error, message} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: message})
    end
  end

  @doc """
  Creates a Stripe Customer Portal session.
  Allows users to manage their subscription, update payment method, etc.

  ## Response
    - `portal_url`: URL to redirect user to Stripe Customer Portal
  """
  @spec create_portal(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_portal(conn, _params) do
    user = Guardian.Plug.current_resource(conn)

    case Subscriptions.create_portal_session(user) do
      {:ok, url} ->
        render_data(conn, %{portal_url: url})

      {:error, :no_customer} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "No active subscription found"})

      {:error, message} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: message})
    end
  end

  @doc """
  Gets the current user's billing/subscription status.

  ## Response
    - `tier`: Current tier (free, premium, enterprise)
    - `active`: Whether subscription is active
    - `expires_at`: Subscription expiration date (if applicable)
    - `expiring_soon`: Whether subscription expires within 7 days
  """
  @spec billing_status(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def billing_status(conn, _params) do
    user = Guardian.Plug.current_resource(conn)

    render_data(conn, %{
      tier: Subscriptions.get_tier(user),
      active: Subscriptions.active?(user),
      expires_at: user.subscription_expires_at,
      expiring_soon: Subscriptions.expiring_soon?(user),
      has_payment_method: user.stripe_customer_id != nil
    })
  end

  @doc """
  Gets available subscription plans.
  """
  @spec plans(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def plans(conn, _params) do
    plans = [
      %{
        id: "free",
        name: "Free",
        price: 0,
        currency: "usd",
        interval: "forever",
        features: [
          "Unlimited encrypted messaging",
          "Join up to 10 forums",
          "Basic profile customization",
          "100 messages per day",
          "5MB file uploads"
        ]
      },
      %{
        id: "premium",
        name: "Premium",
        price: 999,
        price_yearly: 9900,
        currency: "usd",
        interval: "month",
        features: [
          "Everything in Free",
          "Unlimited forums & groups",
          "Group video calls (up to 25)",
          "HD video quality",
          "Custom themes & emoji",
          "Priority support",
          "100MB file uploads",
          "No ads"
        ]
      },
      %{
        id: "enterprise",
        name: "Enterprise",
        price: nil,
        currency: "usd",
        interval: "custom",
        features: [
          "Everything in Premium",
          "SSO/SAML integration",
          "Custom branding",
          "Dedicated support",
          "API access",
          "Advanced analytics",
          "Unlimited file uploads",
          "SLA guarantee"
        ],
        contact_sales: true
      }
    ]

    render_data(conn, %{plans: plans})
  end
end
