defmodule CGraph.WorkerSupervisor do
  @moduledoc "Supervisor for background workers including Oban jobs, presence tracking, and WebRTC management."
  use Supervisor

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    children = [
      # Start Oban for background jobs
      {Oban, oban_config()},

      # Start Presence for online status tracking
      CGraph.Presence,

      # Start WebRTC call management
      CGraph.WebRTC,

      # Start sampled presence for large channels
      CGraph.Presence.Sampled,

      # Start Phoenix Presence for channel tracking
      CGraphWeb.Presence,

      # Start data export service
      CGraph.DataExport
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp oban_config do
    Application.fetch_env!(:cgraph, Oban)
  end
end
