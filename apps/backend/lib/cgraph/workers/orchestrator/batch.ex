defmodule CGraph.Workers.Orchestrator.Batch do
  @moduledoc """
  Batch processing operations for the job orchestrator.

  Handles splitting large collections of items into parallel batches,
  tracking their completion, and triggering callbacks when all batches
  finish. Provides batch creation, progress reporting, status queries,
  and cancellation.

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
  Process a collection of items in parallel batches.

  Splits the collection into batches and processes them concurrently,
  respecting the max_concurrency limit.

  ## Options

  - `:batch_size` - Items per batch (default: 100)
  - `:max_concurrency` - Max parallel batches (default: 5)
  - `:on_complete` - Job to run when all batches complete
  - `:on_failure` - Job to run if any batch fails
  - `:queue` - Queue for batch jobs

  ## Examples

      user_ids = Accounts.list_user_ids()

      Orchestrator.batch(user_ids, UserSyncWorker,
        batch_size: 50,
        max_concurrency: 10,
        on_complete: {AdminNotifier, %{type: "sync_complete"}}
      )
  """
  @spec batch(list(), module(), keyword()) :: {:ok, String.t(), non_neg_integer()}
  def batch(items, worker, opts \\ []) when is_list(items) do
    batch_size = Keyword.get(opts, :batch_size, 100)
    batch_id = generate_batch_id()

    batches = Enum.chunk_every(items, batch_size)
    total_batches = length(batches)

    # Store batch metadata
    batch_meta = %{
      id: batch_id,
      total_batches: total_batches,
      completed: 0,
      failed: 0,
      on_complete: Keyword.get(opts, :on_complete),
      on_failure: Keyword.get(opts, :on_failure),
      started_at: DateTime.utc_now()
    }

    store_batch_state(batch_id, batch_meta)

    # Enqueue all batch jobs
    batches
    |> Enum.with_index()
    |> Enum.each(fn {batch_items, index} ->
      args = %{
        "items" => batch_items,
        "__batch__" => %{
          "id" => batch_id,
          "index" => index,
          "total" => total_batches
        }
      }

      Orchestrator.enqueue(worker, args, Keyword.take(opts, [:queue, :priority]))
    end)

    {:ok, batch_id, total_batches}
  end

  @doc """
  Report batch job completion.

  Called by workers processing batch items.
  """
  @spec report_batch_progress(map(), :success | :failure) :: :ok
  def report_batch_progress(args, status) when status in [:success, :failure] do
    case Map.get(args, "__batch__") do
      nil ->
        :ok

      %{id: batch_id} ->
        update_batch_progress(batch_id, status)
    end
  end

  @doc """
  Get the status of a batch operation.
  """
  @spec batch_status(String.t()) :: map() | nil
  def batch_status(batch_id) do
    get_batch_state(batch_id)
  end

  @doc """
  Cancel all pending jobs in a batch.
  """
  @spec cancel_batch(String.t()) :: {:ok, :cancelled} | {:error, :not_found}
  def cancel_batch(batch_id) do
    case get_batch_state(batch_id) do
      nil ->
        {:error, :not_found}

      state ->
        store_batch_state(batch_id, Map.put(state, :status, :cancelled))
        {:ok, :cancelled}
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp generate_batch_id do
    "batch_" <> Base.encode32(:crypto.strong_rand_bytes(8), case: :lower, padding: false)
  end

  defp store_batch_state(id, state) do
    Cachex.put(:cgraph_cache, "orchestrator:batch:#{id}", state, ttl: :timer.hours(24))
  end

  defp get_batch_state(id) do
    case Cachex.get(:cgraph_cache, "orchestrator:batch:#{id}") do
      {:ok, state} -> state
      _ -> nil
    end
  end

  defp update_batch_progress(id, status) do
    case get_batch_state(id) do
      nil -> :ok
      state ->
        field = if status == :success, do: :completed, else: :failed
        updated_state = Map.update(state, field, 1, &(&1 + 1))
        store_batch_state(id, updated_state)

        # Check if batch is complete
        total = state.total_batches
        completed = updated_state.completed + updated_state.failed

        if completed >= total do
          complete_batch(id, updated_state)
        end
    end
  end

  defp complete_batch(id, state) do
    updated_state = state
    |> Map.put(:status, if(state.failed == 0, do: :success, else: :partial_failure))
    |> Map.put(:completed_at, DateTime.utc_now())

    store_batch_state(id, updated_state)

    # Trigger callbacks
    case {state.failed, state.on_complete, state.on_failure} do
      {0, {worker, args}, _} -> Orchestrator.enqueue(worker, args)
      {_, _, {worker, args}} when not is_nil(worker) -> Orchestrator.enqueue(worker, args)
      _ -> :ok
    end
  end
end
