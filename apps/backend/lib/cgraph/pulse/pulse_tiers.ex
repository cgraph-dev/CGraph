defmodule CGraph.Pulse.PulseTiers do
  @moduledoc "Pulse tier thresholds and calculation."

  @tiers [
    {:legend, 1000},
    {:authority, 500},
    {:expert, 200},
    {:trusted, 50},
    {:active, 10},
    {:newcomer, 0}
  ]

  def tier_for_score(score) when is_integer(score) do
    {tier, _} = Enum.find(@tiers, {:newcomer, 0}, fn {_, threshold} -> score >= threshold end)
    Atom.to_string(tier)
  end

  def threshold_for_tier(tier) when is_binary(tier) do
    tier_atom = String.to_existing_atom(tier)

    case Enum.find(@tiers, fn {t, _} -> t == tier_atom end) do
      {_, threshold} -> threshold
      nil -> 0
    end
  end

  def all_tiers, do: @tiers
  def can_fade?(score), do: score >= 50
end
