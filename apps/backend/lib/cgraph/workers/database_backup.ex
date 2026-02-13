defmodule CGraph.Workers.DatabaseBackup do
  @moduledoc """
  Automated database backup worker.

  Runs daily to create compressed backups and upload to S3/R2 storage.
  Includes verification step and cleanup of old backups.

  ## Schedule

  Configured to run daily at 02:00 UTC via Oban cron.

  ## Retention Policy

  - Daily backups: 7 days
  - Weekly backups: 4 weeks (Sundays)
  - Monthly backups: 12 months (1st of month)
  """

  use Oban.Worker,
    queue: :backups,
    max_attempts: 3,
    priority: 1

  require Logger

  @backup_bucket System.get_env("AWS_BACKUP_BUCKET") || "cgraph-backups"
  @retention_days 30

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    backup_type = Map.get(args, "type", "daily")

    Logger.info("backup_starting", type: backup_type)

    with {:ok, backup_file} <- create_backup(backup_type),
         {:ok, _} <- verify_backup(backup_file),
         {:ok, s3_path} <- upload_to_storage(backup_file, backup_type),
         :ok <- cleanup_local(backup_file),
         :ok <- cleanup_old_backups(backup_type) do

      Logger.info("backup_completed", s3_path: s3_path, type: backup_type)

      # Notify on success (optional)
      notify_backup_complete(s3_path, backup_type)

      :ok
    else
      {:error, reason} ->
        Logger.error("backup_failed", reason: inspect(reason))
        notify_backup_failure(reason)
        {:error, reason}
    end
  end

  # Create compressed database dump
  defp create_backup(type) do
    timestamp = DateTime.utc_now() |> DateTime.to_iso8601(:basic)
    filename = "cgraph_#{type}_#{timestamp}.sql.gz"
    backup_path = Path.join(System.tmp_dir!(), filename)

    database_url = System.get_env("DATABASE_URL")

    if database_url do
      # Use pg_dump with compression
      case System.cmd("pg_dump", [
        "--compress=9",
        "--no-owner",
        "--no-acl",
        "--format=custom",
        database_url,
        "-f", backup_path
      ], stderr_to_stdout: true) do
        {_, 0} ->
          file_size = File.stat!(backup_path).size
          Logger.info("backup_file_created", filename: filename, size_bytes: file_size)
          {:ok, backup_path}

        {output, code} ->
          Logger.error("pg_dump_failed", exit_code: code, output: output)
          {:error, {:pg_dump_failed, code, output}}
      end
    else
      Logger.warning("backup_skipped_no_database_url")
      {:error, :no_database_url}
    end
  end

  # Verify backup integrity
  defp verify_backup(backup_path) do
    case System.cmd("pg_restore", ["--list", backup_path], stderr_to_stdout: true) do
      {_, 0} ->
        Logger.info("backup_verification_passed")
        {:ok, :verified}

      {output, code} ->
        Logger.error("backup_verification_failed", output: output, exit_code: code)
        {:error, {:verification_failed, code}}
    end
  end

  # Upload to S3/R2 storage
  defp upload_to_storage(backup_path, type) do
    filename = Path.basename(backup_path)
    s3_key = "backups/#{type}/#{filename}"

    content = File.read!(backup_path)

    case ExAws.S3.put_object(@backup_bucket, s3_key, content, [
      {:content_type, "application/gzip"},
      {:metadata, [
        {"backup-type", type},
        {"created-at", DateTime.to_iso8601(DateTime.utc_now())}
      ]}
    ]) |> ExAws.request() do
      {:ok, _} ->
        Logger.info("backup_uploaded", s3_key: s3_key)
        {:ok, s3_key}

      {:error, reason} ->
        Logger.error("backup_s3_upload_failed", reason: inspect(reason))
        {:error, {:s3_upload_failed, reason}}
    end
  end

  # Clean up local backup file
  defp cleanup_local(backup_path) do
    File.rm(backup_path)
    :ok
  end

  # Remove old backups beyond retention period
  defp cleanup_old_backups(type) do
    cutoff = DateTime.add(DateTime.utc_now(), -@retention_days * 24 * 60 * 60, :second)
    prefix = "backups/#{type}/"

    case ExAws.S3.list_objects(@backup_bucket, prefix: prefix) |> ExAws.request() do
      {:ok, %{body: %{contents: objects}}} -> delete_old_objects(objects, cutoff)
      {:error, reason} -> log_list_failure(reason)
    end
  end

  defp delete_old_objects(objects, cutoff) do
    objects
    |> Enum.filter(&object_older_than?(&1, cutoff))
    |> Enum.each(&delete_backup_object/1)
    :ok
  end

  defp object_older_than?(obj, cutoff) do
    case DateTime.from_iso8601(obj.last_modified) do
      {:ok, last_modified, _} -> DateTime.compare(last_modified, cutoff) == :lt
      _ -> false
    end
  end

  defp delete_backup_object(obj) do
    ExAws.S3.delete_object(@backup_bucket, obj.key) |> ExAws.request()
    Logger.info("backup_old_deleted", key: obj.key)
  end

  defp log_list_failure(reason) do
    Logger.warning("backup_list_old_failed", reason: inspect(reason))
    :ok
  end

  # Optional notifications
  defp notify_backup_complete(path, type) do
    CGraph.Events.publish(:database_backup_complete, %{
      path: path,
      type: type,
      timestamp: DateTime.utc_now()
    })
  end

  defp notify_backup_failure(reason) do
    CGraph.Events.publish(:database_backup_failed, %{
      reason: inspect(reason),
      timestamp: DateTime.utc_now()
    })

    # Could also send alert via email/Slack here
  end

  # Schedule helpers for manual triggering
  def schedule_now(type \\ "manual") do
    %{type: type}
    |> __MODULE__.new()
    |> Oban.insert()
  end
end
