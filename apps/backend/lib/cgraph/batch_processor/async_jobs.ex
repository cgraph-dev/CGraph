defmodule CGraph.BatchProcessor.AsyncJobs do
  @moduledoc false

  alias CGraph.BatchProcessor.{Processing, Progress}

  @jobs_table :cgraph_batch_jobs

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start an asynchronous batch processing job.

  Returns immediately with a job ID that can be used to check progress.
  """
  def start_async(items, processor, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    batch_id = Processing.generate_batch_id()
    name = Keyword.get(opts, :name, batch_id)

    job = %{
      id: batch_id,
      name: name,
      status: :pending,
      total: length(items),
      started_at: DateTime.utc_now(),
      completed_at: nil
    }

    :ets.insert(@jobs_table, {batch_id, job})

    Task.start(fn ->
      update_job_status(batch_id, :running)

      # process/3 always returns {:ok, result}
      {:ok, result} = Processing.process(items, processor, opts)
      update_job_status(batch_id, :completed, result)
    end)

    {:ok, batch_id}
  end

  @doc """
  Get the status of an async batch job.
  """
  def get_status(batch_id) do
    case :ets.lookup(@jobs_table, batch_id) do
      [{^batch_id, job}] ->
        progress = Progress.get_progress(batch_id)
        {:ok, Map.merge(job, %{progress: progress})}

      [] ->
        {:error, :not_found}
    end
  end

  @doc """
  Cancel an async batch job.
  """
  def cancel(batch_id) do
    case :ets.lookup(@jobs_table, batch_id) do
      [{^batch_id, job}] when job.status == :running ->
        update_job_status(batch_id, :cancelled)
        :ok

      [{^batch_id, _}] ->
        {:error, :not_running}

      [] ->
        {:error, :not_found}
    end
  end

  @doc """
  List all batch jobs.
  """
  def list_jobs(opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    status_filter = Keyword.get(opts, :status)
    limit = Keyword.get(opts, :limit, 100)

    case :ets.whereis(@jobs_table) do
      :undefined ->
        []

      _ ->
        :ets.tab2list(@jobs_table)
        |> Enum.map(fn {_id, job} -> job end)
        |> Enum.filter(fn job ->
          is_nil(status_filter) or job.status == status_filter
        end)
        |> Enum.sort_by(& &1.started_at, {:desc, DateTime})
        |> Enum.take(limit)
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp update_job_status(batch_id, status, result \\ nil) do
    case :ets.lookup(@jobs_table, batch_id) do
      [{^batch_id, job}] ->
        updated = %{
          job
          | status: status,
            completed_at: if(status in [:completed, :failed, :cancelled], do: DateTime.utc_now()),
            result: result
        }

        :ets.insert(@jobs_table, {batch_id, updated})

      [] ->
        :ok
    end
  end
end
