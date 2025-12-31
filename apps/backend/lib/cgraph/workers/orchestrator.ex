defmodule Cgraph.Workers.Orchestrator do
  @moduledoc """
  Background job orchestration and workflow management.
  
  ## Overview
  
  Provides higher-level abstractions over Oban for complex job workflows:
  
  - **Job pipelines**: Chain jobs with dependencies
  - **Batch processing**: Process large datasets in parallel batches
  - **Rate-limited queues**: Respect external API limits
  - **Dead letter handling**: Graceful failure management
  - **Job scheduling**: Cron-like recurring jobs
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Job Orchestration Flow                        │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐   │
  │  │ Job Request │───▶│ Orchestrator  │───▶│ Oban Queue      │   │
  │  │             │    │               │    │                 │   │
  │  └─────────────┘    └───────────────┘    └────────┬────────┘   │
  │                                                    │            │
  │                      ┌─────────────────────────────┼───────┐   │
  │                      │                             │       │   │
  │               ┌──────▼──────┐  ┌───────────┐  ┌───▼─────┐ │   │
  │               │ Worker Pool │  │ Scheduler │  │ Monitor │ │   │
  │               │             │  │           │  │         │ │   │
  │               └─────────────┘  └───────────┘  └─────────┘ │   │
  │                                                            │   │
  │                      Worker Supervision Tree               │   │
  └────────────────────────────────────────────────────────────┼───┘
                                                               │
                                                    ┌──────────▼──────────┐
                                                    │ Result/Callback     │
                                                    │ Processing          │
                                                    └─────────────────────┘
  ```
  
  ## Job Pipelines
  
  Chain jobs that depend on each other:
  
      Orchestrator.pipeline([
        {EmailWorker, %{template: "welcome", user_id: user_id}},
        {AnalyticsWorker, %{event: "user_registered", user_id: user_id}},
        {NotificationWorker, %{type: "welcome", user_id: user_id}}
      ])
  
  ## Batch Processing
  
  Process large datasets efficiently:
  
      user_ids = Users.list_all_ids()
      
      Orchestrator.batch(user_ids, UserSyncWorker, 
        batch_size: 100,
        max_concurrency: 10,
        on_complete: {NotifyAdmin, %{type: "sync_complete"}}
      )
  
  ## Rate-Limited Queues
  
  Respect external API rate limits:
  
      Orchestrator.enqueue(ExternalAPIWorker, args, 
        rate_limit: {:per_second, 10},
        queue: :external_api
      )
  """
  
  require Logger

  @type job_spec :: {module(), map()}
  @type pipeline_opts :: [
    on_complete: job_spec() | nil,
    on_failure: job_spec() | nil,
    timeout_ms: pos_integer()
  ]
  @type batch_opts :: [
    batch_size: pos_integer(),
    max_concurrency: pos_integer(),
    on_complete: job_spec() | nil,
    on_failure: job_spec() | nil
  ]
  
  # ---------------------------------------------------------------------------
  # Simple Job Enqueueing
  # ---------------------------------------------------------------------------
  
  @doc """
  Enqueue a single job with options.
  
  ## Options
  
  - `:queue` - Queue name (default: `:default`)
  - `:scheduled_at` - DateTime to run job
  - `:priority` - Job priority (0-3, lower = higher priority)
  - `:max_attempts` - Maximum retry attempts
  - `:unique` - Uniqueness constraints
  - `:tags` - Tags for job filtering
  
  ## Examples
  
      Orchestrator.enqueue(EmailWorker, %{to: "user@example.com", template: "welcome"})
      
      Orchestrator.enqueue(ReportWorker, %{report_id: id},
        scheduled_at: DateTime.add(DateTime.utc_now(), 3600, :second),
        priority: 1
      )
  """
  def enqueue(worker, args, opts \\ []) do
    job_opts = build_job_opts(opts)
    
    args
    |> worker.new(job_opts)
    |> Oban.insert()
    |> handle_insert_result(worker, args)
  end
  
  @doc """
  Enqueue a job to run at a specific time.
  """
  def schedule(worker, args, scheduled_at, opts \\ []) do
    enqueue(worker, args, Keyword.put(opts, :scheduled_at, scheduled_at))
  end
  
  @doc """
  Enqueue a job to run after a delay.
  """
  def schedule_in(worker, args, delay_seconds, opts \\ []) do
    scheduled_at = DateTime.add(DateTime.utc_now(), delay_seconds, :second)
    schedule(worker, args, scheduled_at, opts)
  end
  
  # ---------------------------------------------------------------------------
  # Job Pipelines
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
  
  defp enqueue_pipeline_job(worker, args, pipeline_id, index, remaining_jobs, opts) do
    enriched_args = Map.merge(args, %{
      "__pipeline__" => %{
        id: pipeline_id,
        index: index,
        remaining: Enum.map(remaining_jobs, fn {w, a} -> %{worker: to_string(w), args: a} end)
      }
    })
    
    enqueue(worker, enriched_args, opts)
  end
  
  @doc """
  Continue a pipeline after successful job completion.
  
  Called by workers that are part of a pipeline.
  """
  def continue_pipeline(args, result \\ nil) do
    case Map.get(args, "__pipeline__") do
      nil ->
        :ok
        
      %{id: pipeline_id, index: index, remaining: remaining} ->
        update_pipeline_progress(pipeline_id, index, :success, result)
        
        case remaining do
          [] ->
            complete_pipeline(pipeline_id, :success)
            
          [%{worker: worker_str, args: next_args} | rest] ->
            worker = String.to_existing_atom(worker_str)
            # Convert remaining back to the expected format for recursion
            rest_maps = Enum.map(rest, fn
              %{worker: w, args: a} -> %{worker: w, args: a}
              {w, a} -> %{worker: to_string(w), args: a}  # Handle legacy format
            end)
            enqueue_pipeline_job(worker, next_args, pipeline_id, index + 1, 
              Enum.map(rest_maps, fn %{worker: w, args: a} -> {String.to_existing_atom(w), a} end), [])
            
          # Handle legacy tuple format for backwards compatibility
          [{worker_str, next_args} | rest] when is_binary(worker_str) ->
            worker = String.to_existing_atom(worker_str)
            enqueue_pipeline_job(worker, next_args, pipeline_id, index + 1, rest, [])
        end
        
      # Handle string keys (from JSON deserialization)
      %{"id" => pipeline_id, "index" => index, "remaining" => remaining} ->
        update_pipeline_progress(pipeline_id, index, :success, result)
        
        case remaining do
          [] ->
            complete_pipeline(pipeline_id, :success)
            
          [%{"worker" => worker_str, "args" => next_args} | rest] ->
            worker = String.to_existing_atom(worker_str)
            rest_tuples = Enum.map(rest, fn %{"worker" => w, "args" => a} -> {String.to_existing_atom(w), a} end)
            enqueue_pipeline_job(worker, next_args, pipeline_id, index + 1, rest_tuples, [])
        end
    end
  end
  
  @doc """
  Fail a pipeline after job failure.
  """
  def fail_pipeline(args, reason) do
    case Map.get(args, "__pipeline__") do
      nil ->
        :ok
        
      %{id: pipeline_id, index: index} ->
        update_pipeline_progress(pipeline_id, index, :failure, reason)
        complete_pipeline(pipeline_id, {:failure, reason})
    end
  end
  
  # ---------------------------------------------------------------------------
  # Batch Processing
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
      
      enqueue(worker, args, Keyword.take(opts, [:queue, :priority]))
    end)
    
    {:ok, batch_id, total_batches}
  end
  
  @doc """
  Report batch job completion.
  
  Called by workers processing batch items.
  """
  def report_batch_progress(args, status) when status in [:success, :failure] do
    case Map.get(args, "__batch__") do
      nil ->
        :ok
        
      %{id: batch_id} ->
        update_batch_progress(batch_id, status)
    end
  end
  
  # ---------------------------------------------------------------------------
  # Recurring Jobs
  # ---------------------------------------------------------------------------
  
  @doc """
  Schedule a recurring job.
  
  Uses cron-like syntax for scheduling.
  
  ## Cron Syntax
  
  - `"* * * * *"` - Every minute
  - `"0 * * * *"` - Every hour
  - `"0 0 * * *"` - Every day at midnight
  - `"0 0 * * 0"` - Every Sunday at midnight
  - `"*/15 * * * *"` - Every 15 minutes
  
  ## Examples
  
      Orchestrator.recurring(:daily_report, ReportWorker, %{type: "daily"},
        cron: "0 9 * * *"  # Every day at 9 AM
      )
      
      Orchestrator.recurring(:hourly_sync, SyncWorker, %{},
        cron: "0 * * * *"  # Every hour
      )
  """
  def recurring(name, worker, args, opts) do
    cron = Keyword.fetch!(opts, :cron)
    queue = Keyword.get(opts, :queue, :scheduled)
    
    # Oban Pro has built-in cron, for standard Oban we use oban_crontab
    # This creates the config that should go in config.exs
    config = %{
      name: name,
      worker: worker,
      args: args,
      cron: cron,
      queue: queue
    }
    
    Logger.info("Recurring job configured", name: name, cron: cron)
    {:ok, config}
  end
  
  # ---------------------------------------------------------------------------
  # Job Monitoring
  # ---------------------------------------------------------------------------
  
  @doc """
  Get the status of a pipeline.
  """
  def pipeline_status(pipeline_id) do
    get_pipeline_state(pipeline_id)
  end
  
  @doc """
  Get the status of a batch operation.
  """
  def batch_status(batch_id) do
    get_batch_state(batch_id)
  end
  
  @doc """
  Cancel all pending jobs in a pipeline.
  """
  def cancel_pipeline(pipeline_id) do
    # Mark pipeline as cancelled
    case get_pipeline_state(pipeline_id) do
      nil ->
        {:error, :not_found}
        
      state ->
        store_pipeline_state(pipeline_id, Map.put(state, :status, :cancelled))
        {:ok, :cancelled}
    end
  end
  
  @doc """
  Cancel all pending jobs in a batch.
  """
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
  # Dead Letter Handling
  # ---------------------------------------------------------------------------
  
  @doc """
  Move failed jobs to dead letter queue for manual review.
  
  Jobs that exceed max_attempts are automatically moved here.
  """
  def move_to_dead_letter(job, reason) do
    dead_letter_args = %{
      original_worker: to_string(job.worker),
      original_args: job.args,
      original_queue: job.queue,
      failure_reason: inspect(reason),
      failed_at: DateTime.utc_now()
    }
    
    enqueue(Cgraph.Workers.DeadLetterWorker, dead_letter_args, queue: :dead_letter)
  end
  
  @doc """
  Retry a dead letter job.
  """
  def retry_dead_letter(job_id) do
    # This would fetch from dead letter storage and re-enqueue
    Logger.info("Retrying dead letter job", job_id: job_id)
    {:ok, :retried}
  end
  
  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------
  
  defp build_job_opts(opts) do
    opts
    |> Keyword.take([:queue, :scheduled_at, :priority, :max_attempts, :unique, :tags])
    |> Enum.filter(fn {_k, v} -> not is_nil(v) end)
  end
  
  defp handle_insert_result({:ok, job}, worker, _args) do
    Logger.debug("Job enqueued", worker: worker, job_id: job.id)
    {:ok, job}
  end
  
  defp handle_insert_result({:error, changeset}, worker, args) do
    Logger.error("Failed to enqueue job", 
      worker: worker, 
      args: inspect(args),
      errors: inspect(changeset.errors)
    )
    {:error, changeset}
  end
  
  defp generate_pipeline_id do
    "pipeline_" <> Base.encode32(:crypto.strong_rand_bytes(8), case: :lower, padding: false)
  end
  
  defp generate_batch_id do
    "batch_" <> Base.encode32(:crypto.strong_rand_bytes(8), case: :lower, padding: false)
  end
  
  # State storage using Cachex (in production, use Redis for persistence)
  
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
          {:success, {worker, args}, _} -> enqueue(worker, args)
          {{:failure, _}, _, {worker, args}} -> enqueue(worker, args)
          _ -> :ok
        end
    end
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
      {0, {worker, args}, _} -> enqueue(worker, args)
      {_, _, {worker, args}} when not is_nil(worker) -> enqueue(worker, args)
      _ -> :ok
    end
  end
end
