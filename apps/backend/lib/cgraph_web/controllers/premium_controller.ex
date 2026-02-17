defmodule CGraphWeb.PremiumController do
  @moduledoc """
  Controller for premium subscriptions and features.
  """
  use CGraphWeb, :controller

  require Logger

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
        id: "plus",
        name: "Plus",
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
        id: "pro",
        name: "Pro",
        price: 9.99,
        currency: "USD",
        interval: "month",
        features: [
          "Everything in Plus",
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
      },
      %{
        id: "business",
        name: "Business",
        price: 19.99,
        currency: "USD",
        interval: "month",
        features: [
          "Everything in Pro",
          "2.5x XP boost",
          "30% coin bonus on purchases",
          "Advanced analytics",
          "Team management",
          "SSO integration",
          "Custom branding"
        ],
        limits: %{
          daily_friend_requests: nil,
          xp_multiplier: 2.5,
          coin_bonus: 30,
          custom_themes: true,
          priority_support: true,
          exclusive_badges: true,
          exclusive_effects: true,
          early_access: true,
          custom_banner: true,
          advanced_analytics: true,
          team_management: true
        }
      },
      %{
        id: "enterprise",
        name: "Enterprise",
        price: -1,
        currency: "USD",
        interval: "month",
        features: [
          "Everything in Business",
          "3x XP boost",
          "50% coin bonus on purchases",
          "Dedicated account manager",
          "Custom integrations",
          "SLA guarantee",
          "On-premise option"
        ],
        limits: %{
          daily_friend_requests: nil,
          xp_multiplier: 3.0,
          coin_bonus: 50,
          custom_themes: true,
          priority_support: true,
          exclusive_badges: true,
          exclusive_effects: true,
          early_access: true,
          custom_banner: true,
          advanced_analytics: true,
          team_management: true,
          dedicated_manager: true,
          custom_integrations: true
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

    if tier in ["free", "plus", "pro", "business", "enterprise"] do
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

  # Fallback: extract tier from nested params
  def subscribe(conn, %{"subscription" => %{"tier" => _}} = params) do
    subscribe(conn, Map.get(params, "subscription"))
  end

  def subscribe(conn, params) do
    tier = Map.get(params, "plan") || Map.get(params, "plan_id") || "plus"
    subscribe(conn, %{"tier" => tier})
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
        "plus" => System.get_env("STRIPE_PLUS_PRICE_ID"),
        "pro" => System.get_env("STRIPE_PRO_PRICE_ID"),
        "business" => System.get_env("STRIPE_BUSINESS_PRICE_ID"),
        "enterprise" => System.get_env("STRIPE_ENTERPRISE_PRICE_ID")
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
        # Create Stripe checkout session
        app_url = Application.get_env(:cgraph, :app_url, "https://app.cgraph.org")
        user = conn.assigns.current_user

        checkout_params = %{
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [%{price: price_id, quantity: 1}],
          customer_email: user.email,
          success_url: "#{app_url}/settings/billing?session_id={CHECKOUT_SESSION_ID}&status=success",
          cancel_url: "#{app_url}/settings/billing?status=cancelled",
          metadata: %{
            user_id: user.id,
            tier: tier
          },
          subscription_data: %{
            metadata: %{
              user_id: user.id,
              tier: tier
            }
          }
        }

        case Stripe.Checkout.Session.create(checkout_params) do
          {:ok, session} ->
            conn
            |> put_status(:ok)
            |> json(%{
              success: true,
              action: "redirect",
              checkout_url: session.url
            })

          {:error, %Stripe.Error{message: message}} ->
            Logger.error("stripe_checkout_failed", error: message, tier: tier, user_id: user.id)
            conn
            |> put_status(:service_unavailable)
            |> json(%{
              error: "checkout_failed",
              message: "Could not create checkout session. Please try again."
            })
        end
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

  defp get_tier_features("plus") do
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

  defp get_tier_features("pro") do
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

  defp get_tier_features("business") do
    %{
      xp_multiplier: 2.0,
      coin_bonus: 25,
      custom_themes: true,
      exclusive_badges: true,
      exclusive_effects: true,
      priority_support: true,
      early_access: true,
      custom_banner: true,
      daily_limits: false
    }
  end

  defp get_tier_features("enterprise") do
    %{
      xp_multiplier: 2.5,
      coin_bonus: 30,
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
