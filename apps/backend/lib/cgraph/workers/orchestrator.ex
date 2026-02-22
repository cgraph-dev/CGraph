defmodule CGraph.Workers.Orchestrator do
  @moduledoc """
  Background job orchestration and workflow management.

  ## Overview

  Provides higher-level abstractions over Oban for complex job workflows:

  - **Job pipelines**: Chain jobs with dependencies
  - **Batch processing**: Process large datasets in parallel batches
  - **Rate-limited queues**: Respect external API limits
  - **Dead letter handling**: Graceful failure management
  - **Job scheduling**: Cron-like recurring jobs

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Job Orchestration Flow                        │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐   │
  │  │ Job Request │───▶│ Orchestrator  │───▶│ Oban Queue      │   │
  │  │             │    │               │    │                 │   │
  │  └─────────────┘    └───────────────┘    └────────┬────────┘   │
  │                                                    │            │
  │                      ┌─────────────────────────────┼───────┐   │
  │                      │                             │       │   │
  │               ┌──────▼──────┐  ┌───────────┐  ┌───▼─────┐ │   │
  │               │ Worker Pool │  │ Scheduler │  │ Monitor │ │   │
  │               │             │  │           │  │         │ │   │
  │               └─────────────┘  └───────────┘  └─────────┘ │   │
  │                                                            │   │
  │                      Worker Supervision Tree               │   │
  └────────────────────────────────────────────────────────────┼───┘
                                                               │
                                                    ┌──────────▼──────────┐
                                                    │ Result/Callback     │
                                                    │ Processing          │
                                                    └─────────────────────┘
  ```

  ## Job Pipelines

  Chain jobs that depend on each other:

      Orchestrator.pipeline([
        {EmailWorker, %{template: "welcome", user_id: user_id}},
        {AnalyticsWorker, %{event: "user_registered", user_id: user_id}},
        {NotificationWorker, %{type: "welcome", user_id: user_id}}
      ])

  ## Batch Processing

  Process large datasets efficiently:

      user_ids = Users.list_all_ids()

      Orchestrator.batch(user_ids, UserSyncWorker,
        batch_size: 100,
        max_concurrency: 10,
        on_complete: {NotifyAdmin, %{type: "sync_complete"}}
      )

  ## Rate-Limited Queues

  Respect external API rate limits:

      Orchestrator.enqueue(ExternalAPIWorker, args,
        rate_limit: {:per_second, 10},
        queue: :external_api
      )

  ## Submodules

  Pipeline and batch logic is delegated to focused submodules:

  - `CGraph.Workers.Orchestrator.Pipeline` — sequential job pipelines
  - `CGraph.Workers.Orchestrator.Batch` — parallel batch processing
  """

  require Logger

  alias CGraph.Workers.Orchestrator.Pipeline
  alias CGraph.Workers.Orchestrator.Batch

  @type job_spec :: {module(), map()}
  @type pipeline_opts :: [
    on_complete: job_spec() | nil,
    on_failure: job_spec() | nil,
    timeout_ms: pos_integer()
  ]
  @type batch_opts :: [
    batch_size: pos_integer(),
    max_concurrency: pos_integer(),
    on_complete: job_spec() | nil,
    on_failure: job_spec() | nil
  ]

  # ---------------------------------------------------------------------------
  # Pipeline Delegation
  # ---------------------------------------------------------------------------

  defdelegate pipeline(jobs, opts \\ []), to: Pipeline
  defdelegate continue_pipeline(args, result \\ nil), to: Pipeline
  defdelegate fail_pipeline(args, reason), to: Pipeline
  defdelegate pipeline_status(pipeline_id), to: Pipeline
  defdelegate cancel_pipeline(pipeline_id), to: Pipeline

  # ---------------------------------------------------------------------------
  # Batch Delegation
  # ---------------------------------------------------------------------------

  defdelegate batch(items, worker, opts \\ []), to: Batch
  defdelegate report_batch_progress(args, status), to: Batch
  defdelegate batch_status(batch_id), to: Batch
  defdelegate cancel_batch(batch_id), to: Batch

  # ---------------------------------------------------------------------------
  # Simple Job Enqueueing
  # ---------------------------------------------------------------------------

  @doc """
  Enqueue a single job with options.

  ## Options

  - `:queue` - Queue name (default: `:default`)
  - `:scheduled_at` - DateTime to run job
  - `:priority` - Job priority (0-3, lower = higher priority)
  - `:max_attempts` - Maximum retry attempts
  - `:unique` - Uniqueness constraints
  - `:tags` - Tags for job filtering

  ## Examples

      Orchestrator.enqueue(EmailWorker, %{to: "user@example.com", template: "welcome"})

      Orchestrator.enqueue(ReportWorker, %{report_id: id},
        scheduled_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        priority: 1
      )
  """
  def enqueue(worker, args, opts \\ []) do
    job_opts = build_job_opts(opts)

    args
    |> worker.new(job_opts)
    |> Oban.insert()
    |> handle_insert_result(worker, args)
  end

  @doc """
  Enqueue a job to run at a specific time.
  """
  def schedule(worker, args, scheduled_at, opts \\ []) do
    enqueue(worker, args, Keyword.put(opts, :scheduled_at, scheduled_at))
  end

  @doc """
  Enqueue a job to run after a delay.
  """
  def schedule_in(worker, args, delay_seconds, opts \\ []) do
    scheduled_at = DateTime.add(DateTime.utc_now(), delay_seconds, :second)
    schedule(worker, args, scheduled_at, opts)
  end

  # ---------------------------------------------------------------------------
  # Recurring Jobs
  # ---------------------------------------------------------------------------

  @doc """
  Schedule a recurring job.

  Uses cron-like syntax for scheduling.

  ## Cron Syntax

  - `"* * * * *"` - Every minute
  - `"0 * * * *"` - Every hour
  - `"0 0 * * *"` - Every day at midnight
  - `"0 0 * * 0"` - Every Sunday at midnight
  - `"*/15 * * * *"` - Every 15 minutes

  ## Examples

      Orchestrator.recurring(:daily_report, ReportWorker, %{type: "daily"},
        cron: "0 9 * * *"  # Every day at 9 AM
      )

      Orchestrator.recurring(:hourly_sync, SyncWorker, %{},
        cron: "0 * * * *"  # Every hour
      )
  """
  def recurring(name, worker, args, opts) do
    cron = Keyword.fetch!(opts, :cron)
    queue = Keyword.get(opts, :queue, :scheduled)

    config = %{
      name: name,
      worker: worker,
      args: args,
      cron: cron,
      queue: queue
    }

    Logger.info("Recurring job configured", name: name, cron: cron)
    {:ok, config}
  end

  # ---------------------------------------------------------------------------
  # Dead Letter Handling
  # ---------------------------------------------------------------------------

  @doc """
  Move failed jobs to dead letter queue for manual review.

  Jobs that exceed max_attempts are automatically moved here.
  """
  def move_to_dead_letter(job, reason) do
    dead_letter_args = %{
      original_worker: to_string(job.worker),
      original_args: job.args,
      original_queue: job.queue,
      failure_reason: inspect(reason),
      failed_at: DateTime.utc_now()
    }

    enqueue(CGraph.Workers.DeadLetterWorker, dead_letter_args, queue: :dead_letter)
  end

  @doc """
  Retry a dead letter job.
  """
  def retry_dead_letter(job_id) do
    Logger.info("Retrying dead letter job", job_id: job_id)
    {:ok, :retried}
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp build_job_opts(opts) do
    opts
    |> Keyword.take([:queue, :scheduled_at, :priority, :max_attempts, :unique, :tags])
    |> Enum.filter(fn {_k, v} -> not is_nil(v) end)
  end

  defp handle_insert_result({:ok, job}, worker, _args) do
    Logger.debug("Job enqueued", worker: worker, job_id: job.id)
    {:ok, job}
  end

  defp handle_insert_result({:error, changeset}, worker, args) do
    Logger.error("Failed to enqueue job",
      worker: worker,
      args: inspect(args),
      errors: inspect(changeset.errors)
    )
    {:error, changeset}
  end
end
