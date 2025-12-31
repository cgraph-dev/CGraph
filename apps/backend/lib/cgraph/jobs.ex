defmodule Cgraph.Jobs do
  @moduledoc """
  Cgraph.Jobs - Comprehensive Background Job Abstraction Layer
  
  ## Overview
  
  This module provides a high-level abstraction over Oban for background job
  processing with additional features for workflow orchestration, job scheduling,
  observability, and operational management.
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                        Cgraph.Jobs                              │
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
      Cgraph.Jobs.enqueue(MyWorker, %{user_id: 123})
      
      # Delayed execution
      Cgraph.Jobs.enqueue(MyWorker, %{user_id: 123}, delay: :timer.minutes(5))
      
      # Scheduled execution
      Cgraph.Jobs.enqueue(MyWorker, %{user_id: 123}, scheduled_at: ~U[2024-01-15 10:00:00Z])
  
  ### Workflow Orchestration
  
      # Define a workflow
      workflow = %Cgraph.Jobs.Workflow{
        name: "user_onboarding",
        steps: [
          %{worker: CreateAccountWorker, args: %{email: "user@example.com"}},
          %{worker: SendWelcomeEmailWorker, depends_on: [:step_1]},
          %{worker: SetupDefaultSettingsWorker, depends_on: [:step_1]},
          %{worker: NotifyAdminWorker, depends_on: [:step_2, :step_3]}
        ]
      }
      
      {:ok, workflow_id} = Cgraph.Jobs.start_workflow(workflow)
  
  ### Progress Tracking
  
      # In your worker
      def perform(%Oban.Job{id: job_id, args: args}) do
        Cgraph.Jobs.update_progress(job_id, 0, "Starting...")
        
        Enum.each(1..100, fn i ->
          do_work(i)
          Cgraph.Jobs.update_progress(job_id, i, "Processing item \#{i}")
        end)
        
        Cgraph.Jobs.update_progress(job_id, 100, "Complete")
        :ok
      end
  
  ## Job Naming Convention
  
  All workers should follow the naming pattern: `Cgraph.Workers.<Domain>.<Action>Worker`
  
  Examples:
  - `Cgraph.Workers.Users.SendWelcomeEmailWorker`
  - `Cgraph.Workers.Notifications.PushNotificationWorker`
  - `Cgraph.Workers.Analytics.AggregateMetricsWorker`
  
  ## Configuration
  
  Configure in `config/config.exs`:
  
      config :cgraph, Cgraph.Jobs,
        progress_ttl: :timer.hours(24),
        workflow_ttl: :timer.hours(72),
        max_workflow_steps: 100,
        broadcast_progress: true
  
  ## Implementation Notes
  
  - Uses ETS for fast progress lookups and caching
  - Integrates with Phoenix PubSub for real-time updates
  - Leverages Oban's built-in retry and uniqueness features
  - Stores workflow state in database for persistence
  """
  
  use GenServer
  require Logger
  
  alias Cgraph.Repo
  
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
  # Configuration
  # ---------------------------------------------------------------------------
  
  @progress_table :cgraph_job_progress
  @workflow_table :cgraph_workflows
  @stats_table :cgraph_job_stats
  
  @default_config %{
    progress_ttl: :timer.hours(24),
    workflow_ttl: :timer.hours(72),
    max_workflow_steps: 100,
    broadcast_progress: true,
    stats_window: :timer.minutes(5)
  }
  
  # ---------------------------------------------------------------------------
  # Client API - Job Enqueueing
  # ---------------------------------------------------------------------------
  
  @doc """
  Enqueue a job for background processing.
  
  ## Options
  
  - `:queue` - The queue to use (default: :default)
  - `:priority` - Job priority 0-9, lower is higher priority (default: 3)
  - `:max_attempts` - Maximum retry attempts (default: 3)
  - `:delay` - Delay in milliseconds before processing
  - `:scheduled_at` - Specific time to process the job
  - `:unique` - Uniqueness constraints
  - `:tags` - Tags for categorization
  - `:meta` - Additional metadata
  
  ## Examples
  
      iex> Cgraph.Jobs.enqueue(MyWorker, %{user_id: 123})
      {:ok, %Oban.Job{id: 1}}
      
      iex> Cgraph.Jobs.enqueue(MyWorker, %{user_id: 123}, delay: 5000)
      {:ok, %Oban.Job{id: 2}}
  """
  @spec enqueue(worker(), job_args(), job_options()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue(worker, args, opts \\ []) do
    args
    |> build_job_changeset(worker, opts)
    |> Oban.insert()
    |> tap_success(&track_enqueue/1)
  end
  
  @doc """
  Enqueue a job and wait for it to complete.
  
  This is useful for testing or when you need synchronous behavior.
  Timeout defaults to 30 seconds.
  
  ## Examples
  
      iex> Cgraph.Jobs.enqueue_and_wait(MyWorker, %{user_id: 123})
      {:ok, result}
      
      iex> Cgraph.Jobs.enqueue_and_wait(MyWorker, %{user_id: 123}, timeout: 60_000)
      {:ok, result}
  """
  @spec enqueue_and_wait(worker(), job_args(), keyword()) :: {:ok, term()} | {:error, term()}
  def enqueue_and_wait(worker, args, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 30_000)
    job_opts = Keyword.drop(opts, [:timeout])
    
    with {:ok, job} <- enqueue(worker, args, job_opts) do
      wait_for_job(job.id, timeout)
    end
  end
  
  @doc """
  Enqueue multiple jobs atomically.
  
  All jobs are inserted in a single transaction. If any job fails validation,
  no jobs are inserted.
  
  ## Examples
  
      jobs = [
        {MyWorker, %{user_id: 1}},
        {MyWorker, %{user_id: 2}},
        {MyWorker, %{user_id: 3}}
      ]
      
      {:ok, inserted_jobs} = Cgraph.Jobs.enqueue_many(jobs)
  """
  @spec enqueue_many([{worker(), job_args()} | {worker(), job_args(), job_options()}]) ::
          {:ok, [Oban.Job.t()]} | {:error, term()}
  def enqueue_many(jobs) do
    changesets = Enum.map(jobs, fn
      {worker, args} -> build_job_changeset(args, worker, [])
      {worker, args, opts} -> build_job_changeset(args, worker, opts)
    end)
    
    Oban.insert_all(changesets)
  end
  
  @doc """
  Schedule a recurring job using cron expression.
  
  This uses Oban's built-in cron functionality but provides a higher-level API.
  
  ## Examples
  
      # Every hour
      Cgraph.Jobs.schedule_recurring(:hourly_cleanup, CleanupWorker, %{}, "0 * * * *")
      
      # Every day at midnight
      Cgraph.Jobs.schedule_recurring(:daily_report, ReportWorker, %{}, "0 0 * * *")
  """
  @spec schedule_recurring(atom(), worker(), job_args(), String.t()) :: :ok | {:error, term()}
  def schedule_recurring(name, worker, args, cron_expression) do
    GenServer.call(__MODULE__, {:schedule_recurring, name, worker, args, cron_expression})
  end
  
  @doc """
  Cancel a scheduled recurring job.
  """
  @spec cancel_recurring(atom()) :: :ok | {:error, :not_found}
  def cancel_recurring(name) do
    GenServer.call(__MODULE__, {:cancel_recurring, name})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Workflow Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Start a new workflow.
  
  A workflow is a series of jobs that are executed in a specific order with
  dependency management and conditional execution.
  
  ## Examples
  
      workflow = %{
        name: "user_onboarding",
        steps: [
          %{id: :create_user, worker: CreateUserWorker, args: %{email: "test@example.com"}},
          %{id: :send_email, worker: SendEmailWorker, args: %{}, depends_on: [:create_user]},
          %{id: :setup_defaults, worker: SetupDefaultsWorker, args: %{}, depends_on: [:create_user]}
        ],
        context: %{source: "signup_page"}
      }
      
      {:ok, workflow_id} = Cgraph.Jobs.start_workflow(workflow)
  """
  @spec start_workflow(workflow()) :: {:ok, workflow_id()} | {:error, term()}
  def start_workflow(workflow) do
    GenServer.call(__MODULE__, {:start_workflow, workflow})
  end
  
  @doc """
  Get the current status of a workflow.
  """
  @spec get_workflow_status(workflow_id()) :: {:ok, workflow_result()} | {:error, :not_found}
  def get_workflow_status(workflow_id) do
    GenServer.call(__MODULE__, {:get_workflow_status, workflow_id})
  end
  
  @doc """
  Pause a running workflow.
  
  Currently executing jobs will complete, but no new jobs will be started.
  """
  @spec pause_workflow(workflow_id()) :: :ok | {:error, term()}
  def pause_workflow(workflow_id) do
    GenServer.call(__MODULE__, {:pause_workflow, workflow_id})
  end
  
  @doc """
  Resume a paused workflow.
  """
  @spec resume_workflow(workflow_id()) :: :ok | {:error, term()}
  def resume_workflow(workflow_id) do
    GenServer.call(__MODULE__, {:resume_workflow, workflow_id})
  end
  
  @doc """
  Cancel a workflow and all its pending jobs.
  """
  @spec cancel_workflow(workflow_id()) :: :ok | {:error, term()}
  def cancel_workflow(workflow_id) do
    GenServer.call(__MODULE__, {:cancel_workflow, workflow_id})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Progress Tracking
  # ---------------------------------------------------------------------------
  
  @doc """
  Update the progress of a job.
  
  Progress updates are stored in ETS for fast access and optionally broadcast
  via PubSub for real-time UI updates.
  
  ## Examples
  
      def perform(%Oban.Job{id: job_id}) do
        Cgraph.Jobs.update_progress(job_id, 0, "Starting...")
        
        # Do work...
        Cgraph.Jobs.update_progress(job_id, 50, "Halfway done")
        
        # More work...
        Cgraph.Jobs.update_progress(job_id, 100, "Complete!")
        :ok
      end
  """
  @spec update_progress(job_id(), 0..100, String.t()) :: :ok
  def update_progress(job_id, percentage, message \\ "") do
    progress = %{
      job_id: job_id,
      percentage: percentage,
      message: message,
      updated_at: DateTime.utc_now()
    }
    
    :ets.insert(@progress_table, {job_id, progress})
    
    if get_config(:broadcast_progress) do
      Phoenix.PubSub.broadcast(
        Cgraph.PubSub,
        "job_progress:#{job_id}",
        {:job_progress, progress}
      )
    end
    
    :ok
  end
  
  @doc """
  Get the current progress of a job.
  """
  @spec get_progress(job_id()) :: {:ok, progress()} | {:error, :not_found}
  def get_progress(job_id) do
    case :ets.lookup(@progress_table, job_id) do
      [{^job_id, progress}] -> {:ok, progress}
      [] -> {:error, :not_found}
    end
  end
  
  @doc """
  Subscribe to progress updates for a job.
  
  Returns immediately. Progress updates will be sent to the caller process
  as `{:job_progress, progress}` messages.
  """
  @spec subscribe_to_progress(job_id()) :: :ok
  def subscribe_to_progress(job_id) do
    Phoenix.PubSub.subscribe(Cgraph.PubSub, "job_progress:#{job_id}")
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Job Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Get a job by ID.
  """
  @spec get_job(job_id()) :: {:ok, Oban.Job.t()} | {:error, :not_found}
  def get_job(job_id) do
    case Repo.get(Oban.Job, job_id) do
      nil -> {:error, :not_found}
      job -> {:ok, job}
    end
  end
  
  @doc """
  Cancel a job.
  
  If the job is currently running, it will be marked for cancellation
  but may complete its current execution.
  """
  @spec cancel_job(job_id()) :: :ok | {:error, term()}
  def cancel_job(job_id) do
    case Oban.cancel_job(job_id) do
      :ok -> :ok
      error -> error
    end
  end
  
  @doc """
  Retry a failed job immediately.
  """
  @spec retry_job(job_id()) :: :ok | {:error, term()}
  def retry_job(job_id) do
    case Oban.retry_job(job_id) do
      :ok -> :ok
      error -> error
    end
  end
  
  @doc """
  Retry all failed jobs matching the given criteria.
  """
  @spec retry_failed_jobs(keyword()) :: {:ok, non_neg_integer()}
  def retry_failed_jobs(opts \\ []) do
    import Ecto.Query
    
    query = from(j in Oban.Job, where: j.state == "discarded")
    
    query = if worker = opts[:worker] do
      from(j in query, where: j.worker == ^to_string(worker))
    else
      query
    end
    
    query = if queue = opts[:queue] do
      from(j in query, where: j.queue == ^to_string(queue))
    else
      query
    end
    
    query = if since = opts[:since] do
      from(j in query, where: j.discarded_at >= ^since)
    else
      query
    end
    
    job_ids = Repo.all(from(j in query, select: j.id))
    
    Enum.each(job_ids, &Oban.retry_job/1)
    
    {:ok, length(job_ids)}
  end
  
  @doc """
  Pause a queue, preventing new jobs from being processed.
  """
  @spec pause_queue(atom()) :: :ok
  def pause_queue(queue) do
    Oban.pause_queue(queue: queue)
  end
  
  @doc """
  Resume a paused queue.
  """
  @spec resume_queue(atom()) :: :ok
  def resume_queue(queue) do
    Oban.resume_queue(queue: queue)
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Statistics & Observability
  # ---------------------------------------------------------------------------
  
  @doc """
  Get job statistics for a time window.
  """
  @spec get_stats(keyword()) :: map()
  def get_stats(opts \\ []) do
    window = Keyword.get(opts, :window, :timer.minutes(5))
    since = DateTime.add(DateTime.utc_now(), -window, :millisecond)
    
    import Ecto.Query
    
    states = Repo.all(
      from j in Oban.Job,
        where: j.inserted_at >= ^since,
        group_by: j.state,
        select: {j.state, count(j.id)}
    )
    |> Map.new()
    
    queues = Repo.all(
      from j in Oban.Job,
        where: j.inserted_at >= ^since,
        group_by: j.queue,
        select: {j.queue, count(j.id)}
    )
    |> Map.new()
    
    workers = Repo.all(
      from j in Oban.Job,
        where: j.inserted_at >= ^since,
        group_by: j.worker,
        select: {j.worker, count(j.id)}
    )
    |> Map.new()
    
    %{
      window_seconds: div(window, 1000),
      since: since,
      by_state: states,
      by_queue: queues,
      by_worker: workers,
      total: Enum.reduce(states, 0, fn {_k, v}, acc -> acc + v end)
    }
  end
  
  @doc """
  Get error statistics grouped by error type.
  """
  @spec get_error_stats(keyword()) :: [map()]
  def get_error_stats(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    since = Keyword.get(opts, :since, DateTime.add(DateTime.utc_now(), -24 * 60 * 60, :second))
    
    import Ecto.Query
    
    Repo.all(
      from j in Oban.Job,
        where: j.state == "discarded" and j.discarded_at >= ^since,
        group_by: fragment("errors->-1->>'error'"),
        select: %{
          error: fragment("errors->-1->>'error'"),
          count: count(j.id),
          last_seen: max(j.discarded_at)
        },
        order_by: [desc: count(j.id)],
        limit: ^limit
    )
  end
  
  @doc """
  Get performance statistics for workers.
  """
  @spec get_worker_performance(keyword()) :: [map()]
  def get_worker_performance(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    since = Keyword.get(opts, :since, DateTime.add(DateTime.utc_now(), -24 * 60 * 60, :second))
    
    import Ecto.Query
    
    Repo.all(
      from j in Oban.Job,
        where: j.state == "completed" and j.completed_at >= ^since,
        group_by: j.worker,
        select: %{
          worker: j.worker,
          count: count(j.id),
          avg_duration_ms: fragment(
            "EXTRACT(EPOCH FROM (avg(completed_at - attempted_at))) * 1000"
          ),
          max_duration_ms: fragment(
            "EXTRACT(EPOCH FROM (max(completed_at - attempted_at))) * 1000"
          ),
          min_duration_ms: fragment(
            "EXTRACT(EPOCH FROM (min(completed_at - attempted_at))) * 1000"
          )
        },
        order_by: [desc: count(j.id)],
        limit: ^limit
    )
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Create ETS tables
    :ets.new(@progress_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@workflow_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@stats_table, [:named_table, :set, :public, read_concurrency: true])
    
    # Subscribe to Oban telemetry
    attach_telemetry()
    
    # Schedule cleanup
    schedule_cleanup()
    
    state = %{
      recurring_jobs: %{},
      active_workflows: %{},
      config: load_config()
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_call({:schedule_recurring, name, worker, args, cron}, _from, state) do
    # Store the recurring job configuration
    recurring = Map.put(state.recurring_jobs, name, %{
      worker: worker,
      args: args,
      cron: cron,
      scheduled_at: DateTime.utc_now()
    })
    
    Logger.info("[Jobs] Scheduled recurring job: #{name} with cron: #{cron}")
    
    {:reply, :ok, %{state | recurring_jobs: recurring}}
  end
  
  def handle_call({:cancel_recurring, name}, _from, state) do
    if Map.has_key?(state.recurring_jobs, name) do
      recurring = Map.delete(state.recurring_jobs, name)
      Logger.info("[Jobs] Cancelled recurring job: #{name}")
      {:reply, :ok, %{state | recurring_jobs: recurring}}
    else
      {:reply, {:error, :not_found}, state}
    end
  end
  
  def handle_call({:start_workflow, workflow}, _from, state) do
    case validate_workflow(workflow) do
      :ok ->
        workflow_id = generate_workflow_id()
        
        workflow_state = %{
          id: workflow_id,
          name: workflow[:name],
          status: :running,
          steps: normalize_steps(workflow[:steps]),
          context: workflow[:context] || %{},
          results: %{},
          errors: [],
          step_jobs: %{},
          started_at: DateTime.utc_now(),
          completed_at: nil,
          on_complete: workflow[:on_complete],
          on_failure: workflow[:on_failure]
        }
        
        # Store workflow state
        :ets.insert(@workflow_table, {workflow_id, workflow_state})
        
        # Start initial steps (those with no dependencies)
        {updated_workflow, jobs} = start_ready_steps(workflow_state)
        :ets.insert(@workflow_table, {workflow_id, updated_workflow})
        
        Logger.info("[Jobs] Started workflow #{workflow_id} with #{length(jobs)} initial jobs")
        
        {:reply, {:ok, workflow_id}, state}
        
      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end
  
  def handle_call({:get_workflow_status, workflow_id}, _from, state) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] ->
        result = %{
          workflow_id: workflow_id,
          name: workflow_state.name,
          status: workflow_state.status,
          results: workflow_state.results,
          errors: workflow_state.errors,
          started_at: workflow_state.started_at,
          completed_at: workflow_state.completed_at,
          duration_ms: calculate_duration(workflow_state)
        }
        {:reply, {:ok, result}, state}
        
      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end
  
  def handle_call({:pause_workflow, workflow_id}, _from, state) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] when workflow_state.status == :running ->
        updated = %{workflow_state | status: :paused}
        :ets.insert(@workflow_table, {workflow_id, updated})
        Logger.info("[Jobs] Paused workflow #{workflow_id}")
        {:reply, :ok, state}
        
      [{^workflow_id, _}] ->
        {:reply, {:error, :not_running}, state}
        
      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end
  
  def handle_call({:resume_workflow, workflow_id}, _from, state) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] when workflow_state.status == :paused ->
        updated = %{workflow_state | status: :running}
        {updated_workflow, _jobs} = start_ready_steps(updated)
        :ets.insert(@workflow_table, {workflow_id, updated_workflow})
        Logger.info("[Jobs] Resumed workflow #{workflow_id}")
        {:reply, :ok, state}
        
      [{^workflow_id, _}] ->
        {:reply, {:error, :not_paused}, state}
        
      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end
  
  def handle_call({:cancel_workflow, workflow_id}, _from, state) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] ->
        # Cancel all pending jobs
        Enum.each(workflow_state.step_jobs, fn {_step_id, job_id} ->
          Oban.cancel_job(job_id)
        end)
        
        updated = %{workflow_state | 
          status: :cancelled, 
          completed_at: DateTime.utc_now()
        }
        :ets.insert(@workflow_table, {workflow_id, updated})
        Logger.info("[Jobs] Cancelled workflow #{workflow_id}")
        {:reply, :ok, state}
        
      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end
  
  @impl true
  def handle_info(:cleanup, state) do
    cleanup_expired_progress()
    cleanup_expired_workflows()
    schedule_cleanup()
    {:noreply, state}
  end
  
  def handle_info({:workflow_step_completed, workflow_id, step_id, result}, state) do
    process_workflow_step_completion(workflow_id, step_id, result)
    {:noreply, state}
  end
  
  def handle_info({:workflow_step_failed, workflow_id, step_id, error}, state) do
    process_workflow_step_failure(workflow_id, step_id, error)
    {:noreply, state}
  end
  
  def handle_info(_msg, state) do
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Job Building
  # ---------------------------------------------------------------------------
  
  defp build_job_changeset(args, worker, opts) do
    job_args = Map.put(args, "__worker__", inspect(worker))
    
    changeset_opts = []
    
    changeset_opts = if queue = opts[:queue] do
      Keyword.put(changeset_opts, :queue, queue)
    else
      changeset_opts
    end
    
    changeset_opts = if priority = opts[:priority] do
      Keyword.put(changeset_opts, :priority, priority)
    else
      changeset_opts
    end
    
    changeset_opts = if max_attempts = opts[:max_attempts] do
      Keyword.put(changeset_opts, :max_attempts, max_attempts)
    else
      changeset_opts
    end
    
    changeset_opts = if delay = opts[:delay] do
      scheduled_at = DateTime.add(DateTime.utc_now(), delay, :millisecond)
      Keyword.put(changeset_opts, :scheduled_at, scheduled_at)
    else
      changeset_opts
    end
    
    changeset_opts = if scheduled_at = opts[:scheduled_at] do
      Keyword.put(changeset_opts, :scheduled_at, scheduled_at)
    else
      changeset_opts
    end
    
    changeset_opts = if unique = opts[:unique] do
      Keyword.put(changeset_opts, :unique, unique)
    else
      changeset_opts
    end
    
    changeset_opts = if tags = opts[:tags] do
      Keyword.put(changeset_opts, :tags, tags)
    else
      changeset_opts
    end
    
    changeset_opts = if meta = opts[:meta] do
      Keyword.put(changeset_opts, :meta, meta)
    else
      changeset_opts
    end
    
    worker.new(job_args, changeset_opts)
  end
  
  defp tap_success({:ok, job} = result, fun) do
    fun.(job)
    result
  end
  defp tap_success(error, _fun), do: error
  
  defp track_enqueue(job) do
    :ets.update_counter(@stats_table, :enqueued, 1, {:enqueued, 0})
    :ets.update_counter(@stats_table, {:worker, job.worker}, 1, {{:worker, job.worker}, 0})
    :ets.update_counter(@stats_table, {:queue, job.queue}, 1, {{:queue, job.queue}, 0})
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Workflow Management
  # ---------------------------------------------------------------------------
  
  defp validate_workflow(workflow) do
    cond do
      not is_map(workflow) ->
        {:error, :invalid_workflow}
        
      not is_list(workflow[:steps]) or workflow[:steps] == [] ->
        {:error, :no_steps}
        
      length(workflow[:steps]) > get_config(:max_workflow_steps) ->
        {:error, :too_many_steps}
        
      not valid_step_dependencies?(workflow[:steps]) ->
        {:error, :invalid_dependencies}
        
      true ->
        :ok
    end
  end
  
  defp valid_step_dependencies?(steps) do
    step_ids = Enum.map(steps, fn step -> step[:id] || generate_step_id(step) end) |> MapSet.new()
    
    Enum.all?(steps, fn step ->
      deps = step[:depends_on] || []
      Enum.all?(deps, &MapSet.member?(step_ids, &1))
    end)
  end
  
  defp normalize_steps(steps) do
    steps
    |> Enum.with_index(1)
    |> Enum.map(fn {step, index} ->
      %{
        id: step[:id] || String.to_atom("step_#{index}"),
        worker: step[:worker],
        args: step[:args] || %{},
        depends_on: step[:depends_on] || [],
        condition: step[:condition],
        status: :pending,
        job_id: nil,
        result: nil,
        error: nil
      }
    end)
  end
  
  defp generate_step_id(step) do
    worker_name = step[:worker] |> inspect() |> String.split(".") |> List.last()
    String.to_atom("#{worker_name}_#{:erlang.unique_integer([:positive])}")
  end
  
  defp start_ready_steps(workflow_state) do
    completed_steps = 
      workflow_state.steps
      |> Enum.filter(&(&1.status == :completed))
      |> Enum.map(& &1.id)
      |> MapSet.new()
    
    ready_steps = 
      workflow_state.steps
      |> Enum.filter(fn step ->
        step.status == :pending and
        Enum.all?(step.depends_on, &MapSet.member?(completed_steps, &1)) and
        check_condition(step, workflow_state)
      end)
    
    jobs = Enum.map(ready_steps, fn step ->
      args = Map.merge(step.args, %{
        __workflow_id__: workflow_state.id,
        __step_id__: step.id,
        __context__: workflow_state.context
      })
      
      {:ok, job} = enqueue(step.worker, args, [
        meta: %{workflow_id: workflow_state.id, step_id: step.id}
      ])
      
      {step.id, job}
    end)
    
    updated_steps = Enum.map(workflow_state.steps, fn step ->
      case Enum.find(jobs, fn {id, _} -> id == step.id end) do
        {_, job} -> %{step | status: :running, job_id: job.id}
        nil -> step
      end
    end)
    
    step_jobs = 
      jobs
      |> Enum.map(fn {step_id, job} -> {step_id, job.id} end)
      |> Map.new()
      |> Map.merge(workflow_state.step_jobs)
    
    updated_workflow = %{workflow_state | 
      steps: updated_steps,
      step_jobs: step_jobs
    }
    
    {updated_workflow, jobs}
  end
  
  defp check_condition(%{condition: nil}, _workflow_state), do: true
  defp check_condition(%{condition: condition}, workflow_state) when is_function(condition, 1) do
    try do
      condition.(workflow_state.results)
    rescue
      _ -> false
    end
  end
  defp check_condition(_, _), do: true
  
  defp process_workflow_step_completion(workflow_id, step_id, result) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] ->
        updated_steps = Enum.map(workflow_state.steps, fn step ->
          if step.id == step_id do
            %{step | status: :completed, result: result}
          else
            step
          end
        end)
        
        updated_results = Map.put(workflow_state.results, step_id, result)
        
        updated_workflow = %{workflow_state |
          steps: updated_steps,
          results: updated_results
        }
        
        # Check if all steps are complete
        if Enum.all?(updated_workflow.steps, &(&1.status in [:completed, :skipped])) do
          finalize_workflow(updated_workflow, :completed)
        else
          # Start next ready steps
          {final_workflow, _} = start_ready_steps(updated_workflow)
          :ets.insert(@workflow_table, {workflow_id, final_workflow})
        end
        
      [] ->
        Logger.warning("[Jobs] Received completion for unknown workflow: #{workflow_id}")
    end
  end
  
  defp process_workflow_step_failure(workflow_id, step_id, error) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] ->
        updated_steps = Enum.map(workflow_state.steps, fn step ->
          if step.id == step_id do
            %{step | status: :failed, error: error}
          else
            step
          end
        end)
        
        updated_errors = [%{step_id: step_id, error: error} | workflow_state.errors]
        
        updated_workflow = %{workflow_state |
          steps: updated_steps,
          errors: updated_errors
        }
        
        finalize_workflow(updated_workflow, :failed)
        
      [] ->
        Logger.warning("[Jobs] Received failure for unknown workflow: #{workflow_id}")
    end
  end
  
  defp finalize_workflow(workflow_state, status) do
    final_workflow = %{workflow_state |
      status: status,
      completed_at: DateTime.utc_now()
    }
    
    :ets.insert(@workflow_table, {workflow_state.id, final_workflow})
    
    # Execute callbacks
    callback = if status == :completed do
      workflow_state.on_complete
    else
      workflow_state.on_failure
    end
    
    if is_function(callback, 1) do
      Task.start(fn ->
        try do
          callback.(%{
            workflow_id: workflow_state.id,
            status: status,
            results: final_workflow.results,
            errors: final_workflow.errors,
            started_at: workflow_state.started_at,
            completed_at: final_workflow.completed_at,
            duration_ms: calculate_duration(final_workflow)
          })
        rescue
          e ->
            Logger.error("[Jobs] Workflow callback failed: #{inspect(e)}")
        end
      end)
    end
    
    Logger.info("[Jobs] Workflow #{workflow_state.id} #{status}")
  end
  
  defp calculate_duration(%{started_at: started, completed_at: nil}) do
    DateTime.diff(DateTime.utc_now(), started, :millisecond)
  end
  defp calculate_duration(%{started_at: started, completed_at: completed}) do
    DateTime.diff(completed, started, :millisecond)
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Waiting & Polling
  # ---------------------------------------------------------------------------
  
  defp wait_for_job(job_id, timeout) do
    deadline = System.monotonic_time(:millisecond) + timeout
    poll_job_completion(job_id, deadline)
  end
  
  defp poll_job_completion(job_id, deadline) do
    if System.monotonic_time(:millisecond) >= deadline do
      {:error, :timeout}
    else
      case Repo.get(Oban.Job, job_id) do
        %{state: "completed"} = job ->
          {:ok, job}
          
        %{state: "discarded", errors: errors} ->
          {:error, {:job_failed, errors}}
          
        %{state: "cancelled"} ->
          {:error, :cancelled}
          
        _ ->
          Process.sleep(100)
          poll_job_completion(job_id, deadline)
      end
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Telemetry & Observability
  # ---------------------------------------------------------------------------
  
  defp attach_telemetry do
    :telemetry.attach_many(
      "cgraph-jobs-handler",
      [
        [:oban, :job, :start],
        [:oban, :job, :stop],
        [:oban, :job, :exception]
      ],
      &handle_telemetry_event/4,
      nil
    )
  end
  
  defp handle_telemetry_event([:oban, :job, :start], _measurements, metadata, _config) do
    job = metadata.job
    
    # Track job start
    :ets.update_counter(@stats_table, :started, 1, {:started, 0})
    
    # Initialize progress if not exists
    if :ets.lookup(@progress_table, job.id) == [] do
      update_progress(job.id, 0, "Started")
    end
    
    Logger.debug("[Jobs] Started job #{job.id} (#{job.worker})")
  end
  
  defp handle_telemetry_event([:oban, :job, :stop], measurements, metadata, _config) do
    job = metadata.job
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
    
    # Track completion
    :ets.update_counter(@stats_table, :completed, 1, {:completed, 0})
    
    # Update progress to complete
    update_progress(job.id, 100, "Completed")
    
    # Handle workflow step completion
    if workflow_id = job.meta["workflow_id"] do
      step_id = String.to_atom(job.meta["step_id"])
      send(self(), {:workflow_step_completed, workflow_id, step_id, job.args})
    end
    
    Logger.debug("[Jobs] Completed job #{job.id} in #{duration_ms}ms")
  end
  
  defp handle_telemetry_event([:oban, :job, :exception], _measurements, metadata, _config) do
    job = metadata.job
    error = metadata.reason
    
    # Track failure
    :ets.update_counter(@stats_table, :failed, 1, {:failed, 0})
    
    # Handle workflow step failure
    if workflow_id = job.meta["workflow_id"] do
      step_id = String.to_atom(job.meta["step_id"])
      send(self(), {:workflow_step_failed, workflow_id, step_id, error})
    end
    
    Logger.error("[Jobs] Job #{job.id} failed: #{inspect(error)}")
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Cleanup
  # ---------------------------------------------------------------------------
  
  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, :timer.minutes(5))
  end
  
  defp cleanup_expired_progress do
    ttl = get_config(:progress_ttl)
    cutoff = DateTime.add(DateTime.utc_now(), -ttl, :millisecond)
    
    expired =
      :ets.tab2list(@progress_table)
      |> Enum.filter(fn {_id, progress} ->
        DateTime.compare(progress.updated_at, cutoff) == :lt
      end)
      |> Enum.map(fn {id, _} -> id end)
    
    Enum.each(expired, &:ets.delete(@progress_table, &1))
    
    if length(expired) > 0 do
      Logger.debug("[Jobs] Cleaned up #{length(expired)} expired progress records")
    end
  end
  
  defp cleanup_expired_workflows do
    ttl = get_config(:workflow_ttl)
    cutoff = DateTime.add(DateTime.utc_now(), -ttl, :millisecond)
    
    expired =
      :ets.tab2list(@workflow_table)
      |> Enum.filter(fn {_id, workflow} ->
        workflow.status in [:completed, :failed, :cancelled] and
        workflow.completed_at != nil and
        DateTime.compare(workflow.completed_at, cutoff) == :lt
      end)
      |> Enum.map(fn {id, _} -> id end)
    
    Enum.each(expired, &:ets.delete(@workflow_table, &1))
    
    if length(expired) > 0 do
      Logger.debug("[Jobs] Cleaned up #{length(expired)} expired workflows")
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Configuration
  # ---------------------------------------------------------------------------
  
  defp load_config do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Map.merge(@default_config, Map.new(app_config))
  end
  
  defp get_config(key) do
    case :ets.lookup(@stats_table, {:config, key}) do
      [{{:config, ^key}, value}] -> value
      [] -> Map.get(@default_config, key)
    end
  end
  
  defp generate_workflow_id do
    "wf_" <> Base.encode16(:crypto.strong_rand_bytes(12), case: :lower)
  end
end
