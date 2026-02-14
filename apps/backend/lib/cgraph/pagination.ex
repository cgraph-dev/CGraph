defmodule CGraph.Pagination do
  @moduledoc """
  Cursor-based pagination for efficient, stable pagination.

  ## Overview

  Provides cursor-based (keyset) pagination which is:

  - **Efficient**: O(1) regardless of offset
  - **Stable**: No duplicates/skips with concurrent writes
  - **Consistent**: Works with real-time data

  ## Comparison

  | Feature | Offset-based | Cursor-based |
  |---------|--------------|--------------|
  | Performance | O(n) | O(1) |
  | Stability | Poor | Excellent |
  | Jump to page | Yes | No |
  | Infinite scroll | Poor | Excellent |

  ## Cursor Format

  Cursors are opaque base64-encoded strings containing:

  - Sort field value
  - Primary key (for tiebreaking)
  - Direction

  ```
  eyJpZCI6IjEyMzQ1Iiwic29ydCI6IjIwMjQtMDEtMTUiLCJkaXIiOiJhZnRlciJ9
  ```

  ## Usage

      # In controller
      def index(conn, params) do
        opts = Pagination.parse_params(params, default_limit: 25)

        {users, page_info} = Pagination.paginate(User, opts)

        render(conn, "index.json", users: users, page_info: page_info)
      end

      # With Ecto query
      query = from u in User, where: u.active == true
      {users, page_info} = Pagination.paginate(query, opts)

      # Custom cursor field
      {messages, page_info} = Pagination.paginate(Message, %{
        cursor: params["cursor"],
        limit: 50,
        sort_field: :inserted_at,
        sort_direction: :desc
      })

  ## Response Format

      %{
        data: [...],
        page_info: %{
          has_next_page: true,
          has_previous_page: false,
          start_cursor: "...",
          end_cursor: "...",
          total_count: 1234  # optional
        }
      }
  """

  import Ecto.Query
  alias CGraph.Repo

  @type cursor :: String.t() | nil
  @type direction :: :asc | :desc

  @type opts :: %{
    cursor: cursor(),
    limit: pos_integer(),
    sort_field: atom(),
    sort_direction: direction(),
    include_total: boolean()
  }

  @type page_info :: %{
    has_next_page: boolean(),
    has_previous_page: boolean(),
    start_cursor: cursor(),
    end_cursor: cursor(),
    total_count: non_neg_integer() | nil
  }

  @default_limit 25
  @max_limit 100

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Parse pagination parameters from request params.

  ## Options

  - `:default_limit` - Default page size (default: 25)
  - `:max_limit` - Maximum allowed limit (default: 100)
  - `:sort_field` - Default sort field (default: :id)
  - `:sort_direction` - Default sort direction (default: :desc)
  """
  def parse_params(params, opts \\ [])

  def parse_params(params, opts) when is_map(opts) do
    parse_params(params, Map.to_list(opts))
  end

  def parse_params(params, opts) when is_list(opts) do
    default_limit = Keyword.get(opts, :default_limit, @default_limit)
    max_limit = Keyword.get(opts, :max_limit, @max_limit)
    sort_field = Keyword.get(opts, :sort_field, :id)
    sort_direction = Keyword.get(opts, :sort_direction, :desc)

    limit = params
    |> get_limit_param(default_limit)
    |> parse_limit(max_limit)

    %{
      cursor: Map.get(params, "cursor", Map.get(params, :cursor)),
      after_cursor: Map.get(params, "after", Map.get(params, :after)),
      before_cursor: Map.get(params, "before", Map.get(params, :before)),
      limit: limit,
      sort_field: parse_sort_field(params, sort_field),
      sort_direction: parse_sort_direction(params, sort_direction),
      include_total: Map.get(params, "include_total", Map.get(params, :include_total, false))
    }
  end

  @doc """
  Paginate a queryable using cursor-based pagination.

  Returns `{results, page_info}`.
  """
  def paginate(queryable, opts) do
    # Normalize cursor options
    cursor = opts[:after_cursor] || opts[:before_cursor] || opts[:cursor]
    direction = if opts[:before_cursor], do: :before, else: :after

    # Build the query
    query = queryable
    |> apply_cursor(cursor, direction, opts)
    |> apply_ordering(opts)
    |> limit(^(opts.limit + 1))  # Fetch one extra to detect next page

    # Execute query
    results = Repo.all(query)

    # Determine if there are more pages
    has_more = length(results) > opts.limit
    results = Enum.take(results, opts.limit)

    # Reverse if fetching before cursor
    results = if direction == :before, do: Enum.reverse(results), else: results

    # Build page info
    page_info = build_page_info(results, cursor, direction, has_more, opts)

    # Optionally include total count
    page_info = if opts[:include_total] do
      total = Repo.aggregate(queryable, :count)
      page_info |> Map.put(:total_count, total) |> Map.put(:total, total)
    else
      page_info
    end

    {results, page_info}
  end

  @doc """
  Generate a cursor for a record.
  """
  def cursor_for(record, opts \\ []) do
    sort_field = Keyword.get(opts, :sort_field, :id)

    data = %{
      id: get_field(record, :id),
      sort_value: get_field(record, sort_field),
      sort_field: sort_field
    }

    encode_cursor(data)
  end

  @doc """
  Decode a cursor to its components.
  """
  def decode_cursor(nil), do: nil

  def decode_cursor(cursor) when is_binary(cursor) do
    case Base.url_decode64(cursor, padding: false) do
      {:ok, json} ->
        case Jason.decode(json, keys: :atoms!) do
          {:ok, data} -> data
          _ -> nil
        end
      _ -> nil
    end
  end

  # ---------------------------------------------------------------------------
  # Query Building
  # ---------------------------------------------------------------------------

  defp apply_cursor(query, nil, _direction, _opts), do: query

  defp apply_cursor(query, cursor, direction, opts) do
    case decode_cursor(cursor) do
      nil -> query
      cursor_data -> apply_cursor_filter(query, cursor_data, direction, opts)
    end
  end

  defp apply_cursor_filter(query, cursor_data, direction, opts) do
    operator = determine_cursor_operator(direction, opts.sort_direction)
    build_cursor_query(query, cursor_data, opts.sort_field, operator)
  end

  defp determine_cursor_operator(:after, :asc), do: :gt
  defp determine_cursor_operator(:after, :desc), do: :lt
  defp determine_cursor_operator(:before, :asc), do: :lt
  defp determine_cursor_operator(:before, :desc), do: :gt

  defp build_cursor_query(query, cursor_data, sort_field, :gt) do
    from r in query,
      where: field(r, ^sort_field) > ^cursor_data.sort_value or
             (field(r, ^sort_field) == ^cursor_data.sort_value and r.id > ^cursor_data.id)
  end
  defp build_cursor_query(query, cursor_data, sort_field, :lt) do
    from r in query,
      where: field(r, ^sort_field) < ^cursor_data.sort_value or
             (field(r, ^sort_field) == ^cursor_data.sort_value and r.id < ^cursor_data.id)
  end

  defp apply_ordering(query, opts) do
    sort_field = opts.sort_field
    sort_direction = opts.sort_direction

    # Order by sort field, then by id for stability
    from r in query,
      order_by: [{^sort_direction, field(r, ^sort_field)}, {^sort_direction, r.id}]
  end

  # ---------------------------------------------------------------------------
  # Page Info Building
  # ---------------------------------------------------------------------------

  defp build_page_info([], _cursor, _direction, _has_more, opts) do
    %{
      has_next_page: false,
      has_previous_page: false,
      start_cursor: nil,
      end_cursor: nil,
      total_count: nil,
      total: nil,
      per_page: opts[:limit]
    }
  end

  defp build_page_info(results, cursor, direction, has_more, opts) do
    first = List.first(results)
    last = List.last(results)

    start_cursor = cursor_for(first, sort_field: opts.sort_field)
    end_cursor = cursor_for(last, sort_field: opts.sort_field)

    # Determine page direction based on cursor direction
    {has_next, has_prev} = case direction do
      :after -> {has_more, cursor != nil}
      :before -> {cursor != nil, has_more}
    end

    %{
      has_next_page: has_next,
      has_previous_page: has_prev,
      start_cursor: start_cursor,
      end_cursor: end_cursor,
      total_count: nil,
      total: nil,
      per_page: opts[:limit]
    }
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp encode_cursor(data) do
    data
    |> Jason.encode!()
    |> Base.url_encode64(padding: false)
  end

  defp get_field(record, field) when is_map(record) do
    Map.get(record, field)
  end

  defp parse_limit(limit, max) when is_integer(limit) do
    min(max(1, limit), max)
  end

  defp parse_limit(limit, max) when is_binary(limit) do
    case Integer.parse(limit) do
      {int, _} -> parse_limit(int, max)
      :error -> @default_limit
    end
  end

  defp parse_limit(_, _), do: @default_limit

  # Accept per_page, page_size as aliases for limit
  defp get_limit_param(params, default) do
    Map.get(params, "limit",
      Map.get(params, :limit,
        Map.get(params, "per_page",
          Map.get(params, :per_page,
            Map.get(params, "page_size",
              Map.get(params, :page_size, default))))))
  end

  defp parse_sort_field(params, default) do
    case Map.get(params, "sort", Map.get(params, :sort)) do
      nil -> default
      field when is_binary(field) ->
        try do
          String.to_existing_atom(field)
        rescue
          _ -> default
        end
      field when is_atom(field) -> field
    end
  end

  defp parse_sort_direction(params, default) do
    case Map.get(params, "order", Map.get(params, :order)) do
      "asc" -> :asc
      "desc" -> :desc
      :asc -> :asc
      :desc -> :desc
      _ -> default
    end
  end

  # ---------------------------------------------------------------------------
  # Low-level helpers for manual cursor pagination in context modules
  # ---------------------------------------------------------------------------

  @doc """
  Fetch `limit + 1` items from a pre-built query.

  Returns `{items, has_next_page}` where `items` has at most `limit` entries.
  Useful when the caller builds the full query (with ordering and cursor WHERE)
  and just needs the fetch + has_next logic.
  """
  @spec fetch_page(Ecto.Query.t(), pos_integer()) :: {list(), boolean()}
  def fetch_page(query, limit) do
    results =
      query
      |> limit(^(limit + 1))
      |> Repo.all()

    has_more = length(results) > limit
    {Enum.take(results, limit), has_more}
  end

  @doc """
  Encode arbitrary cursor data as an opaque Base64url string.

  Unlike `cursor_for/2`, this accepts any map and doesn't impose a specific
  key structure. Useful for compound cursors (e.g., `%{p: true, v: val, id: id}`).
  """
  @spec encode_cursor_data(map()) :: String.t()
  def encode_cursor_data(data) when is_map(data) do
    data
    |> Jason.encode!()
    |> Base.url_encode64(padding: false)
  end

  @doc """
  Deserialize a cursor value that may be an ISO 8601 datetime string.
  Public so context modules can use it when applying manual cursor filters.
  """
  @spec deserialize_cursor_value(term()) :: term()
  def deserialize_cursor_value(v) when is_binary(v) do
    case DateTime.from_iso8601(v) do
      {:ok, dt, _} ->
        dt

      _ ->
        case NaiveDateTime.from_iso8601(v) do
          {:ok, ndt} -> ndt
          _ -> v
        end
    end
  end

  def deserialize_cursor_value(v), do: v
end

defmodule CGraph.Pagination.JSON do
  @moduledoc """
  JSON rendering helpers for paginated responses.
  """

  @doc """
  Wrap data with pagination info for API response.
  """
  def paginated_response(data, page_info, opts \\ []) do
    data_key = Keyword.get(opts, :data_key, :data)

    response = %{
      data_key => data,
      :page_info => %{
        has_next_page: page_info.has_next_page,
        has_previous_page: page_info.has_previous_page,
        start_cursor: page_info.start_cursor,
        end_cursor: page_info.end_cursor
      }
    }

    if page_info.total_count do
      put_in(response, [:page_info, :total_count], page_info.total_count)
    else
      response
    end
  end

  @doc """
  Build pagination links for response headers.
  """
  def pagination_links(base_url, page_info) do
    links = []

    links = if page_info.has_next_page do
      [{"next", "#{base_url}?after=#{page_info.end_cursor}"} | links]
    else
      links
    end

    links = if page_info.has_previous_page do
      [{"prev", "#{base_url}?before=#{page_info.start_cursor}"} | links]
    else
      links
    end

    Enum.map_join(links, ", ", fn {rel, url} ->
      "<#{url}>; rel=\"#{rel}\""
    end)
  end
end
