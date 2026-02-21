defmodule CGraph.Metrics.Telemetry do
  @moduledoc """
  Telemetry event handlers for automatic metric collection.

  Attaches to Phoenix, Ecto, and Oban telemetry events and translates
  them into metric observations.
  """

  @doc """
  Handle a telemetry event and record metrics.

  Supports Phoenix endpoint, Ecto query, and Oban job events.
  """
  @spec handle_event(list(), map(), map(), map()) :: :ok
  def handle_event([:phoenix, :endpoint, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
    status = metadata[:conn].status || 0
    method = metadata[:conn].method
    path = normalize_path(metadata[:conn].request_path)

    CGraph.Metrics.increment(:http_requests_total, %{method: method, path: path, status: status})
    CGraph.Metrics.observe(:http_request_duration_ms, duration_ms, %{method: method, path: path})
  end

  def handle_event([:ecto, :repo, :query], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.total_time || 0, :native, :millisecond)
    source = metadata[:source] || "unknown"

    CGraph.Metrics.increment(:db_query_total, %{source: source})
    CGraph.Metrics.observe(:db_query_duration_ms, duration_ms, %{source: source})
  end

  def handle_event([:oban, :job, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
    worker = metadata[:job].worker
    state = metadata[:state] || :success

    CGraph.Metrics.increment(:job_executed_total, %{worker: worker, state: state})
    CGraph.Metrics.observe(:job_duration_ms, duration_ms, %{worker: worker})
  end

  def handle_event(_event, _measurements, _metadata, _config) do
    :ok
  end

  defp normalize_path(path) do
    path
    |> String.replace(~r/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, ":id")
    |> String.replace(~r/\/\d+/, "/:id")
  end
end
