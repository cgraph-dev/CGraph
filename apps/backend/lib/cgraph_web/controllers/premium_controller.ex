defmodule CGraphWeb.PremiumController do
  @moduledoc """
  Controller for premium subscriptions and features.
  """
  use CGraphWeb, :controller

  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/premium/status
  Get current subscription status.
  """
  def status(conn, _params) do
    user = conn.assigns.current_user

    conn
    |> put_status(:ok)
    |> json(%{
      tier: user.subscription_tier,
      expires_at: user.subscription_expires_at,
      is_active: subscription_active?(user),
      features: get_tier_features(user.subscription_tier)
    })
  end

  @doc """
  GET /api/v1/premium/tiers
  List all subscription tiers and their features.
  """
  def tiers(conn, _params) do
    tiers = [
      %{
        id: "free",
        name: "Free",
        price: 0,
        currency: "USD",
        interval: "month",
        features: [
          "Basic chat features",
          "Forum access",
          "5 friend limit per day",
          "Standard support"
        ],
        limits: %{
          daily_friend_requests: 5,
          xp_multiplier: 1.0,
          coin_bonus: 0,
          custom_themes: false,
          priority_support: false,
          exclusive_badges: false
        }
      },
      %{
        id: "premium",
        name: "Premium",
        price: 4.99,
        currency: "USD",
        interval: "month",
        popular: true,
        features: [
          "Everything in Free",
          "1.5x XP boost",
          "10% coin bonus on purchases",
          "Custom themes",
          "Priority support",
          "Exclusive badges",
          "No daily limits"
        ],
        limits: %{
          daily_friend_requests: nil,
          xp_multiplier: 1.5,
          coin_bonus: 10,
          custom_themes: true,
          priority_support: true,
          exclusive_badges: true
        }
      },
      %{
        id: "premium_plus",
        name: "Premium+",
        price: 9.99,
        currency: "USD",
        interval: "month",
        features: [
          "Everything in Premium",
          "2x XP boost",
          "20% coin bonus on purchases",
          "Exclusive effects",
          "Early access to new features",
          "Dedicated support",
          "Custom profile banner"
        ],
        limits: %{
          daily_friend_requests: nil,
          xp_multiplier: 2.0,
          coin_bonus: 20,
          custom_themes: true,
          priority_support: true,
          exclusive_badges: true,
          exclusive_effects: true,
          early_access: true,
          custom_banner: true
        }
      }
    ]

    conn
    |> put_status(:ok)
    |> json(%{tiers: tiers})
  end

  @doc """
  POST /api/v1/premium/subscribe
  Create a subscription checkout session.

  ## Security

  This endpoint does NOT directly grant premium access. It creates a
  payment session URL. The actual subscription is granted via webhook
  after payment confirmation from the payment provider.

  ## Environment Variables Required

  - STRIPE_SECRET_KEY: Stripe API key
  - STRIPE_WEBHOOK_SECRET: Webhook signature verification
  - PREMIUM_DEMO_MODE: Set to "true" ONLY for development
  """
  def subscribe(conn, %{"tier" => tier}) do
    user = conn.assigns.current_user

    if tier in ["free", "premium", "premium_plus"] do
      # Downgrade to free is always allowed
      if tier == "free" do
        handle_downgrade_to_free(conn, user)
      else
        # Check if demo mode is enabled (ONLY for development)
        if demo_mode_enabled?() do
          handle_demo_subscription(conn, user, tier)
        else
          create_checkout_session(conn, user, tier)
        end
      end
    else
      conn
      |> put_status(:bad_request)
      |> json(%{error: "invalid_tier", message: "Invalid subscription tier"})
      |> halt()
    end
  end

  # Handle downgrade to free tier
  defp handle_downgrade_to_free(conn, user) do
    {:ok, updated_user} =
      user
      |> Ecto.Changeset.change(%{
        subscription_tier: "free",
        subscription_expires_at: nil,
        cancel_at_period_end: false
      })
      |> Repo.update()

    conn
    |> put_status(:ok)
    |> json(%{
      success: true,
      tier: updated_user.subscription_tier,
      message: "Successfully downgraded to free tier"
    })
  end

  # Demo mode for development ONLY - requires explicit env var
  defp demo_mode_enabled? do
    System.get_env("PREMIUM_DEMO_MODE") == "true" and
    Application.get_env(:cgraph, :env) != :prod
  end

  defp handle_demo_subscription(conn, user, tier) do
    require Logger
    Logger.warning("[SECURITY] Premium demo mode used for user #{user.id} - tier: #{tier}")

    expires_at = DateTime.add(DateTime.utc_now(), 30 * 24 * 60 * 60, :second)

    {:ok, updated_user} =
      user
      |> Ecto.Changeset.change(%{
        subscription_tier: tier,
        subscription_expires_at: expires_at
      })
      |> Repo.update()

    conn
    |> put_status(:ok)
    |> json(%{
      success: true,
      demo_mode: true,
      tier: updated_user.subscription_tier,
      expires_at: updated_user.subscription_expires_at,
      message: "Demo subscription activated (development mode only)"
    })
  end

  # Production: Create Stripe checkout session
  defp create_checkout_session(conn, _user, tier) do
    stripe_key = System.get_env("STRIPE_SECRET_KEY")

    if is_nil(stripe_key) or stripe_key == "" do
      conn
      |> put_status(:service_unavailable)
      |> json(%{
        error: "payment_not_configured",
        message: "Payment processing is not configured. Please contact support."
      })
    else
      # Stripe checkout session creation would go here
      # For now, return that the feature is coming soon
      price_ids = %{
        "premium" => System.get_env("STRIPE_PREMIUM_PRICE_ID"),
        "premium_plus" => System.get_env("STRIPE_PREMIUM_PLUS_PRICE_ID")
      }

      price_id = Map.get(price_ids, tier)

      if is_nil(price_id) do
        conn
        |> put_status(:service_unavailable)
        |> json(%{
          error: "price_not_configured",
          message: "Subscription pricing not configured. Please contact support."
        })
      else
        # In production, this would call Stripe.Checkout.Session.create
        # For now, return a placeholder response
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          action: "redirect",
          checkout_url: nil,
          message: "Payment integration coming soon. Contact support for manual activation."
        })
      end
    end
  end

  @doc """
  POST /api/v1/premium/cancel
  Cancel subscription (reverts to free at end of period).
  """
  def cancel(conn, _params) do
    user = conn.assigns.current_user

    if user.subscription_tier == "free" do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "no_subscription", message: "No active subscription to cancel"})
    else
      # Mark subscription to cancel at period end (don't revoke immediately)
      {:ok, updated_user} =
        user
        |> Ecto.Changeset.change(%{cancel_at_period_end: true})
        |> Repo.update()

      conn
      |> put_status(:ok)
      |> json(%{
        success: true,
        message: "Subscription will be cancelled at the end of the billing period",
        expires_at: updated_user.subscription_expires_at,
        cancel_at_period_end: true
      })
    end
  end

  @doc """
  GET /api/v1/premium/features
  Get features available to current user based on subscription.
  """
  def features(conn, _params) do
    user = conn.assigns.current_user
    features = get_tier_features(user.subscription_tier)

    conn
    |> put_status(:ok)
    |> json(%{features: features})
  end

  # Helper functions

  defp subscription_active?(%{subscription_tier: "free"}), do: true
  defp subscription_active?(%{subscription_expires_at: nil}), do: false
  defp subscription_active?(%{subscription_expires_at: expires_at}) do
    DateTime.compare(DateTime.utc_now(), expires_at) == :lt
  end

  defp get_tier_features("free") do
    %{
      xp_multiplier: 1.0,
      coin_bonus: 0,
      custom_themes: false,
      exclusive_badges: false,
      exclusive_effects: false,
      priority_support: false,
      early_access: false,
      custom_banner: false,
      daily_limits: true
    }
  end

  defp get_tier_features("premium") do
    %{
      xp_multiplier: 1.5,
      coin_bonus: 10,
      custom_themes: true,
      exclusive_badges: true,
      exclusive_effects: false,
      priority_support: true,
      early_access: false,
      custom_banner: false,
      daily_limits: false
    }
  end

  defp get_tier_features("premium_plus") do
    %{
      xp_multiplier: 2.0,
      coin_bonus: 20,
      custom_themes: true,
      exclusive_badges: true,
      exclusive_effects: true,
      priority_support: true,
      early_access: true,
      custom_banner: true,
      daily_limits: false
    }
  end

  defp get_tier_features(_), do: get_tier_features("free")
end
