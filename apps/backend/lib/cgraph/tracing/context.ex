defmodule CGraph.Tracing.Context do
  @moduledoc """
  Trace context management, propagation, and sampling.

  Handles creating and continuing traces, managing the process-dictionary-backed
  trace context, W3C Trace Context header generation/parsing, baggage propagation,
  and sampling decisions.
  """

  require Logger

  # Trace flags
  @flag_sampled 0x01

  # Process dictionary key for context
  @context_key :cgraph_trace_context

  # ---------------------------------------------------------------------------
  # Context Management
  # ---------------------------------------------------------------------------

  @doc """
  Start a new trace.

  Creates a new trace with a root span. Use this for incoming requests
  that don't have existing trace context.

  ## Options

  - `:sampled` - Whether to sample this trace (default: true)
  - `:attributes` - Initial span attributes
  """
  @spec start_trace(String.t(), keyword()) :: {:ok, map()}
  def start_trace(name, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
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

    set_context(ctx)
    emit_span_start(name, ctx)

    {:ok, ctx}
  end

  @doc """
  Continue a trace from incoming headers.

  Parses W3C traceparent header and continues the trace.
  """
  @spec continue_trace(String.t(), String.t(), keyword()) :: {:ok, map()}
  def continue_trace(name, traceparent, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts

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
        start_trace(name, opts)
    end
  end

  @doc """
  Get the current trace context from process dictionary.
  """
  @spec current_context() :: map() | nil
  def current_context do
    Process.get(@context_key)
  end

  @doc """
  Set the trace context in process dictionary.
  """
  @spec set_context(map()) :: map()
  def set_context(ctx) do
    Process.put(@context_key, ctx)
    ctx
  end

  @doc """
  Clear the trace context from process dictionary.
  """
  @spec clear_context() :: map() | nil
  def clear_context do
    Process.delete(@context_key)
  end

  # ---------------------------------------------------------------------------
  # Context Propagation
  # ---------------------------------------------------------------------------

  @doc """
  Generate traceparent header for outgoing requests.

  Returns W3C Trace Context compliant header value.
  """
  @spec traceparent(map() | {:ok, map()}) :: String.t()
  def traceparent({:ok, ctx}), do: traceparent(ctx)

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
  @spec parse_traceparent(String.t() | term()) :: {:ok, String.t(), String.t(), non_neg_integer()} | :error
  def parse_traceparent(header) when is_binary(header) do
    case String.split(header, "-") do
      ["00", trace_id, parent_id, flags]
      when byte_size(trace_id) == 32 and byte_size(parent_id) == 16 ->
        case Integer.parse(flags, 16) do
          {trace_flags, ""} -> {:ok, trace_id, parent_id, trace_flags}
          _ -> :error
        end

      _ ->
        :error
    end
  end

  def parse_traceparent(_), do: :error

  @doc """
  Set baggage (cross-cutting data propagated with trace).
  """
  @spec set_baggage(map(), String.t(), term()) :: map()
  def set_baggage(ctx, key, value) do
    baggage = Map.put(ctx.baggage, key, value)
    new_ctx = %{ctx | baggage: baggage}
    set_context(new_ctx)
    new_ctx
  end

  @doc """
  Get baggage value.
  """
  @spec get_baggage(map(), String.t()) :: term() | nil
  def get_baggage(ctx, key) do
    Map.get(ctx.baggage, key)
  end

  # ---------------------------------------------------------------------------
  # Sampling
  # ---------------------------------------------------------------------------

  @doc """
  Check if the current trace is sampled.
  """
  @spec sampled?(map()) :: boolean()
  def sampled?(ctx) do
    Bitwise.band(ctx.trace_flags, @flag_sampled) == @flag_sampled
  end

  @doc """
  Determine if a new trace should be sampled.

  Uses configurable sampling strategy.
  """
  @spec should_sample?(keyword()) :: boolean()
  def should_sample?(opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    strategy = Keyword.get(opts, :strategy, :always)
    rate = Keyword.get(opts, :rate, 1.0)

    case strategy do
      :always -> true
      :never -> false
      :probabilistic -> :rand.uniform() < rate
      :rate_limiting -> check_rate_limit()
    end
  end

  # ---------------------------------------------------------------------------
  # Shared helpers (public for Span module)
  # ---------------------------------------------------------------------------

  @doc false
  @spec generate_span_id() :: String.t()
  def generate_span_id do
    :crypto.strong_rand_bytes(8)
    |> Base.encode16(case: :lower)
  end

  @doc false
  @spec create_span(String.t(), String.t(), String.t() | nil, map()) :: map()
  def create_span(name, span_id, parent_span_id, attributes) do
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

  @doc false
  @spec emit_span_start(String.t(), map()) :: :ok
  def emit_span_start(name, ctx) do
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

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp generate_trace_id do
    :crypto.strong_rand_bytes(16)
    |> Base.encode16(case: :lower)
  end

  defp add_span_to_context(ctx, span) do
    %{ctx | spans: [span | ctx.spans]}
  end

  defp check_rate_limit do
    # Would implement token bucket or sliding window
    true
  end
end
