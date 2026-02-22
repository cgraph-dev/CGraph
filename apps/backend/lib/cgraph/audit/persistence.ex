defmodule CGraph.Audit.Persistence do
  @moduledoc """
  Handles audit entry persistence, buffered flushing, real-time alerting,
  and retention cleanup for the audit logging system.
  """

  require Logger

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
  # Buffer Operations
  # ---------------------------------------------------------------------------

  @doc """
  Flushes buffered audit entries to persistent storage.

  Returns the updated GenServer state with an empty buffer.
  """
  @spec do_flush(map()) :: map()
  def do_flush(%{buffer: []} = state), do: state

  def do_flush(state) do
    entries = Enum.reverse(state.buffer)

    # In production, this would batch insert to database
    write_entries(entries)

    %{state |
      buffer: [],
      buffer_count: 0,
      last_flush: DateTime.utc_now()
    }
  end

  @doc """
  Writes a single audit entry to persistent storage.
  """
  @spec write_entry(map()) :: :ok
  def write_entry(entry) do
    write_entries([entry])
  end

  @doc """
  Writes a batch of audit entries to persistent storage.

  In development, entries are logged to console.
  Security-critical entries are always persisted via `CGraph.Accounts.AuditLog`.
  """
  @spec write_entries([map()]) :: :ok
  def write_entries(entries) do
    # Log to console in development
    if Application.get_env(:cgraph, :env) == :dev do
      Enum.each(entries, fn entry ->
        Logger.debug("audit_entry",
          category: entry.category,
          event_type: entry.event_type,
          actor_id: entry.actor_id,
          target_id: entry.target_id,
          metadata: inspect(entry.metadata)
        )
      end)
    end

    # Persist security-critical entries via the DB-backed AuditLog
    Enum.each(entries, fn entry ->
      if entry.category in [:security, :auth, :admin, :compliance] do
        CGraph.Accounts.AuditLog.log(
          "#{entry.category}_#{entry.event_type}",
          entry.actor_id,
          %{
            resource_type: to_string(entry[:target_type] || entry.category),
            resource_id: entry.target_id,
            ip_address: entry[:ip_address],
            user_agent: entry[:user_agent],
            category: to_string(entry.category),
            event_type: to_string(entry.event_type),
            session_id: entry[:session_id],
            original_metadata: entry.metadata
          }
        )
      end
    end)

    :ok
  end

  # ---------------------------------------------------------------------------
  # Alerting
  # ---------------------------------------------------------------------------

  @doc """
  Checks whether a category/event pair should trigger a real-time alert,
  and sends the alert if so.
  """
  @spec maybe_send_alert(atom(), atom(), map()) :: :ok
  def maybe_send_alert(category, event_type, entry) do
    if {category, event_type} in @alert_events do
      send_alert(category, event_type, entry)
    end

    :ok
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
    # - Webhook
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

  @doc """
  Runs retention cleanup, deleting audit entries older than their
  category-specific retention period.
  """
  @spec do_retention_cleanup() :: :ok
  def do_retention_cleanup do
    now = Date.utc_today()

    Enum.each(@retention_periods, fn {category, days} ->
      cutoff = Date.add(now, -days)

      Logger.info("Audit retention cleanup",
        category: category,
        cutoff: cutoff
      )

      try do
        import Ecto.Query

        {deleted, _} =
          CGraph.Repo.delete_all(
            from(a in CGraph.Accounts.AuditLog,
              where: a.category == ^to_string(category) and a.inserted_at < ^cutoff
            )
          )

        if deleted > 0 do
          Logger.info("Audit retention deleted entries",
            category: category,
            deleted_count: deleted,
            cutoff: cutoff
          )
        end
      rescue
        e ->
          Logger.error("Audit retention cleanup failed",
            category: category,
            error: inspect(e)
          )
      end
    end)

    :ok
  end
end
