defmodule CGraph.Queue.DeadLetterQueue do
  @moduledoc """
  Dead letter queue for capturing and querying permanently failed jobs.

  When jobs exhaust their max retries, they are recorded here with full
  metadata for debugging, auditing, and optional re-enqueue via admin UI.

  ## Architecture

  Uses an ETS table for fast in-memory storage with periodic persistence.
  Each dead letter entry contains the original job's worker, args, queue,
  error details, and timestamps.

  ## Usage

      # Record a failed job (called from Oban error handler)
      DeadLetterQueue.record_failure(job, error)

      # Query failures for admin dashboard
      DeadLetterQueue.list_failures(limit: 50, queue: "search")

      # Retry a dead-lettered job
      DeadLetterQueue.retry(failure_id)

      # Purge old entries
      DeadLetterQueue.purge(older_than: ~U[2026-03-01 00:00:00Z])

  ## Telemetry

  - `[:cgraph, :dead_letter, :recorded]` — failure captured
  - `[:cgraph, :dead_letter, :retried]` — job re-enqueued
  - `[:cgraph, :dead_letter, :purged]` — old entries removed
  """

  use GenServer

  require Logger

  @table :cgraph_dead_letter_queue
  @max_entries 10_000

  @type failure_entry :: %{
          id: String.t(),
          original_worker: String.t(),
          original_queue: String.t(),
          args: map(),
          error: String.t(),
          attempts: non_neg_integer(),
          max_attempts: non_neg_integer(),
          inserted_at: DateTime.t(),
          failed_at: DateTime.t(),
          meta: map()
        }

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc "Start the dead letter queue GenServer."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Record a failed job in the dead letter queue.

  Called automatically when an Oban job exhausts all retry attempts.
  """
  @spec record_failure(Oban.Job.t(), term()) :: :ok
  def record_failure(%Oban.Job{} = job, error) do
    entry = %{
      id: Ecto.UUID.generate(),
      original_worker: to_string(job.worker),
      original_queue: to_string(job.queue),
      args: job.args,
      error: inspect(error),
      attempts: job.attempt,
      max_attempts: job.max_attempts,
      inserted_at: job.inserted_at,
      failed_at: DateTime.utc_now(),
      meta: Map.get(job, :meta, %{})
    }

    GenServer.cast(__MODULE__, {:record, entry})
  end

  @doc """
  Record a failure from raw metadata (for non-Oban failures).
  """
  @spec record_failure_raw(map()) :: :ok
  def record_failure_raw(attrs) when is_map(attrs) do
    entry = %{
      id: Ecto.UUID.generate(),
      original_worker: Map.get(attrs, :worker, "unknown"),
      original_queue: Map.get(attrs, :queue, "unknown"),
      args: Map.get(attrs, :args, %{}),
      error: Map.get(attrs, :error, "unknown"),
      attempts: Map.get(attrs, :attempts, 0),
      max_attempts: Map.get(attrs, :max_attempts, 0),
      inserted_at: Map.get(attrs, :inserted_at, DateTime.utc_now()),
      failed_at: DateTime.utc_now(),
      meta: Map.get(attrs, :meta, %{})
    }

    GenServer.cast(__MODULE__, {:record, entry})
  end

  @doc """
  List dead letter entries with optional filters.

  ## Options

  - `:limit` — max entries to return (default 50)
  - `:offset` — pagination offset (default 0)
  - `:queue` — filter by original queue name
  - `:worker` — filter by original worker module
  - `:since` — only entries after this DateTime
  """
  @spec list_failures(keyword()) :: [failure_entry()]
  def list_failures(opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)
    queue_filter = Keyword.get(opts, :queue)
    worker_filter = Keyword.get(opts, :worker)
    since = Keyword.get(opts, :since)

    @table
    |> :ets.tab2list()
    |> Enum.map(fn {_id, entry} -> entry end)
    |> maybe_filter_queue(queue_filter)
    |> maybe_filter_worker(worker_filter)
    |> maybe_filter_since(since)
    |> Enum.sort_by(& &1.failed_at, {:desc, DateTime})
    |> Enum.drop(offset)
    |> Enum.take(limit)
  end

  @doc """
  Get a specific dead letter entry by ID.
  """
  @spec get_failure(String.t()) :: {:ok, failure_entry()} | {:error, :not_found}
  def get_failure(id) do
    case :ets.lookup(@table, id) do
      [{^id, entry}] -> {:ok, entry}
      [] -> {:error, :not_found}
    end
  end

  @doc """
  Count total dead letter entries, optionally filtered by queue.
  """
  @spec count(keyword()) :: non_neg_integer()
  def count(opts \\ []) do
    list_failures(Keyword.merge(opts, limit: @max_entries)) |> length()
  end

  @doc """
  Retry a dead-lettered job by re-enqueuing it through Oban.
  """
  @spec retry(String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def retry(failure_id) do
    case get_failure(failure_id) do
      {:ok, entry} ->
        worker = String.to_existing_atom(entry.original_worker)

        case entry.args |> worker.new(queue: entry.original_queue) |> Oban.insert() do
          {:ok, job} ->
            :ets.delete(@table, failure_id)

            emit_telemetry(:retried, %{
              worker: entry.original_worker,
              queue: entry.original_queue
            })

            {:ok, job}

          {:error, _reason} = error ->
            error
        end

      {:error, :not_found} = error ->
        error
    end
  end

  @doc """
  Purge dead letter entries older than the given DateTime.
  """
  @spec purge(keyword()) :: {:ok, non_neg_integer()}
  def purge(opts \\ []) do
    older_than = Keyword.get(opts, :older_than, DateTime.add(DateTime.utc_now(), -7, :day))

    entries = :ets.tab2list(@table)

    purged =
      entries
      |> Enum.filter(fn {_id, entry} ->
        DateTime.compare(entry.failed_at, older_than) == :lt
      end)
      |> Enum.each(fn {id, _entry} -> :ets.delete(@table, id) end)
      |> then(fn _ ->
        Enum.count(entries, fn {_id, entry} ->
          DateTime.compare(entry.failed_at, older_than) == :lt
        end)
      end)

    emit_telemetry(:purged, %{count: purged, older_than: older_than})

    {:ok, purged}
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl GenServer
  def init(_opts) do
    table = :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    {:ok, %{table: table}}
  end

  @impl GenServer
  def handle_cast({:record, entry}, state) do
    # Enforce max entries — evict oldest if at capacity
    maybe_evict()

    :ets.insert(@table, {entry.id, entry})

    Logger.warning("dead_letter_recorded",
      worker: entry.original_worker,
      queue: entry.original_queue,
      error: String.slice(entry.error, 0, 200)
    )

    emit_telemetry(:recorded, %{
      worker: entry.original_worker,
      queue: entry.original_queue
    })

    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp maybe_evict do
    size = :ets.info(@table, :size)

    if size >= @max_entries do
      # Evict oldest 10% of entries
      evict_count = div(@max_entries, 10)

      @table
      |> :ets.tab2list()
      |> Enum.map(fn {id, entry} -> {id, entry.failed_at} end)
      |> Enum.sort_by(&elem(&1, 1), DateTime)
      |> Enum.take(evict_count)
      |> Enum.each(fn {id, _} -> :ets.delete(@table, id) end)
    end
  end

  defp maybe_filter_queue(entries, nil), do: entries

  defp maybe_filter_queue(entries, queue) do
    Enum.filter(entries, &(&1.original_queue == to_string(queue)))
  end

  defp maybe_filter_worker(entries, nil), do: entries

  defp maybe_filter_worker(entries, worker) do
    Enum.filter(entries, &(&1.original_worker == to_string(worker)))
  end

  defp maybe_filter_since(entries, nil), do: entries

  defp maybe_filter_since(entries, since) do
    Enum.filter(entries, fn entry ->
      DateTime.compare(entry.failed_at, since) in [:gt, :eq]
    end)
  end

  defp emit_telemetry(event, metadata) do
    :telemetry.execute(
      [:cgraph, :dead_letter, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      metadata
    )
  end
end
