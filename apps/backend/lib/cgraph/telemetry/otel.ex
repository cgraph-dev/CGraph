defmodule CGraph.Telemetry.OpenTelemetry do
  @moduledoc """
  OpenTelemetry configuration and setup for CGraph.

  ## Overview

  Configures distributed tracing using OpenTelemetry with auto-instrumentation
  for Phoenix, Ecto, and Oban. Also provides helpers for creating custom spans
  around E2EE operations, cache lookups, and WebSocket broadcasts.

  ## Architecture

  ```
  ┌────────────────────────────────────────────────────────────────┐
  │                 OpenTelemetry Pipeline                         │
  ├────────────────────────────────────────────────────────────────┤
  │                                                                │
  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
  │  │ Phoenix      │──▶│ OTel SDK     │──▶│ OTLP Exporter    │  │
  │  │ Ecto         │   │ (Spans)      │   │ (Tempo/Jaeger)   │  │
  │  │ Oban         │   └──────────────┘   └──────────────────┘  │
  │  └──────────────┘          │                                   │
  │                            ▼                                   │
  │  ┌──────────────┐   ┌──────────────┐                          │
  │  │ Custom Spans │──▶│ Sampler      │                          │
  │  │ (E2EE, WS)  │   │ (tail-based) │                          │
  │  └──────────────┘   └──────────────┘                          │
  └────────────────────────────────────────────────────────────────┘
  ```

  ## Configuration

  Set the following environment variables:

  | Variable               | Default                        | Description           |
  |------------------------|--------------------------------|-----------------------|
  | `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | OTLP endpoint         |
  | `OTEL_SAMPLE_RATE`     | `1.0`                          | Sample rate (0.0-1.0) |
  | `OTEL_SERVICE_NAME`    | `cgraph`                       | Service name          |
  """

  require Logger
  require OpenTelemetry.Tracer, as: Tracer

  @doc """
  Setup OpenTelemetry instrumentation.

  Call this from `Application.start/2` to configure auto-instrumentation
  for Phoenix requests, Ecto queries, and Oban jobs.
  """
  @spec setup() :: :ok
  def setup do
    Logger.info("[OpenTelemetry] Setting up distributed tracing...")

    # Auto-instrument Phoenix endpoints (creates spans for every HTTP request)
    OpentelemetryPhoenix.setup(adapter: :cowboy2)

    # Auto-instrument Ecto queries (creates spans for every DB query)
    OpentelemetryEcto.setup([:cgraph, :repo])

    # Auto-instrument Oban jobs (creates spans for every background job)
    OpentelemetryOban.setup()

    # Attach custom telemetry handlers for slow query warnings + business metrics
    setup_slow_query_alerts()
    setup_business_event_spans()

    Logger.info("[OpenTelemetry] Tracing configured successfully")
    :ok
  end

  @doc """
  Create a custom span for an operation using the real OpenTelemetry SDK.

  ## Examples

      OpenTelemetry.with_span("e2ee.encrypt_message", %{
        "message.conversation_id" => conv_id,
        "message.algorithm" => "X25519-XSalsa20-Poly1305"
      }, fn ->
        encrypt(message)
      end)
  """
  @spec with_span(String.t(), map(), (-> result)) :: result when result: term()
  def with_span(name, attributes \\ %{}, fun) when is_function(fun, 0) do
    # SECURITY: Use String.to_existing_atom to prevent atom exhaustion from external input.
    # OTel attribute keys should be predefined atoms; unknown keys are kept as strings.
    otel_attrs = Enum.map(attributes, fn {k, v} ->
      atom_key = try do
        String.to_existing_atom(k)
      rescue
        ArgumentError -> k
      end
      {atom_key, to_string(v)}
    end)

    Tracer.with_span name, %{attributes: otel_attrs} do
      try do
        result = fun.()
        Tracer.set_status(:ok, "")
        result
      rescue
        error ->
          Tracer.set_status(:error, Exception.message(error))

          Tracer.set_attributes([
            {:"error.type", inspect(error.__struct__)},
            {:"error.message", Exception.message(error)}
          ])

          reraise error, __STACKTRACE__
      end
    end
  end

  @doc """
  Record a span for a cache operation (hit/miss/error).
  """
  @spec cache_span(atom(), term(), (-> result)) :: result when result: term()
  def cache_span(operation, cache_key, fun) when is_function(fun, 0) do
    with_span("cache.#{operation}", %{
      "cache.key" => to_string(cache_key),
      "cache.operation" => to_string(operation)
    }, fun)
  end

  @doc """
  Record a span for a WebSocket broadcast.
  """
  @spec ws_broadcast_span(String.t(), String.t(), non_neg_integer(), (-> result)) :: result when result: term()
  def ws_broadcast_span(topic, event, payload_size, fun) when is_function(fun, 0) do
    with_span("websocket.broadcast", %{
      "ws.topic" => topic,
      "ws.event" => event,
      "ws.payload_bytes" => payload_size
    }, fun)
  end

  @doc """
  Record a span for E2EE operations (encrypt/decrypt/key_exchange).
  """
  @spec e2ee_span(atom(), map(), (-> result)) :: result when result: term()
  def e2ee_span(operation, attrs \\ %{}, fun) when is_function(fun, 0) do
    with_span("e2ee.#{operation}", Map.merge(%{
      "e2ee.operation" => to_string(operation),
      "e2ee.algorithm" => "X25519-XSalsa20-Poly1305"
    }, attrs), fun)
  end

  # ---------------------------------------------------------------------------
  # Slow Query Alerting (supplements OTel Ecto auto-instrumentation)
  # ---------------------------------------------------------------------------

  defp setup_slow_query_alerts do
    :telemetry.attach(
      "otel-slow-query-alert",
      [:cgraph, :repo, :query],
      &handle_slow_query/4,
      nil
    )
  end

  defp handle_slow_query([:cgraph, :repo, :query], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.total_time, :native, :millisecond)

    if duration_ms > 100 do
      Logger.warning(
        "[OTel] Slow query detected",
        source: metadata.source,
        query_time_ms: duration_ms,
        queue_time_ms:
          measurements.queue_time &&
            System.convert_time_unit(measurements.queue_time, :native, :millisecond)
      )
    end
  end

  # ---------------------------------------------------------------------------
  # Business Event Spans (Oban failures, custom span events)
  # ---------------------------------------------------------------------------

  defp setup_business_event_spans do
    :telemetry.attach(
      "otel-oban-failure-alert",
      [:oban, :job, :exception],
      &handle_oban_failure/4,
      nil
    )
  end

  defp handle_oban_failure([:oban, :job, :exception], _measurements, metadata, _config) do
    Logger.error(
      "[OTel] Oban job failed",
      worker: metadata.job.worker,
      queue: metadata.job.queue,
      attempt: metadata.job.attempt,
      error: inspect(metadata.reason)
    )
  end
end
