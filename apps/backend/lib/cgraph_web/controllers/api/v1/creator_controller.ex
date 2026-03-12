defmodule CGraphWeb.API.V1.CreatorController do
  @moduledoc """
  Creator monetization endpoints.

  Handles Stripe Connect onboarding, paid forum configuration,
  paid subscriptions, balance queries, and payout requests.
  """

  use CGraphWeb, :controller
  require Logger

  alias CGraph.Creators
  alias CGraph.Forums.Forum
  alias CGraph.Creators.PaidForumSubscription
  alias CGraph.Repo
  alias CGraphWeb.ErrorHelpers

  # ── Connect Onboarding ──────────────────────────────────────────

  @doc "POST /api/v1/creator/onboard — Start Stripe Connect onboarding."
  def onboard(conn, _params) do
    user = conn.assigns.current_user

    case Creators.create_connect_account(user) do
      {:ok, %{account_id: account_id, url: url}} ->
        json(conn, %{data: %{account_id: account_id, onboarding_url: url}})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: ErrorHelpers.safe_error_message(reason, context: "creator_onboard")}})
    end
  end

  @doc "GET /api/v1/creator/status — Get onboarding status."
  def status(conn, _params) do
    user = conn.assigns.current_user

    data = %{
      creator_status: user.creator_status || "none",
      stripe_connect_id: !is_nil(user.stripe_connect_id),
      onboarded_at: user.creator_onboarded_at
    }

    # If pending/active, fetch live status from Stripe
    data =
      if user.stripe_connect_id do
        case Creators.check_account_status(user.stripe_connect_id) do
          {:ok, stripe_status} -> Map.merge(data, %{stripe_account: stripe_status})
          _ -> data
        end
      else
        data
      end

    json(conn, %{data: data})
  end

  @doc "POST /api/v1/creator/onboard/refresh — Generate new onboarding link."
  def refresh_onboard(conn, _params) do
    user = conn.assigns.current_user

    if is_nil(user.stripe_connect_id) do
      conn
      |> put_status(:bad_request)
      |> json(%{error: %{message: "No Connect account found. Start onboarding first."}})
    else
      case Creators.create_account_link(user.stripe_connect_id) do
        {:ok, link} ->
          json(conn, %{data: %{onboarding_url: link.url}})

        {:error, reason} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: %{message: ErrorHelpers.safe_error_message(reason, context: "creator_refresh_onboard")}})
      end
    end
  end

  # ── Forum Monetization Config ───────────────────────────────────

  @doc "PUT /api/v1/forums/:id/monetization — Enable/configure paid subscriptions."
  def update_monetization(conn, %{"id" => forum_id} = params) do
    user = conn.assigns.current_user

    with {:ok, forum} <- get_owned_forum(user, forum_id),
         :ok <- validate_creator_active(user),
         {:ok, updated} <- update_forum_monetization(forum, params) do
      json(conn, %{data: %{
        forum_id: updated.id,
        monetization_enabled: updated.monetization_enabled,
        subscription_price_cents: updated.subscription_price_cents,
        subscription_currency: updated.subscription_currency
      }})
    else
      {:error, :not_owner} ->
        conn |> put_status(:forbidden) |> json(%{error: %{message: "Only the forum owner can configure monetization"}})

      {:error, :creator_not_active} ->
        conn |> put_status(:forbidden) |> json(%{error: %{message: "Complete Stripe Connect onboarding first"}})

      {:error, changeset} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: ErrorHelpers.safe_error_message(changeset, context: "creator_monetization")}})
    end
  end

  # ── Paid Subscriptions ──────────────────────────────────────────

  @doc "POST /api/v1/forums/:id/subscribe — Subscribe to a paid forum."
  def subscribe(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user

    case Repo.get(Forum, forum_id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{error: %{message: "Forum not found"}})

      forum ->
        case Creators.subscribe_to_paid_forum(user, forum) do
          {:ok, sub} ->
            conn
            |> put_status(:created)
            |> json(%{data: %{
              subscription_id: sub.id,
              status: sub.status,
              price_cents: sub.price_cents,
              current_period_end: sub.current_period_end
            }})

          {:error, :not_a_paid_forum} ->
            conn |> put_status(:bad_request) |> json(%{error: %{message: "This forum does not have paid subscriptions"}})

          {:error, :already_subscribed} ->
            conn |> put_status(:conflict) |> json(%{error: %{message: "Already subscribed to this forum"}})

          {:error, reason} ->
            conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: ErrorHelpers.safe_error_message(reason, context: "creator_subscribe")}})
        end
    end
  end

  @doc "DELETE /api/v1/forums/:id/subscribe — Cancel paid forum subscription."
  def unsubscribe(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user

    case Repo.get_by(PaidForumSubscription,
           forum_id: forum_id,
           subscriber_id: user.id,
           status: "active"
         ) do
      nil ->
        conn |> put_status(:not_found) |> json(%{error: %{message: "No active subscription found"}})

      subscription ->
        case Creators.cancel_paid_subscription(subscription) do
          {:ok, sub} ->
            json(conn, %{data: %{subscription_id: sub.id, status: sub.status, canceled_at: sub.canceled_at}})

          {:error, reason} ->
            conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: ErrorHelpers.safe_error_message(reason, context: "creator_unsubscribe")}})
        end
    end
  end

  # ── Balance & Payouts ───────────────────────────────────────────

  @doc "GET /api/v1/creator/balance — Get earnings balance."
  def balance(conn, _params) do
    user = conn.assigns.current_user
    balance = Creators.get_balance(user.id)
    json(conn, %{data: balance})
  end

  @doc "POST /api/v1/creator/payout — Request payout."
  def request_payout(conn, _params) do
    user = conn.assigns.current_user

    case Creators.request_payout(user) do
      {:ok, payout} ->
        conn
        |> put_status(:created)
        |> json(%{data: %{
          payout_id: payout.id,
          amount_cents: payout.amount_cents,
          status: payout.status
        }})

      {:error, :below_minimum} ->
        min = Creators.minimum_payout_cents()
        conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: "Balance below minimum payout of $#{div(min, 100)}"}})

      {:error, :account_not_active} ->
        conn |> put_status(:forbidden) |> json(%{error: %{message: "Creator account is not active"}})

      {:error, :payout_already_pending} ->
        conn |> put_status(:conflict) |> json(%{error: %{message: "A payout is already being processed"}})

      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: %{message: ErrorHelpers.safe_error_message(reason, context: "creator_payout")}})
    end
  end

  @doc "GET /api/v1/creator/payouts — List past payouts."
  def list_payouts(conn, params) do
    user = conn.assigns.current_user
    limit = Map.get(params, "limit", "50") |> String.to_integer()
    offset = Map.get(params, "offset", "0") |> String.to_integer()

    payouts = Creators.list_payouts(user.id, limit: limit, offset: offset)

    json(conn, %{data: Enum.map(payouts, fn p ->
      %{
        id: p.id,
        amount_cents: p.amount_cents,
        currency: p.currency,
        status: p.status,
        requested_at: p.requested_at,
        completed_at: p.completed_at,
        failure_reason: p.failure_reason
      }
    end)})
  end

  # ── Private helpers ─────────────────────────────────────────────

  defp get_owned_forum(user, forum_id) do
    case Repo.get(Forum, forum_id) do
      nil -> {:error, :not_found}
      %Forum{owner_id: owner_id} = forum when owner_id == user.id -> {:ok, forum}
      _ -> {:error, :not_owner}
    end
  end

  defp validate_creator_active(%{creator_status: "active"}), do: :ok
  defp validate_creator_active(_), do: {:error, :creator_not_active}

  defp update_forum_monetization(forum, params) do
    import Ecto.Changeset

    forum
    |> cast(%{
      monetization_enabled: params["enabled"],
      subscription_price_cents: params["price_cents"],
      subscription_currency: params["currency"] || "usd"
    }, [:monetization_enabled, :subscription_price_cents, :subscription_currency])
    |> validate_number(:subscription_price_cents, greater_than: 0)
    |> Repo.update()
  end

  # ── Premium Content ─────────────────────────────────────────────

  @doc "POST /api/v1/creator/premium-threads — Mark a thread as premium."
  def create_premium_thread(conn, params) do
    user = conn.assigns.current_user

    case Creators.create_premium_thread(user.id, params["thread_id"], %{
           price_nodes: params["price_nodes"],
           subscriber_only: params["subscriber_only"] || false,
           preview_length: params["preview_length"] || 200
         }) do
      {:ok, pt} ->
        conn
        |> put_status(:created)
        |> json(%{data: %{id: pt.id, thread_id: pt.thread_id, price_nodes: pt.price_nodes}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: ErrorHelpers.safe_error_message(changeset, context: "premium_thread")}})
    end
  end

  @doc "PUT /api/v1/threads/:id/purchase — Purchase access to a premium thread."
  def purchase_access(conn, %{"id" => thread_id}) do
    user = conn.assigns.current_user

    case Creators.purchase_thread_access(user.id, thread_id, %{}) do
      {:ok, result} ->
        json(conn, %{data: result})

      {:error, :not_premium} ->
        conn |> put_status(:not_found) |> json(%{error: %{message: "Thread is not premium"}})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: ErrorHelpers.safe_error_message(reason, context: "purchase_access")}})
    end
  end

  @doc "GET /api/v1/creator/tiers — List creator subscription tiers."
  def list_tiers(conn, _params) do
    user = conn.assigns.current_user
    tiers = Creators.list_creator_tiers(user.id)

    json(conn, %{
      data:
        Enum.map(tiers, fn t ->
          %{
            id: t.id,
            name: t.name,
            price_monthly_nodes: t.price_monthly_nodes,
            benefits: t.benefits,
            max_subscribers: t.max_subscribers,
            active: t.active
          }
        end)
    })
  end

  @doc "POST /api/v1/creator/tiers — Create a subscription tier."
  def create_tier(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user

    case Creators.create_subscription_tier(user.id, forum_id, %{
           name: params["name"],
           price_monthly_nodes: params["price_monthly_nodes"],
           benefits: params["benefits"] || %{},
           max_subscribers: params["max_subscribers"]
         }) do
      {:ok, tier} ->
        conn
        |> put_status(:created)
        |> json(%{data: %{id: tier.id, name: tier.name, price_monthly_nodes: tier.price_monthly_nodes}})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: ErrorHelpers.safe_error_message(changeset, context: "create_tier")}})
    end
  end

  @doc "PUT /api/v1/creator/tiers/:id — Update a subscription tier."
  def update_tier(conn, %{"id" => tier_id} = params) do
    alias CGraph.Creators.SubscriptionTier

    case Repo.get(SubscriptionTier, tier_id) do
      nil ->
        conn |> put_status(:not_found) |> json(%{error: %{message: "Tier not found"}})

      tier ->
        user = conn.assigns.current_user

        if tier.creator_id != user.id do
          conn |> put_status(:forbidden) |> json(%{error: %{message: "Not your tier"}})
        else
          changeset =
            SubscriptionTier.changeset(tier, %{
              name: params["name"] || tier.name,
              price_monthly_nodes: params["price_monthly_nodes"] || tier.price_monthly_nodes,
              benefits: params["benefits"] || tier.benefits,
              max_subscribers: params["max_subscribers"] || tier.max_subscribers,
              active: Map.get(params, "active", tier.active)
            })

          case Repo.update(changeset) do
            {:ok, updated} ->
              json(conn, %{data: %{id: updated.id, name: updated.name, active: updated.active}})

            {:error, changeset} ->
              conn
              |> put_status(:unprocessable_entity)
              |> json(%{error: %{message: ErrorHelpers.safe_error_message(changeset, context: "update_tier")}})
          end
        end
    end
  end

  @doc "GET /api/v1/creator/revenue-splits — Get revenue split info for creator threads."
  def revenue_splits(conn, _params) do
    user = conn.assigns.current_user
    alias CGraph.Creators.{PremiumThread, RevenueSplit}
    import Ecto.Query

    threads =
      PremiumThread
      |> where([pt], pt.creator_id == ^user.id)
      |> Repo.all()

    splits =
      Enum.map(threads, fn pt ->
        split = Repo.get_by(RevenueSplit, thread_id: pt.thread_id)

        %{
          thread_id: pt.thread_id,
          price_nodes: pt.price_nodes,
          creator_share: split && split.creator_share,
          platform_share: split && split.platform_share,
          referral_share: split && split.referral_share
        }
      end)

    json(conn, %{data: splits})
  end
end
