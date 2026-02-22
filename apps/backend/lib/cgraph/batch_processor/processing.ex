defmodule CGraph.BatchProcessor.Processing do
  @moduledoc false

  require Logger

  alias CGraph.BatchProcessor.Progress
  alias CGraph.Repo

  @default_config %{
    default_batch_size: 100,
    default_concurrency: 4,
    max_concurrency: 20,
    progress_interval: 1000,
    checkpoint_interval: 5000,
    default_timeout: :timer.minutes(5)
  }

  # ---------------------------------------------------------------------------
  # Synchronous Processing
  # ---------------------------------------------------------------------------

  @doc """
  Process items synchronously with parallel execution.
  """
  @spec process(list(), (term() -> term()), keyword()) :: {:ok, map()}
  def process(items, processor, opts \\ []) when is_function(processor, 1) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    batch_id = generate_batch_id()
    total = length(items)

    opts = merge_options(opts)

    Logger.info("batchprocessor_starting_batch_with_items", batch_id: batch_id, total: total)

    start_time = System.monotonic_time(:millisecond)

    # Initialize progress tracking
    Progress.init_progress(batch_id, total)

    # Process items in parallel batches
    result = do_process(batch_id, items, processor, opts)

    end_time = System.monotonic_time(:millisecond)
    duration = end_time - start_time

    final_result = Map.put(result, :duration_ms, duration)

    Logger.info("batchprocessor_completed_batch_succeeded_in_ms",
      batch_id: batch_id,
      result_succeeded: result.succeeded,
      total: total,
      duration: duration
    )

    Progress.cleanup_progress(batch_id)

    {:ok, final_result}
  end

  @doc """
  Process items in batches using a batch processor function.
  """
  @spec process_batches(list(), (term() -> term()), keyword()) :: {:ok, map()}
  def process_batches(items, processor, opts \\ []) when is_function(processor, 1) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    batch_id = generate_batch_id()
    batch_size = Keyword.get(opts, :batch_size, get_config(:default_batch_size))

    opts = merge_options(opts)
    total = length(items)

    Logger.info("batchprocessor_starting_batched_processing_with_it",
      batch_id: batch_id,
      total: total
    )

    start_time = System.monotonic_time(:millisecond)
    Progress.init_progress(batch_id, total)

    # Split into batches and process
    batches = Enum.chunk_every(items, batch_size)

    result =
      process_batch_chunks(batch_id, batches, processor, opts, %{
        succeeded: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        results: []
      })

    end_time = System.monotonic_time(:millisecond)

    final_result =
      result
      |> Map.put(:batch_id, batch_id)
      |> Map.put(:total, total)
      |> Map.put(:duration_ms, end_time - start_time)

    Progress.cleanup_progress(batch_id)

    {:ok, final_result}
  end

  @doc """
  Stream process records from an Ecto query.
  """
  @spec stream_process(Ecto.Queryable.t(), (term() -> term()), keyword()) :: {:ok, map()} | {:error, term()}
  def stream_process(query, processor, opts \\ []) when is_function(processor, 1) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    batch_id = generate_batch_id()
    batch_size = Keyword.get(opts, :batch_size, get_config(:default_batch_size))

    opts = merge_options(opts)

    Logger.info("batchprocessor_starting_stream_processing", batch_id: batch_id)

    start_time = System.monotonic_time(:millisecond)

    # Count total (optional, can be expensive for large tables)
    total =
      if Keyword.get(opts, :count_total, true) do
        Repo.aggregate(query, :count)
      else
        0
      end

    Progress.init_progress(batch_id, total)

    # Process in transaction for consistent read
    result =
      Repo.transaction(
        fn ->
          query
          |> Repo.stream(max_rows: batch_size)
          |> Stream.chunk_every(batch_size)
          |> Enum.reduce(
            %{succeeded: 0, failed: 0, skipped: 0, errors: [], results: []},
            fn batch, acc ->
              batch_result = process_single_batch(batch, processor, opts)
              merge_batch_result(acc, batch_result)
            end
          )
        end,
        timeout: Keyword.get(opts, :transaction_timeout, :infinity)
      )

    case result do
      {:ok, batch_result} ->
        end_time = System.monotonic_time(:millisecond)

        final_result =
          batch_result
          |> Map.put(:batch_id, batch_id)
          |> Map.put(:total, total)
          |> Map.put(:duration_ms, end_time - start_time)

        Progress.cleanup_progress(batch_id)
        {:ok, final_result}

      {:error, reason} ->
        Progress.cleanup_progress(batch_id)
        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions - Processing
  # ---------------------------------------------------------------------------

  defp do_process(batch_id, items, processor, opts) do
    concurrency = Keyword.get(opts, :concurrency)
    timeout = Keyword.get(opts, :timeout)
    on_error = Keyword.get(opts, :on_error, :skip)
    max_retries = Keyword.get(opts, :max_retries, 3)
    progress_callback = Keyword.get(opts, :progress_callback)

    # Process items in parallel using Task.async_stream
    items
    |> Enum.with_index()
    |> Task.async_stream(
      fn {item, index} ->
        result = process_item_with_retry(item, processor, on_error, max_retries)
        Progress.update_progress(batch_id, index + 1, result, progress_callback)
        {index, result}
      end,
      max_concurrency: concurrency,
      timeout: timeout,
      on_timeout: :kill_task
    )
    |> Enum.reduce(
      %{
        batch_id: batch_id,
        succeeded: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        results: []
      },
      fn
        {:ok, {_index, {:ok, result}}}, acc ->
          %{acc | succeeded: acc.succeeded + 1, results: [result | acc.results]}

        {:ok, {index, {:error, error}}}, acc ->
          %{acc | failed: acc.failed + 1, errors: [%{index: index, error: error} | acc.errors]}

        {:ok, {_index, :skipped}}, acc ->
          %{acc | skipped: acc.skipped + 1}

        {:exit, _reason}, acc ->
          %{acc | failed: acc.failed + 1}
      end
    )
    |> Map.update!(:results, &Enum.reverse/1)
    |> Map.update!(:errors, &Enum.reverse/1)
  end

  defp process_item_with_retry(item, processor, on_error, max_retries, attempt \\ 1) do
    case processor.(item) do
      {:ok, result} -> {:ok, result}
      {:error, error} -> handle_item_error(item, processor, on_error, max_retries, attempt, error)
      :ok -> {:ok, nil}
      result -> {:ok, result}
    end
  rescue
    e ->
      handle_item_error(item, processor, on_error, max_retries, attempt, Exception.message(e))
  end

  defp handle_item_error(item, processor, on_error, max_retries, attempt, error) do
    case on_error do
      :skip ->
        :skipped

      :fail ->
        {:error, error}

      :retry when attempt < max_retries ->
        # Exponential backoff
        delay = :math.pow(2, attempt) * 100 |> trunc()
        Process.sleep(delay)
        process_item_with_retry(item, processor, on_error, max_retries, attempt + 1)

      :retry ->
        {:error, error}
    end
  end

  defp process_batch_chunks(_batch_id, [], _processor, _opts, acc), do: acc

  defp process_batch_chunks(batch_id, [batch | rest], processor, opts, acc) do
    batch_result = process_single_batch(batch, processor, opts)
    new_acc = merge_batch_result(acc, batch_result)

    # Update progress
    processed = acc.succeeded + acc.failed + acc.skipped + length(batch)

    if callback = opts[:progress_callback] do
      callback.(%{processed: processed})
    end

    process_batch_chunks(batch_id, rest, processor, opts, new_acc)
  end

  defp process_single_batch(batch, processor, opts) do
    on_error = Keyword.get(opts, :on_error, :skip)

    try do
      case processor.(batch) do
        {:ok, results} when is_list(results) ->
          %{succeeded: length(results), failed: 0, skipped: 0, errors: [], results: results}

        {:ok, result} ->
          %{succeeded: length(batch), failed: 0, skipped: 0, errors: [], results: [result]}

        {:error, error} ->
          case on_error do
            :skip -> %{succeeded: 0, failed: 0, skipped: length(batch), errors: [], results: []}
            _ -> %{succeeded: 0, failed: length(batch), skipped: 0, errors: [error], results: []}
          end
      end
    rescue
      e ->
        %{
          succeeded: 0,
          failed: length(batch),
          skipped: 0,
          errors: [Exception.message(e)],
          results: []
        }
    end
  end

  defp merge_batch_result(acc, batch_result) do
    %{
      succeeded: acc.succeeded + batch_result.succeeded,
      failed: acc.failed + batch_result.failed,
      skipped: acc.skipped + batch_result.skipped,
      errors: acc.errors ++ batch_result.errors,
      results: acc.results ++ batch_result.results
    }
  end

  # ---------------------------------------------------------------------------
  # Private Functions - Configuration
  # ---------------------------------------------------------------------------

  defp merge_options(opts) do
    defaults = [
      batch_size: get_config(:default_batch_size),
      concurrency: get_config(:default_concurrency),
      timeout: get_config(:default_timeout),
      on_error: :skip,
      max_retries: 3
    ]

    Keyword.merge(defaults, opts)
  end

  defp get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.BatchProcessor, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end

  @doc false
  def generate_batch_id do
    "batch_" <> Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
  end
end
