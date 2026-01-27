defmodule CGraph.Subscriptions do
  @moduledoc """
  Context for managing user subscriptions and Stripe integration.

  This module handles:
  - Subscription lifecycle (create, update, cancel)
  - Stripe Checkout session creation
  - Customer portal access
  - Payment recording and history

  ## Usage

      # Create a checkout session
      {:ok, url} = Subscriptions.create_checkout_session(user, "premium")

      # Activate a subscription (called from webhook)
      {:ok, user} = Subscriptions.activate_subscription(user, params)

      # Check subscription status
      Subscriptions.active?(user)
  """

  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Accounts.User
  require Logger

  @premium_price_id Application.compile_env(:cgraph, :stripe_premium_price_id, "price_premium_monthly")
  @enterprise_price_id Application.compile_env(:cgraph, :stripe_enterprise_price_id, "price_enterprise_monthly")

  # ===========================================================================
  # Checkout Session
  # ===========================================================================

  @doc """
  Creates a Stripe Checkout session for the given user and tier.

  Returns `{:ok, checkout_url}` on success.
  """
  def create_checkout_session(%User{} = user, tier, opts \\ []) do
    price_id = get_price_id(tier, opts)
    success_url = Keyword.get(opts, :success_url, default_success_url())
    cancel_url = Keyword.get(opts, :cancel_url, default_cancel_url())

    params = %{
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: %{
        user_id: user.id,
        tier: tier
      },
      line_items: [
        %{
          price: price_id,
          quantity: 1
        }
      ],
      success_url: success_url,
      cancel_url: cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: %{
        metadata: %{
          user_id: user.id,
          tier: tier
        }
      }
    }

    # If user already has a Stripe customer, use it
    params =
      if user.stripe_customer_id do
        Map.put(params, :customer, user.stripe_customer_id)
        |> Map.delete(:customer_email)
      else
        params
      end

    case Stripe.Checkout.Session.create(params) do
      {:ok, session} ->
        Logger.info("Created checkout session #{session.id} for user #{user.id}")
        {:ok, session.url}

      {:error, %Stripe.Error{message: message}} ->
        Logger.error("Failed to create checkout session: #{message}")
        {:error, message}
    end
  end

  @doc """
  Creates a Stripe Customer Portal session for subscription management.
  """
  def create_portal_session(%User{stripe_customer_id: nil}), do: {:error, :no_customer}

  def create_portal_session(%User{stripe_customer_id: customer_id} = user) do
    return_url = Application.get_env(:cgraph, :portal_return_url, default_portal_return_url())

    case Stripe.BillingPortal.Session.create(%{
      customer: customer_id,
      return_url: return_url
    }) do
      {:ok, session} ->
        Logger.info("Created portal session for user #{user.id}")
        {:ok, session.url}

      {:error, %Stripe.Error{message: message}} ->
        Logger.error("Failed to create portal session: #{message}")
        {:error, message}
    end
  end

  # ===========================================================================
  # Subscription Management (called from webhooks)
  # ===========================================================================

  @doc """
  Activates a subscription for a user.
  Called when `customer.subscription.created` webhook is received.
  """
  def activate_subscription(%User{} = user, params) do
    attrs = %{
      subscription_tier: params.tier,
      subscription_expires_at: unix_to_datetime(params.current_period_end),
      stripe_subscription_id: params.stripe_subscription_id,
      stripe_customer_id: params.stripe_customer_id
    }

    user
    |> User.subscription_changeset(attrs)
    |> Repo.update()
    |> tap(fn
      {:ok, user} -> broadcast_subscription_change(user)
      _ -> :ok
    end)
  end

  @doc """
  Updates a subscription tier or period.
  Called when `customer.subscription.updated` webhook is received.
  """
  def update_subscription(%User{} = user, params) do
    attrs = %{
      subscription_tier: params[:tier] || user.subscription_tier,
      subscription_expires_at: unix_to_datetime(params[:current_period_end])
    }

    user
    |> User.subscription_changeset(attrs)
    |> Repo.update()
    |> tap(fn
      {:ok, user} -> broadcast_subscription_change(user)
      _ -> :ok
    end)
  end

  @doc """
  Cancels a subscription, reverting user to free tier.
  Called when `customer.subscription.deleted` webhook is received.
  """
  def cancel_subscription(%User{} = user) do
    attrs = %{
      subscription_tier: "free",
      subscription_expires_at: nil,
      stripe_subscription_id: nil
      # Keep stripe_customer_id for future purchases
    }

    user
    |> User.subscription_changeset(attrs)
    |> Repo.update()
    |> tap(fn
      {:ok, user} -> broadcast_subscription_change(user)
      _ -> :ok
    end)
  end

  @doc """
  Links a Stripe customer and subscription to a user.
  Called after checkout.session.completed.
  """
  def link_stripe_customer(%User{} = user, params) do
    attrs = %{
      stripe_customer_id: params.stripe_customer_id,
      stripe_subscription_id: params.stripe_subscription_id
    }

    user
    |> User.subscription_changeset(attrs)
    |> Repo.update()
  end

  # ===========================================================================
  # Payment Recording
  # ===========================================================================

  @doc """
  Records a successful payment.
  """
  def record_payment(%User{} = user, params) do
    Logger.info("Recording payment for user #{user.id}: #{params.amount} #{params.currency}")
    
    # Could store in payment_history table if needed
    # For now, just update the subscription period
    if params[:current_period_end] do
      update_subscription(user, %{current_period_end: params.current_period_end})
    else
      {:ok, user}
    end
  end

  @doc """
  Records a failed payment attempt.
  """
  def record_payment_failure(%User{} = user, params) do
    Logger.warning("Payment failed for user #{user.id}, attempt #{params.attempt_count}")

    # Could trigger notification email here
    # CGraph.Notifications.send_payment_failed_email(user, params)

    {:ok, user}
  end

  # ===========================================================================
  # Subscription Status Queries
  # ===========================================================================

  @doc """
  Checks if a user has an active subscription (non-free tier).
  """
  def active?(%User{subscription_tier: tier, subscription_expires_at: expires_at}) do
    tier != "free" && tier != nil && 
      (expires_at == nil || DateTime.compare(expires_at, DateTime.utc_now()) == :gt)
  end

  def active?(_), do: false

  @doc """
  Gets the user's current subscription tier.
  """
  def get_tier(%User{subscription_tier: nil}), do: "free"
  def get_tier(%User{subscription_tier: tier}), do: tier

  @doc """
  Checks if a user's subscription is about to expire (within 7 days).
  """
  def expiring_soon?(%User{subscription_expires_at: nil}), do: false

  def expiring_soon?(%User{subscription_expires_at: expires_at}) do
    days_until = DateTime.diff(expires_at, DateTime.utc_now(), :day)
    days_until > 0 && days_until <= 7
  end

  # ===========================================================================
  # Helpers
  # ===========================================================================

  defp get_price_id("premium", opts) do
    if Keyword.get(opts, :yearly, false) do
      Application.get_env(:cgraph, :stripe_premium_yearly_price_id, @premium_price_id)
    else
      Application.get_env(:cgraph, :stripe_premium_price_id, @premium_price_id)
    end
  end

  defp get_price_id("enterprise", opts) do
    if Keyword.get(opts, :yearly, false) do
      Application.get_env(:cgraph, :stripe_enterprise_yearly_price_id, @enterprise_price_id)
    else
      Application.get_env(:cgraph, :stripe_enterprise_price_id, @enterprise_price_id)
    end
  end

  defp get_price_id(_, _), do: @premium_price_id

  defp unix_to_datetime(nil), do: nil
  defp unix_to_datetime(unix) when is_integer(unix), do: DateTime.from_unix!(unix)
  defp unix_to_datetime(%DateTime{} = dt), do: dt

  defp default_success_url do
    base_url() <> "/settings/subscription?success=true"
  end

  defp default_cancel_url do
    base_url() <> "/settings/subscription?canceled=true"
  end

  defp default_portal_return_url do
    base_url() <> "/settings/subscription"
  end

  defp base_url do
    Application.get_env(:cgraph, :app_url, "https://cgraph.app")
  end

  defp broadcast_subscription_change(%User{} = user) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "user:#{user.id}",
      {:subscription_updated, %{tier: user.subscription_tier}}
    )
  end
end
