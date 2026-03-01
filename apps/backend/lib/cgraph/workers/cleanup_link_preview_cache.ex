defmodule CGraph.Workers.CleanupLinkPreviewCache do
  @moduledoc """
  Oban cron worker that deletes expired link preview cache entries.

  Runs daily to clean up entries where `expires_at` has passed.
  """
  use Oban.Worker,
    queue: :cleanup,
    max_attempts: 1,
    tags: ["cleanup", "link_preview"]

  import Ecto.Query

  alias CGraph.Messaging.LinkPreviewCache
  alias CGraph.Repo

  require Logger

  @impl Oban.Worker
  def perform(_job) do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    {count, _} =
      from(c in LinkPreviewCache, where: c.expires_at < ^now)
      |> Repo.delete_all()

    if count > 0 do
      Logger.info("link_preview_cache_cleanup", deleted_count: count)
    end

    :ok
  end
end
