defmodule CGraph.Cosmetics.UnlockEngine do
  @moduledoc """
  Core dispatcher for the cosmetic unlock system.

  Evaluates whether a user has unlocked a cosmetic item by dispatching
  to the appropriate evaluator based on the item's `unlock_condition["type"]`.

  ## Evaluator Registry

    * `"level"` — `LevelEvaluator` (karma / post-count thresholds)
    * `"achievement"` — `AchievementEvaluator` (earned achievements)
    * `"collection"` — `CollectionEvaluator` (owned item count)
    * `"event"` — `EventEvaluator` (time-limited windows)
    * `"purchase"` — `PurchaseEvaluator` (Nodes currency)

  ## Return Values

    * `:unlocked` — user meets all unlock criteria
    * `:locked` — user does not meet criteria
    * `{:progress, float}` — partial progress toward unlock (0.0–1.0)
    * `{:error, term}` — evaluation failed
  """

  require Logger

  @evaluators %{
    "level" => CGraph.Cosmetics.Evaluators.LevelEvaluator,
    "achievement" => CGraph.Cosmetics.Evaluators.AchievementEvaluator,
    "collection" => CGraph.Cosmetics.Evaluators.CollectionEvaluator,
    "event" => CGraph.Cosmetics.Evaluators.EventEvaluator,
    "purchase" => CGraph.Cosmetics.Evaluators.PurchaseEvaluator
  }

  # ── Public API ────────────────────────────────────────────────────────────

  @doc """
  Evaluate whether a user has unlocked a cosmetic item.

  Dispatches to the registered evaluator for the item's
  `unlock_condition["type"]`. Items with no condition or type `"default"`
  are considered unlocked.
  """
  @spec evaluate(map(), map()) :: :unlocked | :locked | {:progress, float()} | {:error, term()}
  def evaluate(user, item) do
    condition = Map.get(item, :unlock_condition) || Map.get(item, "unlock_condition") || %{}
    type = Map.get(condition, "type")

    case Map.get(@evaluators, type) do
      nil when type in [nil, "default"] ->
        :unlocked

      nil ->
        {:error, {:unknown_evaluator_type, type}}

      evaluator ->
        dispatch(evaluator, user, item, condition, type)
    end
  end

  @doc "Returns the map of registered evaluator types to modules."
  @spec evaluators() :: map()
  def evaluators, do: @evaluators

  @doc "Returns the evaluator module for a given type, or nil."
  @spec evaluator_for(String.t()) :: module() | nil
  def evaluator_for(type), do: Map.get(@evaluators, type)

  # ── Private ───────────────────────────────────────────────────────────────

  defp dispatch(evaluator, user, item, condition, type) do
    case evaluator.evaluate(user, condition) do
      {:ok, true} ->
        emit_telemetry(user, item, type)
        :unlocked

      {:ok, false} ->
        maybe_progress(evaluator, user, condition)

      {:error, _reason} = error ->
        error
    end
  end

  defp maybe_progress(evaluator, user, condition) do
    if function_exported?(evaluator, :progress, 2) do
      {:progress, evaluator.progress(user, condition)}
    else
      :locked
    end
  end

  defp emit_telemetry(user, item, type) do
    :telemetry.execute(
      [:cgraph, :cosmetics, :unlocked],
      %{count: 1},
      %{
        user_id: Map.get(user, :id),
        item_id: Map.get(item, :id),
        type: type
      }
    )
  end
end
