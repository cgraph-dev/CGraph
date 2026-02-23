defmodule CGraph.WorkerSupervisor do
  @moduledoc "Supervisor for background workers including Oban jobs, presence tracking, and WebRTC management."
  use Supervisor

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  @spec init(keyword()) :: {:ok, {Supervisor.sup_flags(), [Supervisor.child_spec()]}}
  def init(_init_arg) do
    children = [
      # Task supervisor for fire-and-forget async work
      # Used by: application startup tasks, presence, request context cleanup
      {Task.Supervisor, name: CGraph.TaskSupervisor},

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
      CGraph.DataExport,

      # Service discovery and health monitoring
      CGraph.Services.Registry,

      # SLO enforcement (latency/error-rate budgets)
      CGraph.Performance.SLO,

      # Singleflight request deduplication
      CGraph.Performance.RequestCoalescing
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp oban_config do
    Application.fetch_env!(:cgraph, Oban)
  end
end
