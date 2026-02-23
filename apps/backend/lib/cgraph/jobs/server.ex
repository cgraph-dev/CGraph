defmodule CGraph.Jobs.Server do
  @moduledoc """
  GenServer managing the Jobs subsystem lifecycle.

  Handles recurring job scheduling, workflow orchestration state,
  Oban telemetry integration, and periodic cleanup of stale data.
  Workflow logic is delegated to `CGraph.Jobs.WorkflowEngine`.
  """

  use GenServer
  require Logger

  alias CGraph.Jobs.{Progress, WorkflowEngine}

  # ---------------------------------------------------------------------------
  # ETS Tables & Defaults
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
  # Client
  # ---------------------------------------------------------------------------

  @doc "Starts the jobs server GenServer."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @doc "Initializes the jobs server with ETS tables, telemetry, and cleanup scheduling."
  @impl true
  @spec init(term()) :: {:ok, map()}
  def init(_opts) do
    :ets.new(@progress_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@workflow_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@stats_table, [:named_table, :set, :public, read_concurrency: true])

    attach_telemetry()
    schedule_cleanup()

    state = %{
      recurring_jobs: %{},
      active_workflows: %{},
      config: load_config()
    }

    {:ok, state}
  end

  # -- Recurring Jobs --------------------------------------------------------

  @doc "Handles synchronous recurring job scheduling and workflow management calls."
  @impl true
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  def handle_call({:schedule_recurring, name, worker, args, cron}, _from, state) do
    recurring = Map.put(state.recurring_jobs, name, %{
      worker: worker,
      args: args,
      cron: cron,
      scheduled_at: DateTime.utc_now()
    })

    Logger.info("[Jobs] Scheduled recurring job", name: name, cron: cron)
    {:reply, :ok, %{state | recurring_jobs: recurring}}
  end

  def handle_call({:cancel_recurring, name}, _from, state) do
    if Map.has_key?(state.recurring_jobs, name) do
      recurring = Map.delete(state.recurring_jobs, name)
      Logger.info("[Jobs] Cancelled recurring job", name: name)
      {:reply, :ok, %{state | recurring_jobs: recurring}}
    else
      {:reply, {:error, :not_found}, state}
    end
  end

  # -- Workflow Lifecycle ----------------------------------------------------

  def handle_call({:start_workflow, workflow}, _from, state) do
    case WorkflowEngine.validate_workflow(workflow) do
      :ok ->
        workflow_id = WorkflowEngine.generate_workflow_id()

        workflow_state = %{
          id: workflow_id,
          name: workflow[:name],
          status: :running,
          steps: WorkflowEngine.normalize_steps(workflow[:steps]),
          context: workflow[:context] || %{},
          results: %{},
          errors: [],
          step_jobs: %{},
          started_at: DateTime.utc_now(),
          completed_at: nil,
          on_complete: workflow[:on_complete],
          on_failure: workflow[:on_failure]
        }

        :ets.insert(@workflow_table, {workflow_id, workflow_state})

        {updated_workflow, jobs} = WorkflowEngine.start_ready_steps(workflow_state)
        :ets.insert(@workflow_table, {workflow_id, updated_workflow})

        Logger.info("[Jobs] Started workflow", workflow_id: workflow_id, job_count: length(jobs))
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
          duration_ms: WorkflowEngine.calculate_duration(workflow_state)
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
        Logger.info("[Jobs] Paused workflow", workflow_id: workflow_id)
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
        {updated_workflow, _jobs} = WorkflowEngine.start_ready_steps(updated)
        :ets.insert(@workflow_table, {workflow_id, updated_workflow})
        Logger.info("[Jobs] Resumed workflow", workflow_id: workflow_id)
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
        Enum.each(workflow_state.step_jobs, fn {_step_id, job_id} ->
          Oban.cancel_job(job_id)
        end)

        updated = %{workflow_state |
          status: :cancelled,
          completed_at: DateTime.utc_now()
        }
        :ets.insert(@workflow_table, {workflow_id, updated})
        Logger.info("[Jobs] Cancelled workflow", workflow_id: workflow_id)
        {:reply, :ok, state}

      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end

  # -- Info Handlers ---------------------------------------------------------

  @doc "Handles cleanup, workflow step completion, and failure messages."
  @impl true
  @spec handle_info(term(), map()) :: {:noreply, map()}
  def handle_info(:cleanup, state) do
    cleanup_expired_progress()
    cleanup_expired_workflows()
    schedule_cleanup()
    {:noreply, state}
  end

  def handle_info({:workflow_step_completed, workflow_id, step_id, result}, state) do
    WorkflowEngine.process_step_completion(workflow_id, step_id, result)
    {:noreply, state}
  end

  def handle_info({:workflow_step_failed, workflow_id, step_id, error}, state) do
    WorkflowEngine.process_step_failure(workflow_id, step_id, error)
    {:noreply, state}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private - Telemetry
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

    :ets.update_counter(@stats_table, :started, 1, {:started, 0})

    if :ets.lookup(@progress_table, job.id) == [] do
      Progress.update_progress(job.id, 0, "Started")
    end

    Logger.debug("[Jobs] Started job", job_id: job.id, worker: job.worker)
  end

  defp handle_telemetry_event([:oban, :job, :stop], measurements, metadata, _config) do
    job = metadata.job
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)

    :ets.update_counter(@stats_table, :completed, 1, {:completed, 0})

    Progress.update_progress(job.id, 100, "Completed")

    if workflow_id = job.meta["workflow_id"] do
      step_id = String.to_existing_atom(job.meta["step_id"])
      send(self(), {:workflow_step_completed, workflow_id, step_id, job.args})
    end

    Logger.debug("[Jobs] Completed job", job_id: job.id, duration_ms: duration_ms)
  end

  defp handle_telemetry_event([:oban, :job, :exception], _measurements, metadata, _config) do
    job = metadata.job
    error = metadata.reason

    :ets.update_counter(@stats_table, :failed, 1, {:failed, 0})

    if workflow_id = job.meta["workflow_id"] do
      step_id = String.to_existing_atom(job.meta["step_id"])
      send(self(), {:workflow_step_failed, workflow_id, step_id, error})
    end

    Logger.error("[Jobs] Job failed", job_id: job.id, error: inspect(error))
  end

  # ---------------------------------------------------------------------------
  # Private - Cleanup
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

    unless Enum.empty?(expired) do
      Logger.debug("[Jobs] Cleaned up expired progress records", count: length(expired))
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

    unless Enum.empty?(expired) do
      Logger.debug("[Jobs] Cleaned up expired workflows", count: length(expired))
    end
  end

  # ---------------------------------------------------------------------------
  # Private - Configuration
  # ---------------------------------------------------------------------------

  defp load_config do
    app_config = Application.get_env(:cgraph, CGraph.Jobs, [])
    Map.merge(@default_config, Map.new(app_config))
  end

  defp get_config(key) do
    case :ets.lookup(@stats_table, {:config, key}) do
      [{{:config, ^key}, value}] -> value
      [] -> Map.get(@default_config, key)
    end
  end
end
