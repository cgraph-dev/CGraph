defmodule CGraph.Workers.DeadLetterWorker do
  @moduledoc """
  Dead letter queue worker for permanently failed jobs.

  Jobs that exceed their max_attempts in the orchestrator are moved here
  for auditing, alerting, and optional retry. Dead letter jobs are stored
  with their original worker, args, queue, and failure reason.
  """
  use Oban.Worker,
    queue: :dead_letter,
    max_attempts: 1,
    priority: 3

  require Logger

  @doc "Processes a dead-lettered job by logging it for observability."
  @impl Oban.Worker
  @spec perform(Oban.Job.t()) :: :ok
  def perform(%Oban.Job{args: args}) do
    Logger.warning("dead_letter_received",
      original_worker: args["original_worker"],
      original_queue: args["original_queue"],
      failure_reason: args["failure_reason"],
      failed_at: args["failed_at"]
    )

    :telemetry.execute(
      [:cgraph, :workers, :dead_letter],
      %{count: 1},
      %{
        worker: args["original_worker"],
        queue: args["original_queue"],
        reason: args["failure_reason"]
      }
    )

    :ok
  end
end
