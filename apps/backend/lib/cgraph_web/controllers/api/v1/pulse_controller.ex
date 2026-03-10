defmodule CGraphWeb.API.V1.PulseController do
  @moduledoc "API controller for Pulse reputation endpoints."
  use CGraphWeb, :controller

  alias CGraph.Pulse.PulseSystem

  action_fallback CGraphWeb.FallbackController

  def my_pulse(conn, _params) do
    user_id = conn.assigns.current_user.id
    scores = PulseSystem.get_user_pulse(user_id)
    json(conn, %{data: Enum.map(scores, &serialize_score/1)})
  end

  def community_pulse(conn, %{"id" => forum_id}) do
    user_id = conn.assigns.current_user.id

    case PulseSystem.get_user_pulse_in_forum(user_id, forum_id) do
      nil -> json(conn, %{data: %{score: 0, tier: "newcomer", forum_id: forum_id}})
      score -> json(conn, %{data: serialize_score(score)})
    end
  end

  def vote(conn, %{
        "to_user_id" => to_user_id,
        "forum_id" => forum_id,
        "content_id" => content_id,
        "content_type" => content_type,
        "vote_type" => vote_type
      }) do
    from_user_id = conn.assigns.current_user.id
    vote_atom = String.to_existing_atom(vote_type)

    case PulseSystem.process_vote(
           from_user_id,
           to_user_id,
           forum_id,
           content_id,
           content_type,
           vote_atom
         ) do
      {:ok, tx} ->
        json(conn, %{
          data: %{id: tx.id, type: tx.transaction_type, weighted_amount: tx.weighted_amount}
        })

      {:error, :cannot_vote_self} ->
        {:error, :unprocessable_entity}

      {:error, :insufficient_pulse_for_fade} ->
        conn |> put_status(403) |> json(%{error: "Pulse >= 50 required to Fade"})

      {:error, reason} ->
        {:error, reason}
    end
  end

  def top(conn, %{"community_id" => forum_id}) do
    scores = PulseSystem.get_top_in_forum(forum_id)
    json(conn, %{data: Enum.map(scores, &serialize_score_with_user/1)})
  end

  defp serialize_score(%{} = s) do
    %{
      id: s.id,
      score: s.score,
      tier: s.tier,
      forum_id: s.forum_id,
      user_id: s.user_id
    }
  end

  defp serialize_score_with_user(%{} = s) do
    %{
      score: s.score,
      tier: s.tier,
      user: %{id: s.user.id, username: s.user.username}
    }
  end
end
