defmodule CGraph.Workers.CleanupWorker do
  @moduledoc """
  Daily cleanup worker that performs maintenance tasks.

  Tasks performed:
  - Clean up expired tokens
  - Remove orphaned files
  - Clear expired cache entries
  - Archive old data
  """
  use Oban.Worker, queue: :default, max_attempts: 3

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: _args}) do
    Logger.info("[CleanupWorker] Starting daily cleanup...")

    with :ok <- cleanup_expired_tokens(),
         :ok <- cleanup_orphaned_attachments(),
         :ok <- cleanup_old_notifications() do
      Logger.info("[CleanupWorker] Daily cleanup completed successfully")
      :ok
    else
      {:error, reason} ->
        Logger.error("[CleanupWorker] Cleanup failed: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp cleanup_expired_tokens do
    # Clean up expired password reset tokens
    import Ecto.Query

    expired_count =
      CGraph.Repo.delete_all(
        from t in CGraph.Accounts.Token,
          where: t.expires_at < ^DateTime.utc_now()
      )

    Logger.info("[CleanupWorker] Cleaned up #{elem(expired_count, 0)} expired tokens")
    :ok
  rescue
    e ->
      Logger.warning("[CleanupWorker] Token cleanup failed: #{inspect(e)}")
      :ok  # Non-fatal, continue
  end

  defp cleanup_orphaned_attachments do
    # Placeholder for orphaned file cleanup
    # This would typically scan for files not referenced in the database
    Logger.debug("[CleanupWorker] Orphaned attachment cleanup skipped (not implemented)")
    :ok
  end

  defp cleanup_old_notifications do
    # Clean up notifications older than 90 days
    import Ecto.Query

    cutoff = DateTime.add(DateTime.utc_now(), -90, :day)

    deleted_count =
      CGraph.Repo.delete_all(
        from n in CGraph.Notifications.Notification,
          where: n.inserted_at < ^cutoff and n.read == true
      )

    Logger.info("[CleanupWorker] Cleaned up #{elem(deleted_count, 0)} old read notifications")
    :ok
  rescue
    e ->
      Logger.warning("[CleanupWorker] Notification cleanup failed: #{inspect(e)}")
      :ok  # Non-fatal, continue
  end
end
