defmodule CgraphWeb.PremiumController do
  @moduledoc """
  Controller for premium subscriptions and features.
  """
  use CgraphWeb, :controller

  alias Cgraph.Repo

  action_fallback CgraphWeb.FallbackController

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
      is_active: is_subscription_active?(user),
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
  Subscribe to a tier (mock - would integrate with payment provider).
  """
  def subscribe(conn, %{"tier" => tier}) do
    user = conn.assigns.current_user
    
    if tier in ["free", "premium", "premium_plus"] do
      # In production, this would:
      # 1. Create a Stripe/payment checkout session
      # 2. Handle webhook for payment confirmation
      # 3. Update subscription only after payment succeeds
      
      # For now, we'll just update the tier (demo mode)
      expires_at = if tier == "free" do
        nil
      else
        DateTime.add(DateTime.utc_now(), 30 * 24 * 60 * 60, :second)
      end
      
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
        tier: updated_user.subscription_tier,
        expires_at: updated_user.subscription_expires_at,
        message: "Subscription updated successfully"
      })
    else
      conn
      |> put_status(:bad_request)
      |> json(%{error: "invalid_tier", message: "Invalid subscription tier"})
    end
  end

  @doc """
  POST /api/v1/premium/cancel
  Cancel subscription (reverts to free at end of period).
  """
  def cancel(conn, _params) do
    user = conn.assigns.current_user
    
    # In production, this would cancel with payment provider
    # Subscription remains active until expires_at
    
    conn
    |> put_status(:ok)
    |> json(%{
      success: true,
      message: "Subscription will be cancelled at the end of the billing period",
      expires_at: user.subscription_expires_at
    })
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

  defp is_subscription_active?(%{subscription_tier: "free"}), do: true
  defp is_subscription_active?(%{subscription_expires_at: nil}), do: false
  defp is_subscription_active?(%{subscription_expires_at: expires_at}) do
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
