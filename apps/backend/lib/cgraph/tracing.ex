defmodule Cgraph.Tracing do
  @moduledoc """
  Distributed tracing system for request flow visualization.
  
  ## Overview
  
  Implements W3C Trace Context compatible distributed tracing for:
  
  - **Request Tracking**: Follow requests across services
  - **Performance Analysis**: Identify bottlenecks with span timing
  - **Error Correlation**: Link errors to specific request flows
  - **Dependency Mapping**: Visualize service dependencies
  
  ## Concepts
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                       DISTRIBUTED TRACE                         │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Trace: 4bf92f3577b34da6a3ce929d0e0e4736                        │
  │  ├── Span: HTTP Request (120ms)                                 │
  │  │   ├── Span: Authentication (5ms)                             │
  │  │   ├── Span: Database Query (45ms)                            │
  │  │   │   ├── Span: Connection (2ms)                             │
  │  │   │   └── Span: Execute (43ms)                               │
  │  │   ├── Span: Business Logic (50ms)                            │
  │  │   └── Span: Response (2ms)                                   │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  - **Trace**: End-to-end request journey
  - **Span**: Individual operation within a trace
  - **Context**: Propagated data across spans
  
  ## W3C Trace Context
  
  Implements W3C Trace Context specification for cross-service tracing:
  
  - `traceparent`: Required header with trace-id, parent-id, flags
  - `tracestate`: Optional vendor-specific data
  
  ## Usage
  
      # Start a trace (usually automatic via plug)
      {:ok, ctx} = Tracing.start_trace("api.request")
      
      # Create a child span
      Tracing.with_span(ctx, "database.query", fn ->
        Repo.all(User)
      end)
      
      # Add metadata to current span
      Tracing.add_attributes(ctx, %{
        "user.id" => user.id,
        "query.type" => "select"
      })
      
      # Record an error
      Tracing.record_error(ctx, exception, stacktrace)
  
  ## Integration
  
  Automatically integrates with:
  
  - Phoenix requests via `TracingPlug`
  - Ecto queries via telemetry
  - Oban jobs via telemetry
  - External HTTP calls via middleware
  """
  
  require Logger
  
  @type trace_id :: String.t()
  @type span_id :: String.t()
  @type trace_flags :: non_neg_integer()
  
  @type context :: %{
    trace_id: trace_id(),
    span_id: span_id(),
    parent_span_id: span_id() | nil,
    trace_flags: trace_flags(),
    baggage: map(),
    spans: list()
  }
  
  @type span :: %{
    span_id: span_id(),
    parent_span_id: span_id() | nil,
    name: String.t(),
    start_time: integer(),
    end_time: integer() | nil,
    duration_us: integer() | nil,
    status: :ok | :error,
    attributes: map(),
    events: list(),
    links: list()
  }
  
  # Trace flags
  @flag_sampled 0x01
  
  # Process dictionary key for context
  @context_key :cgraph_trace_context
  
  # ---------------------------------------------------------------------------
  # Public API - Context Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Start a new trace.
  
  Creates a new trace with a root span. Use this for incoming requests
  that don't have existing trace context.
  
  ## Options
  
  - `:sampled` - Whether to sample this trace (default: true)
  - `:attributes` - Initial span attributes
  """
  def start_trace(name, opts \\ []) do
    trace_id = generate_trace_id()
    span_id = generate_span_id()
    sampled = Keyword.get(opts, :sampled, true)
    attributes = Keyword.get(opts, :attributes, %{})
    
    ctx = %{
      trace_id: trace_id,
      span_id: span_id,
      parent_span_id: nil,
      trace_flags: if(sampled, do: @flag_sampled, else: 0),
      baggage: %{},
      spans: []
    }
    
    span = create_span(name, span_id, nil, attributes)
    ctx = add_span_to_context(ctx, span)
    
    # Store in process dictionary
    set_context(ctx)
    
    emit_span_start(name, ctx)
    
    {:ok, ctx}
  end
  
  @doc """
  Continue a trace from incoming headers.
  
  Parses W3C traceparent header and continues the trace.
  """
  def continue_trace(name, traceparent, opts \\ []) do
    case parse_traceparent(traceparent) do
      {:ok, trace_id, parent_span_id, trace_flags} ->
        span_id = generate_span_id()
        attributes = Keyword.get(opts, :attributes, %{})
        
        ctx = %{
          trace_id: trace_id,
          span_id: span_id,
          parent_span_id: parent_span_id,
          trace_flags: trace_flags,
          baggage: Keyword.get(opts, :baggage, %{}),
          spans: []
        }
        
        span = create_span(name, span_id, parent_span_id, attributes)
        ctx = add_span_to_context(ctx, span)
        
        set_context(ctx)
        emit_span_start(name, ctx)
        
        {:ok, ctx}
        
      :error ->
        # Invalid traceparent, start new trace
        start_trace(name, opts)
    end
  end
  
  @doc """
  Get the current trace context from process dictionary.
  """
  def current_context do
    Process.get(@context_key)
  end
  
  @doc """
  Set the trace context in process dictionary.
  """
  def set_context(ctx) do
    Process.put(@context_key, ctx)
    ctx
  end
  
  @doc """
  Clear the trace context from process dictionary.
  """
  def clear_context do
    Process.delete(@context_key)
  end
  
  # ---------------------------------------------------------------------------
  # Public API - Span Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Execute a function within a new span.
  
  Creates a child span, executes the function, and ends the span
  when the function completes (success or error).
  
  ## Example
  
      Tracing.with_span(ctx, "database.query", fn ->
        Repo.all(User)
      end)
      
      Tracing.with_span(ctx, "external.api", %{service: "payment"}, fn ->
        PaymentGateway.charge(amount)
      end)
  """
  def with_span(ctx, name, opts_or_fun, fun_or_nil \\ nil)
  
  def with_span(ctx, name, fun, nil) when is_function(fun, 0) do
    with_span(ctx, name, %{}, fun)
  end
  
  def with_span(ctx, name, attributes, fun) when is_map(attributes) and is_function(fun, 0) do
    {span, new_ctx} = start_span(ctx, name, attributes)
    
    try do
      result = fun.()
      end_span(new_ctx, span.span_id, :ok)
      result
    rescue
      e ->
        record_error(new_ctx, span.span_id, e, __STACKTRACE__)
        end_span(new_ctx, span.span_id, :error)
        reraise e, __STACKTRACE__
    catch
      kind, reason ->
        record_error(new_ctx, span.span_id, {kind, reason}, __STACKTRACE__)
        end_span(new_ctx, span.span_id, :error)
        :erlang.raise(kind, reason, __STACKTRACE__)
    end
  end
  
  @doc """
  Start a new child span manually.
  
  Returns the span and updated context. Must call `end_span/3` when done.
  """
  def start_span(ctx, name, attributes \\ %{}) do
    span_id = generate_span_id()
    parent_span_id = ctx.span_id
    
    span = create_span(name, span_id, parent_span_id, attributes)
    
    new_ctx = %{ctx | 
      span_id: span_id,
      spans: [span | ctx.spans]
    }
    
    set_context(new_ctx)
    emit_span_start(name, new_ctx)
    
    {span, new_ctx}
  end
  
  @doc """
  End a span.
  """
  def end_span(ctx, span_id, status \\ :ok) do
    end_time = System.monotonic_time(:microsecond)
    
    spans = Enum.map(ctx.spans, fn span ->
      if span.span_id == span_id do
        duration = end_time - span.start_time
        %{span | 
          end_time: end_time,
          duration_us: duration,
          status: status
        }
      else
        span
      end
    end)
    
    new_ctx = %{ctx | spans: spans}
    set_context(new_ctx)
    
    # Find the ended span for telemetry
    span = Enum.find(spans, &(&1.span_id == span_id))
    if span, do: emit_span_end(span, new_ctx)
    
    new_ctx
  end
  
  @doc """
  Add attributes to the current span.
  """
  def add_attributes(ctx, span_id \\ nil, attributes) do
    target_span_id = span_id || ctx.span_id
    
    spans = Enum.map(ctx.spans, fn span ->
      if span.span_id == target_span_id do
        %{span | attributes: Map.merge(span.attributes, attributes)}
      else
        span
      end
    end)
    
    new_ctx = %{ctx | spans: spans}
    set_context(new_ctx)
    new_ctx
  end
  
  @doc """
  Add an event to the current span.
  
  Events are timestamped markers within a span.
  """
  def add_event(ctx, name, attributes \\ %{}) do
    event = %{
      name: name,
      timestamp: System.monotonic_time(:microsecond),
      attributes: attributes
    }
    
    spans = Enum.map(ctx.spans, fn span ->
      if span.span_id == ctx.span_id do
        %{span | events: [event | span.events]}
      else
        span
      end
    end)
    
    new_ctx = %{ctx | spans: spans}
    set_context(new_ctx)
    new_ctx
  end
  
  @doc """
  Record an exception in the current span.
  """
  def record_error(ctx, span_id \\ nil, error, stacktrace \\ []) do
    # Use span_id for targeting specific span, or default to current
    _target_span_id = span_id || ctx.span_id
    
    error_attrs = %{
      "exception.type" => error_type(error),
      "exception.message" => error_message(error),
      "exception.stacktrace" => Exception.format_stacktrace(stacktrace)
    }
    
    add_event(ctx, "exception", error_attrs)
  end
  
  # ---------------------------------------------------------------------------
  # Public API - Context Propagation
  # ---------------------------------------------------------------------------
  
  @doc """
  Generate traceparent header for outgoing requests.
  
  Returns W3C Trace Context compliant header value.
  """
  def traceparent(ctx) do
    version = "00"
    trace_id = ctx.trace_id
    parent_id = ctx.span_id
    flags = String.pad_leading(Integer.to_string(ctx.trace_flags, 16), 2, "0")
    
    "#{version}-#{trace_id}-#{parent_id}-#{flags}"
  end
  
  @doc """
  Parse incoming traceparent header.
  """
  def parse_traceparent(header) when is_binary(header) do
    case String.split(header, "-") do
      ["00", trace_id, parent_id, flags] when byte_size(trace_id) == 32 and byte_size(parent_id) == 16 ->
        case Integer.parse(flags, 16) do
          {trace_flags, ""} -> {:ok, trace_id, parent_id, trace_flags}
          _ -> :error
        end
      _ -> :error
    end
  end
  def parse_traceparent(_), do: :error
  
  @doc """
  Set baggage (cross-cutting data propagated with trace).
  """
  def set_baggage(ctx, key, value) do
    baggage = Map.put(ctx.baggage, key, value)
    new_ctx = %{ctx | baggage: baggage}
    set_context(new_ctx)
    new_ctx
  end
  
  @doc """
  Get baggage value.
  """
  def get_baggage(ctx, key) do
    Map.get(ctx.baggage, key)
  end
  
  # ---------------------------------------------------------------------------
  # Public API - Sampling
  # ---------------------------------------------------------------------------
  
  @doc """
  Check if the current trace is sampled.
  """
  def sampled?(ctx) do
    Bitwise.band(ctx.trace_flags, @flag_sampled) == @flag_sampled
  end
  
  @doc """
  Determine if a new trace should be sampled.
  
  Uses configurable sampling strategy.
  """
  def should_sample?(opts \\ []) do
    strategy = Keyword.get(opts, :strategy, :always)
    rate = Keyword.get(opts, :rate, 1.0)
    
    case strategy do
      :always -> true
      :never -> false
      :probabilistic -> :rand.uniform() < rate
      :rate_limiting -> check_rate_limit()
    end
  end
  
  defp check_rate_limit do
    # Would implement token bucket or sliding window
    true
  end
  
  # ---------------------------------------------------------------------------
  # Public API - Export
  # ---------------------------------------------------------------------------
  
  @doc """
  Export trace data for external systems.
  
  Returns spans in a format compatible with Jaeger/Zipkin.
  """
  def export_trace(ctx) do
    %{
      trace_id: ctx.trace_id,
      spans: Enum.map(ctx.spans, fn span ->
        %{
          trace_id: ctx.trace_id,
          span_id: span.span_id,
          parent_span_id: span.parent_span_id,
          operation_name: span.name,
          start_time: span.start_time,
          duration_us: span.duration_us,
          status: span.status,
          tags: span.attributes,
          logs: Enum.map(span.events, fn event ->
            %{
              timestamp: event.timestamp,
              fields: Map.put(event.attributes, "event", event.name)
            }
          end)
        }
      end),
      baggage: ctx.baggage
    }
  end
  
  # ---------------------------------------------------------------------------
  # Internal Functions
  # ---------------------------------------------------------------------------
  
  defp generate_trace_id do
    :crypto.strong_rand_bytes(16)
    |> Base.encode16(case: :lower)
  end
  
  defp generate_span_id do
    :crypto.strong_rand_bytes(8)
    |> Base.encode16(case: :lower)
  end
  
  defp create_span(name, span_id, parent_span_id, attributes) do
    %{
      span_id: span_id,
      parent_span_id: parent_span_id,
      name: name,
      start_time: System.monotonic_time(:microsecond),
      end_time: nil,
      duration_us: nil,
      status: :ok,
      attributes: attributes,
      events: [],
      links: []
    }
  end
  
  defp add_span_to_context(ctx, span) do
    %{ctx | spans: [span | ctx.spans]}
  end
  
  defp error_type(%{__struct__: struct}), do: to_string(struct)
  defp error_type({kind, _}), do: to_string(kind)
  defp error_type(error), do: inspect(error)
  
  defp error_message(%{message: msg}), do: msg
  defp error_message({_, reason}), do: inspect(reason)
  defp error_message(error), do: inspect(error)
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_span_start(name, ctx) do
    :telemetry.execute(
      [:cgraph, :trace, :span, :start],
      %{system_time: System.system_time()},
      %{
        trace_id: ctx.trace_id,
        span_id: ctx.span_id,
        parent_span_id: ctx.parent_span_id,
        name: name
      }
    )
  end
  
  defp emit_span_end(span, ctx) do
    :telemetry.execute(
      [:cgraph, :trace, :span, :stop],
      %{duration: span.duration_us},
      %{
        trace_id: ctx.trace_id,
        span_id: span.span_id,
        name: span.name,
        status: span.status
      }
    )
  end
end
