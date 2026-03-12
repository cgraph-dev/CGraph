defmodule CGraph.Workers.ArchivalWorker do
  @moduledoc """
  Oban worker that runs archive policies on a monthly schedule.

  Iterates through all defined `ArchivePolicy` entries, batch-moves
  qualifying rows to their archive tables, and logs results.

  ## Scheduling

  Runs on the 1st of each month at 2 AM UTC:

      {"0 2 1 * *", CGraph.Workers.ArchivalWorker}

  ## Relationship to MessageArchivalWorker

  `MessageArchivalWorker` archives messages to **R2 cold storage** (object store).
  This worker archives rows to **Postgres archive tables** for queryable archival.
  Both can coexist — R2 archival is for disaster recovery / compliance,
  table archival is for keeping the live tables lean.
  """

  use Oban.Worker,
    queue: :archival,
    max_attempts: 3,
    priority: 3

  require Logger

  alias CGraph.Archival
  alias CGraph.Archival.ArchivePolicy

  @impl Oban.Worker
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  def perform(%Oban.Job{args: args}) do
    policies = resolve_policies(args)
    dry_run = Map.get(args, "dry_run", false)

    Logger.info("[ArchivalWorker] Starting with #{length(policies)} policies, dry_run=#{dry_run}")
    start = System.monotonic_time(:millisecond)

    results =
      Enum.map(policies, fn policy ->
        if dry_run do
          count = count_for_policy(policy)
          Logger.info("[ArchivalWorker] DRY RUN policy=#{policy.name} would_archive=#{count}")
          {policy.name, {:ok, 0}}
        else
          result = Archival.archive_by_policy(policy)
          {policy.name, result}
        end
      end)

    duration = System.monotonic_time(:millisecond) - start

    total_archived =
      Enum.reduce(results, 0, fn
        {_name, {:ok, n}}, acc -> acc + n
        _, acc -> acc
      end)

    failures =
      Enum.filter(results, fn
        {_name, {:error, _}} -> true
        _ -> false
      end)

    :telemetry.execute(
      [:cgraph, :archival, :worker],
      %{duration_ms: duration, total_archived: total_archived, failures: length(failures)},
      %{policies: Enum.map(policies, & &1.name)}
    )

    Logger.info(
      "[ArchivalWorker] Completed in #{duration}ms — archived=#{total_archived} failures=#{length(failures)}"
    )

    if failures == [] do
      :ok
    else
      # Log failures but don't retry the whole job — partial success is acceptable
      Enum.each(failures, fn {name, {:error, reason}} ->
        Logger.error("[ArchivalWorker] Policy=#{name} failed: #{inspect(reason)}")
      end)

      :ok
    end
  end

  # ── Helpers ───────────────────────────────────────────────────────────────

  defp resolve_policies(args) do
    case Map.get(args, "policies") do
      nil ->
        ArchivePolicy.default_policies()

      policy_names when is_list(policy_names) ->
        all = ArchivePolicy.default_policies()

        names =
          Enum.map(policy_names, fn name ->
            if is_binary(name), do: String.to_existing_atom(name), else: name
          end)

        Enum.filter(all, fn p -> p.name in names end)
    end
  end

  defp count_for_policy(policy) do
    cutoff = ArchivePolicy.cutoff(policy)

    sql = """
    SELECT COUNT(*) FROM #{policy.target_table}
    WHERE #{policy.timestamp_column} < $1
    """

    case Ecto.Adapters.SQL.query(CGraph.Repo, sql, [cutoff]) do
      {:ok, %{rows: [[count]]}} -> count
      _ -> 0
    end
  end
end
