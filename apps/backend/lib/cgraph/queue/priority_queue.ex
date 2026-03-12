defmodule CGraph.Queue.PriorityQueue do
  @moduledoc """
  Priority queue wrapper around Oban for job prioritization.

  Provides four priority levels that map to Oban's numeric priorities:

  | Level      | Value | Use case                          |
  |------------|-------|-----------------------------------|
  | `:critical`| 0     | Security alerts, system failures  |
  | `:high`    | 1     | User-facing notifications         |
  | `:normal`  | 2     | Background processing (default)   |
  | `:low`     | 3     | Analytics, cleanup, reports       |

  ## Usage

      # Enqueue with priority
      PriorityQueue.enqueue(MyWorker, %{user_id: "123"}, :high)

      # Enqueue critical job
      PriorityQueue.enqueue(AlertWorker, %{msg: "disk full"}, :critical)

      # Default priority (normal)
      PriorityQueue.enqueue(DigestWorker, %{date: "2026-03-12"})

      # Enqueue with extra Oban options
      PriorityQueue.enqueue(CleanupWorker, %{}, :low, queue: :maintenance, scheduled_at: tomorrow)

  ## Telemetry

  - `[:cgraph, :queue, :enqueue]` — emitted on every enqueue with priority metadata
  """

  require Logger

  @type priority :: :critical | :high | :normal | :low
  @type worker :: module()

  @priority_map %{
    critical: 0,
    high: 1,
    normal: 2,
    low: 3
  }

  @valid_priorities Map.keys(@priority_map)

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Enqueue a job with a priority level.

  ## Parameters

  - `worker` — Oban.Worker module
  - `args` — Job arguments map
  - `priority` — One of `:critical`, `:high`, `:normal`, `:low` (default `:normal`)
  - `opts` — Additional Oban job options (queue, scheduled_at, unique, tags, etc.)

  ## Returns

  - `{:ok, %Oban.Job{}}` on success
  - `{:error, reason}` on failure
  """
  @spec enqueue(worker(), map(), priority(), keyword()) ::
          {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue(worker, args, priority \\ :normal, opts \\ [])

  def enqueue(worker, args, priority, opts) when priority in @valid_priorities do
    numeric_priority = Map.fetch!(@priority_map, priority)

    changeset =
      args
      |> worker.new(Keyword.merge(opts, priority: numeric_priority))

    emit_telemetry(:enqueue, %{
      worker: inspect(worker),
      priority: priority,
      numeric_priority: numeric_priority,
      queue: Keyword.get(opts, :queue, :default)
    })

    case Oban.insert(changeset) do
      {:ok, job} ->
        Logger.debug("priority_queue_enqueued",
          worker: inspect(worker),
          priority: priority,
          job_id: job.id
        )

        {:ok, job}

      {:error, reason} = error ->
        Logger.warning("priority_queue_enqueue_failed",
          worker: inspect(worker),
          priority: priority,
          reason: inspect(reason)
        )

        error
    end
  end

  def enqueue(_worker, _args, invalid_priority, _opts) do
    {:error, {:invalid_priority, invalid_priority, @valid_priorities}}
  end

  @doc """
  Enqueue multiple jobs at the same priority level atomically.

  Uses `Oban.insert_all/1` for efficient bulk insertion.
  """
  @spec enqueue_many(worker(), [map()], priority(), keyword()) ::
          {:ok, [Oban.Job.t()]} | {:error, term()}
  def enqueue_many(worker, args_list, priority \\ :normal, opts \\ [])
      when priority in @valid_priorities do
    numeric_priority = Map.fetch!(@priority_map, priority)
    merged_opts = Keyword.merge(opts, priority: numeric_priority)

    changesets = Enum.map(args_list, &worker.new(&1, merged_opts))

    jobs = Oban.insert_all(changesets)

    emit_telemetry(:enqueue_many, %{
      worker: inspect(worker),
      priority: priority,
      count: length(args_list)
    })

    {:ok, jobs}
  end

  @doc """
  Get the numeric Oban priority for a named level.
  """
  @spec priority_value(priority()) :: non_neg_integer()
  def priority_value(level) when level in @valid_priorities do
    Map.fetch!(@priority_map, level)
  end

  @doc """
  List valid priority levels.
  """
  @spec valid_priorities() :: [priority()]
  def valid_priorities, do: @valid_priorities

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp emit_telemetry(event, metadata) do
    :telemetry.execute(
      [:cgraph, :queue, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      metadata
    )
  end
end
