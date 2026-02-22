defmodule CGraph.Search.Engine.PostgresAdapter do
  @moduledoc """
  PostgreSQL fallback adapter and telemetry for the search engine.

  Provides ILIKE-based full-text search as a graceful degradation path when
  Meilisearch is unavailable. Also handles telemetry emission for all search
  engine observability events.

  ## Supported Indexes

  - `:users` — searches `username` and `display_name`
  - `:posts` — searches `title` and `content`
  - `:groups` — searches `name` and `description`
  - `:messages` — not supported (returns empty)
  """

  import Ecto.Query
  import CGraph.Query.SoftDelete

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search using PostgreSQL ILIKE queries.

  Falls back to simple pattern matching. Results are returned in the same
  format as the Meilisearch adapter for transparent swapping.
  """
  @spec search(atom(), String.t(), keyword()) :: {:ok, map()}
  def search(index, query, opts) do
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)
    search_term = "%#{query}%"

    result = case index do
      :users ->
        CGraph.Repo.all(
          from(u in CGraph.Accounts.User,
            where: ilike(u.username, ^search_term) or ilike(u.display_name, ^search_term),
            where: not_deleted(u) and is_nil(u.banned_at),
            limit: ^limit,
            offset: ^offset,
            order_by: [asc: u.username]
          )
        )

      :posts ->
        CGraph.Repo.all(
          from(p in CGraph.Forums.Post,
            where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
            limit: ^limit,
            offset: ^offset,
            order_by: [desc: p.inserted_at]
          )
        )

      :groups ->
        CGraph.Repo.all(
          from(g in CGraph.Groups.Group,
            where: ilike(g.name, ^search_term) or ilike(g.description, ^search_term),
            limit: ^limit,
            offset: ^offset,
            order_by: [asc: g.name]
          )
        )

      :messages ->
        []

      _ ->
        []
    end

    {:ok, %{
      hits: Enum.map(result, &stringify_keys/1),
      total: length(result),
      processing_time_ms: 0,
      query: query,
      backend: :postgres
    }}
  end

  @doc """
  Get PostgreSQL backend statistics.
  """
  @spec stats() :: {:ok, map()}
  def stats do
    {:ok, %{
      backend: :postgres,
      message: "Using PostgreSQL for search (Meilisearch not configured)"
    }}
  end

  # ============================================================================
  # Telemetry
  # ============================================================================

  @doc """
  Emit telemetry event for a completed search query.
  """
  @spec emit_search_telemetry(atom(), String.t(), keyword(), term(), integer()) :: :ok
  def emit_search_telemetry(index, query, opts, result, start_time) do
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

  @doc """
  Emit telemetry event for document indexing.
  """
  @spec emit_index_telemetry(atom(), integer()) :: :ok
  def emit_index_telemetry(index, count) do
    :telemetry.execute(
      [:cgraph, :search, :index],
      %{documents_count: count},
      %{index: index}
    )
  end

  @doc """
  Emit telemetry event when PostgreSQL fallback is activated.
  """
  @spec emit_fallback_telemetry(atom(), String.t()) :: :ok
  def emit_fallback_telemetry(index, query) do
    :telemetry.execute(
      [:cgraph, :search, :fallback],
      %{count: 1},
      %{index: index, query: query}
    )
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
end
