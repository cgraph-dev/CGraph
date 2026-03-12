defmodule CGraph.Workers.SearchIndexWorker do
  @moduledoc """
  Oban worker for asynchronous search indexing.

  Handles index, bulk_index, and delete operations with retry logic.
  """

  use Oban.Worker,
    queue: :search,
    max_attempts: 3,
    priority: 2

  alias CGraph.Search.Engine
  alias CGraph.Search.ElasticAdapter

  require Logger

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"operation" => "index", "index" => index, "document" => doc}}) do
    index_atom = String.to_existing_atom(index)

    case Engine.index(index_atom, doc) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("search_index_failed_for", index: index, reason: inspect(reason))
        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"operation" => "bulk_index", "index" => index, "documents" => docs}}) do
    index_atom = String.to_existing_atom(index)

    case Engine.bulk_index(index_atom, docs) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("search_bulk_index_failed_for", index: index, reason: inspect(reason))
        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"operation" => "delete", "index" => index, "document_id" => id}}) do
    index_atom = String.to_existing_atom(index)

    case Engine.delete(index_atom, id) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("search_delete_failed_for", index: index, id: id, reason: inspect(reason))
        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # ElasticAdapter Operations (Elasticsearch/OpenSearch)
  # ---------------------------------------------------------------------------

  def perform(%Oban.Job{args: %{"operation" => "elastic_index", "index" => index, "document_id" => id, "document" => doc}}) do
    case ElasticAdapter.index(index, id, doc) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("elastic_index_failed",
          index: index,
          document_id: id,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"operation" => "elastic_delete", "index" => index, "document_id" => id}}) do
    case ElasticAdapter.delete(index, id) do
      :ok -> :ok
      {:ok, :postgres_is_source_of_truth} -> :ok
      {:error, reason} ->
        Logger.warning("elastic_delete_failed",
          index: index,
          document_id: id,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"operation" => "elastic_bulk", "index" => index, "documents" => docs}}) do
    emit_batch_telemetry(:start, index, length(docs))

    case ElasticAdapter.bulk(index, docs) do
      :ok ->
        emit_batch_telemetry(:complete, index, length(docs))
        :ok

      {:ok, :postgres_is_source_of_truth} ->
        emit_batch_telemetry(:complete, index, length(docs))
        :ok

      {:error, reason} ->
        emit_batch_telemetry(:error, index, length(docs))

        Logger.warning("elastic_bulk_index_failed",
          index: index,
          count: length(docs),
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: args}) do
    Logger.warning("unknown_search_index_operation", args: inspect(args))
    :ok
  end

  # ---------------------------------------------------------------------------
  # Batch Telemetry
  # ---------------------------------------------------------------------------

  defp emit_batch_telemetry(event, index, count) do
    :telemetry.execute(
      [:cgraph, :search, :batch, event],
      %{count: count, timestamp: System.system_time(:millisecond)},
      %{index: index}
    )
  end
end
