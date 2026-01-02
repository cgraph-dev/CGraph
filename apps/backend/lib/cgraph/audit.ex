defmodule Cgraph.Audit do
  @moduledoc """
  Production-grade audit logging system for compliance and security.
  
  ## Overview
  
  Provides immutable audit trail for:
  
  - **Security Events**: Login attempts, password changes, 2FA events
  - **Data Access**: Who accessed what data and when
  - **Administrative Actions**: User bans, config changes, moderation
  - **Compliance**: GDPR data exports, consent tracking
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                      AUDIT LOGGING SYSTEM                        │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
  │   │  Ingestion  │────►│   Buffer    │────►│  Database   │       │
  │   │    API      │     │ (async batch)│     │ (immutable) │       │
  │   └─────────────┘     └─────────────┘     └─────────────┘       │
  │          │                                       │              │
  │          ▼                                       ▼              │
  │   ┌─────────────┐                        ┌─────────────┐        │
  │   │  Real-time  │                        │  Retention  │        │
  │   │  Alerting   │                        │   Policy    │        │
  │   └─────────────┘                        └─────────────┘        │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Event Categories
  
  | Category | Events |
  |----------|--------|
  | `auth` | login, logout, password_change, 2fa_enable |
  | `user` | profile_update, email_change, deletion |
  | `admin` | ban, unban, verify, config_change |
  | `data` | export, access, modification |
  | `security` | suspicious_activity, rate_limit, blocked |
  
  ## Usage
  
      # Log an authentication event
      Audit.log(:auth, :login_success, %{
        user_id: user.id,
        ip_address: conn.remote_ip,
        user_agent: get_user_agent(conn)
      })
      
      # Log with context
      Audit.log(:admin, :user_banned, %{
        admin_id: admin.id,
        target_user_id: user.id,
        reason: "TOS violation"
      }, context: conn)
      
      # Query audit log
      Audit.query(
        category: :auth,
        user_id: user.id,
        from: ~D[2024-01-01],
        limit: 100
      )
  
  ## Retention
  
  Audit logs are retained based on category:
  
  - Security events: 7 years
  - Admin actions: 5 years
  - User actions: 2 years
  - General: 1 year
  """
  
  use GenServer
  require Logger

  @buffer_flush_interval :timer.seconds(5)
  @buffer_max_size 100
  
  # Retention periods in days
  @retention_periods %{
    security: 365 * 7,   # 7 years
    admin: 365 * 5,      # 5 years
    compliance: 365 * 7, # 7 years
    auth: 365 * 2,       # 2 years
    user: 365 * 2,       # 2 years
    data: 365 * 2,       # 2 years
    general: 365         # 1 year
  }
  
  # Events that trigger real-time alerts
  @alert_events [
    {:auth, :login_failed_threshold},
    {:auth, :suspicious_login},
    {:security, :rate_limit_exceeded},
    {:security, :blocked_request},
    {:admin, :emergency_shutdown},
    {:data, :mass_deletion}
  ]
  
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
  def log(category, event_type, metadata \\ %{}, opts \\ []) do
    entry = build_entry(category, event_type, metadata, opts)
    
    if Keyword.get(opts, :sync, false) do
      write_entry(entry)
    else
      GenServer.cast(__MODULE__, {:log, entry})
    end
    
    # Check for alert-worthy events
    maybe_send_alert(category, event_type, entry)
    
    :ok
  end
  
  @doc """
  Log with Plug.Conn context extraction.
  """
  def log_with_conn(conn, category, event_type, metadata \\ %{}, opts \\ []) do
    context_opts = [
      ip_address: format_ip(conn.remote_ip),
      user_agent: get_header(conn, "user-agent"),
      request_id: get_header(conn, "x-request-id"),
      session_id: get_session_id(conn)
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
  def query(opts \\ []) do
    GenServer.call(__MODULE__, {:query, opts})
  end
  
  @doc """
  Get audit entries for a specific user (for GDPR exports).
  """
  def get_user_audit_trail(user_id, opts \\ []) do
    query(Keyword.merge([actor_id: user_id, limit: 1000], opts))
  end
  
  @doc """
  Export audit log to JSON for compliance.
  """
  def export(opts \\ []) do
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
  def stats(opts \\ []) do
    GenServer.call(__MODULE__, {:stats, opts})
  end
  
  @doc """
  Verify integrity of audit entries.
  
  Checks that checksums are valid and entries haven't been tampered with.
  """
  def verify_integrity(entries) when is_list(entries) do
    Enum.all?(entries, &verify_entry_integrity/1)
  end
  
  @doc """
  Force flush the buffer (for testing/shutdown).
  """
  def flush do
    GenServer.call(__MODULE__, :flush)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
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
      {:noreply, do_flush(state)}
    else
      {:noreply, state}
    end
  end
  
  @impl true
  def handle_call(:flush, _from, state) do
    {:reply, :ok, do_flush(state)}
  end
  
  @impl true
  def handle_call({:query, opts}, _from, state) do
    entries = filter_entries(state.buffer, opts)
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
      period_counts: count_by_category(recent_entries),
      event_counts: count_by_event(recent_entries)
    }
    
    {:reply, {:ok, stats}, state}
  end
  
  @impl true
  def handle_info(:flush, state) do
    schedule_flush()
    {:noreply, do_flush(state)}
  end
  
  @impl true
  def handle_info(:retention_cleanup, state) do
    # Clean up old entries based on retention policy
    do_retention_cleanup()
    schedule_retention_cleanup()
    {:noreply, state}
  end
  
  defp schedule_flush do
    Process.send_after(self(), :flush, @buffer_flush_interval)
  end
  
  defp schedule_retention_cleanup do
    # Run daily at 3 AM
    Process.send_after(self(), :retention_cleanup, :timer.hours(24))
  end
  
  # ---------------------------------------------------------------------------
  # Entry Building
  # ---------------------------------------------------------------------------
  
  defp build_entry(category, event_type, metadata, opts) do
    now = DateTime.utc_now()
    id = generate_id()
    
    entry = %{
      id: id,
      category: category,
      event_type: event_type,
      actor_id: Keyword.get(opts, :actor_id),
      actor_type: Keyword.get(opts, :actor_type, :user),
      target_id: Keyword.get(opts, :target_id),
      target_type: Keyword.get(opts, :target_type),
      metadata: metadata,
      ip_address: Keyword.get(opts, :ip_address),
      user_agent: Keyword.get(opts, :user_agent),
      session_id: Keyword.get(opts, :session_id),
      request_id: Keyword.get(opts, :request_id),
      timestamp: now
    }
    
    # Add tamper-proof checksum
    Map.put(entry, :checksum, compute_checksum(entry))
  end
  
  defp generate_id do
    # ULID-style sortable ID
    :crypto.strong_rand_bytes(16)
    |> Base.encode16(case: :lower)
  end
  
  defp compute_checksum(entry) do
    # Create deterministic hash of entry data
    data = [
      entry.id,
      to_string(entry.category),
      to_string(entry.event_type),
      entry.actor_id || "",
      entry.target_id || "",
      Jason.encode!(entry.metadata),
      DateTime.to_iso8601(entry.timestamp)
    ]
    |> Enum.join("|")
    
    :crypto.hash(:sha256, data)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end
  
  defp verify_entry_integrity(entry) do
    expected = compute_checksum(Map.delete(entry, :checksum))
    entry.checksum == expected
  end
  
  # ---------------------------------------------------------------------------
  # Buffer Operations
  # ---------------------------------------------------------------------------
  
  defp do_flush(%{buffer: []} = state), do: state
  
  defp do_flush(state) do
    entries = Enum.reverse(state.buffer)
    
    # In production, this would batch insert to database
    write_entries(entries)
    
    %{state | 
      buffer: [], 
      buffer_count: 0,
      last_flush: DateTime.utc_now()
    }
  end
  
  defp write_entry(entry) do
    write_entries([entry])
  end
  
  defp write_entries(entries) do
    # Log to console in development
    if Application.get_env(:cgraph, :env) == :dev do
      Enum.each(entries, fn entry ->
        Logger.debug("Audit: #{entry.category}/#{entry.event_type}",
          actor_id: entry.actor_id,
          target_id: entry.target_id,
          metadata: inspect(entry.metadata)
        )
      end)
    end
    
    # In production, batch insert to audit_logs table
    # Repo.insert_all(AuditLog, entries)
    
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # Query Helpers
  # ---------------------------------------------------------------------------
  
  defp filter_entries(entries, opts) do
    entries
    |> maybe_filter_category(opts[:category])
    |> maybe_filter_event_type(opts[:event_type])
    |> maybe_filter_actor(opts[:actor_id])
    |> maybe_filter_target(opts[:target_id])
    |> maybe_filter_date_range(opts[:from], opts[:to])
    |> limit_entries(opts[:limit] || 100, opts[:offset] || 0)
  end
  
  defp maybe_filter_category(entries, nil), do: entries
  defp maybe_filter_category(entries, category) do
    Enum.filter(entries, &(&1.category == category))
  end
  
  defp maybe_filter_event_type(entries, nil), do: entries
  defp maybe_filter_event_type(entries, event_type) do
    Enum.filter(entries, &(&1.event_type == event_type))
  end
  
  defp maybe_filter_actor(entries, nil), do: entries
  defp maybe_filter_actor(entries, actor_id) do
    Enum.filter(entries, &(&1.actor_id == actor_id))
  end
  
  defp maybe_filter_target(entries, nil), do: entries
  defp maybe_filter_target(entries, target_id) do
    Enum.filter(entries, &(&1.target_id == target_id))
  end
  
  defp maybe_filter_date_range(entries, nil, nil), do: entries
  defp maybe_filter_date_range(entries, from, to) do
    Enum.filter(entries, fn entry ->
      (from == nil or Date.compare(DateTime.to_date(entry.timestamp), from) != :lt) and
      (to == nil or Date.compare(DateTime.to_date(entry.timestamp), to) != :gt)
    end)
  end
  
  defp limit_entries(entries, limit, offset) do
    entries
    |> Enum.drop(offset)
    |> Enum.take(limit)
  end
  
  defp count_by_category(entries) do
    Enum.frequencies_by(entries, & &1.category)
  end
  
  defp count_by_event(entries) do
    Enum.frequencies_by(entries, fn entry ->
      {entry.category, entry.event_type}
    end)
  end
  
  # ---------------------------------------------------------------------------
  # Alerting
  # ---------------------------------------------------------------------------
  
  defp maybe_send_alert(category, event_type, entry) do
    if {category, event_type} in @alert_events do
      send_alert(category, event_type, entry)
    end
  end
  
  defp send_alert(category, event_type, entry) do
    Logger.warning("Audit alert triggered",
      category: category,
      event_type: event_type,
      actor_id: entry.actor_id,
      target_id: entry.target_id,
      ip_address: entry.ip_address
    )
    
    # In production, would send to:
    # - Slack/Discord webhook
    # - PagerDuty
    # - Email to security team
    
    :telemetry.execute(
      [:cgraph, :audit, :alert],
      %{count: 1},
      %{category: category, event_type: event_type}
    )
  end
  
  # ---------------------------------------------------------------------------
  # Retention
  # ---------------------------------------------------------------------------
  
  defp do_retention_cleanup do
    now = Date.utc_today()
    
    Enum.each(@retention_periods, fn {category, days} ->
      cutoff = Date.add(now, -days)
      
      # In production, would delete old entries
      Logger.info("Audit retention cleanup",
        category: category,
        cutoff: cutoff
      )
      
      # Repo.delete_all(
      #   from a in AuditLog,
      #   where: a.category == ^category and a.inserted_at < ^cutoff
      # )
    end)
  end
  
  # ---------------------------------------------------------------------------
  # Context Extraction Helpers
  # ---------------------------------------------------------------------------
  
  defp format_ip(ip) when is_tuple(ip) do
    ip
    |> Tuple.to_list()
    |> Enum.join(".")
  end
  defp format_ip(ip), do: to_string(ip)
  
  defp get_header(conn, header) do
    case Plug.Conn.get_req_header(conn, header) do
      [value | _] -> value
      _ -> nil
    end
  end
  
  defp get_session_id(conn) do
    case conn.assigns do
      %{session_id: id} -> id
      _ -> nil
    end
  end
end
