defmodule CGraph.Cosmetics.Evaluators.PurchaseEvaluator do
  @moduledoc """
  Evaluator for purchase-based unlock conditions.

  Verifies the user's Node balance via `CGraph.Nodes` and debits
  the cost on successful unlock. **This is the only evaluator with
  side effects** (the debit).

  ## Condition Shape

      %{
        "type" => "purchase",
        "cost" => 500
      }
  """

  @behaviour CGraph.Cosmetics.UnlockEvaluator

  alias CGraph.Nodes

  @impl true
  @spec evaluate(map(), map()) :: {:ok, boolean()} | {:error, term()}
  def evaluate(user, condition) do
    cost = condition["cost"] || 0
    user_id = Map.get(user, :id)

    if cost <= 0 do
      {:ok, true}
    else
      case Nodes.debit_nodes(user_id, cost, :cosmetic_purchase,
             description: "Cosmetic unlock",
             reference_type: "cosmetic_unlock"
           ) do
        {:ok, _transaction} -> {:ok, true}
        {:error, :insufficient_balance} -> {:ok, false}
        {:error, reason} -> {:error, reason}
      end
    end
  end
end
