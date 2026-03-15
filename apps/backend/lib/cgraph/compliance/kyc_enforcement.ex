defmodule CGraph.Compliance.KYCEnforcement do
  @moduledoc """
  KYC (Know Your Customer) enforcement for withdrawal compliance.

  Checks whether a user has exceeded the EUR earnings threshold
  that triggers mandatory KYC verification before withdrawal.

  - Threshold: €500 lifetime earnings
  - Verification via Stripe Connect account status
  - Integrated into the withdrawal pipeline
  """

  import Ecto.Query, warn: false

  alias CGraph.Repo
  alias CGraph.Accounts.User
  alias CGraph.Creators.ConnectOnboarding
  alias CGraph.Nodes.NodeTransaction

  @kyc_threshold_eur 500

  @earning_types ~w(tip_received content_unlock subscription_received)

  # Exchange rate: 0.008 EUR per Node
  @exchange_rate_eur Application.compile_env(:cgraph, :nodes_exchange_rate, 0.008)

  @doc """
  Checks whether KYC verification is required for a user.

  Queries total lifetime earnings from node transactions and checks
  if the EUR equivalent exceeds the KYC threshold (€#{@kyc_threshold_eur}).

  Returns `true` if KYC is required, `false` otherwise.
  """
  @spec check_kyc_required(String.t()) :: boolean()
  def check_kyc_required(user_id) do
    total_nodes =
      from(t in NodeTransaction,
        where: t.user_id == ^user_id and t.type in ^@earning_types,
        select: coalesce(sum(t.amount), 0)
      )
      |> Repo.one()

    total_eur = total_nodes * @exchange_rate_eur
    total_eur >= @kyc_threshold_eur
  end

  @doc """
  Returns the KYC status for a user based on their Stripe Connect account.

  - `:not_required` — earnings below threshold
  - `:pending` — Connect account exists but not fully verified
  - `:verified` — both charges and payouts enabled
  - `:rejected` — no Connect account despite threshold being exceeded
  """
  @spec kyc_status(String.t()) :: :not_required | :pending | :verified | :rejected
  def kyc_status(user_id) do
    if check_kyc_required(user_id) do
      user = Repo.get(User, user_id)

      case user do
        %User{stripe_connect_id: nil} ->
          :rejected

        %User{stripe_connect_id: connect_id} ->
          case ConnectOnboarding.check_account_status(connect_id) do
            {:ok, %{charges_enabled: true, payouts_enabled: true}} ->
              :verified

            {:ok, _status} ->
              :pending

            {:error, _} ->
              :rejected
          end
      end
    else
      :not_required
    end
  end

  @doc """
  Enforces KYC verification before withdrawal.

  Called at the top of the withdrawal pipeline. Returns `{:ok, :passed}`
  if KYC is not required or the user is verified, `{:error, :kyc_required}`
  if the user must complete KYC before withdrawing.
  """
  @spec enforce_kyc!(String.t()) :: {:ok, :passed} | {:error, :kyc_required}
  def enforce_kyc!(user_id) do
    case kyc_status(user_id) do
      :not_required -> {:ok, :passed}
      :verified -> {:ok, :passed}
      _other -> {:error, :kyc_required}
    end
  end
end
