defmodule CGraph.Cosmetics.Evaluators.CollectionEvaluator do
  @moduledoc """
  Evaluator for collection-based unlock conditions.

  Checks whether the user owns at least N items of a given item type
  via the unified `user_inventory` table.

  ## Condition Shape

      %{
        "type"      => "collection",
        "item_type" => "border",
        "count"     => 5
      }
  """

  @behaviour CGraph.Cosmetics.UnlockEvaluator

  import Ecto.Query, warn: false

  alias CGraph.Cosmetics.Inventory
  alias CGraph.Repo

  @impl true
  @spec evaluate(map(), map()) :: {:ok, boolean()}
  def evaluate(user, condition) do
    required = condition["count"] || 1
    owned = count_owned(Map.get(user, :id), condition["item_type"])

    {:ok, owned >= required}
  end

  @impl true
  @spec progress(map(), map()) :: float()
  def progress(user, condition) do
    required = condition["count"] || 1

    if required == 0 do
      1.0
    else
      owned = count_owned(Map.get(user, :id), condition["item_type"])
      min(owned / required, 1.0)
    end
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp count_owned(user_id, item_type) do
    from(i in Inventory,
      where: i.user_id == ^user_id and i.item_type == ^item_type,
      select: count(i.id)
    )
    |> Repo.one()
  end
end
