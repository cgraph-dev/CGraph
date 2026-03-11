defmodule CGraph.Cosmetics.UnlockEvaluator do
  @moduledoc """
  Behaviour for cosmetic unlock evaluators.

  Each evaluator checks whether a user meets the unlock criteria
  for a specific condition type. Evaluators must be pure functions
  with no side effects (except `PurchaseEvaluator`, which debits Nodes).

  ## Callbacks

    * `evaluate/2` — required; returns `{:ok, boolean}` or `{:error, term}`
    * `progress/2` — optional; returns a float between 0.0 and 1.0
  """

  @doc "Evaluate whether a user meets the unlock condition."
  @callback evaluate(user :: map(), condition :: map()) :: {:ok, boolean()} | {:error, term()}

  @doc "Calculate unlock progress as a float between 0.0 and 1.0."
  @callback progress(user :: map(), condition :: map()) :: float()

  @optional_callbacks progress: 2
end
