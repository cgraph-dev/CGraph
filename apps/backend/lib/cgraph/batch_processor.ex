defmodule CGraph.BatchProcessor do
  @moduledoc """
  CGraph.BatchProcessor — thin delegation facade.

  Delegates to specialized sub-modules:

  - `Processing` — Synchronous batch/stream processing with parallel execution
  - `AsyncJobs` — Asynchronous job lifecycle (start, status, cancel, list)
  - `Progress`  — Real-time progress tracking and PubSub subscriptions
  """

  use GenServer

  alias CGraph.BatchProcessor.{AsyncJobs, Processing, Progress}

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

  # ---------------------------------------------------------------------------
  # Synchronous Processing
  # ---------------------------------------------------------------------------

  defdelegate process(items, processor, opts \\ []), to: Processing
  defdelegate process_batches(items, processor, opts \\ []), to: Processing
  defdelegate stream_process(query, processor, opts \\ []), to: Processing

  # ---------------------------------------------------------------------------
  # Asynchronous Processing
  # ---------------------------------------------------------------------------

  defdelegate start_async(items, processor, opts \\ []), to: AsyncJobs
  defdelegate get_status(batch_id), to: AsyncJobs
  defdelegate cancel(batch_id), to: AsyncJobs
  defdelegate list_jobs(opts \\ []), to: AsyncJobs

  # ---------------------------------------------------------------------------
  # Progress
  # ---------------------------------------------------------------------------

  defdelegate get_progress(batch_id), to: Progress
  defdelegate subscribe(batch_id), to: Progress

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @doc "Starts the process and links it to the current process."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Initializes the process state."
  @spec init(keyword()) :: {:ok, map()}
  @impl true
  def init(_opts) do
    :ets.new(@jobs_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@progress_table, [:named_table, :set, :public, read_concurrency: true])

    {:ok, %{}}
  end
end
