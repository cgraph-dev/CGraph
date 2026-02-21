defmodule CGraph.Jobs.Progress do
  @moduledoc """
  Job progress tracking via ETS and PubSub.

  Provides real-time progress updates for long-running jobs stored in ETS
  for fast access, with optional PubSub broadcast for UI integration.
  """

  @progress_table :cgraph_job_progress

  @default_config %{
    broadcast_progress: true
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Update the progress of a job.

  Progress updates are stored in ETS for fast access and optionally broadcast
  via PubSub for real-time UI updates.

  ## Examples

      def perform(%Oban.Job{id: job_id}) do
        CGraph.Jobs.Progress.update_progress(job_id, 0, "Starting...")

        # Do work...
        CGraph.Jobs.Progress.update_progress(job_id, 50, "Halfway done")

        # More work...
        CGraph.Jobs.Progress.update_progress(job_id, 100, "Complete!")
        :ok
      end
  """
  @spec update_progress(pos_integer(), 0..100, String.t()) :: :ok
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
        CGraph.PubSub,
        "job_progress:#{job_id}",
        {:job_progress, progress}
      )
    end

    :ok
  end

  @doc """
  Get the current progress of a job.
  """
  @spec get_progress(pos_integer()) :: {:ok, map()} | {:error, :not_found}
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
  @spec subscribe_to_progress(pos_integer()) :: :ok
  def subscribe_to_progress(job_id) do
    Phoenix.PubSub.subscribe(CGraph.PubSub, "job_progress:#{job_id}")
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp get_config(key) do
    stats_table = :cgraph_job_stats

    case :ets.lookup(stats_table, {:config, key}) do
      [{{:config, ^key}, value}] -> value
      [] -> Map.get(@default_config, key)
    end
  end
end
