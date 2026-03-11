defmodule CGraph.Cosmetics.Evaluators.LevelEvaluator do
  @moduledoc """
  Evaluator for level/reputation-based unlock conditions.

  Checks user `karma` (reputation score) or `total_posts_created`
  against the configured thresholds. Does **not** use `user.level`
  — the XP tables were dropped.

  ## Condition Shape

      %{
        "type"                 => "level",
        "karma_threshold"      => 100,   # optional
        "post_count_threshold" => 50     # optional
      }

  Unlocks when **either** threshold is met.
  """

  @behaviour CGraph.Cosmetics.UnlockEvaluator

  @impl true
  @spec evaluate(map(), map()) :: {:ok, boolean()}
  def evaluate(user, condition) do
    karma = Map.get(user, :karma) || 0
    posts = Map.get(user, :total_posts_created) || 0

    karma_threshold = condition["karma_threshold"]
    post_threshold = condition["post_count_threshold"]

    met? =
      cond do
        karma_threshold && post_threshold ->
          karma >= karma_threshold || posts >= post_threshold

        karma_threshold ->
          karma >= karma_threshold

        post_threshold ->
          posts >= post_threshold

        true ->
          # No threshold specified — treat as met
          true
      end

    {:ok, met?}
  end

  @impl true
  @spec progress(map(), map()) :: float()
  def progress(user, condition) do
    karma = Map.get(user, :karma) || 0
    posts = Map.get(user, :total_posts_created) || 0

    karma_progress = ratio(karma, condition["karma_threshold"])
    post_progress = ratio(posts, condition["post_count_threshold"])

    max(karma_progress, post_progress)
  end

  # ── Private ───────────────────────────────────────────────────────────────

  defp ratio(_current, nil), do: 0.0
  defp ratio(_current, 0), do: 1.0
  defp ratio(current, threshold), do: min(current / threshold, 1.0)
end
