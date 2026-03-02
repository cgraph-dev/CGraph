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
  alias CGraph.Subscriptions.Idempotency
  alias CGraph.Creators

  @doc """
  Main webhook endpoint. Verifies signature and dispatches to handlers.
  """
  @spec webhook(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
          case Idempotency.process_once(event, &handle_event/1) do
            {:ok, _result} ->
              conn |> put_status(:ok) |> json(%{received: true})

            {:already_processed, event_id} ->
              Logger.info("webhook_duplicate_skipped", event_id: event_id)
              conn |> put_status(:ok) |> json(%{received: true, duplicate: true})

            {:error, reason} ->
              Logger.error("webhook_processing_failed", error: inspect(reason))
              conn |> put_status(:ok) |> json(%{received: true, error: true})
          end

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

  # NOTE: customer.subscription.deleted is handled below in Connect Event Handlers
  # with metadata-based routing (paid_forum vs regular subscriptions)

  # NOTE: invoice.payment_succeeded is handled below in Connect Event Handlers
  # with metadata-based routing (paid_forum vs regular invoices)

  defp handle_event(%Stripe.Event{type: "invoice.payment_failed", data: %{object: invoice}}) do
    Logger.warning("Payment failed", invoice_id: invoice.id)

    if invoice.subscription do
      with {:ok, user} <- find_user_by_stripe_subscription(invoice.subscription) do
        # Set 72-hour grace period
        grace_until = DateTime.utc_now() |> DateTime.add(72 * 3600, :second) |> DateTime.truncate(:second)

        user
        |> CGraph.Accounts.User.subscription_changeset(%{subscription_grace_until: grace_until})
        |> CGraph.Repo.update()

        # Notify user of failed payment
        Subscriptions.record_payment_failure(user, %{
          invoice_id: invoice.id,
          amount: invoice.amount_due,
          attempt_count: invoice.attempt_count
        })

        # Broadcast to user's channel for real-time notification
        Phoenix.PubSub.broadcast(
          CGraph.PubSub,
          "user:#{user.id}",
          {:payment_failed, %{invoice_id: invoice.id, grace_until: grace_until}}
        )
      end
    end
  end

  defp handle_event(%Stripe.Event{type: "checkout.session.completed", data: %{object: session}}) do
    Logger.info("Checkout session completed", session_id: session.id)

    # Distinguish coin purchases from subscription checkouts via metadata
    case session.metadata do
      %{"type" => "coin_purchase"} ->
        CGraph.Shop.CoinCheckout.fulfill_purchase(session.id)

      _ ->
        # Subscription checkout flow
        with {:ok, user} <- find_user_by_metadata(session.metadata),
             subscription_id when not is_nil(subscription_id) <- session.subscription do
          Subscriptions.link_stripe_customer(user, %{
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription_id
          })
        end
    end
  end

  # ===========================================================================
  # Connect Event Handlers (Creator Monetization — 17-04)
  # ===========================================================================

  defp handle_event(%Stripe.Event{type: "account.updated", data: %{object: account}, account: connect_id}) do
    Logger.info("Processing Connect account.updated", account_id: connect_id || account.id)

    account_id = connect_id || account.id

    status = %{
      charges_enabled: Map.get(account, :charges_enabled, false),
      payouts_enabled: Map.get(account, :payouts_enabled, false)
    }

    Creators.handle_account_updated(account_id, status)
  end

  defp handle_event(%Stripe.Event{
    type: "invoice.payment_succeeded",
    data: %{object: invoice}
  }) when is_map_key(invoice, :metadata) do
    case Map.get(invoice.metadata || %{}, "type") do
      "paid_forum" ->
        Logger.info("Processing paid forum invoice", invoice_id: invoice.id)

        creator_id = Map.get(invoice.metadata, "creator_id")
        forum_id = Map.get(invoice.metadata, "forum_id")
        subscriber_id = Map.get(invoice.metadata, "subscriber_id")

        if creator_id do
          Creators.record_earning(creator_id, %{
            amount_cents: invoice.amount_paid || 0,
            forum_id: forum_id,
            subscriber_id: subscriber_id,
            payment_intent_id: invoice.payment_intent,
            currency: invoice.currency || "usd",
            period_start: safe_from_unix(Map.get(invoice, :period_start)),
            period_end: safe_from_unix(Map.get(invoice, :period_end))
          })
        else
          Logger.warning("paid_forum invoice without creator_id", invoice_id: invoice.id)
        end

      _ ->
        # Regular invoice (platform subscriptions) — delegate to existing handler
        handle_regular_invoice_succeeded(invoice)
    end
  end

  defp handle_event(%Stripe.Event{
    type: "customer.subscription.deleted",
    data: %{object: subscription}
  }) when is_map_key(subscription, :metadata) do
    case Map.get(subscription.metadata || %{}, "type") do
      "paid_forum" ->
        Logger.info("Processing paid forum subscription deletion", subscription_id: subscription.id)

        Creators.update_subscription_status(subscription.id, %{
          status: "expired",
          canceled_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })

      _ ->
        # Regular subscription deletion
        with {:ok, user} <- find_user_by_stripe_subscription(subscription.id),
             {:ok, _user} <- Subscriptions.cancel_subscription(user) do
          Logger.info("Subscription cancelled", user_id: user.id)
        else
          {:error, reason} ->
            Logger.error("Failed to process subscription.deleted", reason: inspect(reason))
        end
    end
  end

  defp handle_event(%Stripe.Event{type: "transfer.paid", data: %{object: transfer}}) do
    Logger.info("Transfer completed", transfer_id: transfer.id)

    Creators.update_payout_status(transfer.id, "completed", %{
      completed_at: DateTime.utc_now() |> DateTime.truncate(:second)
    })
  end

  defp handle_event(%Stripe.Event{type: "transfer.failed", data: %{object: transfer}}) do
    Logger.warning("Transfer failed", transfer_id: transfer.id)

    failure_reason = Map.get(transfer, :failure_message) || "Transfer failed"

    Creators.update_payout_status(transfer.id, "failed", %{
      failure_reason: failure_reason
    })
  end

  defp handle_event(%Stripe.Event{type: type}) do
    Logger.debug("Unhandled Stripe event type", event_type: type)
    :ok
  end

  # ===========================================================================
  # Helper Functions
  # ===========================================================================

  defp safe_from_unix(nil), do: nil
  defp safe_from_unix(ts) when is_integer(ts), do: DateTime.from_unix!(ts) |> DateTime.truncate(:second)
  defp safe_from_unix(_), do: nil

  defp handle_regular_invoice_succeeded(invoice) do
    if invoice.subscription do
      with {:ok, user} <- find_user_by_stripe_subscription(invoice.subscription) do
        Subscriptions.record_payment(user, %{
          invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          paid_at: DateTime.from_unix!(invoice.status_transitions.paid_at || System.system_time(:second))
        })
      end
    end
  end

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
        {:ok, tier || "premium"}

      _ ->
        {:ok, "premium"}
    end
  end

  defp determine_tier_from_subscription(_), do: {:ok, "premium"}

  defp get_tier_from_env(price_id) do
    subs_config = Application.get_env(:cgraph, CGraph.Subscriptions, [])
    price_ids = Keyword.get(subs_config, :stripe_price_ids, %{})

    cond do
      price_id == Map.get(price_ids, :premium) -> "premium"
      price_id == Map.get(price_ids, :enterprise) -> "enterprise"
      true -> nil
    end
  end
end
