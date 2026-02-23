defmodule CGraph.Audit do
  @moduledoc """
  Production-grade audit logging system for compliance and security.

  Provides an immutable, buffered audit trail covering security events,
  data access, administrative actions, and compliance (GDPR exports).

  Categories: `:auth`, `:user`, `:admin`, `:data`, `:security`,
  `:compliance`, `:general`.

  Entries are buffered in-process and flushed periodically or when the
  buffer reaches its max size. Real-time alerts fire for critical events.

  Retention periods range from 1 year (general) to 7 years (security/compliance).

  Implementation is split across submodules:

  - `CGraph.Audit.EntryBuilder` — entry construction, checksums, context extraction
  - `CGraph.Audit.Persistence` — flushing, writing, alerting, retention
  - `CGraph.Audit.Query` — filtering and aggregation helpers
  """

  use GenServer
  require Logger

  alias CGraph.Audit.{EntryBuilder, Persistence, Query}

  @buffer_flush_interval :timer.seconds(5)
  @buffer_max_size 100

  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------

  @type category :: :auth | :user | :admin | :data | :security | :compliance | :general
  @type event_type :: atom()
  @type metadata :: map()

  @type audit_entry :: %{
    id: String.t(),
    category: category(),
    event_type: event_type(),
    actor_id: String.t() | nil,
    actor_type: :user | :system | :admin,
    target_id: String.t() | nil,
    target_type: atom() | nil,
    metadata: map(),
    ip_address: String.t() | nil,
    user_agent: String.t() | nil,
    session_id: String.t() | nil,
    request_id: String.t() | nil,
    timestamp: DateTime.t(),
    checksum: String.t()
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start the audit logging GenServer.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Log an audit event.

  ## Parameters

  - `category` - Event category (:auth, :user, :admin, etc.)
  - `event_type` - Specific event type (:login_success, :password_change, etc.)
  - `metadata` - Event-specific data

  ## Options

  - `:actor_id` - ID of the user/system performing the action
  - `:actor_type` - :user, :system, or :admin
  - `:target_id` - ID of the affected entity
  - `:target_type` - Type of the affected entity
  - `:context` - Plug.Conn for request context extraction
  - `:sync` - If true, write immediately (default: false, uses buffer)

  ## Examples

      Audit.log(:auth, :login_success, %{method: "password"}, actor_id: user.id)

      Audit.log(:admin, :user_banned, %{reason: "spam"},
        actor_id: admin.id,
        target_id: user.id,
        target_type: :user
      )
  """
  @doc "Records an audit log entry."
  @spec log(category(), event_type(), metadata(), keyword()) :: :ok
  def log(category, event_type, metadata \\ %{}, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    entry = EntryBuilder.build_entry(category, event_type, metadata, opts)

    if Keyword.get(opts, :sync, false) do
      Persistence.write_entry(entry)
    else
      GenServer.cast(__MODULE__, {:log, entry})
    end

    # Check for alert-worthy events
    Persistence.maybe_send_alert(category, event_type, entry)

    :ok
  end

  @doc """
  Log with Plug.Conn context extraction.
  """
  @spec log_with_conn(Plug.Conn.t(), category(), event_type(), metadata(), keyword()) :: :ok
  def log_with_conn(conn, category, event_type, metadata \\ %{}, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    context_opts = [
      ip_address: EntryBuilder.format_ip(conn.remote_ip),
      user_agent: EntryBuilder.get_header(conn, "user-agent"),
      request_id: EntryBuilder.get_header(conn, "x-request-id"),
      session_id: EntryBuilder.get_session_id(conn)
    ]

    opts = Keyword.merge(context_opts, opts)
    log(category, event_type, metadata, opts)
  end

  @doc """
  Query audit log entries.

  ## Options

  - `:category` - Filter by category
  - `:event_type` - Filter by event type
  - `:actor_id` - Filter by actor
  - `:target_id` - Filter by target
  - `:from` - Start date
  - `:to` - End date
  - `:limit` - Maximum entries (default: 100)
  - `:offset` - Pagination offset
  """
  @spec query(keyword()) :: {:ok, [audit_entry()]}
  def query(opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    GenServer.call(__MODULE__, {:query, opts})
  end

  @doc """
  Get audit entries for a specific user (for GDPR exports).
  """
  @spec get_user_audit_trail(String.t(), keyword()) :: {:ok, [audit_entry()]}
  def get_user_audit_trail(user_id, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    query(Keyword.merge([actor_id: user_id, limit: 1000], opts))
  end

  @doc """
  Export audit log to JSON for compliance.
  """
  @spec export(keyword()) :: {:ok, String.t()} | {:error, term()}
  def export(opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    case query(Keyword.put(opts, :limit, 10_000)) do
      {:ok, entries} ->
        json = Jason.encode!(entries, pretty: true)
        {:ok, json}
      error -> error
    end
  end

  @doc """
  Get audit statistics for dashboard.
  """
  @spec stats(keyword()) :: {:ok, map()}
  def stats(opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    GenServer.call(__MODULE__, {:stats, opts})
  end

  @doc """
  Verify integrity of audit entries.

  Checks that checksums are valid and entries haven't been tampered with.
  """
  @spec verify_integrity([audit_entry()]) :: boolean()
  def verify_integrity(entries) when is_list(entries) do
    Enum.all?(entries, &EntryBuilder.verify_entry_integrity/1)
  end

  @doc """
  Force flush the buffer (for testing/shutdown).
  """
  @spec flush() :: :ok
  def flush do
    GenServer.call(__MODULE__, :flush)
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @doc "Initializes the audit GenServer with an empty buffer and schedules periodic flushing."
  @spec init(keyword()) :: {:ok, map()}
  @impl true
  def init(_opts) do
    state = %{
      buffer: [],
      buffer_count: 0,
      total_logged: 0,
      last_flush: DateTime.utc_now()
    }

    # Schedule periodic buffer flush
    schedule_flush()

    # Schedule retention cleanup
    schedule_retention_cleanup()

    {:ok, state}
  end

  @doc "Handles asynchronous audit log entry buffering."
  @spec handle_cast(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_cast({:log, entry}, state) do
    buffer = [entry | state.buffer]
    buffer_count = state.buffer_count + 1

    state = %{state |
      buffer: buffer,
      buffer_count: buffer_count,
      total_logged: state.total_logged + 1
    }

    # Flush if buffer is full
    if buffer_count >= @buffer_max_size do
      {:noreply, Persistence.do_flush(state)}
    else
      {:noreply, state}
    end
  end

  @doc "Handles synchronous flush, query, and stats calls."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call(:flush, _from, state) do
    {:reply, :ok, Persistence.do_flush(state)}
  end

  @impl true
  def handle_call({:query, opts}, _from, state) do
    entries = Query.filter_entries(state.buffer, opts)
    {:reply, {:ok, entries}, state}
  end

  @impl true
  def handle_call({:stats, opts}, _from, state) do
    period_hours = Keyword.get(opts, :period_hours, 24)
    cutoff = DateTime.add(DateTime.utc_now(), -period_hours * 3600, :second)

    recent_entries = Enum.filter(state.buffer, fn entry ->
      DateTime.compare(entry.timestamp, cutoff) == :gt
    end)

    stats = %{
      total_logged: state.total_logged,
      buffer_size: state.buffer_count,
      last_flush: state.last_flush,
      period_counts: Query.count_by_category(recent_entries),
      event_counts: Query.count_by_event(recent_entries)
    }

    {:reply, {:ok, stats}, state}
  end

  @doc "Handles periodic buffer flush and retention cleanup messages."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_info(:flush, state) do
    schedule_flush()
    {:noreply, Persistence.do_flush(state)}
  end

  @impl true
  def handle_info(:retention_cleanup, state) do
    # Clean up old entries based on retention policy
    Persistence.do_retention_cleanup()
    schedule_retention_cleanup()
    {:noreply, state}
  end

  @doc "Flushes any remaining buffered audit entries on GenServer shutdown."
  @spec terminate(term(), map()) :: :ok
  @impl true
  def terminate(_reason, state) do
    # Flush any remaining buffered entries on shutdown to prevent data loss
    if state.buffer != [] do
      Persistence.do_flush(state)
    end

    :ok
  end

  defp schedule_flush do
    Process.send_after(self(), :flush, @buffer_flush_interval)
  end

  defp schedule_retention_cleanup do
    # Run daily at 3 AM
    Process.send_after(self(), :retention_cleanup, :timer.hours(24))
  end
end
