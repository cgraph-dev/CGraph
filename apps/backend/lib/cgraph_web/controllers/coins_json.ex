defmodule CGraphWeb.CoinsJSON do
  @moduledoc """
  JSON rendering for coins endpoints.
  """

  def history(%{transactions: {transactions, meta}}) when is_list(transactions) do
    %{data: Enum.map(transactions, &render_transaction/1), meta: meta}
  end

  def history(%{transactions: transactions}) when is_list(transactions) do
    %{data: Enum.map(transactions, &render_transaction/1)}
  end

  def history(%{transactions: transactions}) do
    # Fallback: if it's something else, wrap in list
    %{data: Enum.map(List.wrap(transactions), &render_transaction/1)}
  end

  # Private helpers

  defp render_transaction(transaction) do
    %{
      id: transaction.id,
      amount: transaction.amount,
      balance_after: transaction.balance_after,
      type: transaction.type,
      description: transaction.description,
      reference_type: transaction.reference_type,
      created_at: transaction.inserted_at
    }
  end
end
