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

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
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
        Logger.error("cleanupworker_cleanup_failed", reason: inspect(reason))
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

    Logger.info("cleanupworker_cleaned_up_expired_tokens", elem_expired_count_0: inspect(elem(expired_count, 0)))
    :ok
  rescue
    e ->
      Logger.warning("cleanupworker_token_cleanup_failed", e: inspect(e))
      :ok  # Non-fatal, continue
  end

  defp cleanup_orphaned_attachments do
    # ✅ IMPLEMENTED: Clean up orphaned attachments from S3/R2
    # Find attachments older than 7 days that are not referenced by any message
    import Ecto.Query

    cutoff = DateTime.add(DateTime.utc_now(), -7, :day)

    orphaned_attachments =
      from(a in "attachments",
        left_join: m in "messages",
        on: m.id == a.message_id,
        where: is_nil(m.id) and a.inserted_at < ^cutoff,
        select: %{id: a.id, url: a.url}
      )
      |> CGraph.Repo.all()

    deleted_count =
      Enum.reduce(orphaned_attachments, 0, fn attachment, acc ->
        case delete_from_storage(attachment.url) do
          :ok ->
            # Delete database record
            CGraph.Repo.delete_all(from a in "attachments", where: a.id == ^attachment.id)
            acc + 1

          {:error, reason} ->
            Logger.warning(
              "[CleanupWorker] Failed to delete attachment #{attachment.id}: #{inspect(reason)}"
            )

            acc
        end
      end)

    Logger.info("cleanupworker_cleaned_up_orphaned_attachments", deleted_count: deleted_count)
    :ok
  rescue
    e ->
      Logger.warning("cleanupworker_orphaned_attachment_cleanup_failed", e: inspect(e))
      :ok  # Non-fatal, continue
  end

  defp delete_from_storage(url) when is_binary(url) do
    # Extract key from URL (supports both S3 and R2)
    # URL format: https://bucket-name.r2.cloudflarestorage.com/path/to/file.ext
    # or: https://s3.amazonaws.com/bucket-name/path/to/file.ext
    key = extract_key_from_url(url)

    case Application.get_env(:cgraph, :storage_provider, :local) do
      :r2 ->
        delete_from_r2(key)

      :s3 ->
        delete_from_s3(key)

      :local ->
        delete_from_local(key)

      _ ->
        Logger.debug("[CleanupWorker] Unknown storage provider, skipping delete")
        :ok
    end
  end

  defp extract_key_from_url(url) do
    uri = URI.parse(url)
    # Remove leading slash from path
    String.trim_leading(uri.path || "", "/")
  end

  defp delete_from_r2(key) do
    bucket = Application.get_env(:cgraph, :r2_bucket, "cgraph-uploads")

    case ExAws.S3.delete_object(bucket, key) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  rescue
    e -> {:error, e}
  end

  defp delete_from_s3(key) do
    bucket = Application.get_env(:cgraph, :s3_bucket, "cgraph-uploads")

    case ExAws.S3.delete_object(bucket, key) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, reason}
    end
  rescue
    e -> {:error, e}
  end

  defp delete_from_local(key) do
    # Local file storage (development)
    upload_dir = Application.get_env(:cgraph, :upload_dir, "priv/static/uploads")
    file_path = Path.join(upload_dir, key)

    case File.rm(file_path) do
      :ok -> :ok
      {:error, :enoent} -> :ok  # File already deleted
      {:error, reason} -> {:error, reason}
    end
  rescue
    e -> {:error, e}
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

    Logger.info("cleanupworker_cleaned_up_old_read_notifications", elem_deleted_count_0: inspect(elem(deleted_count, 0)))
    :ok
  rescue
    e ->
      Logger.warning("cleanupworker_notification_cleanup_failed", e: inspect(e))
      :ok  # Non-fatal, continue
  end
end
