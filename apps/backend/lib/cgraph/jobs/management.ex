defmodule CGraph.Jobs.Management do
  @moduledoc """
  Operational job management — querying, cancelling, retrying, and queue control.
  """

  import Ecto.Query

  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Get a job by ID.
  """
  @spec get_job(pos_integer()) :: {:ok, Oban.Job.t()} | {:error, :not_found}
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
  @spec cancel_job(pos_integer()) :: :ok | {:error, term()}
  def cancel_job(job_id) do
    case Oban.cancel_job(job_id) do
      :ok -> :ok
      error -> error
    end
  end

  @doc """
  Retry a failed job immediately.
  """
  @spec retry_job(pos_integer()) :: :ok | {:error, term()}
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
end
