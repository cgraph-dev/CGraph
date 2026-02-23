defmodule CGraph.Workers.LeaderboardWarm do
  @moduledoc """
  Periodic Oban worker that warms Redis leaderboard sorted sets from the database.

  Runs every 15 minutes to ensure Redis leaderboard data stays consistent
  with the PostgreSQL source of truth. Each category is warmed separately
  to distribute load.

  Schedule in config:
    {Oban, queues: [...], plugins: [
      {Oban.Plugins.Cron, crontab: [
        {"*/15 * * * *", CGraph.Workers.LeaderboardWarm}
      ]}
    ]}
  """

  use Oban.Worker,
    queue: :maintenance,
    max_attempts: 2,
    unique: [period: 600]

  require Logger

  alias CGraph.Gamification.Leaderboard

  @categories ~w(xp level streak karma messages posts)

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    category = Map.get(args, "category")

    categories = if category, do: [category], else: @categories

    Enum.each(categories, fn cat ->
      Logger.info("Warming leaderboard", category: cat)
      Leaderboard.warm_from_db(cat, 2000)
      Logger.info("Leaderboard warm complete", category: cat)
    end)

    :ok
  end
end
