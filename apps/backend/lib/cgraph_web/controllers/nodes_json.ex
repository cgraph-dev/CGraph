defmodule CGraphWeb.NodesJSON do
  @moduledoc """
  JSON rendering for Nodes endpoints.
  """

  @doc "Render wallet balance and stats."
  def wallet(%{wallet: wallet}) do
    %{
      data: %{
        user_id: wallet.user_id,
        available_balance: wallet.available_balance,
        pending_balance: wallet.pending_balance,
        lifetime_earned: wallet.lifetime_earned,
        lifetime_spent: wallet.lifetime_spent
      }
    }
  end

  @doc "Render a single transaction."
  def transaction(%{transaction: transaction}) do
    %{data: render_transaction(transaction)}
  end

  @doc "Render a list of transactions."
  def transactions(%{transactions: transactions}) do
    %{
      data: Enum.map(transactions, &render_transaction/1),
      meta: %{count: length(transactions)}
    }
  end

  @doc "Render purchasable bundles."
  def bundles(%{bundles: bundles}) do
    %{
      data:
        Enum.map(bundles, fn b ->
          %{
            id: b.id,
            name: b.name,
            nodes: b.nodes,
            price: b.price_eur,
            bonus_percent: b.bonus_percent,
            popular: Map.get(b, :popular, false)
          }
        end)
    }
  end

  @doc "Render a withdrawal request."
  def withdrawal(%{withdrawal: withdrawal}) do
    %{
      data: %{
        id: withdrawal.id,
        nodes_amount: withdrawal.nodes_amount,
        currency: withdrawal.currency,
        fiat_amount: withdrawal.fiat_amount,
        status: withdrawal.status,
        inserted_at: withdrawal.inserted_at
      }
    }
  end

  defp render_transaction(t) do
    %{
      id: t.id,
      amount: t.amount,
      type: t.type,
      reference_id: t.reference_id,
      reference_type: t.reference_type,
      platform_cut: t.platform_cut,
      net_amount: t.net_amount,
      metadata: t.metadata,
      inserted_at: t.inserted_at
    }
  end
end
