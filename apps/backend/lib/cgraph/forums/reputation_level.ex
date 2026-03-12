defmodule CGraph.Forums.ReputationLevel do
  @moduledoc """
  Pure constants module for reputation levels.
  Maps numerical scores to named levels: iron → diamond.
  """

  @levels [
    %{key: :iron, name: "Iron", min: 0, color: "#8B8B8B", icon: "iron-shield"},
    %{key: :bronze, name: "Bronze", min: 100, color: "#CD7F32", icon: "bronze-shield"},
    %{key: :silver, name: "Silver", min: 500, color: "#C0C0C0", icon: "silver-shield"},
    %{key: :gold, name: "Gold", min: 1500, color: "#FFD700", icon: "gold-shield"},
    %{key: :platinum, name: "Platinum", min: 5000, color: "#E5E4E2", icon: "platinum-shield"},
    %{key: :diamond, name: "Diamond", min: 15000, color: "#B9F2FF", icon: "diamond-shield"}
  ]

  @doc "Returns all reputation levels."
  def all_levels, do: @levels

  @doc "Returns the level for a given reputation score."
  def level_for_score(score) when is_number(score) do
    @levels
    |> Enum.reverse()
    |> Enum.find(fn level -> score >= level.min end)
    |> case do
      nil -> List.first(@levels)
      level -> level
    end
  end
end
