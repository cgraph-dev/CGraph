defmodule CGraph.Workers.BoostExpirationWorker do
  @moduledoc """
  Oban worker that expires active boosts whose duration has elapsed.
  Runs hourly via cron in the :maintenance queue.
  Calls existing CGraph.Boosts.expire_boosts/0.
  """

  use Oban.Worker,
    queue: :maintenance,
    max_attempts: 3

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    Logger.info("[BoostExpirationWorker] Starting boost expiration check")

    case CGraph.Boosts.expire_boosts() do
      {:ok, count} ->
        Logger.info("[BoostExpirationWorker] Expired #{count} boosts")
        :ok

      result ->
        Logger.info("[BoostExpirationWorker] Result: #{inspect(result)}")
        :ok
    end
  end
end
