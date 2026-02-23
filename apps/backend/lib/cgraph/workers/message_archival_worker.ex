defmodule CGraph.Workers.MessageArchivalWorker do
  @moduledoc """
  Oban worker that archives messages older than a threshold to cold storage.

  ## Strategy

  1. Finds messages older than `@archive_threshold` (default 6 months)
  2. Exports them as compressed JSON to R2 (Cloudflare object storage)
  3. Marks records with `archived_at` timestamp
  4. Optionally deletes archived rows to reclaim space

  ## Scheduling

  Runs daily via Oban cron. Configure in `config/config.exs`:

      config :cgraph, Oban,
        queues: [archival: 1],
        plugins: [
          {Oban.Plugins.Cron, crontab: [
            {"0 3 * * *", CGraph.Workers.MessageArchivalWorker}
          ]}
        ]

  ## On-Demand Retrieval

  Archived messages can be fetched via `CGraph.Messaging.fetch_archived/2`.
  """
  use Oban.Worker,
    queue: :archival,
    max_attempts: 3,
    priority: 3

  import Ecto.Query
  import CGraph.Query.SoftDelete
  require Logger

  alias CGraph.Messaging.Message
  alias CGraph.Repo

  # Archive messages older than 6 months
  @archive_threshold_days 180
  @batch_size 1000

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    threshold_days = Map.get(args, "threshold_days", @archive_threshold_days)
    batch_size = Map.get(args, "batch_size", @batch_size)
    dry_run = Map.get(args, "dry_run", false)

    cutoff = DateTime.utc_now() |> DateTime.add(-threshold_days * 86_400)

    Logger.info("archival_starting", cutoff: cutoff)

    count = count_archivable(cutoff)

    if count == 0 do
      Logger.info("[Archival] No messages to archive")
      :ok
    else
      Logger.info("archival_messages_found", count: count)

      if dry_run do
        Logger.info("[Archival] Dry run — skipping actual archival")
        :ok
      else
        archive_in_batches(cutoff, batch_size, count)
      end
    end
  end

  # ── Private ───────────────────────────────────────────────

  defp count_archivable(cutoff) do
    from(m in Message,
      where: m.inserted_at < ^cutoff,
      where: not_deleted(m),
      select: count(m.id)
    )
    |> Repo.one()
  end

  defp archive_in_batches(cutoff, batch_size, total) do
    batches = ceil(total / batch_size)

    _archived =
      Enum.reduce_while(1..batches, 0, fn batch_num, archived_count ->
        case archive_batch(cutoff, batch_size) do
          {:ok, count} ->
            new_total = archived_count + count
            Logger.info("archival_batch_completed", batch: batch_num, total_batches: batches, batch_count: count, archived: new_total, total: total)

            if count < batch_size do
              {:halt, new_total}
            else
              {:cont, new_total}
            end

          {:error, reason} ->
            Logger.error("archival_batch_failed", batch: batch_num, reason: inspect(reason))
            {:halt, archived_count}
        end
      end)

    :ok
  end

  defp archive_batch(cutoff, batch_size) do
    messages =
      from(m in Message,
        where: m.inserted_at < ^cutoff,
        where: not_deleted(m),
        order_by: [asc: m.inserted_at],
        limit: ^batch_size,
        preload: [:sender]
      )
      |> Repo.all()

    if Enum.empty?(messages) do
      {:ok, 0}
    else
      # Step 1: Serialize to JSON
      archive_data = Enum.map(messages, &serialize_message/1)

      # Step 2: Upload to cold storage (R2)
      case upload_archive(archive_data) do
        :ok ->
          # Step 3: Soft-delete archived messages
          ids = Enum.map(messages, & &1.id)
          now = DateTime.utc_now()

          {count, _} =
            from(m in Message, where: m.id in ^ids)
            |> Repo.update_all(set: [deleted_at: now])

          {:ok, count}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp serialize_message(message) do
    %{
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_username: message.sender && message.sender.username,
      content: message.content,
      message_type: message.message_type,
      inserted_at: DateTime.to_iso8601(message.inserted_at),
      updated_at: DateTime.to_iso8601(message.updated_at),
      metadata: message.metadata
    }
  end

  defp upload_archive(data) do
    # Generate archive key based on date range
    now = DateTime.utc_now() |> DateTime.to_unix()
    key = "archives/messages/batch_#{now}.json.gz"

    json = Jason.encode!(data)
    compressed = :zlib.gzip(json)

    case ExAws.S3.put_object("cgraph-archives", key, compressed,
           content_type: "application/gzip",
           content_encoding: "gzip"
         )
         |> ExAws.request() do
      {:ok, _} ->
        Logger.info("archival_uploaded", key: key, size_bytes: byte_size(compressed))
        :ok

      {:error, reason} ->
        Logger.error("archival_upload_failed", reason: inspect(reason))
        {:error, reason}
    end
  end
end
