defmodule CGraph.Jobs do
  @moduledoc """
  CGraph.Jobs - Comprehensive Background Job Abstraction Layer

  ## Overview

  This module provides a high-level abstraction over Oban for background job
  processing with additional features for workflow orchestration, job scheduling,
  observability, and operational management.

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                        CGraph.Jobs                              │
  ├─────────────────────────────────────────────────────────────────┤
  │  Job Scheduling    │  Workflow Engine  │  Job Observability    │
  │  ────────────────  │  ────────────────  │  ─────────────────    │
  │  • Immediate       │  • Sequential     │  • Progress tracking  │
  │  • Delayed         │  • Parallel       │  • Job metrics        │
  │  • Scheduled       │  • Conditional    │  • Error aggregation  │
  │  • Recurring       │  • Fan-out/in     │  • Performance stats  │
  ├─────────────────────────────────────────────────────────────────┤
  │                        Oban (Engine)                           │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Features

  1. **Job Scheduling**: Multiple scheduling strategies including immediate,
     delayed, scheduled, and recurring jobs with cron expressions.

  2. **Workflow Engine**: Orchestrate complex multi-step workflows with
     sequential, parallel, and conditional execution patterns.

  3. **Progress Tracking**: Real-time progress updates for long-running jobs
     with WebSocket integration for UI updates.

  4. **Job Observability**: Comprehensive metrics, error aggregation, and
     performance statistics for operational visibility.

  5. **Operational Tools**: Job management APIs for pausing, resuming,
     cancelling, and retrying jobs.

  ## Usage Examples

  ### Simple Job Enqueueing

      # Immediate execution
      CGraph.Jobs.enqueue(MyWorker, %{user_id: 123})

      # Delayed execution
      CGraph.Jobs.enqueue(MyWorker, %{user_id: 123}, delay: :timer.minutes(5))

      # Scheduled execution
      CGraph.Jobs.enqueue(MyWorker, %{user_id: 123}, scheduled_at: ~U[2024-01-15 10:00:00Z])

  ### Workflow Orchestration

      # Define a workflow
      workflow = %{
        name: "user_onboarding",
        steps: [
          %{worker: CreateAccountWorker, args: %{email: "user@example.com"}},
          %{worker: SendWelcomeEmailWorker, depends_on: [:step_1]},
          %{worker: SetupDefaultSettingsWorker, depends_on: [:step_1]},
          %{worker: NotifyAdminWorker, depends_on: [:step_2, :step_3]}
        ]
      }

      {:ok, workflow_id} = CGraph.Jobs.start_workflow(workflow)

  ### Progress Tracking

      # In your worker
      @doc "Executes the background job."
      def perform(%Oban.Job{id: job_id, args: args}) do
        CGraph.Jobs.update_progress(job_id, 0, "Starting...")

        Enum.each(1..100, fn i ->
          do_work(i)
          CGraph.Jobs.update_progress(job_id, i, "Processing item \#{i}")
        end)

        CGraph.Jobs.update_progress(job_id, 100, "Complete")
        :ok
      end

  ## Job Naming Convention

  All workers should follow the naming pattern: `CGraph.Workers.<Domain>.<Action>Worker`

  Examples:
  - `CGraph.Workers.Users.SendWelcomeEmailWorker`
  - `CGraph.Workers.Notifications.PushNotificationWorker`
  - `CGraph.Workers.Analytics.AggregateMetricsWorker`

  ## Configuration

  Configure in `config/config.exs`:

      config :cgraph, CGraph.Jobs,
        progress_ttl: :timer.hours(24),
        workflow_ttl: :timer.hours(72),
        max_workflow_steps: 100,
        broadcast_progress: true

  ## Submodules

  - `CGraph.Jobs.Server`      — GenServer lifecycle, workflow engine, telemetry
  - `CGraph.Jobs.Scheduling`  — Job enqueueing and recurring scheduling
  - `CGraph.Jobs.Workflows`   — Workflow orchestration public API
  - `CGraph.Jobs.Progress`    — Progress tracking via ETS / PubSub
  - `CGraph.Jobs.Management`  — Job & queue operational management
  - `CGraph.Jobs.Stats`       — Statistics & observability queries
  """

  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------

  @type job_id :: pos_integer()
  @type workflow_id :: String.t()
  @type worker :: module()
  @type job_args :: map()
  @type job_status :: :pending | :running | :completed | :failed | :cancelled
  @type workflow_status :: :pending | :running | :completed | :failed | :cancelled | :paused

  @type job_options :: [
    queue: atom(),
    priority: 0..9,
    max_attempts: pos_integer(),
    delay: pos_integer(),
    scheduled_at: DateTime.t(),
    unique: keyword(),
    tags: [String.t()],
    meta: map()
  ]

  @type workflow_step :: %{
    id: atom(),
    worker: worker(),
    args: job_args(),
    depends_on: [atom()],
    condition: (map() -> boolean()) | nil
  }

  @type workflow :: %{
    name: String.t(),
    steps: [workflow_step()],
    context: map(),
    on_complete: (workflow_result() -> any()) | nil,
    on_failure: (workflow_result() -> any()) | nil
  }

  @type workflow_result :: %{
    workflow_id: workflow_id(),
    status: workflow_status(),
    results: map(),
    errors: [map()],
    started_at: DateTime.t(),
    completed_at: DateTime.t() | nil,
    duration_ms: pos_integer() | nil
  }

  @type progress :: %{
    job_id: job_id(),
    percentage: 0..100,
    message: String.t(),
    updated_at: DateTime.t()
  }

  # ---------------------------------------------------------------------------
  # GenServer (delegates to CGraph.Jobs.Server)
  # ---------------------------------------------------------------------------

  defdelegate start_link(opts \\ []), to: CGraph.Jobs.Server
  defdelegate child_spec(opts), to: CGraph.Jobs.Server

  # ---------------------------------------------------------------------------
  # Job Scheduling
  # ---------------------------------------------------------------------------

  @doc "Enqueue a job for background processing. See `CGraph.Jobs.Scheduling.enqueue/3`."
  @spec enqueue(worker(), job_args(), job_options()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue(worker, args, opts \\ []),
    do: CGraph.Jobs.Scheduling.enqueue(worker, args, opts)

  @doc "Enqueue a job and wait for completion. See `CGraph.Jobs.Scheduling.enqueue_and_wait/3`."
  @spec enqueue_and_wait(worker(), job_args(), job_options()) :: {:ok, term()} | {:error, term()}
  def enqueue_and_wait(worker, args, opts \\ []),
    do: CGraph.Jobs.Scheduling.enqueue_and_wait(worker, args, opts)

  defdelegate enqueue_many(jobs), to: CGraph.Jobs.Scheduling

  defdelegate schedule_recurring(name, worker, args, cron_expression),
    to: CGraph.Jobs.Scheduling

  defdelegate cancel_recurring(name), to: CGraph.Jobs.Scheduling

  # ---------------------------------------------------------------------------
  # Workflow Management
  # ---------------------------------------------------------------------------

  defdelegate start_workflow(workflow), to: CGraph.Jobs.Workflows
  defdelegate get_workflow_status(workflow_id), to: CGraph.Jobs.Workflows
  defdelegate pause_workflow(workflow_id), to: CGraph.Jobs.Workflows
  defdelegate resume_workflow(workflow_id), to: CGraph.Jobs.Workflows
  defdelegate cancel_workflow(workflow_id), to: CGraph.Jobs.Workflows

  # ---------------------------------------------------------------------------
  # Progress Tracking
  # ---------------------------------------------------------------------------

  @doc "Update job progress. See `CGraph.Jobs.Progress.update_progress/3`."
  @spec update_progress(job_id(), non_neg_integer(), String.t()) :: :ok | {:error, term()}
  def update_progress(job_id, percentage, message \\ ""),
    do: CGraph.Jobs.Progress.update_progress(job_id, percentage, message)

  defdelegate get_progress(job_id), to: CGraph.Jobs.Progress
  defdelegate subscribe_to_progress(job_id), to: CGraph.Jobs.Progress

  # ---------------------------------------------------------------------------
  # Job Management
  # ---------------------------------------------------------------------------

  defdelegate get_job(job_id), to: CGraph.Jobs.Management
  defdelegate cancel_job(job_id), to: CGraph.Jobs.Management
  defdelegate retry_job(job_id), to: CGraph.Jobs.Management

  @doc "Retry all failed jobs matching criteria. See `CGraph.Jobs.Management.retry_failed_jobs/1`."
  @spec retry_failed_jobs(keyword()) :: {:ok, non_neg_integer()} | {:error, term()}
  def retry_failed_jobs(opts \\ []),
    do: CGraph.Jobs.Management.retry_failed_jobs(opts)

  defdelegate pause_queue(queue), to: CGraph.Jobs.Management
  defdelegate resume_queue(queue), to: CGraph.Jobs.Management

  # ---------------------------------------------------------------------------
  # Statistics & Observability
  # ---------------------------------------------------------------------------

  @doc "Get job statistics. See `CGraph.Jobs.Stats.get_stats/1`."
  @spec get_stats(keyword()) :: {:ok, map()} | {:error, term()}
  def get_stats(opts \\ []), do: CGraph.Jobs.Stats.get_stats(opts)

  @doc "Get error statistics. See `CGraph.Jobs.Stats.get_error_stats/1`."
  @spec get_error_stats(keyword()) :: {:ok, map()} | {:error, term()}
  def get_error_stats(opts \\ []), do: CGraph.Jobs.Stats.get_error_stats(opts)

  @doc "Get worker performance stats. See `CGraph.Jobs.Stats.get_worker_performance/1`."
  @spec get_worker_performance(keyword()) :: {:ok, map()} | {:error, term()}
  def get_worker_performance(opts \\ []),
    do: CGraph.Jobs.Stats.get_worker_performance(opts)
end
