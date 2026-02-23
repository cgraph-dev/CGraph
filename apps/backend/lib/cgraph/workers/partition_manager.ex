defmodule CGraph.Workers.PartitionManager do
  @moduledoc """
  Oban worker that ensures future message partitions exist.

  Runs daily via Oban cron. Creates monthly partitions 3 months ahead
  so new data always has a partition ready. This prevents the default
  partition from accumulating data.

  ## Schedule

  Configured in Oban cron config:

      {Oban, plugins: [
        {Oban.Plugins.Cron, crontab: [
          {"0 2 * * *", CGraph.Workers.PartitionManager}
        ]}
      ]}

  ## How it works

  1. Calculates the next 3 months from today
  2. Calls `create_messages_partition(date)` for each
  3. The SQL function is idempotent (IF NOT EXISTS)
  """

  use Oban.Worker,
    queue: :maintenance,
    max_attempts: 3,
    unique: [period: :infinity, states: [:available, :scheduled, :executing]]

  require Logger

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(_job) do
    today = Date.utc_today()

    # Create partitions for the next 3 months
    results =
      for offset <- 1..3 do
        date = Date.add(today, offset * 30)
        {year, month, _} = Date.to_erl(date)
        first_of_month = Date.new!(year, month, 1)

        case CGraph.Repo.query("SELECT create_messages_partition($1::date)", [first_of_month]) do
          {:ok, _} ->
            partition_name = "messages_#{year}_#{String.pad_leading(Integer.to_string(month), 2, "0")}"
            Logger.info("Ensured partition exists", partition: partition_name)
            {:ok, partition_name}

          {:error, reason} ->
            Logger.error("Failed to create partition",
              date: Date.to_iso8601(first_of_month),
              error: inspect(reason)
            )
            {:error, reason}
        end
      end

    errors = Enum.filter(results, &match?({:error, _}, &1))

    if errors == [] do
      :ok
    else
      {:error, "Failed to create #{length(errors)} partition(s)"}
    end
  end
end
