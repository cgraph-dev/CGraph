defmodule CGraph.Search.Engine.MeilisearchAdapter do
  @moduledoc """
  Meilisearch backend adapter for the search engine.

  Handles all HTTP communication with Meilisearch including:

  - Document search with filters, sorting, and pagination
  - Document indexing (single and bulk)
  - Document deletion (single and bulk)
  - Index creation and settings management
  - Health checks and statistics
  """

  require Logger

  @default_config [
    meilisearch_url: "http://localhost:7700",
    meilisearch_key: nil,
    request_timeout: 5_000
  ]

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Search a Meilisearch index with the given query and options.
  """
  @spec search(atom(), String.t(), keyword()) :: {:ok, map()} | {:error, term()}
  def search(index, query, opts) do
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
        Logger.error("meilisearch_search_error", reason: inspect(reason))
        {:error, :meilisearch_unavailable}
    end
  end

  @doc """
  Index a batch of documents in a Meilisearch index.
  """
  @spec bulk_index(atom(), list(map())) :: :ok | {:error, term()}
  def bulk_index(index_name, documents) do
    url = "#{config(:meilisearch_url)}/indexes/#{index_name}/documents"
    docs = Enum.map(documents, &stringify_keys/1)

    case http_post(url, docs) do
      {:ok, %{status: status}} when status in [200, 202] ->
        :ok

      {:ok, %{status: status, body: body}} ->
        {:error, {:meilisearch_error, status, body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Delete a single document from a Meilisearch index.
  """
  @spec delete(atom(), String.t()) :: :ok | {:error, term()}
  def delete(index_name, document_id) do
    url = "#{config(:meilisearch_url)}/indexes/#{index_name}/documents/#{document_id}"

    case http_delete(url) do
      {:ok, %{status: status}} when status in [200, 202, 204] -> :ok
      {:ok, %{status: status}} -> {:error, {:meilisearch_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Bulk delete documents from a Meilisearch index.
  """
  @spec bulk_delete(atom(), list(String.t())) :: :ok | {:error, term()}
  def bulk_delete(index_name, document_ids) do
    url = "#{config(:meilisearch_url)}/indexes/#{index_name}/documents/delete-batch"

    case http_post(url, document_ids) do
      {:ok, %{status: status}} when status in [200, 202] -> :ok
      {:ok, %{status: status}} -> {:error, {:meilisearch_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Create or update a Meilisearch index with the given settings.
  """
  @spec create_or_update_index(atom(), map()) :: :ok | {:error, term()}
  def create_or_update_index(name, settings) do
    settings_url = "#{config(:meilisearch_url)}/indexes/#{name}/settings"

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

  @doc """
  Check if Meilisearch is healthy and responding.
  """
  @spec healthy?() :: boolean()
  def healthy? do
    url = "#{config(:meilisearch_url)}/health"

    case http_get(url) do
      {:ok, %{status: 200}} -> true
      _ -> false
    end
  end

  @doc """
  Get Meilisearch index statistics.
  """
  @spec stats() :: {:ok, map()} | {:error, :unavailable}
  def stats do
    url = "#{config(:meilisearch_url)}/stats"

    case http_get(url) do
      {:ok, %{status: 200, body: body}} -> {:ok, body}
      _ -> {:error, :unavailable}
    end
  end

  # ============================================================================
  # HTTP Helpers
  # ============================================================================

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

  # ============================================================================
  # Helpers
  # ============================================================================

  defp stringify_keys(%Ecto.Association.NotLoaded{}), do: nil

  defp stringify_keys(%{__struct__: _} = struct) do
    struct
    |> Map.from_struct()
    |> Map.drop([:__meta__])
    |> stringify_keys()
  end

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

  # ============================================================================
  # Configuration
  # ============================================================================

  defp config(key) do
    app_config = Application.get_env(:cgraph, CGraph.Search.Engine, [])
    Keyword.get(app_config, key) || Keyword.get(@default_config, key)
  end
end
