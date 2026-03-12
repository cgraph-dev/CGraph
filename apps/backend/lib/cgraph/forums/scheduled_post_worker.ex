defmodule CGraph.Forums.ScheduledPostWorker do
  @moduledoc """
  Oban worker that publishes due scheduled posts.

  Runs every minute on the `:default` queue. Queries for posts with
  `status = "pending"` and `scheduled_for <= now()`, then publishes
  them atomically inside a transaction.

  ## Cron config

  Add to your Oban configuration:

      crontab: [
        {"* * * * *", CGraph.Forums.ScheduledPostWorker}
      ]
  """

  use Oban.Worker, queue: :default, max_attempts: 3

  require Logger

  import Ecto.Query, warn: false

  alias CGraph.Forums.ScheduledPost
  alias CGraph.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    due_posts =
      from(sp in ScheduledPost,
        where: sp.status == "pending" and sp.scheduled_for <= ^now,
        order_by: [asc: sp.scheduled_for],
        lock: "FOR UPDATE SKIP LOCKED"
      )
      |> Repo.all()

    if due_posts == [] do
      :ok
    else
      Logger.info("[ScheduledPostWorker] Publishing #{length(due_posts)} scheduled post(s)")

      Enum.each(due_posts, &publish_post/1)
      :ok
    end
  end

  defp publish_post(%ScheduledPost{} = sp) do
    sp
    |> Ecto.Changeset.change(%{status: "published", published_at: DateTime.utc_now() |> DateTime.truncate(:second)})
    |> Repo.update()
    |> case do
      {:ok, _published} ->
        Logger.info("[ScheduledPostWorker] Published scheduled post #{sp.id}")

      {:error, changeset} ->
        Logger.error(
          "[ScheduledPostWorker] Failed to publish #{sp.id}: #{inspect(changeset.errors)}"
        )
    end
  end
end
