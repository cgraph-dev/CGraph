defmodule CGraphWeb.StripeWebhookController do
  @moduledoc """
  Handles Stripe webhook events for subscription management.

  ## Supported Events

  - `customer.subscription.created` - New subscription started
  - `customer.subscription.updated` - Subscription changed (upgrade/downgrade)
  - `customer.subscription.deleted` - Subscription cancelled
  - `invoice.payment_succeeded` - Payment successful
  - `invoice.payment_failed` - Payment failed

  ## Security

  All webhooks are verified using Stripe's signature verification.
  The webhook secret must be configured in the environment.
  """

  use CGraphWeb, :controller
  require Logger

  alias CGraph.Accounts
  alias CGraph.Subscriptions

  @doc """
  Main webhook endpoint. Verifies signature and dispatches to handlers.
  """
  def webhook(conn, _params) do
    # Raw body is cached by RawBodyPlug for signature verification
    payload = conn.private[:raw_body]
    signature = get_stripe_signature(conn)

    if is_nil(payload) or is_nil(signature) do
      Logger.warning("Stripe webhook missing payload or signature")

      conn
      |> put_status(:bad_request)
      |> json(%{error: "Missing webhook payload or signature"})
    else

      case verify_webhook(payload, signature) do
        {:ok, event} ->
          handle_event(event)
          json(conn, %{received: true})

        {:error, reason} ->
          Logger.warning("Stripe webhook verification failed", reason: inspect(reason))

          conn
          |> put_status(:bad_request)
          |> json(%{error: "Webhook verification failed"})
      end
    end
  end

  # ===========================================================================
  # Event Handlers
  # ===========================================================================

  defp handle_event(%Stripe.Event{type: "customer.subscription.created", data: %{object: subscription}}) do
    Logger.info("Processing subscription.created", subscription_id: subscription.id)

    with {:ok, user} <- find_user_by_stripe_customer(subscription.customer),
         {:ok, tier} <- determine_tier_from_subscription(subscription),
         {:ok, _user} <- Subscriptions.activate_subscription(user, %{
           stripe_subscription_id: subscription.id,
           stripe_customer_id: subscription.customer,
           tier: tier,
           current_period_end: subscription.current_period_end
         }) do
      Logger.info("Subscription activated", user_id: user.id, tier: tier)
    else
      {:error, reason} ->
        Logger.error("Failed to process subscription.created", reason: inspect(reason))
    end
  end

  defp handle_event(%Stripe.Event{type: "customer.subscription.updated", data: %{object: subscription}}) do
    Logger.info("Processing subscription.updated", subscription_id: subscription.id)

    with {:ok, user} <- find_user_by_stripe_subscription(subscription.id),
         {:ok, tier} <- determine_tier_from_subscription(subscription) do

      case subscription.status do
        "active" ->
          Subscriptions.update_subscription(user, %{
            tier: tier,
            current_period_end: subscription.current_period_end
          })

        "past_due" ->
          Logger.warning("Subscription past due", user_id: user.id)
          # Optionally send reminder email

        "canceled" ->
          Subscriptions.cancel_subscription(user)

        status ->
          Logger.info("Subscription status changed", status: status, user_id: user.id)
      end
    else
      {:error, reason} ->
        Logger.error("Failed to process subscription.updated", reason: inspect(reason))
    end
  end

  defp handle_event(%Stripe.Event{type: "customer.subscription.deleted", data: %{object: subscription}}) do
    Logger.info("Processing subscription.deleted", subscription_id: subscription.id)

    with {:ok, user} <- find_user_by_stripe_subscription(subscription.id),
         {:ok, _user} <- Subscriptions.cancel_subscription(user) do
      Logger.info("Subscription cancelled", user_id: user.id)
    else
      {:error, reason} ->
        Logger.error("Failed to process subscription.deleted", reason: inspect(reason))
    end
  end

  defp handle_event(%Stripe.Event{type: "invoice.payment_succeeded", data: %{object: invoice}}) do
    Logger.info("Payment succeeded", invoice_id: invoice.id)

    if invoice.subscription do
      with {:ok, user} <- find_user_by_stripe_subscription(invoice.subscription) do
        # Extend subscription period
        Subscriptions.record_payment(user, %{
          invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          paid_at: DateTime.from_unix!(invoice.status_transitions.paid_at || System.system_time(:second))
        })
      end
    end
  end

  defp handle_event(%Stripe.Event{type: "invoice.payment_failed", data: %{object: invoice}}) do
    Logger.warning("Payment failed", invoice_id: invoice.id)

    if invoice.subscription do
      with {:ok, user} <- find_user_by_stripe_subscription(invoice.subscription) do
        # Notify user of failed payment
        Subscriptions.record_payment_failure(user, %{
          invoice_id: invoice.id,
          amount: invoice.amount_due,
          attempt_count: invoice.attempt_count
        })
      end
    end
  end

  defp handle_event(%Stripe.Event{type: "checkout.session.completed", data: %{object: session}}) do
    Logger.info("Checkout session completed", session_id: session.id)

    with {:ok, user} <- find_user_by_metadata(session.metadata),
         subscription_id when not is_nil(subscription_id) <- session.subscription do

      # Link the subscription to the user
      Subscriptions.link_stripe_customer(user, %{
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription_id
      })
    end
  end

  defp handle_event(%Stripe.Event{type: type}) do
    Logger.debug("Unhandled Stripe event type", event_type: type)
    :ok
  end

  # ===========================================================================
  # Helper Functions
  # ===========================================================================

  defp get_stripe_signature(conn) do
    case get_req_header(conn, "stripe-signature") do
      [signature] -> signature
      _ -> nil
    end
  end

  defp verify_webhook(payload, signature) do
    webhook_secret = Application.get_env(:stripity_stripe, :signing_secret)

    case Stripe.Webhook.construct_event(payload, signature, webhook_secret) do
      {:ok, event} -> {:ok, event}
      {:error, %Stripe.Error{message: message}} -> {:error, message}
      {:error, reason} -> {:error, reason}
    end
  end

  defp find_user_by_stripe_customer(customer_id) do
    case Accounts.get_user_by_stripe_customer(customer_id) do
      {:ok, user} -> {:ok, user}
      {:error, _} -> {:error, :user_not_found}
    end
  end

  defp find_user_by_stripe_subscription(subscription_id) do
    case Accounts.get_user_by_stripe_subscription(subscription_id) do
      {:ok, user} -> {:ok, user}
      {:error, _} -> {:error, :user_not_found}
    end
  end

  defp find_user_by_metadata(%{"user_id" => user_id}) when is_binary(user_id) do
    case Accounts.get_user(user_id) do
      {:ok, user} -> {:ok, user}
      _ -> {:error, :user_not_found}
    end
  end

  defp find_user_by_metadata(_), do: {:error, :no_user_metadata}

  @tier_mapping %{
    # Map Stripe price IDs to tier names
    # In production, use env-based mapping via get_tier_from_env/1
  }

  defp determine_tier_from_subscription(%{items: %{data: items}}) do
    # Get the first subscription item's price
    case items do
      [%{price: %{id: price_id}} | _] ->
        tier = Map.get(@tier_mapping, price_id, get_tier_from_env(price_id))
        {:ok, tier || "plus"}

      _ ->
        {:ok, "plus"}
    end
  end

  defp determine_tier_from_subscription(_), do: {:ok, "plus"}

  defp get_tier_from_env(price_id) do
    subs_config = Application.get_env(:cgraph, CGraph.Subscriptions, [])
    price_ids = Keyword.get(subs_config, :stripe_price_ids, %{})

    cond do
      price_id == Map.get(price_ids, :plus) -> "plus"
      price_id == Map.get(price_ids, :pro) -> "pro"
      price_id == Map.get(price_ids, :business) -> "business"
      price_id == Map.get(price_ids, :enterprise) -> "enterprise"
      true -> nil
    end
  end
end
