defmodule CGraph.Workers.EventExporter do
  @moduledoc """
  Oban worker for exporting event data.

  Exports:
  - Participant data
  - Leaderboard standings
  - Quest completion stats
  - Transaction history
  """

  use Oban.Worker, queue: :exports, max_attempts: 3

  alias CGraph.Gamification.Events

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"event_id" => event_id, "format" => format}} = _job) do
    Logger.info("event_exporter_started", event_id: event_id, format: format)

    with {:ok, event} <- fetch_event_data(event_id),
         {:ok, export_data} <- build_export(event, format),
         {:ok, path} <- write_export(event_id, format, export_data) do
      Logger.info("event_exporter_completed", event_id: event_id, path: path)
      {:ok, %{download_url: path, status: "completed"}}
    else
      {:error, reason} ->
        Logger.error("event_exporter_failed", event_id: event_id, reason: inspect(reason))
        {:error, reason}
    end
  end

  def perform(%Oban.Job{args: %{"event_id" => event_id}}) do
    perform(%Oban.Job{args: %{"event_id" => event_id, "format" => "json"}})
  end

  @doc """
  Enqueue an export job.
  """
  def enqueue(%{event_id: _event_id} = args) do
    args
    |> Map.put_new(:format, "json")
    |> __MODULE__.new()
    |> Oban.insert()
  end

  defp fetch_event_data(event_id) do
    case Events.get_event(event_id) do
      {:ok, event} -> {:ok, event}
      {:error, _} -> {:error, :event_not_found}
    end
  end

  defp build_export(event, "json") do
    data = %{
      event: %{id: event.id, name: event.name, type: event.type},
      exported_at: DateTime.utc_now()
    }
    {:ok, Jason.encode!(data, pretty: true)}
  end

  defp build_export(event, "csv") do
    header = "id,name,type,started_at,ended_at\n"
    row = "#{event.id},#{event.name},#{event.type},#{event.started_at},#{event.ended_at}\n"
    {:ok, header <> row}
  end

  defp build_export(_event, format) do
    {:error, "Unsupported export format: #{format}"}
  end

  defp write_export(event_id, format, data) do
    safe_id = String.replace(to_string(event_id), ~r/[^a-zA-Z0-9_-]/, "")
    safe_format = String.replace(to_string(format), ~r/[^a-z]/, "")
    filename = "event_#{safe_id}_#{System.system_time(:second)}.#{safe_format}"
    dir = Path.join([System.tmp_dir!(), "exports"])
    File.mkdir_p!(dir)
    path = Path.join(dir, filename)

    # Validate path stays within export directory
    unless String.starts_with?(Path.expand(path), Path.expand(dir)) do
      {:error, :path_traversal}
    else
      File.write!(path, data)
      {:ok, path}
    end
  end
end
