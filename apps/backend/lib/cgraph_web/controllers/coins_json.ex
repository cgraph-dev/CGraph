defmodule CgraphWeb.CoinsJSON do
  @moduledoc """
  JSON rendering for coins endpoints.
  """

  def history(%{transactions: transactions}) do
    %{data: Enum.map(transactions, &render_transaction/1)}
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
