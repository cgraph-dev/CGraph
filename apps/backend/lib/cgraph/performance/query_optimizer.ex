defmodule Cgraph.Performance.QueryOptimizer do
  @moduledoc """
  Database query optimization utilities.
  
  ## Overview
  
  Provides tools for optimizing database queries:
  
  - Query batching to reduce N+1 problems
  - Cursor-based pagination for efficient large result sets
  - Preload optimization with selective loading
  - Query plan analysis and suggestions
  
  ## Query Patterns
  
  ### Batched Loading
  
  Instead of N+1 queries:
  
      # Bad: N+1 queries
      messages = Repo.all(Message)
      Enum.map(messages, fn msg -> Repo.preload(msg, :sender) end)
      
      # Good: Batched loading
      messages = QueryOptimizer.load_in_batches(Message, user_ids, :sender)
  
  ### Cursor Pagination
  
      # Efficient pagination for large datasets
      {:ok, results, cursor} = QueryOptimizer.cursor_paginate(
        from(m in Message, where: m.conversation_id == ^conv_id),
        after: last_cursor,
        limit: 50
      )
  
  ### Selective Preloading
  
      # Only load what's needed
      query = from(u in User, select: map(u, [:id, :username, :avatar_url]))
      users = QueryOptimizer.preload_selective(query, [:profile], [:bio, :location])
  """
  
  import Ecto.Query
  require Logger
  
  alias Cgraph.Repo
  
  @default_batch_size 100
  @default_page_limit 50
  @max_page_limit 100
  
  @type cursor :: String.t() | nil
  @type pagination_result :: {:ok, [term()], cursor()}
  
  # ---------------------------------------------------------------------------
  # Batched Loading
  # ---------------------------------------------------------------------------
  
  @doc """
  Load records in batches to avoid memory issues with large datasets.
  
  ## Options
  
  - `:batch_size` - Number of records per batch (default: 100)
  - `:preloads` - Associations to preload
  - `:callback` - Function to call with each batch
  """
  @spec stream_in_batches(Ecto.Queryable.t(), keyword()) :: Enumerable.t()
  def stream_in_batches(query, opts \\ []) do
    batch_size = Keyword.get(opts, :batch_size, @default_batch_size)
    preloads = Keyword.get(opts, :preloads, [])
    
    query
    |> order_by([r], asc: r.id)
    |> Repo.stream(max_rows: batch_size)
    |> Stream.chunk_every(batch_size)
    |> Stream.map(fn batch ->
      if preloads != [] do
        Repo.preload(batch, preloads)
      else
        batch
      end
    end)
  end
  
  @doc """
  Load associations for a list of IDs in batches.
  
  Prevents N+1 queries by loading all associated records in a single query.
  """
  @spec batch_preload(module(), [term()], atom() | [atom()]) :: [term()]
  def batch_preload(schema, ids, preloads) when is_list(ids) do
    ids = Enum.uniq(ids)
    
    schema
    |> where([r], r.id in ^ids)
    |> Repo.all()
    |> Repo.preload(preloads)
  end
  
  @doc """
  Load records with their associations using a dataloader pattern.
  
  Groups lookups by association to minimize queries.
  """
  @spec load_with_associations(module(), [term()], [atom()]) :: map()
  def load_with_associations(schema, ids, associations) do
    primary_records = 
      schema
      |> where([r], r.id in ^ids)
      |> Repo.all()
      |> Map.new(& {&1.id, &1})
    
    # Load each association in a single query
    Enum.reduce(associations, primary_records, fn assoc, acc ->
      # Get association metadata
      assoc_info = schema.__schema__(:association, assoc)
      related_schema = assoc_info.related
      
      # Collect foreign keys
      fk_field = assoc_info.owner_key
      related_ids = acc
        |> Map.values()
        |> Enum.map(&Map.get(&1, fk_field))
        |> Enum.reject(&is_nil/1)
        |> Enum.uniq()
      
      # Load related records
      related = 
        related_schema
        |> where([r], r.id in ^related_ids)
        |> Repo.all()
        |> Map.new(& {&1.id, &1})
      
      # Attach to primary records
      Map.new(acc, fn {id, record} ->
        related_id = Map.get(record, fk_field)
        related_record = Map.get(related, related_id)
        {id, Map.put(record, assoc, related_record)}
      end)
    end)
  end
  
  # ---------------------------------------------------------------------------
  # Cursor Pagination
  # ---------------------------------------------------------------------------
  
  @doc """
  Cursor-based pagination for efficient large dataset traversal.
  
  Unlike offset pagination, cursor pagination:
  - Has consistent performance regardless of page number
  - Handles new records without duplicate/missing entries
  - Works well with real-time data
  
  ## Options
  
  - `:after` - Cursor for records after this point
  - `:before` - Cursor for records before this point
  - `:limit` - Maximum records to return (default: 50, max: 100)
  - `:order_by` - Field to order by (default: :inserted_at)
  - `:order_dir` - Direction (:asc or :desc, default: :desc)
  
  ## Returns
  
  `{:ok, records, %{end_cursor: cursor, has_more: boolean}}`
  """
  @spec cursor_paginate(Ecto.Queryable.t(), keyword()) :: 
    {:ok, [term()], map()}
  def cursor_paginate(query, opts \\ []) do
    limit = min(Keyword.get(opts, :limit, @default_page_limit), @max_page_limit)
    order_field = Keyword.get(opts, :order_by, :inserted_at)
    order_dir = Keyword.get(opts, :order_dir, :desc)
    after_cursor = Keyword.get(opts, :after)
    before_cursor = Keyword.get(opts, :before)
    
    # Apply cursor filter
    query = cond do
      after_cursor ->
        case decode_cursor(after_cursor) do
          {:ok, value} ->
            if order_dir == :desc do
              where(query, [r], field(r, ^order_field) < ^value)
            else
              where(query, [r], field(r, ^order_field) > ^value)
            end
          :error ->
            query
        end
      
      before_cursor ->
        case decode_cursor(before_cursor) do
          {:ok, value} ->
            if order_dir == :desc do
              where(query, [r], field(r, ^order_field) > ^value)
            else
              where(query, [r], field(r, ^order_field) < ^value)
            end
          :error ->
            query
        end
      
      true ->
        query
    end
    
    # Apply ordering and limit (fetch one extra to check for more)
    query = query
      |> order_by([r], [{^order_dir, field(r, ^order_field)}])
      |> limit(^(limit + 1))
    
    results = Repo.all(query)
    has_more = length(results) > limit
    results = Enum.take(results, limit)
    
    # Generate end cursor
    end_cursor = case List.last(results) do
      nil -> nil
      last -> encode_cursor(Map.get(last, order_field))
    end
    
    {:ok, results, %{
      end_cursor: end_cursor,
      has_more: has_more,
      limit: limit
    }}
  end
  
  @doc """
  Paginate with both cursor and count information.
  
  More expensive than cursor_paginate due to count query.
  Use sparingly when total count is needed.
  """
  @spec cursor_paginate_with_count(Ecto.Queryable.t(), keyword()) :: 
    {:ok, [term()], map()}
  def cursor_paginate_with_count(query, opts \\ []) do
    {:ok, results, page_info} = cursor_paginate(query, opts)
    
    # Get total count (can be cached)
    total_count = Repo.aggregate(query, :count, :id)
    
    {:ok, results, Map.put(page_info, :total_count, total_count)}
  end
  
  defp encode_cursor(value) when is_struct(value, DateTime) do
    value
    |> DateTime.to_iso8601()
    |> Base.url_encode64(padding: false)
  end
  
  defp encode_cursor(value) when is_struct(value, NaiveDateTime) do
    value
    |> NaiveDateTime.to_iso8601()
    |> Base.url_encode64(padding: false)
  end
  
  defp encode_cursor(value) do
    value
    |> to_string()
    |> Base.url_encode64(padding: false)
  end
  
  defp decode_cursor(cursor) do
    case Base.url_decode64(cursor, padding: false) do
      {:ok, value} ->
        # Try parsing as DateTime first
        case DateTime.from_iso8601(value) do
          {:ok, datetime, _} -> {:ok, datetime}
          _ ->
            case NaiveDateTime.from_iso8601(value) do
              {:ok, naive} -> {:ok, naive}
              _ -> {:ok, value}
            end
        end
      :error ->
        :error
    end
  end
  
  # ---------------------------------------------------------------------------
  # Query Analysis
  # ---------------------------------------------------------------------------
  
  @doc """
  Analyze a query and return optimization suggestions.
  
  Uses EXPLAIN ANALYZE to identify slow queries.
  """
  @spec analyze_query(Ecto.Queryable.t()) :: map()
  def analyze_query(query) do
    {sql, params} = Repo.to_sql(:all, query)
    
    explain_result = Repo.query!("EXPLAIN ANALYZE #{sql}", params)
    
    plan = Enum.map(explain_result.rows, fn [row] -> row end)
    
    # Parse for common issues
    issues = []
    
    issues = if Enum.any?(plan, &String.contains?(&1, "Seq Scan")),
      do: ["Sequential scan detected - consider adding an index" | issues],
      else: issues
    
    issues = if Enum.any?(plan, &String.contains?(&1, "Nested Loop")),
      do: ["Nested loop join - may be slow for large datasets" | issues],
      else: issues
    
    # Extract timing
    timing = Enum.find_value(plan, fn line ->
      case Regex.run(~r/actual time=[\d.]+\.\.(\d+\.\d+)/, line) do
        [_, time] -> String.to_float(time)
        _ -> nil
      end
    end)
    
    %{
      plan: plan,
      timing_ms: timing,
      issues: issues,
      sql: sql
    }
  end
  
  @doc """
  Check for N+1 query patterns in a function.
  
  Wraps execution and counts queries.
  """
  @spec detect_n_plus_one((() -> term())) :: {term(), map()}
  def detect_n_plus_one(fun) when is_function(fun, 0) do
    # Start query counting
    ref = make_ref()
    :ets.new(ref, [:set, :public])
    :ets.insert(ref, {:count, 0})
    
    # Hook into telemetry
    handler_id = "n_plus_one_#{:erlang.unique_integer()}"
    
    :telemetry.attach(
      handler_id,
      [:cgraph, :repo, :query],
      fn _event, _measurements, _metadata, _config ->
        :ets.update_counter(ref, :count, 1)
      end,
      nil
    )
    
    result = try do
      fun.()
    after
      :telemetry.detach(handler_id)
    end
    
    [{:count, query_count}] = :ets.lookup(ref, :count)
    :ets.delete(ref)
    
    stats = %{
      query_count: query_count,
      potential_n_plus_one: query_count > 10,
      recommendation: if(query_count > 10, 
        do: "Consider using preloads or batch loading",
        else: nil
      )
    }
    
    {result, stats}
  end
  
  # ---------------------------------------------------------------------------
  # Selective Field Loading
  # ---------------------------------------------------------------------------
  
  @doc """
  Select only specific fields to reduce data transfer.
  
  Useful for list views where full records aren't needed.
  """
  @spec select_fields(Ecto.Queryable.t(), [atom()]) :: Ecto.Query.t()
  def select_fields(query, fields) when is_list(fields) do
    from(q in query, select: map(q, ^fields))
  end
  
  @doc """
  Select fields with computed columns.
  """
  @spec select_with_computed(Ecto.Queryable.t(), [atom()], keyword()) :: Ecto.Query.t()
  def select_with_computed(query, fields, computed) do
    base_select = Enum.map(fields, &{&1, dynamic([q], field(q, ^&1))})
    full_select = base_select ++ computed
    
    from(q in query, select: ^Map.new(full_select))
  end
end
