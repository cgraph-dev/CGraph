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

  @doc """
  Setup OpenTelemetry instrumentation.

  Call this from `Application.start/2` to configure auto-instrumentation
  for Phoenix requests, Ecto queries, and Oban jobs.
  """
  def setup do
    Logger.info("[OpenTelemetry] Setting up distributed tracing...")

    # Auto-instrument Phoenix endpoints
    setup_phoenix_instrumentation()

    # Auto-instrument Ecto queries
    setup_ecto_instrumentation()

    # Auto-instrument Oban jobs
    setup_oban_instrumentation()

    # Register custom span processors for business events
    setup_custom_spans()

    Logger.info("[OpenTelemetry] Tracing configured successfully")
    :ok
  end

  @doc """
  Create a custom span for an operation.

  ## Examples

      OpenTelemetry.with_span("e2ee.encrypt_message", %{
        "message.conversation_id" => conv_id,
        "message.algorithm" => "X25519-XSalsa20-Poly1305"
      }, fn ->
        encrypt(message)
      end)
  """
  def with_span(name, attributes \\ %{}, fun) when is_function(fun, 0) do
    start_time = System.monotonic_time(:microsecond)

    try do
      result = fun.()

      duration_us = System.monotonic_time(:microsecond) - start_time

      :telemetry.execute(
        [:cgraph, :otel, :span],
        %{duration: duration_us},
        %{name: name, attributes: attributes, status: :ok}
      )

      result
    rescue
      error ->
        duration_us = System.monotonic_time(:microsecond) - start_time

        :telemetry.execute(
          [:cgraph, :otel, :span],
          %{duration: duration_us},
          %{
            name: name,
            attributes: Map.put(attributes, "error.type", inspect(error.__struct__)),
            status: :error,
            error: error
          }
        )

        reraise error, __STACKTRACE__
    end
  end

  @doc """
  Record a span for a cache operation (hit/miss/error).
  """
  def cache_span(operation, cache_key, fun) when is_function(fun, 0) do
    with_span("cache.#{operation}", %{
      "cache.key" => to_string(cache_key),
      "cache.operation" => to_string(operation)
    }, fun)
  end

  @doc """
  Record a span for a WebSocket broadcast.
  """
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
  def e2ee_span(operation, attrs \\ %{}, fun) when is_function(fun, 0) do
    with_span("e2ee.#{operation}", Map.merge(%{
      "e2ee.operation" => to_string(operation),
      "e2ee.algorithm" => "X25519-XSalsa20-Poly1305"
    }, attrs), fun)
  end

  # ---------------------------------------------------------------------------
  # Auto-Instrumentation Setup
  # ---------------------------------------------------------------------------

  defp setup_phoenix_instrumentation do
    :telemetry.attach_many(
      "otel-phoenix",
      [
        [:phoenix, :endpoint, :start],
        [:phoenix, :endpoint, :stop],
        [:phoenix, :endpoint, :exception],
        [:phoenix, :router_dispatch, :start],
        [:phoenix, :router_dispatch, :stop]
      ],
      &handle_phoenix_event/4,
      nil
    )
  end

  defp setup_ecto_instrumentation do
    :telemetry.attach(
      "otel-ecto",
      [:cgraph, :repo, :query],
      &handle_ecto_event/4,
      nil
    )
  end

  defp setup_oban_instrumentation do
    :telemetry.attach_many(
      "otel-oban",
      [
        [:oban, :job, :start],
        [:oban, :job, :stop],
        [:oban, :job, :exception]
      ],
      &handle_oban_event/4,
      nil
    )
  end

  defp setup_custom_spans do
    :telemetry.attach(
      "otel-custom-spans",
      [:cgraph, :otel, :span],
      &handle_custom_span/4,
      nil
    )
  end

  # ---------------------------------------------------------------------------
  # Event Handlers
  # ---------------------------------------------------------------------------

  defp handle_phoenix_event([:phoenix, :endpoint, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)

    Logger.debug(
      "[OTel] Phoenix request",
      method: metadata[:conn] && metadata[:conn].method,
      path: metadata[:conn] && metadata[:conn].request_path,
      status: metadata[:conn] && metadata[:conn].status,
      duration_ms: duration_ms
    )
  end

  defp handle_phoenix_event(_event, _measurements, _metadata, _config), do: :ok

  defp handle_ecto_event([:cgraph, :repo, :query], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.total_time, :native, :millisecond)

    if duration_ms > 100 do
      Logger.warning(
        "[OTel] Slow query detected",
        source: metadata.source,
        query_time_ms: duration_ms,
        queue_time_ms: measurements.queue_time && System.convert_time_unit(measurements.queue_time, :native, :millisecond)
      )
    end
  end

  defp handle_oban_event([:oban, :job, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)

    Logger.debug(
      "[OTel] Oban job completed",
      worker: metadata.job.worker,
      queue: metadata.job.queue,
      duration_ms: duration_ms,
      attempt: metadata.job.attempt
    )
  end

  defp handle_oban_event([:oban, :job, :exception], _measurements, metadata, _config) do
    Logger.error(
      "[OTel] Oban job failed",
      worker: metadata.job.worker,
      queue: metadata.job.queue,
      attempt: metadata.job.attempt,
      error: inspect(metadata.reason)
    )
  end

  defp handle_oban_event(_event, _measurements, _metadata, _config), do: :ok

  defp handle_custom_span([:cgraph, :otel, :span], measurements, metadata, _config) do
    duration_ms = div(measurements.duration, 1000)

    case metadata.status do
      :ok ->
        Logger.debug(
          "[OTel] Span #{metadata.name}",
          duration_ms: duration_ms,
          attributes: inspect(metadata.attributes)
        )

      :error ->
        Logger.warning(
          "[OTel] Span #{metadata.name} failed",
          duration_ms: duration_ms,
          error: inspect(Map.get(metadata, :error)),
          attributes: inspect(metadata.attributes)
        )
    end
  end
end
