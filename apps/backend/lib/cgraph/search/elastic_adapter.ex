defmodule CGraph.Search.ElasticAdapter do
  @moduledoc """
  Behaviour-based search adapter supporting Elasticsearch, OpenSearch,
  and PostgreSQL tsvector fallback.

  Provides a unified interface for search operations, abstracting over
  the configured backend. Backend is selected via application config:

      config :cgraph, CGraph.Search.ElasticAdapter,
        backend: :elasticsearch,  # :elasticsearch | :opensearch | :postgres
        url: "http://localhost:9200",
        index_prefix: "cgraph_",
        request_timeout: 5_000

  ## Usage

      # Search documents
      {:ok, results} = ElasticAdapter.search(:users, "john doe", limit: 20)

      # Index a document
      :ok = ElasticAdapter.index(:users, "user-123", %{username: "john"})

      # Delete a document
      :ok = ElasticAdapter.delete(:users, "user-123")

      # Bulk index
      :ok = ElasticAdapter.bulk(:users, [%{id: "1", name: "Alice"}, %{id: "2", name: "Bob"}])

  ## Telemetry

  - `[:cgraph, :search, :elastic, :search]` — search query executed
  - `[:cgraph, :search, :elastic, :index]` — document indexed
  - `[:cgraph, :search, :elastic, :delete]` — document deleted
  - `[:cgraph, :search, :elastic, :bulk]` — bulk operation executed
  """

  require Logger

  @type index_name :: atom() | String.t()
  @type document_id :: String.t()
  @type document :: map()
  @type search_opts :: keyword()

  @type search_result :: %{
          hits: [map()],
          total: non_neg_integer(),
          took_ms: non_neg_integer(),
          query: String.t()
        }

  # ---------------------------------------------------------------------------
  # Behaviour Definition
  # ---------------------------------------------------------------------------

  @callback search(index_name(), String.t(), search_opts()) ::
              {:ok, search_result()} | {:error, term()}

  @callback index(index_name(), document_id(), document()) ::
              :ok | {:error, term()}

  @callback delete(index_name(), document_id()) ::
              :ok | {:error, term()}

  @callback bulk(index_name(), [document()]) ::
              :ok | {:error, term()}

  @callback health_check() :: :ok | {:error, term()}

  # ---------------------------------------------------------------------------
  # Public API — delegates to configured backend
  # ---------------------------------------------------------------------------

  @doc """
  Search documents in an index.

  ## Options

  - `:limit` — max results (default 20, max 100)
  - `:offset` — pagination offset (default 0)
  - `:filter` — filter query map
  - `:sort` — sort specification
  - `:highlight` — highlight fields list
  """
  @spec search(index_name(), String.t(), search_opts()) ::
          {:ok, search_result()} | {:error, term()}
  def search(index, query, opts \\ []) do
    start_time = System.monotonic_time(:millisecond)

    result =
      case backend() do
        :postgres -> postgres_search(index, query, opts)
        backend when backend in [:elasticsearch, :opensearch] -> elastic_search(index, query, opts)
        other -> {:error, {:unsupported_backend, other}}
      end

    duration = System.monotonic_time(:millisecond) - start_time

    emit_telemetry(:search, %{
      index: index,
      query: query,
      backend: backend(),
      duration_ms: duration,
      success: match?({:ok, _}, result)
    })

    result
  end

  @doc """
  Index a single document.
  """
  @spec index(index_name(), document_id(), document()) :: :ok | {:ok, atom()} | {:error, term()}
  def index(index, id, body) do
    start_time = System.monotonic_time(:millisecond)

    result =
      case backend() do
        :postgres -> postgres_index(index, id, body)
        backend when backend in [:elasticsearch, :opensearch] -> elastic_index(index, id, body)
        other -> {:error, {:unsupported_backend, other}}
      end

    duration = System.monotonic_time(:millisecond) - start_time

    emit_telemetry(:index, %{
      index: index,
      document_id: id,
      backend: backend(),
      duration_ms: duration
    })

    result
  end

  @doc """
  Delete a document from an index.
  """
  @spec delete(index_name(), document_id()) :: :ok | {:ok, atom()} | {:error, term()}
  def delete(index, id) do
    start_time = System.monotonic_time(:millisecond)

    result =
      case backend() do
        :postgres -> postgres_delete(index, id)
        backend when backend in [:elasticsearch, :opensearch] -> elastic_delete(index, id)
        other -> {:error, {:unsupported_backend, other}}
      end

    duration = System.monotonic_time(:millisecond) - start_time

    emit_telemetry(:delete, %{
      index: index,
      document_id: id,
      backend: backend(),
      duration_ms: duration
    })

    result
  end

  @doc """
  Bulk index multiple documents.
  """
  @spec bulk(index_name(), [document()]) :: :ok | {:ok, atom()} | {:error, term()}
  def bulk(index, documents) when is_list(documents) do
    start_time = System.monotonic_time(:millisecond)

    result =
      case backend() do
        :postgres -> postgres_bulk(index, documents)
        backend when backend in [:elasticsearch, :opensearch] -> elastic_bulk(index, documents)
        other -> {:error, {:unsupported_backend, other}}
      end

    duration = System.monotonic_time(:millisecond) - start_time

    emit_telemetry(:bulk, %{
      index: index,
      count: length(documents),
      backend: backend(),
      duration_ms: duration
    })

    result
  end

  @doc """
  Check backend health.
  """
  @spec health_check() :: :ok | {:error, term()}
  def health_check do
    case backend() do
      :postgres ->
        case CGraph.Repo.query("SELECT 1") do
          {:ok, _} -> :ok
          {:error, reason} -> {:error, reason}
        end

      backend when backend in [:elasticsearch, :opensearch] ->
        url = "#{config(:url)}/_cluster/health"

        case http_get(url) do
          {:ok, %{status: 200}} -> :ok
          {:ok, %{status: status}} -> {:error, {:unhealthy, status}}
          {:error, reason} -> {:error, reason}
        end

      other ->
        {:error, {:unsupported_backend, other}}
    end
  end

  # ---------------------------------------------------------------------------
  # Elasticsearch/OpenSearch Implementation
  # ---------------------------------------------------------------------------

  defp elastic_search(index, query, opts) do
    url = "#{config(:url)}/#{index_name(index)}/_search"
    limit = min(Keyword.get(opts, :limit, 20), 100)
    offset = Keyword.get(opts, :offset, 0)

    body = %{
      query: %{
        multi_match: %{
          query: query,
          fields: ["*"],
          type: "best_fields",
          fuzziness: "AUTO"
        }
      },
      size: limit,
      from: offset
    }

    body =
      if sort = Keyword.get(opts, :sort),
        do: Map.put(body, :sort, sort),
        else: body

    body =
      if filter = Keyword.get(opts, :filter),
        do: put_in(body, [:query], %{bool: %{must: body.query, filter: filter}}),
        else: body

    body =
      if highlight = Keyword.get(opts, :highlight),
        do: Map.put(body, :highlight, %{fields: Map.new(highlight, &{&1, %{}})}),
        else: body

    case http_post(url, body) do
      {:ok, %{status: 200, body: response}} ->
        hits = get_in(response, ["hits", "hits"]) || []
        total = get_in(response, ["hits", "total", "value"]) || 0
        took = response["took"] || 0

        {:ok, %{
          hits: Enum.map(hits, fn hit ->
            Map.merge(hit["_source"] || %{}, %{
              "_id" => hit["_id"],
              "_score" => hit["_score"]
            })
          end),
          total: total,
          took_ms: took,
          query: query
        }}

      {:ok, %{status: status, body: body}} ->
        Logger.warning("elastic_search_error", status: status, body: inspect(body))
        {:error, {:elastic_error, status}}

      {:error, reason} ->
        Logger.warning("elastic_search_unavailable", reason: inspect(reason))
        {:error, :elastic_unavailable}
    end
  end

  defp elastic_index(index, id, body) do
    url = "#{config(:url)}/#{index_name(index)}/_doc/#{id}"

    case http_put(url, body) do
      {:ok, %{status: status}} when status in [200, 201] -> :ok
      {:ok, %{status: status}} -> {:error, {:elastic_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp elastic_delete(index, id) do
    url = "#{config(:url)}/#{index_name(index)}/_doc/#{id}"

    case http_delete(url) do
      {:ok, %{status: status}} when status in [200, 404] -> :ok
      {:ok, %{status: status}} -> {:error, {:elastic_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp elastic_bulk(index, documents) do
    url = "#{config(:url)}/_bulk"

    ndjson =
      documents
      |> Enum.flat_map(fn doc ->
        id = doc["id"] || doc[:id] || Ecto.UUID.generate()
        [
          Jason.encode!(%{index: %{_index: index_name(index), _id: to_string(id)}}),
          Jason.encode!(doc)
        ]
      end)
      |> Enum.join("\n")
      |> Kernel.<>("\n")

    case http_post_ndjson(url, ndjson) do
      {:ok, %{status: 200, body: %{"errors" => false}}} -> :ok
      {:ok, %{status: 200, body: %{"errors" => true} = body}} ->
        Logger.warning("elastic_bulk_partial_failure", body: inspect(body))
        {:error, :partial_bulk_failure}
      {:ok, %{status: status}} -> {:error, {:elastic_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # PostgreSQL tsvector Fallback
  # ---------------------------------------------------------------------------

  defp postgres_search(index, query, opts) do
    limit = min(Keyword.get(opts, :limit, 20), 100)
    offset = Keyword.get(opts, :offset, 0)

    # Delegate to existing Engine for postgres search
    case CGraph.Search.Engine.search(index, query, Keyword.merge(opts, limit: limit, offset: offset)) do
      {:ok, result} ->
        {:ok, %{
          hits: result.hits,
          total: result.total,
          took_ms: result.processing_time_ms,
          query: query
        }}

      {:error, _} = error ->
        error
    end
  end

  defp postgres_index(_index, _id, _body) do
    # PostgreSQL is the source of truth — no separate index needed
    {:ok, :postgres_is_source_of_truth}
  end

  defp postgres_delete(_index, _id) do
    {:ok, :postgres_is_source_of_truth}
  end

  defp postgres_bulk(_index, _documents) do
    {:ok, :postgres_is_source_of_truth}
  end

  # ---------------------------------------------------------------------------
  # HTTP Helpers
  # ---------------------------------------------------------------------------

  defp http_get(url) do
    Req.get(url,
      headers: auth_headers(),
      receive_timeout: config(:request_timeout)
    )
  rescue
    e -> {:error, Exception.message(e)}
  end

  defp http_post(url, body) do
    Req.post(url,
      json: body,
      headers: auth_headers(),
      receive_timeout: config(:request_timeout)
    )
  rescue
    e -> {:error, Exception.message(e)}
  end

  defp http_put(url, body) do
    Req.put(url,
      json: body,
      headers: auth_headers(),
      receive_timeout: config(:request_timeout)
    )
  rescue
    e -> {:error, Exception.message(e)}
  end

  defp http_delete(url) do
    Req.delete(url,
      headers: auth_headers(),
      receive_timeout: config(:request_timeout)
    )
  rescue
    e -> {:error, Exception.message(e)}
  end

  defp http_post_ndjson(url, ndjson_body) do
    Req.post(url,
      body: ndjson_body,
      headers: Map.merge(auth_headers(), %{"content-type" => "application/x-ndjson"}),
      receive_timeout: config(:request_timeout)
    )
  rescue
    e -> {:error, Exception.message(e)}
  end

  defp auth_headers do
    case config(:api_key) do
      nil -> %{}
      key -> %{"authorization" => "ApiKey #{key}"}
    end
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  defp config(key) do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(key, default_config(key))
  end

  defp default_config(:backend), do: :postgres
  defp default_config(:url), do: "http://localhost:9200"
  defp default_config(:index_prefix), do: "cgraph_"
  defp default_config(:request_timeout), do: 5_000
  defp default_config(:api_key), do: nil

  defp backend, do: config(:backend)

  defp index_name(index) do
    "#{config(:index_prefix)}#{index}"
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_telemetry(event, metadata) do
    :telemetry.execute(
      [:cgraph, :search, :elastic, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      metadata
    )
  end
end
