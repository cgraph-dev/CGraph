defmodule CGraph.Pulse.PulseSystem do
  @moduledoc "Community-scoped Pulse reputation system."

  alias CGraph.Pulse.{PulseScore, PulseTransaction, PulseTiers, TransactionProcessor}
  alias CGraph.Repo
  import Ecto.Query

  # Voting
  defdelegate process_vote(from_user_id, to_user_id, forum_id, content_id, content_type, vote_type),
    to: TransactionProcessor

  # Queries
  def get_user_pulse(user_id) do
    from(s in PulseScore, where: s.user_id == ^user_id, order_by: [desc: s.score], preload: [:forum])
    |> Repo.all()
  end

  def get_user_pulse_in_forum(user_id, forum_id) do
    Repo.get_by(PulseScore, user_id: user_id, forum_id: forum_id)
  end

  def get_top_in_forum(forum_id, limit \\ 20) do
    from(s in PulseScore,
      where: s.forum_id == ^forum_id and s.score > 0,
      order_by: [desc: s.score],
      limit: ^limit,
      preload: [:user]
    )
    |> Repo.all()
  end

  def apply_decay(user_id, forum_id, decay_percent \\ 0.05) do
    case Repo.get_by(PulseScore, user_id: user_id, forum_id: forum_id) do
      nil ->
        :ok

      %{score: score} = pulse_score when score > 0 ->
        decay_amount = max(1, round(score * decay_percent))
        new_score = max(0, score - decay_amount)
        new_tier = PulseTiers.tier_for_score(new_score)

        # Log decay transaction
        %PulseTransaction{}
        |> PulseTransaction.changeset(%{
          to_user_id: user_id,
          forum_id: forum_id,
          raw_amount: -decay_amount,
          weighted_amount: -decay_amount * 1.0,
          transaction_type: "decay"
        })
        |> Repo.insert!()

        pulse_score
        |> PulseScore.changeset(%{score: new_score, tier: new_tier})
        |> Repo.update()

      _ ->
        :ok
    end
  end
end
