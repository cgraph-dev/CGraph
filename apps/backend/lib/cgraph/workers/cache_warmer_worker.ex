defmodule CGraph.Workers.CacheWarmerWorker do
  @moduledoc """
  Oban worker that periodically refreshes hot cache data.

  Runs hourly via Oban Cron to keep the warm cache set up to date
  without waiting for cache misses to trigger individual fetches.

  ## Scheduling

  Add to the Oban Cron config:

      {"0 * * * *", CGraph.Workers.CacheWarmerWorker}
  """

  use Oban.Worker,
    queue: :default,
    max_attempts: 3,
    priority: 3

  require Logger

  alias CGraph.Cache.CacheWarmer

  @impl Oban.Worker
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  def perform(%Oban.Job{args: args}) do
    categories = Map.get(args, "categories", ["users", "conversations", "threads"])

    Logger.info("[CacheWarmerWorker] Starting periodic cache warming for: #{inspect(categories)}")
    start = System.monotonic_time(:millisecond)

    results =
      Enum.map(categories, fn category ->
        result = warm_category(category)
        {category, result}
      end)

    duration = System.monotonic_time(:millisecond) - start

    {succeeded, failed} =
      Enum.split_with(results, fn {_cat, result} -> match?({:ok, _}, result) end)

    total_warmed =
      Enum.reduce(succeeded, 0, fn {_cat, {:ok, n}}, acc -> acc + n end)

    :telemetry.execute(
      [:cgraph, :cache, :warmer, :periodic],
      %{duration_ms: duration, entries_warmed: total_warmed},
      %{categories: categories}
    )

    if failed == [] do
      Logger.info("[CacheWarmerWorker] Completed in #{duration}ms — #{total_warmed} entries warmed")
      :ok
    else
      failed_cats = Enum.map(failed, fn {cat, _} -> cat end)
      Logger.warning("[CacheWarmerWorker] Partial failure — failed categories: #{inspect(failed_cats)}")
      # Return :ok to avoid Oban retry for partial failures
      :ok
    end
  end

  # ── Category dispatch ─────────────────────────────────────────────────────

  defp warm_category("users"), do: CacheWarmer.warm_users()
  defp warm_category("conversations"), do: CacheWarmer.warm_conversations()
  defp warm_category("threads"), do: CacheWarmer.warm_threads()

  defp warm_category(unknown) do
    Logger.warning("[CacheWarmerWorker] Unknown category: #{unknown}")
    {:error, :unknown_category}
  end
end
