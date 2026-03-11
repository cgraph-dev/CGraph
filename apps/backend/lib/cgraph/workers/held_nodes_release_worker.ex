defmodule CGraph.Workers.HeldNodesReleaseWorker do
  @moduledoc """
  Daily Oban worker that releases held nodes (21+ days) to available balance.

  Delegates to `CGraph.Nodes.release_held_nodes/0` which atomically moves
  pending balances to available and clears hold_until timestamps.

  Scheduled: 03:00 UTC daily via Oban cron on the :payments queue.
  """
  use Oban.Worker, queue: :payments, max_attempts: 5

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    {:ok, count} = CGraph.Nodes.release_held_nodes()

    :telemetry.execute([:cgraph, :nodes, :hold_released], %{count: count}, %{})

    :ok
  end
end
