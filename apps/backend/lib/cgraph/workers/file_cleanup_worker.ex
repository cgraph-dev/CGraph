defmodule CGraph.Workers.FileCleanupWorker do
  @moduledoc """
  Oban cron worker that cleans up abandoned and expired file transfers.

  Runs hourly to:
  - Delete pending transfers older than 24 hours (abandoned uploads)
  - Delete transfers past their expires_at (ephemeral file sharing)
  - Clean up storage for failed/expired transfers
  """

  use Oban.Worker,
    queue: :cleanup,
    max_attempts: 3

  require Logger

  alias CGraph.Messaging.FileTransfer

  @impl Oban.Worker
  def perform(_job) do
    count = FileTransfer.cleanup_stale_transfers()

    if count > 0 do
      Logger.info("file_cleanup_worker", cleaned_up: count)
    end

    :ok
  end
end
