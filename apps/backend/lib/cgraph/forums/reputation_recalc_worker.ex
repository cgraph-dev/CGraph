defmodule CGraph.Forums.ReputationRecalcWorker do
  @moduledoc """
  Oban worker for full reputation recalculation across all forum members.

  Runs on the `:default` queue. Enqueue with:

      %{}
      |> CGraph.Forums.ReputationRecalcWorker.new()
      |> Oban.insert()

  Or schedule periodic recalc via Oban cron configuration.
  """

  use Oban.Worker, queue: :default, max_attempts: 3

  require Logger

  alias CGraph.Forums.Reputation

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("[ReputationRecalcWorker] Starting full reputation recalculation")

    {:ok, count} = Reputation.recalculate_all()
    Logger.info("[ReputationRecalcWorker] Recalculated reputation for #{count} members")
    :ok
  end
end
