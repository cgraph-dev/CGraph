defmodule CGraphWeb.Plugs.TraceContext do
  @moduledoc """
  Plug for propagating W3C Trace Context headers and adding X-Trace-Id 
  response headers for frontend correlation.

  ## Overview

  This plug complements the existing `TracingPlug` by ensuring trace context
  is properly propagated in responses and stored in Logger metadata for
  structured logging correlation.

  ## Headers

  | Header          | Direction  | Description                          |
  |-----------------|-----------|--------------------------------------|
  | `traceparent`   | Request   | W3C Trace Context parent header      |
  | `tracestate`    | Request   | W3C vendor-specific trace state      |
  | `x-trace-id`    | Response  | Trace ID for frontend error tracking |
  | `x-request-id`  | Response  | Request ID (Phoenix default)         |

  ## Usage

  Add to your router pipeline:

      pipeline :api do
        plug CGraphWeb.Plugs.TraceContext
      end

  Frontend can read `X-Trace-Id` from response headers to correlate
  errors and performance traces with backend spans.
  """

  @behaviour Plug

  import Plug.Conn
  require Logger

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, _opts) do
    trace_id = extract_or_generate_trace_id(conn)
    span_id = generate_span_id()

    # Store in process dictionary for Logger metadata
    Logger.metadata(
      trace_id: trace_id,
      span_id: span_id,
      request_path: conn.request_path,
      request_method: conn.method
    )

    # Store in conn assigns for downstream access
    conn
    |> assign(:trace_id, trace_id)
    |> assign(:span_id, span_id)
    |> put_resp_header("x-trace-id", trace_id)
    |> register_before_send(&add_trace_metadata/1)
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp extract_or_generate_trace_id(conn) do
    case get_req_header(conn, "traceparent") do
      [traceparent | _] ->
        parse_traceparent(traceparent)

      _ ->
        # Check for x-trace-id from frontend
        case get_req_header(conn, "x-trace-id") do
          [trace_id | _] -> trace_id
          _ -> generate_trace_id()
        end
    end
  end

  # Parse W3C traceparent: version-trace_id-parent_id-trace_flags
  # Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
  defp parse_traceparent(traceparent) do
    case String.split(traceparent, "-") do
      [_version, trace_id, _parent_id, _flags] when byte_size(trace_id) == 32 ->
        trace_id

      _ ->
        generate_trace_id()
    end
  end

  defp generate_trace_id do
    :crypto.strong_rand_bytes(16) |> Base.encode16(case: :lower)
  end

  defp generate_span_id do
    :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
  end

  defp add_trace_metadata(conn) do
    # Add response metadata to Logger
    duration = if start_time = conn.assigns[:request_start_time] do
      System.monotonic_time(:microsecond) - start_time
    end

    Logger.metadata(
      status: conn.status,
      duration_us: duration || 0
    )

    conn
  end
end
