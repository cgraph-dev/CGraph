defmodule CGraph.BatchProcessor.Progress do
  @moduledoc false

  @progress_table :cgraph_batch_progress

  @default_config %{
    progress_interval: 1000
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Get current progress for a batch.
  """
  def get_progress(batch_id) do
    case :ets.lookup(@progress_table, batch_id) do
      [{^batch_id, progress}] -> progress
      [] -> nil
    end
  end

  @doc """
  Subscribe to progress updates for a batch.
  """
  def subscribe(batch_id) do
    Phoenix.PubSub.subscribe(CGraph.PubSub, "batch_progress:#{batch_id}")
  end

  # ---------------------------------------------------------------------------
  # Internal API (used by Processing and AsyncJobs)
  # ---------------------------------------------------------------------------

  @doc false
  def init_progress(batch_id, total) do
    progress = %{
      batch_id: batch_id,
      total: total,
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      percentage: 0.0,
      elapsed_ms: 0,
      estimated_remaining_ms: nil,
      items_per_second: 0.0,
      started_at: System.monotonic_time(:millisecond)
    }

    :ets.insert(@progress_table, {batch_id, progress})
  end

  @doc false
  def update_progress(batch_id, processed, result, callback) do
    case :ets.lookup(@progress_table, batch_id) do
      [{^batch_id, progress}] ->
        now = System.monotonic_time(:millisecond)
        elapsed = now - progress.started_at
        {succeeded_inc, failed_inc, skipped_inc} = count_result(result)

        new_progress = %{
          progress
          | processed: processed,
            succeeded: progress.succeeded + succeeded_inc,
            failed: progress.failed + failed_inc,
            skipped: progress.skipped + skipped_inc,
            percentage: calculate_percentage(processed, progress.total),
            elapsed_ms: elapsed,
            items_per_second: calculate_rate(processed, elapsed),
            estimated_remaining_ms: estimate_remaining(progress.total, processed, elapsed)
        }

        :ets.insert(@progress_table, {batch_id, new_progress})

        # Broadcast progress update
        Phoenix.PubSub.broadcast(
          CGraph.PubSub,
          "batch_progress:#{batch_id}",
          {:batch_progress, new_progress}
        )

        # Call progress callback
        if callback && rem(processed, get_config(:progress_interval)) == 0 do
          callback.(new_progress)
        end

      [] ->
        :ok
    end
  end

  @doc false
  def cleanup_progress(batch_id) do
    :ets.delete(@progress_table, batch_id)
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp count_result({:ok, _}), do: {1, 0, 0}
  defp count_result({:error, _}), do: {0, 1, 0}
  defp count_result(:skipped), do: {0, 0, 1}
  defp count_result(_), do: {0, 0, 0}

  defp calculate_percentage(_processed, 0), do: 0
  defp calculate_percentage(processed, total), do: processed / total * 100

  defp calculate_rate(_processed, 0), do: 0.0
  defp calculate_rate(processed, elapsed), do: processed / (elapsed / 1000)

  defp estimate_remaining(total, processed, elapsed) when processed > 0 do
    remaining = total - processed
    avg_time_per_item = elapsed / processed
    trunc(remaining * avg_time_per_item)
  end

  defp estimate_remaining(_, _, _), do: nil

  defp get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.BatchProcessor, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
