defmodule CGraph.Creators.PaidSubscription do
  @moduledoc """
  Manages paid forum subscriptions with Stripe.

  Creates subscriptions with `application_fee_percent` so CGraph automatically
  takes a platform fee on every recurring payment. Funds flow directly to the
  creator's connected Stripe account via `transfer_data.destination`.

  ## Platform Fee

  Configurable via `config :cgraph, CGraph.Creators, platform_fee_percent: 15`.
  Default is 15%.
  """

  import Ecto.Query
  require Logger

  alias CGraph.Accounts.User
  alias CGraph.Creators.PaidForumSubscription
  alias CGraph.Forums.Forum
  alias CGraph.Repo

  @default_platform_fee_percent 15

  @doc """
  Subscribes a user to a paid forum.

  1. Ensures subscriber has a Stripe customer ID
  2. Creates a Stripe Subscription with application_fee_percent + transfer_data
  3. Inserts a local PaidForumSubscription record

  Returns `{:ok, %PaidForumSubscription{}}` on success.
  """
  @spec subscribe_to_paid_forum(User.t(), Forum.t()) :: {:ok, PaidForumSubscription.t()} | {:error, any()}
  def subscribe_to_paid_forum(%User{} = subscriber, %Forum{} = forum) do
    creator = Repo.get!(User, forum.owner_id)

    cond do
      !forum.monetization_enabled ->
        {:error, :not_a_paid_forum}

      is_nil(creator.stripe_connect_id) ->
        {:error, :creator_not_onboarded}

      is_nil(subscriber.stripe_customer_id) ->
        {:error, :subscriber_needs_payment_method}

      has_active_subscription?(subscriber.id, forum.id) ->
        {:error, :already_subscribed}

      true ->
        create_stripe_subscription(subscriber, forum, creator)
    end
  end

  @doc """
  Cancels a paid forum subscription at period end.
  """
  @spec cancel_paid_subscription(PaidForumSubscription.t()) :: {:ok, PaidForumSubscription.t()} | {:error, any()}
  def cancel_paid_subscription(%PaidForumSubscription{} = subscription) do
    with {:ok, _stripe_sub} <- Stripe.Subscription.update(
           subscription.stripe_subscription_id,
           %{cancel_at_period_end: true}
         ),
         {:ok, updated} <- subscription
           |> PaidForumSubscription.changeset(%{
             status: "canceled",
             canceled_at: DateTime.utc_now() |> DateTime.truncate(:second)
           })
           |> Repo.update() do
      Logger.info("paid_subscription_canceled",
        subscription_id: subscription.id,
        forum_id: subscription.forum_id,
        subscriber_id: subscription.subscriber_id
      )
      {:ok, updated}
    end
  end

  @doc """
  Updates the status of a local PaidForumSubscription (used by webhooks).
  """
  @spec update_subscription_status(String.t(), map()) :: {:ok, PaidForumSubscription.t()} | {:error, any()}
  def update_subscription_status(stripe_subscription_id, attrs) do
    case Repo.get_by(PaidForumSubscription, stripe_subscription_id: stripe_subscription_id) do
      nil -> {:error, :subscription_not_found}
      sub -> sub |> PaidForumSubscription.changeset(attrs) |> Repo.update()
    end
  end

  @doc """
  Checks if a user has an active paid subscription to a forum.
  Active means status is "active" or "canceled" (still in period) and period hasn't ended.
  """
  @spec has_active_subscription?(String.t(), String.t()) :: boolean()
  def has_active_subscription?(user_id, forum_id) do
    now = DateTime.utc_now()

    Repo.exists?(
      from s in PaidForumSubscription,
        where: s.subscriber_id == ^user_id
          and s.forum_id == ^forum_id
          and s.status in ["active", "canceled"]
          and s.current_period_end > ^now
    )
  end

  @doc """
  Lists active subscribers for a given forum.
  """
  @spec list_forum_subscribers(String.t()) :: [PaidForumSubscription.t()]
  def list_forum_subscribers(forum_id) do
    now = DateTime.utc_now()

    from(s in PaidForumSubscription,
      where: s.forum_id == ^forum_id
        and s.status in ["active", "canceled"]
        and s.current_period_end > ^now,
      preload: [:subscriber],
      order_by: [desc: s.inserted_at]
    )
    |> Repo.all()
  end

  @doc "Returns the platform fee percentage (configurable)."
  @spec platform_fee_percent() :: integer()
  def platform_fee_percent do
    creators_config = Application.get_env(:cgraph, CGraph.Creators, [])
    Keyword.get(creators_config, :platform_fee_percent, @default_platform_fee_percent)
  end

  # ── Private ──────────────────────────────────────────────────────

  defp create_stripe_subscription(subscriber, forum, creator) do
    params = %{
      customer: subscriber.stripe_customer_id,
      items: [%{
        price_data: %{
          currency: forum.subscription_currency || "usd",
          unit_amount: forum.subscription_price_cents,
          recurring: %{interval: "month"},
          product_data: %{name: "#{forum.name} — Premium Access"}
        }
      }],
      application_fee_percent: platform_fee_percent(),
      transfer_data: %{destination: creator.stripe_connect_id},
      metadata: %{
        forum_id: forum.id,
        subscriber_id: subscriber.id,
        creator_id: creator.id,
        type: "paid_forum"
      }
    }

    case Stripe.Subscription.create(params) do
      {:ok, stripe_sub} ->
        Repo.insert(%PaidForumSubscription{
          forum_id: forum.id,
          subscriber_id: subscriber.id,
          creator_id: creator.id,
          stripe_subscription_id: stripe_sub.id,
          price_cents: forum.subscription_price_cents,
          status: "active",
          current_period_start: DateTime.from_unix!(stripe_sub.current_period_start) |> DateTime.truncate(:second),
          current_period_end: DateTime.from_unix!(stripe_sub.current_period_end) |> DateTime.truncate(:second)
        })

      {:error, e} ->
        Logger.error("stripe_subscription_create_failed",
          subscriber_id: subscriber.id,
          forum_id: forum.id,
          error: inspect(e)
        )
        {:error, e}
    end
  end
end
