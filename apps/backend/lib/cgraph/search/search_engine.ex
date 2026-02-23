defmodule CGraph.Search.Engine do
  @moduledoc """
  Distributed search engine with Meilisearch integration.

  ## Overview

  Provides high-performance full-text search with:

  - **Meilisearch Backend**: Sub-50ms search at millions of documents
  - **PostgreSQL Fallback**: Graceful degradation when search unavailable
  - **Real-time Indexing**: Documents indexed on create/update via Oban
  - **Typo Tolerance**: Fuzzy matching for user-friendly search
  - **Relevance Ranking**: Customizable ranking rules per index

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                        SEARCH ENGINE                                     │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                          │
  │   Query ──► Engine.search/3 ──► Backend Selection                       │
  │                                      │                                   │
  │                    ┌─────────────────┼─────────────────┐                │
  │                    ▼                 ▼                 ▼                │
  │              ┌──────────┐     ┌──────────┐      ┌──────────┐           │
  │              │Meilisearch│     │PostgreSQL│      │  Cache   │           │
  │              │ (Primary) │     │(Fallback)│      │  (Hot)   │           │
  │              └──────────┘     └──────────┘      └──────────┘           │
  │                    │                                                     │
  │   ┌────────────────┼────────────────┐                                   │
  │   │            INDEXER              │                                   │
  │   │  ┌───────┐ ┌───────┐ ┌───────┐ │                                   │
  │   │  │ Users │ │ Posts │ │ Groups│ │                                   │
  │   │  └───────┘ └───────┘ └───────┘ │                                   │
  │   └─────────────────────────────────┘                                   │
  │                                                                          │
  └─────────────────────────────────────────────────────────────────────────┘
  ```

  ## Configuration

      config :cgraph, CGraph.Search.Engine,
        backend: :meilisearch,
        meilisearch_url: "http://localhost:7700",
        meilisearch_key: "your-master-key",
        fallback_to_postgres: true,
        cache_ttl: :timer.minutes(5)

  ## Usage

      # Simple search
      {:ok, results} = Engine.search(:users, "john", limit: 20)

      # With filters
      {:ok, results} = Engine.search(:posts, "elixir",
        filter: "forum_id = 'tech'",
        sort: ["created_at:desc"]
      )

      # Index a document
      :ok = Engine.index(:users, %{id: "123", username: "john"})

      # Bulk index
      :ok = Engine.bulk_index(:users, users)

  ## Telemetry Events

  - `[:cgraph, :search, :query]` - Search executed
  - `[:cgraph, :search, :index]` - Document indexed
  - `[:cgraph, :search, :fallback]` - Postgres fallback used
  """

  require Logger

  @behaviour CGraph.Search.Backend

  @default_config [
    backend: :meilisearch,
    meilisearch_url: "http://localhost:7700",
    meilisearch_key: nil,
    fallback_to_postgres: true,
    cache_ttl: 300_000,
    request_timeout: 5_000
  ]

  @indexes %{
    users: %{
      primary_key: "id",
      searchable_attributes: ["username", "display_name", "bio"],
      filterable_attributes: ["id", "is_verified", "created_at"],
      sortable_attributes: ["created_at", "username"],
      ranking_rules: [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness"
      ]
    },
    posts: %{
      primary_key: "id",
      searchable_attributes: ["title", "content", "author_username"],
      filterable_attributes: ["forum_id", "author_id", "created_at", "score"],
      sortable_attributes: ["created_at", "score", "comment_count"],
      ranking_rules: [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
        "score:desc"
      ]
    },
    messages: %{
      primary_key: "id",
      searchable_attributes: ["content"],
      filterable_attributes: ["conversation_id", "sender_id", "created_at"],
      sortable_attributes: ["created_at"],
      ranking_rules: ["words", "typo", "proximity", "sort"]
    },
    groups: %{
      primary_key: "id",
      searchable_attributes: ["name", "description"],
      filterable_attributes: ["is_public", "member_count", "created_at"],
      sortable_attributes: ["member_count", "created_at", "name"],
      ranking_rules: ["words", "typo", "proximity", "attribute", "member_count:desc"]
    }
  }


  alias CGraph.Search.Engine.MeilisearchAdapter
  alias CGraph.Search.Engine.PostgresAdapter

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc """
  Search an index with the given query.

  ## Options

  - `:limit` - Maximum results (default: 20, max: 100)
  - `:offset` - Pagination offset (default: 0)
  - `:filter` - Meilisearch filter expression
  - `:sort` - List of sort rules ["field:asc", "field:desc"]
  - `:attributes_to_retrieve` - Fields to return
  - `:highlight` - Fields to highlight matches in

  ## Returns

  - `{:ok, %{hits: [...], total: n, processing_time_ms: n}}`
  - `{:error, reason}`
  """
  @doc "Performs a search query and returns matching results."
  @spec search(atom(), String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  @impl true
  def search(index, query, opts \\ []) do
    start_time = System.monotonic_time(:millisecond)

    result = case get_backend() do
      :meilisearch -> MeilisearchAdapter.search(index, query, opts)
      :postgres -> PostgresAdapter.search(index, query, opts)
    end

    case result do
      {:ok, _} = success ->
        PostgresAdapter.emit_search_telemetry(index, query, opts, success, start_time)
        success

      {:error, :meilisearch_unavailable} ->
        if config(:fallback_to_postgres) do
          Logger.warning("Meilisearch unavailable, falling back to PostgreSQL")
          PostgresAdapter.emit_fallback_telemetry(index, query)
          PostgresAdapter.search(index, query, opts)
        else
          PostgresAdapter.emit_search_telemetry(index, query, opts, {:error, :meilisearch_unavailable}, start_time)
          {:error, :meilisearch_unavailable}
        end

      {:error, _} = error ->
        PostgresAdapter.emit_search_telemetry(index, query, opts, error, start_time)
        error
    end
  end

  @doc """
  Index a single document.
  """
  @spec index(atom(), map()) :: :ok | {:error, term()}
  @impl true
  def index(index_name, document) do
    bulk_index(index_name, [document])
  end

  @doc """
  Bulk index multiple documents.
  """
  @spec bulk_index(atom(), [map()]) :: :ok | {:error, term()}
  @impl true
  def bulk_index(index_name, documents) when is_list(documents) do
    case get_backend() do
      :meilisearch ->
        case MeilisearchAdapter.bulk_index(index_name, documents) do
          :ok ->
            PostgresAdapter.emit_index_telemetry(index_name, length(documents))
            :ok

          error ->
            error
        end

      :postgres ->
        {:ok, :postgres_is_source_of_truth}
    end
  end

  @doc """
  Delete a document from the index.
  """
  @spec delete(atom(), String.t()) :: {:ok, term()} | {:error, term()}
  @impl true
  def delete(index_name, document_id) do
    case get_backend() do
      :meilisearch -> MeilisearchAdapter.delete(index_name, document_id)
      :postgres -> {:ok, :postgres_is_source_of_truth}
    end
  end

  @doc """
  Bulk delete documents from the index.
  """
  @spec bulk_delete(atom(), [String.t()]) :: {:ok, term()} | {:error, term()}
  @impl true
  def bulk_delete(index_name, document_ids) when is_list(document_ids) do
    case get_backend() do
      :meilisearch -> MeilisearchAdapter.bulk_delete(index_name, document_ids)
      :postgres -> {:ok, :postgres_is_source_of_truth}
    end
  end

  @doc """
  Initialize or update index settings.
  Called on application startup.
  """
  @spec setup_indexes() :: :ok
  def setup_indexes do
    if get_backend() == :meilisearch do
      Enum.each(@indexes, fn {name, settings} ->
        case MeilisearchAdapter.create_or_update_index(name, settings) do
          :ok -> Logger.info("search_index_configured", name: name)
          {:error, reason} -> Logger.error("failed_to_configure_index", name: name, reason: inspect(reason))
        end
      end)
    end

    :ok
  end

  @doc """
  Check if search engine is healthy.
  """
  @spec healthy?() :: boolean()
  def healthy? do
    case get_backend() do
      :meilisearch -> MeilisearchAdapter.healthy?()
      :postgres -> true
    end
  end

  @doc """
  Get current backend in use.
  """
  @spec get_backend() :: atom()
  def get_backend do
    config(:backend) || :postgres
  end

  @doc """
  Get search statistics.
  """
  @spec stats() :: map()
  def stats do
    case get_backend() do
      :meilisearch -> MeilisearchAdapter.stats()
      :postgres -> PostgresAdapter.stats()
    end
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  defp config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key) || Keyword.get(@default_config, key)
  end
end
