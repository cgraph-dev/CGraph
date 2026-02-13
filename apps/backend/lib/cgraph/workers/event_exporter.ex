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

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"event_id" => event_id, "format" => format}} = _job) do
    Logger.info("eventexporter_exporting_event_as", event_id: event_id, format: format)

    # TODO: Implement export
    # 1. Gather all event data
    # 2. Format according to requested format (csv, json, xlsx)
    # 3. Upload to storage
    # 4. Return download URL

    {:ok, %{download_url: nil, status: "not_implemented"}}
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
end
