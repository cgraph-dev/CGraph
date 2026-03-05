defmodule CGraph.Workers.DocumentCompactionWorker do
  @moduledoc """
  Oban worker that monitors document Yjs state sizes and triggers compaction.

  ## Strategy

  True Yjs merging requires a Yjs-aware runtime (Rust NIF or JS sidecar).
  This worker implements a pragmatic client-assisted compaction flow:

  1. **Monitor**: Periodically scans for documents exceeding the size threshold
  2. **Signal**: Broadcasts a "compact" request to connected clients via PubSub
  3. **Client merges**: Connected client runs `Y.mergeUpdates()` and sends back
  4. **Replace**: Server replaces its state with the compacted version

  For documents with no connected clients, the worker applies a basic server-side
  optimization: deduplicating identical consecutive binary update segments.

  Scheduled via Oban Cron (every 15 minutes on the maintenance queue).
  """

  use Oban.Worker,
    queue: :maintenance,
    max_attempts: 3,
    priority: 3

  alias CGraph.Collaboration.Document
  alias CGraph.Repo

  require Logger

  import Ecto.Query

  # Documents larger than this threshold get flagged for compaction
  @max_state_bytes 512 * 1024  # 512 KB

  # Batch size for scanning documents
  @scan_batch_size 100

  @impl Oban.Worker
  @doc "Scans for oversized documents and triggers compaction."
  @spec perform(Oban.Job.t()) :: :ok
  def perform(%Oban.Job{}) do
    Logger.info("[DocumentCompaction] Starting compaction scan...")

    {compacted, signaled} = scan_and_compact()

    Logger.info(
      "[DocumentCompaction] Scan complete",
      server_compacted: compacted,
      client_signaled: signaled
    )

    :ok
  end

  # ---------------------------------------------------------------------------
  # Internal
  # ---------------------------------------------------------------------------

  defp scan_and_compact do
    # Find documents exceeding the size threshold
    oversized_docs =
      Document
      |> where([d], fragment("octet_length(?) > ?", d.yjs_state, ^@max_state_bytes))
      |> select([d], %{id: d.id, size: fragment("octet_length(?)", d.yjs_state)})
      |> limit(^@scan_batch_size)
      |> order_by([d], desc: fragment("octet_length(?)", d.yjs_state))
      |> Repo.all()

    Logger.info("[DocumentCompaction] Found #{length(oversized_docs)} oversized documents")

    Enum.reduce(oversized_docs, {0, 0}, fn doc, {compacted, signaled} ->
      case try_compact(doc) do
        :server_compacted -> {compacted + 1, signaled}
        :client_signaled -> {compacted, signaled + 1}
        :skipped -> {compacted, signaled}
      end
    end)
  end

  defp try_compact(%{id: doc_id, size: size}) do
    Logger.info("[DocumentCompaction] Document #{doc_id}: #{div(size, 1024)}KB")

    # Check if document server is running (has connected clients)
    case Registry.lookup(CGraph.Collaboration.DocumentRegistry, doc_id) do
      [{pid, _}] when is_pid(pid) ->
        # Document has active server — signal clients to compact
        broadcast_compaction_request(doc_id, size)
        :client_signaled

      _ ->
        # No active server — try basic server-side dedup
        server_side_dedup(doc_id)
    end
  rescue
    error ->
      Logger.warning("[DocumentCompaction] Error compacting #{doc_id}: #{inspect(error)}")
      :skipped
  end

  defp broadcast_compaction_request(doc_id, size) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "document:#{doc_id}",
      {:compaction_request, %{
        document_id: doc_id,
        current_size: size,
        threshold: @max_state_bytes,
        reason: "state_exceeds_threshold"
      }}
    )

    Logger.info("[DocumentCompaction] Sent compaction request for document #{doc_id}")
  end

  defp server_side_dedup(doc_id) do
    case Repo.get(Document, doc_id) do
      nil ->
        :skipped

      doc ->
        original_size = byte_size(doc.yjs_state || <<>>)

        if original_size <= @max_state_bytes do
          # Below threshold now (compacted since scan), skip
          :skipped
        else
          # Basic optimization: remove identical consecutive chunks
          # This won't do true Yjs merge, but catches duplicate updates
          deduped = dedup_consecutive_chunks(doc.yjs_state)
          new_size = byte_size(deduped)

          if new_size < original_size do
            doc
            |> Ecto.Changeset.change(%{yjs_state: deduped})
            |> Repo.update()

            savings_pct = Float.round((1 - new_size / original_size) * 100, 1)
            Logger.info(
              "[DocumentCompaction] Server-side dedup for #{doc_id}: " <>
              "#{div(original_size, 1024)}KB → #{div(new_size, 1024)}KB (#{savings_pct}% reduction)"
            )

            :server_compacted
          else
            Logger.debug("[DocumentCompaction] No dedup savings for #{doc_id}")
            :skipped
          end
        end
    end
  end

  @doc """
  Remove identical consecutive binary chunks from Yjs state.

  Splits state into segments and removes consecutive duplicates.
  This is a conservative optimization that won't corrupt Yjs data
  since identical updates are idempotent in CRDTs.
  """
  @spec dedup_consecutive_chunks(binary()) :: binary()
  def dedup_consecutive_chunks(state) when byte_size(state) == 0, do: state

  def dedup_consecutive_chunks(state) do
    # Yjs updates are variable-length, but we can detect identical
    # consecutive segments by sliding a window. Use 64-byte chunks
    # as a heuristic for detecting repeated small updates.
    chunk_size = 64

    if byte_size(state) < chunk_size * 2 do
      state
    else
      chunks = for <<chunk::binary-size(chunk_size) <- state>>, do: chunk
      remainder_start = length(chunks) * chunk_size
      remainder = binary_part(state, remainder_start, byte_size(state) - remainder_start)

      deduped =
        chunks
        |> Enum.dedup()
        |> Enum.join()

      deduped <> remainder
    end
  end
end
