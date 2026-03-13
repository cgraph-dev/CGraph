defmodule CGraph.Workers.AMLScanWorker do
  @moduledoc """
  Daily AML scan worker.

  Runs at 5 AM UTC. Identifies users with significant transaction volume
  (>1000 total absolute amount in the last 7 days) and runs the AML pattern
  scanner against each.
  """
  use Oban.Worker, queue: :aml_scan, max_attempts: 3

  import Ecto.Query, warn: false

  alias CGraph.Repo
  alias CGraph.Nodes.NodeTransaction
  alias CGraph.Compliance.AMLMonitor

  require Logger

  @volume_threshold 1000

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("[AMLScanWorker] Starting daily AML scan...")

    seven_days_ago = DateTime.utc_now() |> DateTime.add(-7, :day)

    high_volume_users =
      from(t in NodeTransaction,
        where: t.inserted_at >= ^seven_days_ago,
        group_by: t.user_id,
        having: sum(fragment("ABS(?)", t.amount)) > ^@volume_threshold,
        select: t.user_id
      )
      |> Repo.all()

    scanned =
      Enum.reduce(high_volume_users, 0, fn user_id, acc ->
        case AMLMonitor.scan_user(user_id) do
          {:ok, _flags} -> acc + 1
        end
      end)

    Logger.info("[AMLScanWorker] Scanned #{scanned} users")
    :ok
  end
end
