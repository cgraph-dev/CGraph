defmodule CGraph.Pulse.TransactionProcessor do
  @moduledoc """
  Weighted vote processing for the Pulse reputation system.

  Weight calculation: min(4.0, 1.0 + from_pulse / 300)
  Resonate: +2 * weight
  Fade: -1 * weight (requires pulse >= 50)
  Not-for-me: 0 (algorithmic signal only)
  """

  alias CGraph.Pulse.{PulseScore, PulseTransaction, PulseTiers}
  alias CGraph.Repo

  def process_vote(from_user_id, to_user_id, forum_id, content_id, content_type, vote_type) do
    with :ok <- validate_vote(from_user_id, to_user_id, forum_id, vote_type) do
      from_score = get_or_create_score(from_user_id, forum_id)
      weight = calculate_weight(from_score.score)
      {raw, weighted} = amounts_for_type(vote_type, weight)

      Repo.transaction(fn ->
        # Log transaction
        {:ok, tx} =
          %PulseTransaction{}
          |> PulseTransaction.changeset(%{
            from_user_id: from_user_id,
            to_user_id: to_user_id,
            forum_id: forum_id,
            content_id: content_id,
            content_type: content_type,
            raw_amount: raw,
            weighted_amount: weighted,
            transaction_type: Atom.to_string(vote_type)
          })
          |> Repo.insert()

        # Update recipient's score (not_for_me doesn't change score)
        if vote_type != :not_for_me do
          to_score = get_or_create_score(to_user_id, forum_id)
          new_score = max(0, to_score.score + round(weighted))
          new_tier = PulseTiers.tier_for_score(new_score)

          to_score
          |> PulseScore.changeset(%{score: new_score, tier: new_tier})
          |> Repo.update!()

          # Check for tier-change achievements
          if new_tier != to_score.tier do
            CGraph.Gamification.AchievementTriggers.check_all(to_user_id, :pulse_tier_reached)
          end
        end

        tx
      end)
    end
  end

  defp validate_vote(from_id, to_id, _forum_id, _type) when from_id == to_id,
    do: {:error, :cannot_vote_self}

  defp validate_vote(from_id, _to_id, forum_id, :fade) do
    score = get_or_create_score(from_id, forum_id)
    if PulseTiers.can_fade?(score.score), do: :ok, else: {:error, :insufficient_pulse_for_fade}
  end

  defp validate_vote(_from_id, _to_id, _forum_id, _type), do: :ok

  defp calculate_weight(from_pulse), do: min(4.0, 1.0 + from_pulse / 300)

  defp amounts_for_type(:resonate, weight), do: {2, 2.0 * weight}
  defp amounts_for_type(:fade, weight), do: {-1, -1.0 * weight}
  defp amounts_for_type(:not_for_me, _weight), do: {0, 0.0}

  defp get_or_create_score(user_id, forum_id) do
    case Repo.get_by(PulseScore, user_id: user_id, forum_id: forum_id) do
      nil ->
        {:ok, score} =
          %PulseScore{}
          |> PulseScore.changeset(%{user_id: user_id, forum_id: forum_id})
          |> Repo.insert()

        score

      score ->
        score
    end
  end
end
