defmodule CGraph.Creators.ConnectOnboarding do
  @moduledoc """
  Manages Stripe Connect Express account onboarding for forum creators.

  Flow:
  1. Creator calls `create_connect_account/1` — creates Express account on Stripe
  2. User record updated with `stripe_connect_id` and `creator_status: "pending"`
  3. Returns an onboarding URL the creator visits to complete KYC
  4. `account.updated` webhook flips `creator_status` to "active" when ready

  Uses `User.creator_changeset/2` (added by 17-01) for all Connect field updates.
  """

  require Logger

  alias CGraph.Accounts.User
  alias CGraph.Repo

  @doc """
  Creates a Stripe Connect Express account for the given user and returns
  an onboarding URL.

  Returns `{:ok, %{account_id: String.t(), url: String.t()}}` on success.
  """
  @spec create_connect_account(User.t()) :: {:ok, map()} | {:error, any()}
  def create_connect_account(%User{stripe_connect_id: existing} = _user) when not is_nil(existing) do
    # Already has a connect account — just refresh the link
    case create_account_link(existing) do
      {:ok, link} -> {:ok, %{account_id: existing, url: link.url}}
      {:error, _} = err -> err
    end
  end

  def create_connect_account(%User{} = user) do
    params = %{
      type: "express",
      email: user.email,
      metadata: %{cgraph_user_id: user.id},
      capabilities: %{
        card_payments: %{requested: true},
        transfers: %{requested: true}
      }
    }

    with {:ok, account} <- Stripe.Account.create(params),
         {:ok, _user} <- update_creator_fields(user, %{
           stripe_connect_id: account.id,
           creator_status: "pending"
         }),
         {:ok, link} <- create_account_link(account.id) do
      Logger.info("stripe_connect_account_created",
        user_id: user.id,
        account_id: account.id
      )
      {:ok, %{account_id: account.id, url: link.url}}
    else
      {:error, reason} ->
        Logger.error("stripe_connect_account_failed",
          user_id: user.id,
          error: inspect(reason)
        )
        {:error, reason}
    end
  end

  @doc """
  Creates (or refreshes) a Stripe Account Link for onboarding.
  """
  @spec create_account_link(String.t()) :: {:ok, map()} | {:error, any()}
  def create_account_link(connect_account_id) do
    Stripe.AccountLink.create(%{
      account: connect_account_id,
      refresh_url: "#{base_url()}/creator/onboard/refresh",
      return_url: "#{base_url()}/creator/onboard/complete",
      type: "account_onboarding"
    })
  end

  @doc """
  Checks the current status of a Stripe Connect account.
  Returns a map with charges_enabled, payouts_enabled, details_submitted, requirements.
  """
  @spec check_account_status(String.t()) :: {:ok, map()} | {:error, any()}
  def check_account_status(connect_account_id) do
    # Use raw request to GET /v1/accounts/{id} since Stripe.Account.retrieve/2
    # only fetches the platform's own account (GET /v1/account)
    result =
      Stripe.Request.new_request([])
      |> Stripe.Request.put_endpoint("accounts/#{connect_account_id}")
      |> Stripe.Request.put_method(:get)
      |> Stripe.Request.make_request()

    case result do
      {:ok, account} ->
        {:ok, %{
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements
        }}

      {:error, e} ->
        {:error, e}
    end
  end

  @doc """
  Called from the `account.updated` webhook to update creator status
  when Stripe confirms the account is fully active.
  """
  @spec handle_account_updated(String.t(), map()) :: {:ok, User.t()} | {:error, any()}
  def handle_account_updated(connect_account_id, %{charges_enabled: true, payouts_enabled: true}) do
    case Repo.get_by(User, stripe_connect_id: connect_account_id) do
      nil ->
        {:error, :user_not_found}

      user ->
        update_creator_fields(user, %{
          creator_status: "active",
          creator_onboarded_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
    end
  end

  def handle_account_updated(connect_account_id, status) do
    Logger.info("stripe_connect_account_not_ready",
      account_id: connect_account_id,
      charges_enabled: Map.get(status, :charges_enabled),
      payouts_enabled: Map.get(status, :payouts_enabled)
    )
    :ok
  end

  # ── Private helpers ─────────────────────────────────────────────

  defp update_creator_fields(user, attrs) do
    user
    |> User.creator_changeset(attrs)
    |> Repo.update()
  end

  defp base_url do
    Application.get_env(:cgraph, CGraphWeb.Endpoint)[:url][:host]
    |> case do
      nil -> "https://cgraph.app"
      host -> "https://#{host}"
    end
  end
end
