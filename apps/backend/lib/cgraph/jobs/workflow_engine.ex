defmodule CGraph.Jobs.WorkflowEngine do
  @moduledoc """
  Internal workflow execution engine.

  Handles workflow validation, step normalization, dependency resolution,
  step enqueueing, completion/failure processing, and finalization with
  callbacks. Called by `CGraph.Jobs.Server` — not a public API.
  """

  require Logger

  alias CGraph.Jobs.Scheduling

  @workflow_table :cgraph_workflows

  @default_config %{
    max_workflow_steps: 100
  }

  @stats_table :cgraph_job_stats

  # ---------------------------------------------------------------------------
  # Workflow Validation & Normalization
  # ---------------------------------------------------------------------------

  @doc false
  @spec validate_workflow(map()) :: :ok | {:error, atom()}
  def validate_workflow(workflow) do
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

  @doc false
  @spec normalize_steps([map()]) :: [map()]
  def normalize_steps(steps) do
    steps
    |> Enum.with_index(1)
    |> Enum.map(fn {step, index} ->
      %{
        id: step[:id] || "step_#{index}",
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

  @doc false
  @spec generate_workflow_id() :: String.t()
  def generate_workflow_id do
    "wf_" <> Base.encode16(:crypto.strong_rand_bytes(12), case: :lower)
  end

  @doc false
  @spec calculate_duration(map()) :: integer()
  def calculate_duration(%{started_at: started, completed_at: nil}) do
    DateTime.diff(DateTime.utc_now(), started, :millisecond)
  end
  def calculate_duration(%{started_at: started, completed_at: completed}) do
    DateTime.diff(completed, started, :millisecond)
  end

  # ---------------------------------------------------------------------------
  # Step Execution
  # ---------------------------------------------------------------------------

  @doc false
  @spec start_ready_steps(map()) :: {map(), list()}
  def start_ready_steps(workflow_state) do
    completed_ids = get_completed_step_ids(workflow_state.steps)
    ready_steps = find_ready_steps(workflow_state, completed_ids)
    jobs = enqueue_ready_steps(workflow_state, ready_steps)
    build_updated_workflow(workflow_state, jobs)
  end

  # ---------------------------------------------------------------------------
  # Step Completion / Failure
  # ---------------------------------------------------------------------------

  @doc false
  @spec process_step_completion(String.t(), String.t(), term()) :: term()
  def process_step_completion(workflow_id, step_id, result) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] ->
        apply_step_completion(workflow_id, workflow_state, step_id, result)

      [] ->
        Logger.warning("[Jobs] Received completion for unknown workflow",
          workflow_id: workflow_id
        )
    end
  end

  @doc false
  @spec process_step_failure(String.t(), String.t(), term()) :: :ok
  def process_step_failure(workflow_id, step_id, error) do
    case :ets.lookup(@workflow_table, workflow_id) do
      [{^workflow_id, workflow_state}] ->
        apply_step_failure(workflow_state, step_id, error)

      [] ->
        Logger.warning("[Jobs] Received failure for unknown workflow",
          workflow_id: workflow_id
        )
    end
  end

  # ---------------------------------------------------------------------------
  # Private - Dependency Resolution
  # ---------------------------------------------------------------------------

  defp valid_step_dependencies?(steps) do
    step_ids =
      Enum.map(steps, fn step -> step[:id] || generate_step_id(step) end) |> MapSet.new()

    Enum.all?(steps, fn step ->
      deps = step[:depends_on] || []
      Enum.all?(deps, &MapSet.member?(step_ids, &1))
    end)
  end

  defp generate_step_id(step) do
    worker_name = step[:worker] |> inspect() |> String.split(".") |> List.last()
    "#{worker_name}_#{:erlang.unique_integer([:positive])}"
  end

  defp get_completed_step_ids(steps) do
    steps
    |> Enum.filter(&(&1.status == :completed))
    |> Enum.map(& &1.id)
    |> MapSet.new()
  end

  defp find_ready_steps(workflow_state, completed_ids) do
    Enum.filter(workflow_state.steps, fn step ->
      step.status == :pending and
        Enum.all?(step.depends_on, &MapSet.member?(completed_ids, &1)) and
        check_condition(step, workflow_state)
    end)
  end

  defp check_condition(%{condition: nil}, _workflow_state), do: true

  defp check_condition(%{condition: condition}, workflow_state)
       when is_function(condition, 1) do
    condition.(workflow_state.results)
  rescue
    _ -> false
  end

  defp check_condition(_, _), do: true

  # ---------------------------------------------------------------------------
  # Private - Enqueueing & Updating
  # ---------------------------------------------------------------------------

  defp enqueue_ready_steps(workflow_state, ready_steps) do
    Enum.map(ready_steps, fn step ->
      args =
        Map.merge(step.args, %{
          __workflow_id__: workflow_state.id,
          __step_id__: step.id,
          __context__: workflow_state.context
        })

      {:ok, job} =
        Scheduling.enqueue(step.worker, args,
          meta: %{workflow_id: workflow_state.id, step_id: step.id}
        )

      {step.id, job}
    end)
  end

  defp build_updated_workflow(workflow_state, jobs) do
    job_map = Map.new(jobs)

    updated_steps =
      Enum.map(workflow_state.steps, fn step ->
        case Map.get(job_map, step.id) do
          nil -> step
          job -> %{step | status: :running, job_id: job.id}
        end
      end)

    step_jobs =
      jobs
      |> Enum.map(fn {step_id, job} -> {step_id, job.id} end)
      |> Map.new()
      |> Map.merge(workflow_state.step_jobs)

    {%{workflow_state | steps: updated_steps, step_jobs: step_jobs}, jobs}
  end

  # ---------------------------------------------------------------------------
  # Private - Completion / Failure Application
  # ---------------------------------------------------------------------------

  defp apply_step_completion(workflow_id, workflow_state, step_id, result) do
    updated_steps = update_step_status(workflow_state.steps, step_id, :completed, result)
    updated_results = Map.put(workflow_state.results, step_id, result)

    updated_workflow = %{workflow_state | steps: updated_steps, results: updated_results}
    maybe_finalize_or_continue(workflow_id, updated_workflow)
  end

  defp apply_step_failure(workflow_state, step_id, error) do
    updated_steps = update_step_status(workflow_state.steps, step_id, :failed, error)
    updated_errors = [%{step_id: step_id, error: error} | workflow_state.errors]

    updated_workflow = %{workflow_state | steps: updated_steps, errors: updated_errors}
    finalize_workflow(updated_workflow, :failed)
  end

  defp update_step_status(steps, step_id, status, result_or_error) do
    Enum.map(steps, &maybe_update_step(&1, step_id, status, result_or_error))
  end

  defp maybe_update_step(%{id: id} = step, step_id, _status, _result) when id != step_id,
    do: step

  defp maybe_update_step(step, _step_id, :completed, result),
    do: %{step | status: :completed, result: result}

  defp maybe_update_step(step, _step_id, :failed, error),
    do: %{step | status: :failed, error: error}

  defp maybe_finalize_or_continue(workflow_id, workflow) do
    if Enum.all?(workflow.steps, &(&1.status in [:completed, :skipped])) do
      finalize_workflow(workflow, :completed)
    else
      {final_workflow, _} = start_ready_steps(workflow)
      :ets.insert(@workflow_table, {workflow_id, final_workflow})
    end
  end

  # ---------------------------------------------------------------------------
  # Private - Finalization
  # ---------------------------------------------------------------------------

  defp finalize_workflow(workflow_state, status) do
    final_workflow = %{
      workflow_state
      | status: status,
        completed_at: DateTime.utc_now()
    }

    :ets.insert(@workflow_table, {workflow_state.id, final_workflow})

    callback =
      if status == :completed do
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
            Logger.error("[Jobs] Workflow callback failed", error: inspect(e))
        end
      end)
    end

    Logger.info("[Jobs] Workflow status changed",
      workflow_id: workflow_state.id,
      status: status
    )
  end

  # ---------------------------------------------------------------------------
  # Private - Configuration
  # ---------------------------------------------------------------------------

  defp get_config(key) do
    case :ets.lookup(@stats_table, {:config, key}) do
      [{{:config, ^key}, value}] -> value
      [] -> Map.get(@default_config, key)
    end
  end
end
