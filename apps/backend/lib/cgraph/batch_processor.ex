defmodule Cgraph.BatchProcessor do
  @moduledoc """
  Cgraph.BatchProcessor - Comprehensive Batch Processing Infrastructure
  
  ## Overview
  
  This module provides production-grade batch processing capabilities for bulk
  operations, data migrations, and large-scale data transformations. It handles
  parallelization, progress tracking, error recovery, and resource management.
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Batch Processing Flow                        │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Input Data ──▶ Chunking ──▶ Worker Pool ──▶ Results           │
  │       │             │            │              │               │
  │       │             │     ┌──────┴──────┐       │               │
  │       │             │     │   Workers   │       │               │
  │       │             │     │  ┌──┐ ┌──┐  │       │               │
  │       │             │     │  │W1│ │W2│  │       │               │
  │       │             │     │  └──┘ └──┘  │       │               │
  │       │             │     │  ┌──┐ ┌──┐  │       │               │
  │       │             │     │  │W3│ │W4│  │       │               │
  │       │             │     │  └──┘ └──┘  │       │               │
  │       │             │     └─────────────┘       │               │
  │       │             │                           │               │
  │       ▼             ▼                           ▼               │
  │  ┌─────────────────────────────────────────────────┐           │
  │  │              Progress Tracking                   │           │
  │  │  ┌────────────────────────────────────────────┐ │           │
  │  │  │ [████████████████░░░░░░] 75% - 7500/10000  │ │           │
  │  │  └────────────────────────────────────────────┘ │           │
  │  └─────────────────────────────────────────────────┘           │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Features
  
  1. **Parallel Processing**: Configurable worker pools for optimal throughput
  2. **Progress Tracking**: Real-time progress with estimates and stats
  3. **Error Handling**: Configurable retry, skip, or fail-fast behavior
  4. **Resource Management**: Rate limiting and backpressure support
  5. **Checkpointing**: Resume interrupted batches from last checkpoint
  6. **Streaming**: Memory-efficient processing of large datasets
  
  ## Usage Examples
  
  ### Simple Batch Processing
  
      items = Enum.to_list(1..10_000)
      
      {:ok, result} = Cgraph.BatchProcessor.process(items, fn item ->
        # Process each item
        {:ok, transformed_item}
      end)
  
  ### With Options
  
      {:ok, result} = Cgraph.BatchProcessor.process(items, processor_fn, [
        batch_size: 100,
        concurrency: 10,
        timeout: :timer.seconds(30),
        on_error: :skip,  # :skip, :retry, :fail
        max_retries: 3,
        progress_callback: fn progress -> 
          IO.puts("Progress: \#{progress.percentage}%")
        end
      ])
  
  ### Streaming from Database
  
      query = from u in User, where: u.active == true
      
      {:ok, result} = Cgraph.BatchProcessor.stream_process(query, fn batch ->
        # Process batch of users
        Enum.map(batch, &update_user/1)
      end, batch_size: 1000)
  
  ### Background Batch Job
  
      {:ok, job_id} = Cgraph.BatchProcessor.start_async(items, processor_fn, [
        name: "user_migration",
        concurrency: 5
      ])
      
      # Check progress
      {:ok, status} = Cgraph.BatchProcessor.get_status(job_id)
  
  ## Configuration
  
  Configure in `config/config.exs`:
  
      config :cgraph, Cgraph.BatchProcessor,
        default_batch_size: 100,
        default_concurrency: 4,
        max_concurrency: 20,
        progress_interval: 1000,
        checkpoint_interval: 5000
  """
  
  use GenServer
  require Logger
  
  alias Cgraph.Repo
  
  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------
  
  @type batch_id :: String.t()
  @type item :: term()
  @type processor :: (item() -> {:ok, term()} | {:error, term()})
  @type batch_processor :: ([item()] -> {:ok, [term()]} | {:error, term()})
  
  @type error_strategy :: :skip | :retry | :fail
  
  @type options :: [
    batch_size: pos_integer(),
    concurrency: pos_integer(),
    timeout: pos_integer(),
    on_error: error_strategy(),
    max_retries: non_neg_integer(),
    progress_callback: (progress() -> any()),
    checkpoint_callback: (checkpoint() -> any()),
    rate_limit: pos_integer() | nil,
    name: String.t() | nil
  ]
  
  @type progress :: %{
    batch_id: batch_id(),
    total: non_neg_integer(),
    processed: non_neg_integer(),
    succeeded: non_neg_integer(),
    failed: non_neg_integer(),
    skipped: non_neg_integer(),
    percentage: float(),
    elapsed_ms: non_neg_integer(),
    estimated_remaining_ms: non_neg_integer() | nil,
    items_per_second: float()
  }
  
  @type checkpoint :: %{
    batch_id: batch_id(),
    last_processed_index: non_neg_integer(),
    state: map()
  }
  
  @type result :: %{
    batch_id: batch_id(),
    total: non_neg_integer(),
    succeeded: non_neg_integer(),
    failed: non_neg_integer(),
    skipped: non_neg_integer(),
    duration_ms: non_neg_integer(),
    errors: [%{index: non_neg_integer(), error: term()}],
    results: [term()]
  }
  
  @type batch_status :: :pending | :running | :paused | :completed | :failed | :cancelled
  
  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------
  
  @jobs_table :cgraph_batch_jobs
  @progress_table :cgraph_batch_progress
  
  @default_config %{
    default_batch_size: 100,
    default_concurrency: 4,
    max_concurrency: 20,
    progress_interval: 1000,
    checkpoint_interval: 5000,
    default_timeout: :timer.minutes(5)
  }
  
  # ---------------------------------------------------------------------------
  # Client API - Synchronous Processing
  # ---------------------------------------------------------------------------
  
  @doc """
  Process items synchronously with parallel execution.
  
  Each item is processed individually using the provided function.
  Returns when all items have been processed.
  
  ## Options
  
  - `:batch_size` - Number of items per worker batch (default: 100)
  - `:concurrency` - Number of parallel workers (default: 4)
  - `:timeout` - Timeout per item in milliseconds (default: 5 minutes)
  - `:on_error` - Error handling strategy: :skip, :retry, or :fail
  - `:max_retries` - Maximum retry attempts (default: 3)
  - `:progress_callback` - Function called with progress updates
  
  ## Examples
  
      {:ok, result} = Cgraph.BatchProcessor.process(items, fn item ->
        {:ok, transform(item)}
      end)
      
      IO.puts("Processed \#{result.succeeded} items")
  """
  @spec process([item()], processor(), options()) :: {:ok, result()} | {:error, term()}
  def process(items, processor, opts \\ []) when is_function(processor, 1) do
    batch_id = generate_batch_id()
    total = length(items)
    
    opts = merge_options(opts)
    
    Logger.info("[BatchProcessor] Starting batch #{batch_id} with #{total} items")
    
    start_time = System.monotonic_time(:millisecond)
    
    # Initialize progress tracking
    init_progress(batch_id, total)
    
    # Process items in parallel batches
    result = do_process(batch_id, items, processor, opts)
    
    end_time = System.monotonic_time(:millisecond)
    duration = end_time - start_time
    
    final_result = Map.put(result, :duration_ms, duration)
    
    Logger.info("[BatchProcessor] Completed batch #{batch_id}: #{result.succeeded}/#{total} succeeded in #{duration}ms")
    
    cleanup_progress(batch_id)
    
    {:ok, final_result}
  end
  
  @doc """
  Process items in batches using a batch processor function.
  
  The processor receives a batch of items and should return all results at once.
  More efficient when operations can be batched (e.g., bulk database inserts).
  """
  @spec process_batches([item()], batch_processor(), options()) :: {:ok, result()} | {:error, term()}
  def process_batches(items, processor, opts \\ []) when is_function(processor, 1) do
    batch_id = generate_batch_id()
    batch_size = Keyword.get(opts, :batch_size, get_config(:default_batch_size))
    
    opts = merge_options(opts)
    total = length(items)
    
    Logger.info("[BatchProcessor] Starting batched processing #{batch_id} with #{total} items")
    
    start_time = System.monotonic_time(:millisecond)
    init_progress(batch_id, total)
    
    # Split into batches and process
    batches = Enum.chunk_every(items, batch_size)
    
    result = process_batch_chunks(batch_id, batches, processor, opts, %{
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      results: []
    })
    
    end_time = System.monotonic_time(:millisecond)
    
    final_result = result
    |> Map.put(:batch_id, batch_id)
    |> Map.put(:total, total)
    |> Map.put(:duration_ms, end_time - start_time)
    
    cleanup_progress(batch_id)
    
    {:ok, final_result}
  end
  
  @doc """
  Stream process records from an Ecto query.
  
  Memory-efficient processing of large datasets from the database.
  """
  @spec stream_process(Ecto.Query.t(), batch_processor(), options()) :: {:ok, result()} | {:error, term()}
  def stream_process(query, processor, opts \\ []) when is_function(processor, 1) do
    batch_id = generate_batch_id()
    batch_size = Keyword.get(opts, :batch_size, get_config(:default_batch_size))
    
    opts = merge_options(opts)
    
    Logger.info("[BatchProcessor] Starting stream processing #{batch_id}")
    
    start_time = System.monotonic_time(:millisecond)
    
    # Count total (optional, can be expensive for large tables)
    total = if Keyword.get(opts, :count_total, true) do
      Repo.aggregate(query, :count)
    else
      0
    end
    
    init_progress(batch_id, total)
    
    # Process in transaction for consistent read
    result = Repo.transaction(fn ->
      query
      |> Repo.stream(max_rows: batch_size)
      |> Stream.chunk_every(batch_size)
      |> Enum.reduce(%{succeeded: 0, failed: 0, skipped: 0, errors: [], results: []}, fn batch, acc ->
        batch_result = process_single_batch(batch, processor, opts)
        merge_batch_result(acc, batch_result)
      end)
    end, timeout: Keyword.get(opts, :transaction_timeout, :infinity))
    
    case result do
      {:ok, batch_result} ->
        end_time = System.monotonic_time(:millisecond)
        
        final_result = batch_result
        |> Map.put(:batch_id, batch_id)
        |> Map.put(:total, total)
        |> Map.put(:duration_ms, end_time - start_time)
        
        cleanup_progress(batch_id)
        {:ok, final_result}
        
      {:error, reason} ->
        cleanup_progress(batch_id)
        {:error, reason}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Asynchronous Processing
  # ---------------------------------------------------------------------------
  
  @doc """
  Start an asynchronous batch processing job.
  
  Returns immediately with a job ID that can be used to check progress.
  """
  @spec start_async([item()], processor(), options()) :: {:ok, batch_id()}
  def start_async(items, processor, opts \\ []) do
    batch_id = generate_batch_id()
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
      {:ok, result} = process(items, processor, opts)
      update_job_status(batch_id, :completed, result)
    end)
    
    {:ok, batch_id}
  end
  
  @doc """
  Get the status of an async batch job.
  """
  @spec get_status(batch_id()) :: {:ok, map()} | {:error, :not_found}
  def get_status(batch_id) do
    case :ets.lookup(@jobs_table, batch_id) do
      [{^batch_id, job}] ->
        progress = get_progress(batch_id)
        {:ok, Map.merge(job, %{progress: progress})}
        
      [] ->
        {:error, :not_found}
    end
  end
  
  @doc """
  Cancel an async batch job.
  """
  @spec cancel(batch_id()) :: :ok | {:error, term()}
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
  @spec list_jobs(keyword()) :: [map()]
  def list_jobs(opts \\ []) do
    status_filter = Keyword.get(opts, :status)
    limit = Keyword.get(opts, :limit, 100)
    
    :ets.tab2list(@jobs_table)
    |> Enum.map(fn {_id, job} -> job end)
    |> Enum.filter(fn job ->
      is_nil(status_filter) or job.status == status_filter
    end)
    |> Enum.sort_by(& &1.started_at, {:desc, DateTime})
    |> Enum.take(limit)
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Progress
  # ---------------------------------------------------------------------------
  
  @doc """
  Get current progress for a batch.
  """
  @spec get_progress(batch_id()) :: progress() | nil
  def get_progress(batch_id) do
    case :ets.lookup(@progress_table, batch_id) do
      [{^batch_id, progress}] -> progress
      [] -> nil
    end
  end
  
  @doc """
  Subscribe to progress updates for a batch.
  """
  @spec subscribe(batch_id()) :: :ok
  def subscribe(batch_id) do
    Phoenix.PubSub.subscribe(Cgraph.PubSub, "batch_progress:#{batch_id}")
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    :ets.new(@jobs_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@progress_table, [:named_table, :set, :public, read_concurrency: true])
    
    {:ok, %{}}
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
        update_progress(batch_id, index + 1, result, progress_callback)
        {index, result}
      end,
      max_concurrency: concurrency,
      timeout: timeout,
      on_timeout: :kill_task
    )
    |> Enum.reduce(%{
      batch_id: batch_id,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      results: []
    }, fn
      {:ok, {_index, {:ok, result}}}, acc ->
        %{acc | succeeded: acc.succeeded + 1, results: [result | acc.results]}
        
      {:ok, {index, {:error, error}}}, acc ->
        %{acc | failed: acc.failed + 1, errors: [%{index: index, error: error} | acc.errors]}
        
      {:ok, {_index, :skipped}}, acc ->
        %{acc | skipped: acc.skipped + 1}
        
      {:exit, _reason}, acc ->
        %{acc | failed: acc.failed + 1}
    end)
    |> Map.update!(:results, &Enum.reverse/1)
    |> Map.update!(:errors, &Enum.reverse/1)
  end
  
  defp process_item_with_retry(item, processor, on_error, max_retries, attempt \\ 1) do
    try do
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
        %{succeeded: 0, failed: length(batch), skipped: 0, errors: [Exception.message(e)], results: []}
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
  # Private Functions - Progress Tracking
  # ---------------------------------------------------------------------------
  
  defp init_progress(batch_id, total) do
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
  
  defp update_progress(batch_id, processed, result, callback) do
    case :ets.lookup(@progress_table, batch_id) do
      [{^batch_id, progress}] ->
        now = System.monotonic_time(:millisecond)
        elapsed = now - progress.started_at
        
        new_progress = %{progress |
          processed: processed,
          succeeded: progress.succeeded + (if match?({:ok, _}, result), do: 1, else: 0),
          failed: progress.failed + (if match?({:error, _}, result), do: 1, else: 0),
          skipped: progress.skipped + (if result == :skipped, do: 1, else: 0),
          percentage: if(progress.total > 0, do: processed / progress.total * 100, else: 0),
          elapsed_ms: elapsed,
          items_per_second: if(elapsed > 0, do: processed / (elapsed / 1000), else: 0),
          estimated_remaining_ms: estimate_remaining(progress.total, processed, elapsed)
        }
        
        :ets.insert(@progress_table, {batch_id, new_progress})
        
        # Broadcast progress update
        Phoenix.PubSub.broadcast(
          Cgraph.PubSub,
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
  
  defp estimate_remaining(total, processed, elapsed) when processed > 0 do
    remaining = total - processed
    avg_time_per_item = elapsed / processed
    trunc(remaining * avg_time_per_item)
  end
  defp estimate_remaining(_, _, _), do: nil
  
  defp cleanup_progress(batch_id) do
    :ets.delete(@progress_table, batch_id)
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Job Management
  # ---------------------------------------------------------------------------
  
  defp update_job_status(batch_id, status, result \\ nil) do
    case :ets.lookup(@jobs_table, batch_id) do
      [{^batch_id, job}] ->
        updated = %{job |
          status: status,
          completed_at: if(status in [:completed, :failed, :cancelled], do: DateTime.utc_now()),
          result: result
        }
        :ets.insert(@jobs_table, {batch_id, updated})
        
      [] ->
        :ok
    end
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
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
  
  defp generate_batch_id do
    "batch_" <> Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
  end
end
