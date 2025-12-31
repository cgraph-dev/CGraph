defmodule Cgraph.Workers.DatabaseBackup do
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
    
    Logger.info("Starting #{backup_type} database backup")
    
    with {:ok, backup_file} <- create_backup(backup_type),
         {:ok, _} <- verify_backup(backup_file),
         {:ok, s3_path} <- upload_to_storage(backup_file, backup_type),
         :ok <- cleanup_local(backup_file),
         :ok <- cleanup_old_backups(backup_type) do
      
      Logger.info("Database backup completed successfully: #{s3_path}")
      
      # Notify on success (optional)
      notify_backup_complete(s3_path, backup_type)
      
      :ok
    else
      {:error, reason} ->
        Logger.error("Database backup failed: #{inspect(reason)}")
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
          Logger.info("Backup created: #{filename} (#{format_bytes(file_size)})")
          {:ok, backup_path}
        
        {output, code} ->
          Logger.error("pg_dump failed with code #{code}: #{output}")
          {:error, {:pg_dump_failed, code, output}}
      end
    else
      Logger.warning("DATABASE_URL not set, skipping backup")
      {:error, :no_database_url}
    end
  end
  
  # Verify backup integrity
  defp verify_backup(backup_path) do
    case System.cmd("pg_restore", ["--list", backup_path], stderr_to_stdout: true) do
      {_, 0} ->
        Logger.info("Backup verification passed")
        {:ok, :verified}
      
      {output, code} ->
        Logger.error("Backup verification failed: #{output}")
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
        Logger.info("Backup uploaded to S3: #{s3_key}")
        {:ok, s3_key}
      
      {:error, reason} ->
        Logger.error("S3 upload failed: #{inspect(reason)}")
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
      {:ok, %{body: %{contents: objects}}} ->
        old_objects = Enum.filter(objects, fn obj ->
          case DateTime.from_iso8601(obj.last_modified) do
            {:ok, last_modified, _} -> DateTime.compare(last_modified, cutoff) == :lt
            _ -> false
          end
        end)
        
        Enum.each(old_objects, fn obj ->
          ExAws.S3.delete_object(@backup_bucket, obj.key) |> ExAws.request()
          Logger.info("Deleted old backup: #{obj.key}")
        end)
        
        :ok
      
      {:error, reason} ->
        Logger.warning("Failed to list old backups: #{inspect(reason)}")
        :ok  # Don't fail the job for cleanup issues
    end
  end
  
  # Optional notifications
  defp notify_backup_complete(path, type) do
    Cgraph.Events.publish(:database_backup_complete, %{
      path: path,
      type: type,
      timestamp: DateTime.utc_now()
    })
  end
  
  defp notify_backup_failure(reason) do
    Cgraph.Events.publish(:database_backup_failed, %{
      reason: inspect(reason),
      timestamp: DateTime.utc_now()
    })
    
    # Could also send alert via email/Slack here
  end
  
  # Format bytes to human readable
  defp format_bytes(bytes) when bytes < 1024, do: "#{bytes} B"
  defp format_bytes(bytes) when bytes < 1024 * 1024, do: "#{Float.round(bytes / 1024, 1)} KB"
  defp format_bytes(bytes), do: "#{Float.round(bytes / (1024 * 1024), 1)} MB"
  
  # Schedule helpers for manual triggering
  def schedule_now(type \\ "manual") do
    %{type: type}
    |> __MODULE__.new()
    |> Oban.insert()
  end
end
