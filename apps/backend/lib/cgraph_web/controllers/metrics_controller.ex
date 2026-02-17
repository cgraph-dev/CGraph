defmodule CGraphWeb.MetricsController do
  @moduledoc """
  Exposes application metrics in Prometheus text format.

  Combines metrics from two sources:
  1. `CGraph.Metrics` — custom GenServer-based counters/gauges/histograms
  2. `TelemetryMetricsPrometheus.Core` — automatic Telemetry.Metrics definitions
  """

  use CGraphWeb, :controller

  def index(conn, _params) do
    # Custom metrics from CGraph.Metrics GenServer
    custom_metrics = CGraph.Metrics.export(:prometheus)

    # Telemetry-based metrics from TelemetryMetricsPrometheus.Core
    telemetry_metrics =
      try do
        TelemetryMetricsPrometheus.Core.scrape(:cgraph_prometheus_metrics)
      rescue
        _ -> ""
      end

    combined = custom_metrics <> "\n" <> telemetry_metrics

    conn
    |> put_resp_content_type("text/plain; version=0.0.4; charset=utf-8")
    |> send_resp(200, combined)
  end
end
