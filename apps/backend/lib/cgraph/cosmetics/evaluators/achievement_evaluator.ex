defmodule CGraph.Cosmetics.Evaluators.AchievementEvaluator do
  @moduledoc """
  Evaluator for achievement-based unlock conditions.

  Checks whether the user has earned the required achievement(s)
  via `CGraph.Gamification.AchievementSystem`.

  ## Condition Shape

      %{
        "type"               => "achievement",
        "achievement_slugs"  => ["first_message", "social_butterfly"],
        "require_all"        => true          # optional, defaults to true
      }
  """

  @behaviour CGraph.Cosmetics.UnlockEvaluator

  alias CGraph.Gamification.AchievementSystem

  @impl true
  @spec evaluate(map(), map()) :: {:ok, boolean()}
  def evaluate(user, condition) do
    slugs = condition["achievement_slugs"] || []
    require_all? = Map.get(condition, "require_all", true)

    if slugs == [] do
      {:ok, true}
    else
      unlocked_slugs = unlocked_slugs_for(user)

      met? =
        if require_all? do
          Enum.all?(slugs, &MapSet.member?(unlocked_slugs, &1))
        else
          Enum.any?(slugs, &MapSet.member?(unlocked_slugs, &1))
        end

      {:ok, met?}
    end
  end

  @impl true
  @spec progress(map(), map()) :: float()
  def progress(user, condition) do
    slugs = condition["achievement_slugs"] || []

    if slugs == [] do
      1.0
    else
      unlocked = unlocked_slugs_for(user)
      earned = Enum.count(slugs, &MapSet.member?(unlocked, &1))
      earned / length(slugs)
    end
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp unlocked_slugs_for(user) do
    user
    |> Map.get(:id)
    |> AchievementSystem.list_user_achievements()
    |> Enum.filter(& &1.unlocked)
    |> Enum.map(& &1.achievement.slug)
    |> MapSet.new()
  end
end
