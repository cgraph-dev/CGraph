defmodule CGraph.Workers.Orchestrator.Pipeline do
  @moduledoc """
  Pipeline operations for the job orchestrator.

  Manages sequential job pipelines where each job depends on the
  successful completion of the previous one. Provides pipeline
  creation, progress tracking, failure handling, and cancellation.

  This module is not intended to be used directly — use
  `CGraph.Workers.Orchestrator` which delegates to this module.
  """

  require Logger

  alias CGraph.Workers.Orchestrator

  @type job_spec :: {module(), map()}

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Create a pipeline of jobs that run sequentially.

  Each job in the pipeline waits for the previous job to complete successfully
  before starting. If any job fails, subsequent jobs are cancelled.

  ## Options

  - `:on_complete` - Job to run when pipeline completes successfully
  - `:on_failure` - Job to run if pipeline fails
  - `:timeout_ms` - Maximum time for entire pipeline

  ## Examples

      Orchestrator.pipeline([
        {DataFetchWorker, %{source: "api"}},
        {DataTransformWorker, %{format: "json"}},
        {DataLoadWorker, %{destination: "warehouse"}}
      ], on_complete: {NotifyWorker, %{message: "ETL complete"}})
  """
  @spec pipeline([job_spec()], keyword()) :: {:ok, String.t()} | {:error, :empty_pipeline}
  def pipeline(jobs, opts \\ []) when is_list(jobs) do
    pipeline_id = generate_pipeline_id()
    total_jobs = length(jobs)

    # Create pipeline metadata
    pipeline_meta = %{
      id: pipeline_id,
      total_jobs: total_jobs,
      on_complete: Keyword.get(opts, :on_complete),
      on_failure: Keyword.get(opts, :on_failure),
      started_at: DateTime.utc_now()
    }

    # Store pipeline state
    store_pipeline_state(pipeline_id, pipeline_meta)

    # Enqueue first job with pipeline context
    case jobs do
      [{worker, args} | rest] ->
        enqueue_pipeline_job(worker, args, pipeline_id, 0, rest, opts)
        {:ok, pipeline_id}

      [] ->
        {:error, :empty_pipeline}
    end
  end

  @doc """
  Continue a pipeline after successful job completion.

  Called by workers that are part of a pipeline.
  """
  @spec continue_pipeline(map(), any()) :: :ok
  def continue_pipeline(args, result \\ nil) do
    case Map.get(args, "__pipeline__") do
      nil ->
        :ok

      %{id: pipeline_id, index: index, remaining: remaining} ->
        update_pipeline_progress(pipeline_id, index, :success, result)
        handle_atom_keys_remaining(pipeline_id, index, remaining)

      %{"id" => pipeline_id, "index" => index, "remaining" => remaining} ->
        update_pipeline_progress(pipeline_id, index, :success, result)
        continue_remaining_steps(pipeline_id, index, remaining)
    end
  end

  @doc """
  Fail a pipeline after job failure.
  """
  @spec fail_pipeline(map(), any()) :: :ok
  def fail_pipeline(args, reason) do
    case Map.get(args, "__pipeline__") do
      nil ->
        :ok

      %{id: pipeline_id, index: index} ->
        update_pipeline_progress(pipeline_id, index, :failure, reason)
        complete_pipeline(pipeline_id, {:failure, reason})
    end
  end

  @doc """
  Get the status of a pipeline.
  """
  @spec pipeline_status(String.t()) :: map() | nil
  def pipeline_status(pipeline_id) do
    get_pipeline_state(pipeline_id)
  end

  @doc """
  Cancel all pending jobs in a pipeline.
  """
  @spec cancel_pipeline(String.t()) :: {:ok, :cancelled} | {:error, :not_found}
  def cancel_pipeline(pipeline_id) do
    case get_pipeline_state(pipeline_id) do
      nil ->
        {:error, :not_found}

      state ->
        store_pipeline_state(pipeline_id, Map.put(state, :status, :cancelled))
        {:ok, :cancelled}
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp enqueue_pipeline_job(worker, args, pipeline_id, index, remaining_jobs, opts) do
    enriched_args = Map.merge(args, %{
      "__pipeline__" => %{
        id: pipeline_id,
        index: index,
        remaining: Enum.map(remaining_jobs, fn {w, a} -> %{worker: to_string(w), args: a} end)
      }
    })

    Orchestrator.enqueue(worker, enriched_args, opts)
  end

  defp handle_atom_keys_remaining(pipeline_id, _index, []) do
    complete_pipeline(pipeline_id, :success)
  end
  defp handle_atom_keys_remaining(pipeline_id, index, [{worker_str, next_args} | rest]) when is_binary(worker_str) do
    worker = String.to_existing_atom(worker_str)
    enqueue_pipeline_job(worker, next_args, pipeline_id, index + 1, rest, [])
  end
  defp handle_atom_keys_remaining(pipeline_id, index, [%{worker: worker_str, args: next_args} | rest]) do
    worker = String.to_existing_atom(worker_str)
    rest_tuples = convert_remaining_to_tuples(rest)
    enqueue_pipeline_job(worker, next_args, pipeline_id, index + 1, rest_tuples, [])
  end

  defp convert_remaining_to_tuples(rest) do
    rest
    |> Enum.map(fn
      %{worker: w, args: a} -> %{worker: w, args: a}
      {w, a} -> %{worker: to_string(w), args: a}
    end)
    |> Enum.map(fn %{worker: w, args: a} -> {String.to_existing_atom(w), a} end)
  end

  defp continue_remaining_steps(pipeline_id, _index, []) do
    complete_pipeline(pipeline_id, :success)
  end
  defp continue_remaining_steps(pipeline_id, index, [%{"worker" => worker_str, "args" => next_args} | rest]) do
    worker = String.to_existing_atom(worker_str)
    rest_tuples = Enum.map(rest, &parse_worker_tuple/1)
    enqueue_pipeline_job(worker, next_args, pipeline_id, index + 1, rest_tuples, [])
  end

  defp parse_worker_tuple(%{"worker" => w, "args" => a}) do
    {String.to_existing_atom(w), a}
  end

  defp generate_pipeline_id do
    "pipeline_" <> Base.encode32(:crypto.strong_rand_bytes(8), case: :lower, padding: false)
  end

  defp store_pipeline_state(id, state) do
    Cachex.put(:cgraph_cache, "orchestrator:pipeline:#{id}", state, ttl: :timer.hours(24))
  end

  defp get_pipeline_state(id) do
    case Cachex.get(:cgraph_cache, "orchestrator:pipeline:#{id}") do
      {:ok, state} -> state
      _ -> nil
    end
  end

  defp update_pipeline_progress(id, index, status, result) do
    case get_pipeline_state(id) do
      nil -> :ok
      state ->
        progress = Map.get(state, :progress, %{})
        updated_progress = Map.put(progress, index, %{status: status, result: result})
        store_pipeline_state(id, Map.put(state, :progress, updated_progress))
    end
  end

  defp complete_pipeline(id, status) do
    case get_pipeline_state(id) do
      nil -> :ok
      state ->
        updated_state = state
        |> Map.put(:status, status)
        |> Map.put(:completed_at, DateTime.utc_now())

        store_pipeline_state(id, updated_state)

        # Trigger completion callback if configured
        case {status, state.on_complete, state.on_failure} do
          {:success, {worker, args}, _} -> Orchestrator.enqueue(worker, args)
          {{:failure, _}, _, {worker, args}} -> Orchestrator.enqueue(worker, args)
          _ -> :ok
        end
    end
  end
end
