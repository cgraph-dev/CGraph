defmodule CGraph.Search.SearchIndexer do
  @moduledoc """
  High-level search indexer that works alongside `CGraph.Search.Indexer`.

  While `CGraph.Search.Indexer` handles Meilisearch-based indexing via the
  existing search engine, `SearchIndexer` provides a generic interface for
  indexing documents to any backend (Elasticsearch, OpenSearch, or Meilisearch)
  via `CGraph.Search.ElasticAdapter`.

  ## Differences from CGraph.Search.Indexer

  - `Indexer` → indexes to Meilisearch via `CGraph.Search.Engine`
  - `SearchIndexer` → indexes to Elasticsearch/OpenSearch via `ElasticAdapter`

  Both can coexist: `Indexer` for the primary Meilisearch search path,
  `SearchIndexer` for Elastic-backed search or cross-backend indexing.

  ## Usage

      # Index a single document (async via Oban worker)
      SearchIndexer.index_document(:users, "user-123", %{username: "john"})

      # Remove a document
      SearchIndexer.remove_document(:users, "user-123")

      # Bulk index documents
      SearchIndexer.bulk_index(:users, [%{id: "1", name: "Alice"}, ...])

      # Synchronous index (for tests)
      SearchIndexer.index_document_sync(:users, "user-123", %{username: "john"})

  ## Telemetry

  - `[:cgraph, :search_indexer, :index]` — document indexed
  - `[:cgraph, :search_indexer, :remove]` — document removed
  - `[:cgraph, :search_indexer, :bulk]` — bulk index executed
  """

  alias CGraph.Search.ElasticAdapter
  alias CGraph.Workers.SearchIndexWorker

  require Logger

  @type index_name :: atom() | String.t()
  @type document_id :: String.t()
  @type document :: map()

  # ---------------------------------------------------------------------------
  # Async Operations (via Oban)
  # ---------------------------------------------------------------------------

  @doc """
  Index a document asynchronously via the search index worker.

  The document is queued as an Oban job and indexed in the background.
  """
  @spec index_document(index_name(), document_id(), document()) ::
          {:ok, Oban.Job.t()} | {:error, term()}
  def index_document(index, id, body) do
    %{
      "operation" => "elastic_index",
      "index" => to_string(index),
      "document_id" => to_string(id),
      "document" => body
    }
    |> SearchIndexWorker.new()
    |> Oban.insert()
  end

  @doc """
  Remove a document from the search index asynchronously.
  """
  @spec remove_document(index_name(), document_id()) ::
          {:ok, Oban.Job.t()} | {:error, term()}
  def remove_document(index, id) do
    %{
      "operation" => "elastic_delete",
      "index" => to_string(index),
      "document_id" => to_string(id)
    }
    |> SearchIndexWorker.new()
    |> Oban.insert()
  end

  @doc """
  Bulk index multiple documents asynchronously.

  Splits large batches into chunks of `batch_size` (default 500)
  and enqueues each chunk as a separate Oban job.
  """
  @spec bulk_index(index_name(), [document()], keyword()) ::
          {:ok, [Oban.Job.t()]} | {:error, term()}
  def bulk_index(index, documents, opts \\ []) do
    batch_size = Keyword.get(opts, :batch_size, 500)

    jobs =
      documents
      |> Enum.chunk_every(batch_size)
      |> Enum.map(fn chunk ->
        %{
          "operation" => "elastic_bulk",
          "index" => to_string(index),
          "documents" => chunk
        }
        |> SearchIndexWorker.new()
        |> Oban.insert()
      end)

    errors = Enum.filter(jobs, &match?({:error, _}, &1))

    if errors == [] do
      {:ok, Enum.map(jobs, fn {:ok, job} -> job end)}
    else
      Logger.warning("search_indexer_bulk_partial_failure",
        total: length(documents),
        errors: length(errors)
      )

      {:error, {:partial_failure, errors}}
    end
  end

  # ---------------------------------------------------------------------------
  # Sync Operations (for tests and immediate needs)
  # ---------------------------------------------------------------------------

  @doc """
  Index a document synchronously (bypasses Oban).
  """
  @spec index_document_sync(index_name(), document_id(), document()) ::
          :ok | {:error, term()}
  def index_document_sync(index, id, body) do
    result = ElasticAdapter.index(index, to_string(id), body)

    emit_telemetry(:index, %{
      index: index,
      document_id: id,
      sync: true
    })

    result
  end

  @doc """
  Remove a document synchronously (bypasses Oban).
  """
  @spec remove_document_sync(index_name(), document_id()) ::
          :ok | {:error, term()}
  def remove_document_sync(index, id) do
    result = ElasticAdapter.delete(index, to_string(id))

    emit_telemetry(:remove, %{
      index: index,
      document_id: id,
      sync: true
    })

    result
  end

  @doc """
  Bulk index documents synchronously (bypasses Oban).
  """
  @spec bulk_index_sync(index_name(), [document()]) :: :ok | {:error, term()}
  def bulk_index_sync(index, documents) do
    result = ElasticAdapter.bulk(index, documents)

    emit_telemetry(:bulk, %{
      index: index,
      count: length(documents),
      sync: true
    })

    result
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_telemetry(event, metadata) do
    :telemetry.execute(
      [:cgraph, :search_indexer, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      metadata
    )
  end
end
