defmodule CGraph.Tracing do
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

  ## Submodules

  - `CGraph.Tracing.Context` - Context management, propagation, and sampling
  - `CGraph.Tracing.Span` - Span management and trace export
  """

  alias CGraph.Tracing.{Context, Span}

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

  # ---------------------------------------------------------------------------
  # Context Management
  # ---------------------------------------------------------------------------

  # start_trace/2 has a default argument — wrapper required
  @doc "Starts a new distributed trace with the given name and options."
  @spec start_trace(String.t(), keyword()) :: {:ok, context()} | {:error, term()}
  def start_trace(name, opts \\ []), do: Context.start_trace(name, opts)

  # continue_trace/3 has a default argument — wrapper required
  @doc "Continues an existing trace from a W3C traceparent header."
  @spec continue_trace(String.t(), String.t(), keyword()) :: {:ok, context()} | {:error, term()}
  def continue_trace(name, traceparent, opts \\ []),
    do: Context.continue_trace(name, traceparent, opts)

  defdelegate current_context(), to: Context
  defdelegate set_context(ctx), to: Context
  defdelegate clear_context(), to: Context

  # ---------------------------------------------------------------------------
  # Span Management
  # ---------------------------------------------------------------------------

  # with_span has multiple clauses and a default argument — wrapper required
  @doc "Executes a function within a new child span, using options or a function."
  @spec with_span(context(), String.t(), keyword() | (-> term())) :: term()
  def with_span(ctx, name, opts_or_fun), do: Span.with_span(ctx, name, opts_or_fun, nil)
  @doc "Executes a function within a new child span with options and a function."
  @spec with_span(context(), String.t(), keyword(), (-> term())) :: term()
  def with_span(ctx, name, opts_or_fun, fun), do: Span.with_span(ctx, name, opts_or_fun, fun)

  # start_span/3 has a default argument — wrapper required
  @doc "Starts a new child span within the given trace context."
  @spec start_span(context(), String.t(), map()) :: {context(), span_id()}
  def start_span(ctx, name, attributes \\ %{}), do: Span.start_span(ctx, name, attributes)

  # end_span/3 has a default argument — wrapper required
  @doc "Ends a span within the given trace context with an optional status."
  @spec end_span(context(), span_id(), :ok | :error) :: context()
  def end_span(ctx, span_id, status \\ :ok), do: Span.end_span(ctx, span_id, status)

  # add_attributes has a non-trailing default — wrapper required
  @doc "Adds attributes to the current span in the trace context."
  @spec add_attributes(context(), map()) :: context()
  def add_attributes(ctx, attributes) when is_map(attributes),
    do: Span.add_attributes(ctx, nil, attributes)
  @doc "Adds attributes to a specific span by span ID in the trace context."
  @spec add_attributes(context(), span_id(), map()) :: context()
  def add_attributes(ctx, span_id, attributes),
    do: Span.add_attributes(ctx, span_id, attributes)

  # add_event/3 has a default argument — wrapper required
  @doc "Adds a named event with attributes to the current span."
  @spec add_event(context(), String.t(), map()) :: context()
  def add_event(ctx, name, attributes \\ %{}), do: Span.add_event(ctx, name, attributes)

  # record_error has non-trailing defaults — wrapper required
  @doc "Records an error on the current span in the trace context."
  @spec record_error(context(), term()) :: context()
  def record_error(ctx, error), do: Span.record_error(ctx, nil, error, [])
  @doc "Records an error on a specific span in the trace context."
  @spec record_error(context(), span_id() | nil, term()) :: context()
  def record_error(ctx, span_id, error), do: Span.record_error(ctx, span_id, error, [])
  @doc "Records an error with stacktrace on a specific span in the trace context."
  @spec record_error(context(), span_id() | nil, term(), Exception.stacktrace()) :: context()
  def record_error(ctx, span_id, error, stacktrace),
    do: Span.record_error(ctx, span_id, error, stacktrace)

  # ---------------------------------------------------------------------------
  # Context Propagation
  # ---------------------------------------------------------------------------

  defdelegate traceparent(ctx), to: Context
  defdelegate parse_traceparent(header), to: Context
  defdelegate set_baggage(ctx, key, value), to: Context
  defdelegate get_baggage(ctx, key), to: Context

  # ---------------------------------------------------------------------------
  # Sampling
  # ---------------------------------------------------------------------------

  defdelegate sampled?(ctx), to: Context

  # should_sample?/1 has a default argument — wrapper required
  @doc "Determines whether the current request should be sampled for tracing."
  @spec should_sample?(keyword()) :: boolean()
  def should_sample?(opts \\ []), do: Context.should_sample?(opts)

  # ---------------------------------------------------------------------------
  # Export
  # ---------------------------------------------------------------------------

  defdelegate export_trace(ctx), to: Span
end
