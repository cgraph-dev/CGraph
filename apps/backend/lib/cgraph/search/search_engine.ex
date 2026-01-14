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
  @impl true
  def search(index, query, opts \\ []) do
    start_time = System.monotonic_time(:millisecond)

    result = case get_backend() do
      :meilisearch -> search_meilisearch(index, query, opts)
      :postgres -> search_postgres(index, query, opts)
    end

    case result do
      {:ok, _} = success ->
        emit_search_telemetry(index, query, opts, success, start_time)
        success

      {:error, :meilisearch_unavailable} ->
        if config(:fallback_to_postgres) do
          Logger.warning("Meilisearch unavailable, falling back to PostgreSQL")
          emit_fallback_telemetry(index, query)
          search_postgres(index, query, opts)
        else
          emit_search_telemetry(index, query, opts, {:error, :meilisearch_unavailable}, start_time)
          {:error, :meilisearch_unavailable}
        end

      {:error, _} = error ->
        emit_search_telemetry(index, query, opts, error, start_time)
        error
    end
  end

  @doc """
  Index a single document.
  """
  @impl true
  def index(index_name, document) do
    bulk_index(index_name, [document])
  end

  @doc """
  Bulk index multiple documents.
  """
  @impl true
  def bulk_index(index_name, documents) when is_list(documents) do
    case get_backend() do
      :meilisearch -> index_meilisearch(index_name, documents)
      :postgres -> {:ok, :postgres_is_source_of_truth}
    end
  end

  @doc """
  Delete a document from the index.
  """
  @impl true
  def delete(index_name, document_id) do
    case get_backend() do
      :meilisearch -> delete_meilisearch(index_name, document_id)
      :postgres -> {:ok, :postgres_is_source_of_truth}
    end
  end

  @doc """
  Bulk delete documents from the index.
  """
  @impl true
  def bulk_delete(index_name, document_ids) when is_list(document_ids) do
    case get_backend() do
      :meilisearch -> bulk_delete_meilisearch(index_name, document_ids)
      :postgres -> {:ok, :postgres_is_source_of_truth}
    end
  end

  @doc """
  Initialize or update index settings.
  Called on application startup.
  """
  def setup_indexes do
    if get_backend() == :meilisearch do
      Enum.each(@indexes, fn {name, settings} ->
        case create_or_update_index(name, settings) do
          :ok -> Logger.info("Search index '#{name}' configured")
          {:error, reason} -> Logger.error("Failed to configure index '#{name}': #{inspect(reason)}")
        end
      end)
    end

    :ok
  end

  @doc """
  Check if search engine is healthy.
  """
  def healthy? do
    case get_backend() do
      :meilisearch -> meilisearch_healthy?()
      :postgres -> true
    end
  end

  @doc """
  Get current backend in use.
  """
  def get_backend do
    config(:backend) || :postgres
  end

  @doc """
  Get search statistics.
  """
  def stats do
    case get_backend() do
      :meilisearch -> meilisearch_stats()
      :postgres -> postgres_stats()
    end
  end

  # ---------------------------------------------------------------------------
  # Meilisearch Implementation
  # ---------------------------------------------------------------------------

  defp search_meilisearch(index, query, opts) do
    url = "#{config(:meilisearch_url)}/indexes/#{index}/search"

    body = %{
      q: query,
      limit: min(Keyword.get(opts, :limit, 20), 100),
      offset: Keyword.get(opts, :offset, 0)
    }

    body = if filter = Keyword.get(opts, :filter), do: Map.put(body, :filter, filter), else: body
    body = if sort = Keyword.get(opts, :sort), do: Map.put(body, :sort, sort), else: body
    body = if attrs = Keyword.get(opts, :attributes_to_retrieve), do: Map.put(body, :attributesToRetrieve, attrs), else: body

    case http_post(url, body) do
      {:ok, %{status: 200, body: response}} ->
        {:ok, %{
          hits: response["hits"] || [],
          total: response["estimatedTotalHits"] || response["totalHits"] || 0,
          processing_time_ms: response["processingTimeMs"] || 0,
          query: query
        }}

      {:ok, %{status: status}} ->
        {:error, {:meilisearch_error, status}}

      {:error, :timeout} ->
        {:error, :meilisearch_unavailable}

      {:error, reason} ->
        Logger.error("Meilisearch search error: #{inspect(reason)}")
        {:error, :meilisearch_unavailable}
    end
  end

  defp index_meilisearch(index_name, documents) do
    url = "#{config(:meilisearch_url)}/indexes/#{index_name}/documents"

    # Convert documents to maps with string keys
    docs = Enum.map(documents, &stringify_keys/1)

    case http_post(url, docs) do
      {:ok, %{status: status}} when status in [200, 202] ->
        emit_index_telemetry(index_name, length(documents))
        :ok

      {:ok, %{status: status, body: body}} ->
        {:error, {:meilisearch_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp delete_meilisearch(index_name, document_id) do
    url = "#{config(:meilisearch_url)}/indexes/#{index_name}/documents/#{document_id}"

    case http_delete(url) do
      {:ok, %{status: status}} when status in [200, 202, 204] -> :ok
      {:ok, %{status: status}} -> {:error, {:meilisearch_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp bulk_delete_meilisearch(index_name, document_ids) do
    url = "#{config(:meilisearch_url)}/indexes/#{index_name}/documents/delete-batch"

    case http_post(url, document_ids) do
      {:ok, %{status: status}} when status in [200, 202] -> :ok
      {:ok, %{status: status}} -> {:error, {:meilisearch_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp create_or_update_index(name, settings) do
    index_url = "#{config(:meilisearch_url)}/indexes/#{name}"
    settings_url = "#{index_url}/settings"

    # Create index if not exists
    http_post("#{config(:meilisearch_url)}/indexes", %{uid: to_string(name), primaryKey: settings.primary_key})

    # Update settings
    meili_settings = %{
      searchableAttributes: settings.searchable_attributes,
      filterableAttributes: settings.filterable_attributes,
      sortableAttributes: settings.sortable_attributes,
      rankingRules: settings.ranking_rules
    }

    case http_patch(settings_url, meili_settings) do
      {:ok, %{status: status}} when status in [200, 202] -> :ok
      {:ok, %{status: status, body: body}} -> {:error, {:settings_update_failed, status, body}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp meilisearch_healthy? do
    url = "#{config(:meilisearch_url)}/health"

    case http_get(url) do
      {:ok, %{status: 200}} -> true
      _ -> false
    end
  end

  defp meilisearch_stats do
    url = "#{config(:meilisearch_url)}/stats"

    case http_get(url) do
      {:ok, %{status: 200, body: body}} -> {:ok, body}
      _ -> {:error, :unavailable}
    end
  end

  # ---------------------------------------------------------------------------
  # PostgreSQL Fallback
  # ---------------------------------------------------------------------------

  defp search_postgres(index, query, opts) do
    # Delegate to existing CGraph.Search functions
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)

    result = case index do
      :users ->
        {users, _meta} = CGraph.Search.search_users(query, limit: limit, offset: offset)
        users

      :posts ->
        {posts, _meta} = CGraph.Search.search_posts(query, limit: limit, offset: offset)
        posts

      :groups ->
        {groups, _meta} = CGraph.Search.search_groups(query, limit: limit, offset: offset)
        groups

      :messages ->
        # Messages require a user context, return empty for postgres fallback
        []

      _ ->
        []
    end

    {:ok, %{
      hits: result,
      total: length(result),
      processing_time_ms: 0,
      query: query,
      backend: :postgres
    }}
  end

  defp postgres_stats do
    {:ok, %{
      backend: :postgres,
      message: "Using PostgreSQL for search (Meilisearch not configured)"
    }}
  end

  # ---------------------------------------------------------------------------
  # HTTP Helpers
  # ---------------------------------------------------------------------------

  defp http_get(url) do
    Finch.build(:get, url, headers())
    |> Finch.request(CGraph.Finch, receive_timeout: config(:request_timeout))
    |> parse_response()
  end

  defp http_post(url, body) do
    Finch.build(:post, url, headers(), Jason.encode!(body))
    |> Finch.request(CGraph.Finch, receive_timeout: config(:request_timeout))
    |> parse_response()
  end

  defp http_patch(url, body) do
    Finch.build(:patch, url, headers(), Jason.encode!(body))
    |> Finch.request(CGraph.Finch, receive_timeout: config(:request_timeout))
    |> parse_response()
  end

  defp http_delete(url) do
    Finch.build(:delete, url, headers())
    |> Finch.request(CGraph.Finch, receive_timeout: config(:request_timeout))
    |> parse_response()
  end

  defp headers do
    base = [{"Content-Type", "application/json"}]

    case config(:meilisearch_key) do
      nil -> base
      key -> [{"Authorization", "Bearer #{key}"} | base]
    end
  end

  defp parse_response({:ok, %Finch.Response{status: status, body: body}}) do
    parsed_body = case Jason.decode(body) do
      {:ok, decoded} -> decoded
      _ -> body
    end

    {:ok, %{status: status, body: parsed_body}}
  end

  defp parse_response({:error, %Mint.TransportError{reason: :timeout}}) do
    {:error, :timeout}
  end

  defp parse_response({:error, reason}) do
    {:error, reason}
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  defp config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key) || Keyword.get(@default_config, key)
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), stringify_keys(v)}
      {k, v} -> {k, stringify_keys(v)}
    end)
  end

  defp stringify_keys(list) when is_list(list) do
    Enum.map(list, &stringify_keys/1)
  end

  defp stringify_keys(value), do: value

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_search_telemetry(index, query, opts, result, start_time) do
    duration = System.monotonic_time(:millisecond) - start_time

    measurements = %{
      duration_ms: duration,
      results_count: case result do
        {:ok, %{total: total}} -> total
        _ -> 0
      end
    }

    metadata = %{
      index: index,
      query: query,
      limit: Keyword.get(opts, :limit, 20),
      success: match?({:ok, _}, result)
    }

    :telemetry.execute([:cgraph, :search, :query], measurements, metadata)
  end

  defp emit_index_telemetry(index, count) do
    :telemetry.execute(
      [:cgraph, :search, :index],
      %{documents_count: count},
      %{index: index}
    )
  end

  defp emit_fallback_telemetry(index, query) do
    :telemetry.execute(
      [:cgraph, :search, :fallback],
      %{count: 1},
      %{index: index, query: query}
    )
  end
end
