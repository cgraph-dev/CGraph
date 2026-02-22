defmodule CGraph.Tracing.Span do
  @moduledoc """
  Span management and trace export.

  Provides operations for creating, managing, and ending spans within
  a distributed trace, as well as exporting trace data.
  """

  alias CGraph.Tracing.Context

  # ---------------------------------------------------------------------------
  # Span Management
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

  # Handle case where ctx is a string (treat as name with auto-context)
  def with_span(name, _name2, attributes, fun)
      when is_binary(name) and is_map(attributes) and is_function(fun, 0) do
    {:ok, ctx} = Context.start_trace(name)
    with_span(ctx, name, attributes, fun)
  end

  # Handle {:ok, ctx} tuple (unwrap automatically)
  def with_span({:ok, ctx}, name, opts_or_fun, fun_or_nil) when is_map(ctx) do
    with_span(ctx, name, opts_or_fun, fun_or_nil)
  end

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
  @spec start_span(map(), String.t(), map()) :: {map(), map()}
  def start_span(ctx, name, attributes \\ %{}) do
    span_id = Context.generate_span_id()
    parent_span_id = ctx.span_id

    span = Context.create_span(name, span_id, parent_span_id, attributes)

    new_ctx = %{ctx |
      span_id: span_id,
      spans: [span | ctx.spans]
    }

    Context.set_context(new_ctx)
    Context.emit_span_start(name, new_ctx)

    {span, new_ctx}
  end

  @doc """
  End a span.
  """
  @spec end_span(map(), String.t(), :ok | :error) :: map()
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
    Context.set_context(new_ctx)

    span = Enum.find(spans, &(&1.span_id == span_id))
    if span, do: emit_span_end(span, new_ctx)

    new_ctx
  end

  @doc """
  Add attributes to the current span.
  """
  @spec add_attributes(map(), String.t() | nil, map()) :: map()
  def add_attributes(ctx, span_id, attributes) do
    target_span_id = span_id || ctx.span_id

    spans = Enum.map(ctx.spans, fn span ->
      if span.span_id == target_span_id do
        %{span | attributes: Map.merge(span.attributes, attributes)}
      else
        span
      end
    end)

    new_ctx = %{ctx | spans: spans}
    Context.set_context(new_ctx)
    new_ctx
  end

  @doc """
  Add an event to the current span.

  Events are timestamped markers within a span.
  """
  @spec add_event(map(), String.t(), map()) :: map()
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
    Context.set_context(new_ctx)
    new_ctx
  end

  @doc """
  Record an exception in the current span.
  """
  @spec record_error(map(), String.t() | nil, term(), list()) :: map()
  def record_error(ctx, span_id, error, stacktrace) do
    _target_span_id = span_id || ctx.span_id

    error_attrs = %{
      "exception.type" => error_type(error),
      "exception.message" => error_message(error),
      "exception.stacktrace" => Exception.format_stacktrace(stacktrace)
    }

    add_event(ctx, "exception", error_attrs)
  end

  # ---------------------------------------------------------------------------
  # Export
  # ---------------------------------------------------------------------------

  @doc """
  Export trace data for external systems.

  Returns spans in a format compatible with Jaeger/Zipkin.
  """
  @spec export_trace(map()) :: map()
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
  # Private
  # ---------------------------------------------------------------------------

  defp error_type(%{__struct__: struct}), do: to_string(struct)
  defp error_type({kind, _}), do: to_string(kind)
  defp error_type(error), do: inspect(error)

  defp error_message(%{message: msg}), do: msg
  defp error_message({_, reason}), do: inspect(reason)
  defp error_message(error), do: inspect(error)

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
