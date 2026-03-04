defmodule CGraph.Shop.CoinCheckout do
  @moduledoc """
  Creates Stripe Checkout sessions for coin bundle purchases and
  fulfills them after successful payment.

  ## Flow

  1. `create_checkout_session/2` — Creates a pending `CoinPurchase` record and
     a Stripe Checkout Session in `mode: "payment"` (one-time, not subscription).
  2. Stripe sends `checkout.session.completed` webhook.
  3. `fulfill_purchase/1` — Awards coins to user via `CGraph.Gamification.award_coins/4`
     and marks the purchase as `"completed"`.

  ## Idempotency

  - The webhook layer uses `CGraph.Subscriptions.Idempotency.process_once/2` to
    deduplicate events at the Stripe event level.
  - `fulfill_purchase/1` additionally checks purchase status to guard against
    any edge-case double-delivery.
  """

  alias CGraph.Shop.{CoinBundles, CoinPurchase}
  alias CGraph.Accounts.User
  alias CGraph.Repo

  require Logger

  @doc """
  Creates a Stripe Checkout Session for a coin bundle purchase.

  Returns `{:ok, %{checkout_url: url, session_id: id}}` on success.
  """
  @spec create_checkout_session(User.t(), String.t()) ::
          {:ok, %{checkout_url: String.t(), session_id: String.t()}} | {:error, term()}
  def create_checkout_session(%User{} = user, bundle_id) when is_binary(bundle_id) do
    case CoinBundles.get_bundle(bundle_id) do
      nil ->
        {:error, :invalid_bundle}

      bundle ->
        do_create_session(user, bundle)
    end
  end

  defp do_create_session(user, bundle) do
    purchase_attrs = %{
      user_id: user.id,
      bundle_id: bundle.id,
      coins_awarded: bundle.coins,
      price_cents: bundle.price_cents,
      status: "pending"
    }

    with {:ok, purchase} <- Repo.insert(CoinPurchase.changeset(%CoinPurchase{}, purchase_attrs)),
         {:ok, session} <- create_stripe_session(user, bundle, purchase) do
      # Update purchase with stripe session id
      Repo.update(Ecto.Changeset.change(purchase, stripe_session_id: session.id))
      {:ok, %{checkout_url: session.url, session_id: session.id}}
    else
      {:error, reason} ->
        Logger.error("coin_checkout_failed",
          user_id: user.id,
          bundle_id: bundle.id,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  defp create_stripe_session(user, bundle, purchase) do
    params = %{
      mode: "payment",
      line_items: build_line_items(bundle),
      metadata: %{
        "user_id" => user.id,
        "bundle_id" => bundle.id,
        "purchase_id" => purchase.id,
        "type" => "coin_purchase"
      },
      success_url: success_url(purchase.id),
      cancel_url: cancel_url()
    }

    # Attach existing Stripe customer if available
    params =
      if user.stripe_customer_id do
        Map.put(params, :customer, user.stripe_customer_id)
      else
        Map.put(params, :customer_email, user.email)
      end

    Stripe.Checkout.Session.create(params)
  end

  defp build_line_items(%{stripe_price_id: price_id}) when is_binary(price_id) and price_id != "" do
    [%{price: price_id, quantity: 1}]
  end

  defp build_line_items(bundle) do
    # Demo/dev mode: create ad-hoc price data when no Stripe price ID configured
    [
      %{
        price_data: %{
          currency: "usd",
          unit_amount: bundle.price_cents,
          product_data: %{
            name: "#{bundle.label} — #{bundle.coins} Coins"
          }
        },
        quantity: 1
      }
    ]
  end

  @doc """
  Fulfills a coin purchase after successful payment.

  Called from the Stripe webhook handler when `checkout.session.completed` fires
  with `metadata.type == "coin_purchase"`.

  Idempotent: returns `{:ok, :already_fulfilled}` if purchase is already completed.
  """
  @spec fulfill_purchase(String.t()) ::
          {:ok, :fulfilled | :already_fulfilled} | {:error, term()}
  def fulfill_purchase(session_id) when is_binary(session_id) do
    case Repo.get_by(CoinPurchase, stripe_session_id: session_id) do
      %CoinPurchase{status: "completed"} ->
        Logger.info("coin_purchase_already_fulfilled", session_id: session_id)
        {:ok, :already_fulfilled}

      %CoinPurchase{} = purchase ->
        do_fulfill(purchase)

      nil ->
        Logger.warning("coin_purchase_not_found", session_id: session_id)
        {:error, :purchase_not_found}
    end
  end

  defp do_fulfill(purchase) do
    # IMPORTANT: award_coins/4 requires %User{} struct (not UUID) and String.t() type (not atom)
    case Repo.get(User, purchase.user_id) do
      nil ->
        Logger.error("coin_fulfillment_user_not_found",
          user_id: purchase.user_id,
          purchase_id: purchase.id
        )

        {:error, :user_not_found}

      user ->
        case CGraph.Gamification.award_coins(user, purchase.coins_awarded, "purchase",
               description: "Coin bundle: #{purchase.bundle_id}",
               reference_type: "coin_purchase",
               reference_id: purchase.id
             ) do
          {:ok, _updated_user} ->
            Repo.update(
              Ecto.Changeset.change(purchase,
                status: "completed",
                fulfilled_at: DateTime.utc_now() |> DateTime.truncate(:second)
              )
            )

            Logger.info("coin_purchase_fulfilled",
              purchase_id: purchase.id,
              user_id: purchase.user_id,
              coins: purchase.coins_awarded
            )

            {:ok, :fulfilled}

          {:error, reason} ->
            Logger.error("coin_fulfillment_failed",
              purchase_id: purchase.id,
              reason: inspect(reason)
            )

            {:error, reason}
        end
    end
  end

  defp success_url(purchase_id) do
    base_url() <> "/premium/coins?success=true&purchase_id=#{purchase_id}"
  end

  defp cancel_url do
    base_url() <> "/premium/coins?canceled=true"
  end

  defp base_url do
    Application.get_env(:cgraph, :app_url, "https://cgraph.app")
  end
end
