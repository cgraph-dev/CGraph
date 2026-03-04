defmodule CGraph.Creators.Payout do
  @moduledoc """
  Handles creator payout (withdrawal) requests.

  When a creator requests a payout, this module:
  1. Checks the creator's available balance
  2. Verifies the amount meets the minimum threshold ($10)
  3. Creates a Stripe Transfer to the creator's connected account
  4. Records the payout locally

  Payout status transitions:
    pending → processing → completed | failed
  """

  import Ecto.Query
  require Logger

  alias CGraph.Creators.{CreatorPayout, Earnings}
  alias CGraph.Accounts.User
  alias CGraph.Repo

  @minimum_payout_cents 1_000  # $10 minimum

  @doc """
  Requests a payout for the creator.

  Validates balance and creator status before creating a Stripe Transfer.
  """
  @spec request_payout(User.t()) :: {:ok, CreatorPayout.t()} | {:error, atom()}
  def request_payout(%User{} = creator) do
    Repo.transaction(fn ->
      # Lock the creator's earnings rows to prevent concurrent payouts
      total_earned =
        from(e in CGraph.Creators.CreatorEarning,
          where: e.creator_id == ^creator.id,
          select: coalesce(sum(e.net_amount_cents), 0),
          lock: "FOR UPDATE"
        )
        |> Repo.one()

      total_paid_out =
        from(p in CreatorPayout,
          where: p.creator_id == ^creator.id and p.status == "completed",
          select: coalesce(sum(p.amount_cents), 0)
        )
        |> Repo.one()

      available_balance_cents = total_earned - total_paid_out

      cond do
        available_balance_cents < @minimum_payout_cents ->
          Repo.rollback(:below_minimum)

        creator.creator_status != "active" ->
          Repo.rollback(:account_not_active)

        is_nil(creator.stripe_connect_id) ->
          Repo.rollback(:no_connect_account)

        has_pending_payout?(creator.id) ->
          Repo.rollback(:payout_already_pending)

        true ->
          case create_transfer(creator, available_balance_cents) do
            {:ok, payout} -> payout
            {:error, reason} -> Repo.rollback(reason)
          end
      end
    end)
  end

  @doc """
  Updates payout status (called by webhooks for transfer.paid / transfer.failed).
  """
  @spec update_payout_status(String.t(), String.t(), map()) :: {:ok, CreatorPayout.t()} | {:error, any()}
  def update_payout_status(stripe_transfer_id, new_status, extra_attrs \\ %{}) do
    case Repo.get_by(CreatorPayout, stripe_transfer_id: stripe_transfer_id) do
      nil ->
        {:error, :payout_not_found}

      payout ->
        attrs = Map.merge(%{status: new_status}, extra_attrs)

        payout
        |> CreatorPayout.changeset(attrs)
        |> Repo.update()
    end
  end

  @doc "Lists payouts for a creator, most recent first."
  @spec list_payouts(String.t(), keyword()) :: [CreatorPayout.t()]
  def list_payouts(creator_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    from(p in CreatorPayout,
      where: p.creator_id == ^creator_id,
      order_by: [desc: p.inserted_at],
      limit: ^limit,
      offset: ^offset
    )
    |> Repo.all()
  end

  @doc "Returns the minimum payout amount in cents."
  @spec minimum_payout_cents() :: integer()
  def minimum_payout_cents, do: @minimum_payout_cents

  # ── Private ──────────────────────────────────────────────────────

  defp create_transfer(creator, amount_cents) do
    transfer_params = %{
      amount: amount_cents,
      currency: "usd",
      destination: creator.stripe_connect_id,
      metadata: %{
        creator_id: creator.id,
        type: "creator_payout"
      }
    }

    case Stripe.Transfer.create(transfer_params) do
      {:ok, transfer} ->
        now = DateTime.utc_now() |> DateTime.truncate(:second)

        %CreatorPayout{}
        |> CreatorPayout.changeset(%{
          creator_id: creator.id,
          amount_cents: amount_cents,
          stripe_transfer_id: transfer.id,
          status: "processing",
          requested_at: now
        })
        |> Repo.insert()
        |> tap(fn
          {:ok, payout} ->
            Logger.info("creator_payout_initiated",
              payout_id: payout.id,
              creator_id: creator.id,
              amount_cents: amount_cents,
              transfer_id: transfer.id
            )
          _ -> :ok
        end)

      {:error, e} ->
        Logger.error("stripe_transfer_failed",
          creator_id: creator.id,
          amount_cents: amount_cents,
          error: inspect(e)
        )
        {:error, e}
    end
  end

  defp has_pending_payout?(creator_id) do
    Repo.exists?(
      from p in CreatorPayout,
        where: p.creator_id == ^creator_id and p.status in ["pending", "processing"]
    )
  end
end
