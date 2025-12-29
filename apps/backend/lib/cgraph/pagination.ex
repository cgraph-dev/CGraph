defmodule Cgraph.Pagination do
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
  alias Cgraph.Repo
  
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
  def parse_params(params, opts \\ []) do
    default_limit = Keyword.get(opts, :default_limit, @default_limit)
    max_limit = Keyword.get(opts, :max_limit, @max_limit)
    sort_field = Keyword.get(opts, :sort_field, :id)
    sort_direction = Keyword.get(opts, :sort_direction, :desc)
    
    limit = params
    |> Map.get("limit", Map.get(params, :limit, default_limit))
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
      Map.put(page_info, :total_count, Repo.aggregate(queryable, :count))
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
        case Jason.decode(json, keys: :atoms) do
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
    sort_field = opts.sort_field
    sort_direction = opts.sort_direction
    
    # Combine cursor direction with sort direction
    # after + asc = > , after + desc = <
    # before + asc = < , before + desc = >
    operator = case {direction, sort_direction} do
      {:after, :asc} -> :gt
      {:after, :desc} -> :lt
      {:before, :asc} -> :lt
      {:before, :desc} -> :gt
    end
    
    sort_value = cursor_data.sort_value
    id_value = cursor_data.id
    
    # Use composite condition for stable pagination
    case operator do
      :gt ->
        from r in query,
          where: field(r, ^sort_field) > ^sort_value or
                 (field(r, ^sort_field) == ^sort_value and r.id > ^id_value)
      :lt ->
        from r in query,
          where: field(r, ^sort_field) < ^sort_value or
                 (field(r, ^sort_field) == ^sort_value and r.id < ^id_value)
    end
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
  
  defp build_page_info([], _cursor, _direction, _has_more, _opts) do
    %{
      has_next_page: false,
      has_previous_page: false,
      start_cursor: nil,
      end_cursor: nil,
      total_count: nil
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
      total_count: nil
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
end

defmodule Cgraph.Pagination.JSON do
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
    
    links
    |> Enum.map(fn {rel, url} -> "<#{url}>; rel=\"#{rel}\"" end)
    |> Enum.join(", ")
  end
end
