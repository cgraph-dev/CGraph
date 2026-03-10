defmodule CGraph.Jobs.Scheduling do
  @moduledoc """
  Job scheduling and enqueueing logic.

  Provides functions for creating and scheduling background jobs through Oban,
  including immediate, delayed, scheduled, and recurring jobs.
  """

  alias CGraph.Repo

  @stats_table :cgraph_job_stats

  # ---------------------------------------------------------------------------
  # Public API
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

      iex> CGraph.Jobs.Scheduling.enqueue(MyWorker, %{user_id: 123})
      {:ok, %Oban.Job{id: 1}}

      iex> CGraph.Jobs.Scheduling.enqueue(MyWorker, %{user_id: 123}, delay: 5000)
      {:ok, %Oban.Job{id: 2}}
  """
  @spec enqueue(module(), map(), keyword()) :: {:ok, Oban.Job.t()} | {:error, term()}
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

      iex> CGraph.Jobs.Scheduling.enqueue_and_wait(MyWorker, %{user_id: 123})
      {:ok, result}

      iex> CGraph.Jobs.Scheduling.enqueue_and_wait(MyWorker, %{user_id: 123}, timeout: 60_000)
      {:ok, result}
  """
  @spec enqueue_and_wait(module(), map(), keyword()) :: {:ok, term()} | {:error, term()}
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

      {:ok, inserted_jobs} = CGraph.Jobs.Scheduling.enqueue_many(jobs)
  """
  @spec enqueue_many([{module(), map()} | {module(), map(), keyword()}]) ::
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
      CGraph.Jobs.Scheduling.schedule_recurring(:hourly_cleanup, CleanupWorker, %{}, "0 * * * *")

      # Every day at midnight
      CGraph.Jobs.Scheduling.schedule_recurring(:daily_report, ReportWorker, %{}, "0 0 * * *")
  """
  @spec schedule_recurring(atom(), module(), map(), String.t()) :: :ok | {:error, term()}
  def schedule_recurring(name, worker, args, cron_expression) do
    GenServer.call(CGraph.Jobs.Server, {:schedule_recurring, name, worker, args, cron_expression})
  end

  @doc """
  Cancel a scheduled recurring job.
  """
  @spec cancel_recurring(atom()) :: :ok | {:error, :not_found}
  def cancel_recurring(name) do
    GenServer.call(CGraph.Jobs.Server, {:cancel_recurring, name})
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
end
