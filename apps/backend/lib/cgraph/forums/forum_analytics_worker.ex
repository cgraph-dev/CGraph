defmodule CGraph.Forums.ForumAnalyticsWorker do
  @moduledoc """
  Oban worker for aggregating forum analytics on a schedule.

  Runs hourly on the `:default` queue. Collects engagement and growth
  metrics for all active forums and logs a summary.

  ## Cron config

  Add to your Oban configuration:

      crontab: [
        {"0 * * * *", CGraph.Forums.ForumAnalyticsWorker}
      ]
  """

  use Oban.Worker, queue: :default, max_attempts: 3

  require Logger

  alias CGraph.Forums.{Forum, ForumAnalytics}
  alias CGraph.Repo

  import Ecto.Query, warn: false

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("[ForumAnalyticsWorker] Starting hourly analytics aggregation")

    forums = Repo.all(from(f in Forum, select: f.id))

    results =
      Enum.map(forums, fn forum_id ->
        engagement = ForumAnalytics.engagement_metrics(forum_id, days: 1)
        {forum_id, engagement}
      end)

    Logger.info(
      "[ForumAnalyticsWorker] Aggregated analytics for #{length(results)} forums"
    )

    :ok
  end
end
