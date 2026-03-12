defmodule CGraph.Workers.ReputationRewardWorker do
  @moduledoc """
  Oban worker that checks and grants reputation-based node rewards.

  Runs daily at 4 AM UTC via cron. Queries users with recent activity
  (last 7 days) and checks milestone eligibility in batches of 100.

  Queue: `:reputation_rewards`
  """

  use Oban.Worker, queue: :reputation_rewards, max_attempts: 3

  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Accounts.User
  alias CGraph.Nodes.ReputationRewards

  require Logger

  @batch_size 100

  @impl Oban.Worker
  def perform(%Oban.Job{args: _args}) do
    Logger.info("[ReputationRewardWorker] Starting daily reputation reward check")

    cutoff = DateTime.add(DateTime.utc_now(), -7, :day)

    total_processed =
      from(u in User,
        where: u.last_active_at >= ^cutoff,
        select: u.id,
        order_by: [asc: u.id]
      )
      |> Repo.stream(max_rows: @batch_size)
      |> Stream.chunk_every(@batch_size)
      |> Enum.reduce(0, fn batch, acc ->
        Enum.each(batch, fn user_id ->
          case ReputationRewards.check_and_grant(user_id) do
            {:ok, []} -> :ok
            {:ok, granted} ->
              Logger.info("[ReputationRewardWorker] Granted #{length(granted)} milestones to user #{user_id}")
          end
        end)

        acc + length(batch)
      end)

    Logger.info("[ReputationRewardWorker] Processed #{total_processed} users")
    :ok
  end
end
