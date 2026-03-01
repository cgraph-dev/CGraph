defmodule CGraph.Workers.RankingUpdateWorker do
  @moduledoc """
  Oban worker that periodically recalculates forum rankings.

  Schedules:
  - Hourly: `update_all_rankings/0` for all active forums
  - Weekly (Monday 00:00 UTC): `reset_weekly_scores/0`
  - On-demand: triggered by admin via `enqueue_ranking_update/1`

  Queue: `:rankings`
  """

  use Oban.Worker, queue: :rankings, max_attempts: 3

  alias CGraph.Forums.RankingEngine

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"type" => "weekly_reset"}}) do
    Logger.info("[RankingUpdateWorker] Starting weekly score reset")
    RankingEngine.reset_weekly_scores()
    Logger.info("[RankingUpdateWorker] Weekly score reset complete")
    :ok
  end

  def perform(%Oban.Job{args: %{"forum_id" => forum_id}}) do
    Logger.info("[RankingUpdateWorker] On-demand ranking update for forum #{forum_id}")

    case CGraph.Repo.get(CGraph.Forums.Forum, forum_id) do
      nil ->
        Logger.warning("[RankingUpdateWorker] Forum #{forum_id} not found")
        :ok

      forum ->
        RankingEngine.update_forum_rankings(forum)
        Logger.info("[RankingUpdateWorker] Completed ranking update for forum #{forum_id}")
        :ok
    end
  end

  def perform(%Oban.Job{args: _args}) do
    Logger.info("[RankingUpdateWorker] Starting hourly ranking update for all forums")
    {:ok, count} = RankingEngine.update_all_rankings()
    Logger.info("[RankingUpdateWorker] Updated rankings for #{count} forums")
    :ok
  end

  @doc """
  Enqueue an on-demand ranking update for a specific forum.
  Used by admins to trigger immediate recalculation.
  """
  @spec enqueue_ranking_update(String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_ranking_update(forum_id) do
    %{forum_id: forum_id}
    |> __MODULE__.new()
    |> Oban.insert()
  end

  @doc """
  Enqueue a weekly reset job manually (e.g., for testing or admin override).
  """
  @spec enqueue_weekly_reset() :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_weekly_reset do
    %{type: "weekly_reset"}
    |> __MODULE__.new()
    |> Oban.insert()
  end
end
