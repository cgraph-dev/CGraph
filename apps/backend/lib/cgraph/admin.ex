defmodule Cgraph.Admin do
  @moduledoc """
  Admin dashboard context for system monitoring and management.
  
  ## Overview
  
  Provides administrative capabilities for:
  
  - **User Management**: View, moderate, ban/unban users
  - **System Metrics**: Real-time stats, performance monitoring
  - **Content Moderation**: Review flagged content, manage reports
  - **Audit Logging**: Track all administrative actions
  - **Configuration**: Runtime configuration management
  
  ## Authorization
  
  All admin operations require appropriate permissions:
  
  | Permission Level | Capabilities |
  |-----------------|--------------|
  | `admin:read` | View metrics, users, logs |
  | `admin:write` | Moderate content, manage users |
  | `admin:super` | System config, delete data |
  
  ## Usage
  
      # Get system metrics
      {:ok, metrics} = Admin.get_system_metrics()
      
      # Ban a user
      {:ok, user} = Admin.ban_user(user_id, reason: "TOS violation", duration: :permanent)
      
      # View audit log
      {:ok, entries} = Admin.list_audit_log(page: 1, per_page: 50)
  """
  
  require Logger
  import Ecto.Query
  
  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  # Schemas to be implemented:
  # alias Cgraph.Admin.{AuditEntry, Report, SystemConfig}
  
  # ---------------------------------------------------------------------------
  # System Metrics
  # ---------------------------------------------------------------------------
  
  @doc """
  Get comprehensive system metrics for dashboard.
  
  Returns metrics across all major system components.
  """
  def get_system_metrics do
    {:ok, %{
      users: user_metrics(),
      messages: message_metrics(),
      groups: group_metrics(),
      system: system_metrics(),
      jobs: job_metrics(),
      collected_at: DateTime.utc_now()
    }}
  end
  
  @doc """
  Get real-time stats for live dashboard updates.
  """
  def get_realtime_stats do
    %{
      active_connections: get_active_websocket_count(),
      requests_per_minute: get_request_rate(),
      database_latency_ms: get_db_latency(),
      cache_hit_rate: get_cache_hit_rate(),
      memory_usage_mb: get_memory_usage(),
      timestamp: DateTime.utc_now()
    }
  end
  
  defp user_metrics do
    total = Repo.aggregate(User, :count)
    today = Date.utc_today()
    start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")
    
    new_today = Repo.one(
      from u in User,
      where: u.inserted_at >= ^start_of_day,
      select: count()
    )
    
    active_24h = Repo.one(
      from u in User,
      where: u.last_seen_at >= ago(24, "hour"),
      select: count()
    )
    
    %{
      total: total,
      new_today: new_today,
      active_24h: active_24h,
      premium: Repo.one(from u in User, where: u.is_premium == true, select: count()),
      verified: Repo.one(from u in User, where: u.is_verified == true, select: count())
    }
  end
  
  defp message_metrics do
    # Would query from messages table
    %{
      total: 0,
      today: 0,
      avg_per_user: 0.0
    }
  end
  
  defp group_metrics do
    # Would query from groups table
    %{
      total: 0,
      public: 0,
      private: 0,
      avg_members: 0.0
    }
  end
  
  defp system_metrics do
    memory = :erlang.memory()
    {uptime_ms, _} = :erlang.statistics(:wall_clock)
    
    %{
      uptime_seconds: div(uptime_ms, 1000),
      memory: %{
        total_mb: div(memory[:total], 1_048_576),
        processes_mb: div(memory[:processes], 1_048_576),
        ets_mb: div(memory[:ets], 1_048_576),
        binary_mb: div(memory[:binary], 1_048_576)
      },
      processes: :erlang.system_info(:process_count),
      schedulers: :erlang.system_info(:schedulers_online),
      otp_release: :erlang.system_info(:otp_release) |> to_string(),
      elixir_version: System.version()
    }
  end
  
  defp job_metrics do
    # Would query Oban jobs
    %{
      pending: 0,
      running: 0,
      completed_24h: 0,
      failed_24h: 0
    }
  end
  
  defp get_active_websocket_count do
    # Would use Phoenix.Presence or channel tracking
    0
  end
  
  defp get_request_rate do
    # Would use telemetry metrics
    0
  end
  
  defp get_db_latency do
    start = System.monotonic_time(:millisecond)
    Repo.query("SELECT 1")
    System.monotonic_time(:millisecond) - start
  end
  
  defp get_cache_hit_rate do
    case Cachex.stats(:cgraph_cache) do
      {:ok, stats} ->
        hits = Map.get(stats, :hits, 0)
        misses = Map.get(stats, :misses, 0)
        total = hits + misses
        if total > 0, do: Float.round(hits / total * 100, 2), else: 100.0
      _ -> 0.0
    end
  end
  
  defp get_memory_usage do
    div(:erlang.memory(:total), 1_048_576)
  end
  
  # ---------------------------------------------------------------------------
  # User Management
  # ---------------------------------------------------------------------------
  
  @doc """
  List users with filtering and pagination.
  
  ## Options
  
  - `:search` - Search by username, email
  - `:status` - Filter by status (active, banned, deleted)
  - `:sort` - Sort field (inserted_at, last_seen_at, username)
  - `:order` - Sort order (asc, desc)
  - `:page`, `:per_page` - Pagination
  """
  def list_users(opts \\ []) do
    search = Keyword.get(opts, :search)
    status = Keyword.get(opts, :status)
    sort = Keyword.get(opts, :sort, :inserted_at)
    order = Keyword.get(opts, :order, :desc)
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    
    query = from(u in User)
    
    query = if search do
      search_term = "%#{search}%"
      from u in query,
        where: ilike(u.username, ^search_term) or ilike(u.email, ^search_term)
    else
      query
    end
    
    query = case status do
      :banned -> from u in query, where: not is_nil(u.banned_at)
      :deleted -> from u in query, where: not is_nil(u.deleted_at)
      :active -> from u in query, where: is_nil(u.banned_at) and is_nil(u.deleted_at)
      _ -> query
    end
    
    query = from u in query, order_by: [{^order, ^sort}]
    
    # Get total count
    total = Repo.aggregate(query, :count)
    
    # Paginate
    users = query
    |> limit(^per_page)
    |> offset(^((page - 1) * per_page))
    |> Repo.all()
    
    {:ok, %{
      users: users,
      pagination: %{
        total: total,
        page: page,
        per_page: per_page,
        total_pages: ceil(total / per_page)
      }
    }}
  end
  
  @doc """
  Get detailed user information for admin view.
  """
  def get_user_details(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, enrich_user_details(user)}
    end
  end
  
  defp enrich_user_details(user) do
    %{
      user: user,
      stats: %{
        messages_sent: 0,  # Would query messages
        groups_joined: 0,  # Would query memberships
        reports_received: 0,  # Would query reports
        reports_made: 0
      },
      sessions: [],  # Would fetch active sessions
      moderation_history: []  # Would fetch mod actions
    }
  end
  
  @doc """
  Ban a user.
  
  ## Options
  
  - `:reason` - Ban reason (required)
  - `:duration` - Duration in seconds, or `:permanent`
  - `:notify` - Whether to notify the user
  """
  def ban_user(user_id, admin_id, opts \\ []) do
    reason = Keyword.fetch!(opts, :reason)
    duration = Keyword.get(opts, :duration, :permanent)
    
    ban_until = case duration do
      :permanent -> nil
      seconds when is_integer(seconds) -> 
        DateTime.add(DateTime.utc_now(), seconds, :second)
    end
    
    with {:ok, user} <- get_user(user_id),
         {:ok, user} <- do_ban_user(user, ban_until),
         :ok <- log_admin_action(admin_id, :ban_user, %{
           user_id: user_id,
           reason: reason,
           duration: duration
         }) do
      # Terminate active sessions
      terminate_user_sessions(user_id)
      
      {:ok, user}
    end
  end
  
  defp get_user(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end
  
  defp do_ban_user(user, ban_until) do
    user
    |> Ecto.Changeset.change(%{
      banned_at: DateTime.utc_now(),
      banned_until: ban_until
    })
    |> Repo.update()
  end
  
  defp terminate_user_sessions(user_id) do
    # Delete all sessions for user
    from(s in Cgraph.Accounts.Session, where: s.user_id == ^user_id)
    |> Repo.delete_all()
    
    # Broadcast disconnect to any active sockets
    Phoenix.PubSub.broadcast(
      Cgraph.PubSub,
      "user:#{user_id}",
      {:force_disconnect, :banned}
    )
  end
  
  @doc """
  Unban a user.
  """
  def unban_user(user_id, admin_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Ban lifted")
    
    with {:ok, user} <- get_user(user_id),
         {:ok, user} <- do_unban_user(user),
         :ok <- log_admin_action(admin_id, :unban_user, %{
           user_id: user_id,
           reason: reason
         }) do
      {:ok, user}
    end
  end
  
  defp do_unban_user(user) do
    user
    |> Ecto.Changeset.change(%{
      banned_at: nil,
      banned_until: nil
    })
    |> Repo.update()
  end
  
  @doc """
  Verify a user (add verified badge).
  """
  def verify_user(user_id, admin_id) do
    with {:ok, user} <- get_user(user_id),
         {:ok, user} <- update_user_field(user, :is_verified, true),
         :ok <- log_admin_action(admin_id, :verify_user, %{user_id: user_id}) do
      {:ok, user}
    end
  end
  
  defp update_user_field(user, field, value) do
    user
    |> Ecto.Changeset.change(%{field => value})
    |> Repo.update()
  end
  
  # ---------------------------------------------------------------------------
  # Content Moderation
  # ---------------------------------------------------------------------------
  
  @doc """
  List content reports.
  
  ## Options
  
  - `:status` - Filter by status (pending, resolved, dismissed)
  - `:type` - Filter by content type (message, post, comment, user)
  - `:page`, `:per_page` - Pagination
  """
  def list_reports(_opts \\ []) do
    # Would query from reports table
    {:ok, %{
      reports: [],
      pagination: %{total: 0, page: 1, per_page: 50, total_pages: 0}
    }}
  end
  
  @doc """
  Resolve a content report.
  
  ## Actions
  
  - `:dismiss` - No action needed
  - `:warn` - Warn the user
  - `:remove` - Remove the content
  - `:ban` - Ban the user
  """
  def resolve_report(report_id, admin_id, action, opts \\ []) do
    with {:ok, _report} <- get_report(report_id),
         :ok <- execute_moderation_action(action, opts),
         :ok <- log_admin_action(admin_id, :resolve_report, %{
           report_id: report_id,
           action: action,
           notes: Keyword.get(opts, :notes)
         }) do
      {:ok, :resolved}
    end
  end
  
  defp get_report(_report_id) do
    # Would fetch report from database
    {:error, :not_found}
  end
  
  defp execute_moderation_action(_action, _opts) do
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # Audit Logging
  # ---------------------------------------------------------------------------
  
  @doc """
  Log an administrative action.
  """
  def log_admin_action(admin_id, action, details) do
    Logger.info("Admin action", 
      admin_id: admin_id,
      action: action,
      details: inspect(details)
    )
    
    # Would insert into audit_log table
    :ok
  end
  
  @doc """
  List audit log entries.
  """
  def list_audit_log(_opts \\ []) do
    # Would query from audit_log table
    {:ok, %{
      entries: [],
      pagination: %{total: 0, page: 1, per_page: 50, total_pages: 0}
    }}
  end
  
  # ---------------------------------------------------------------------------
  # System Configuration
  # ---------------------------------------------------------------------------
  
  @doc """
  Get all system configuration.
  """
  def get_config do
    %{
      features: %{
        registration_enabled: true,
        email_verification_required: true,
        wallet_auth_enabled: true,
        file_uploads_enabled: true,
        max_file_size_mb: 100
      },
      limits: %{
        max_message_length: 4000,
        max_groups_per_user: 100,
        max_channels_per_group: 500,
        rate_limit_per_minute: 100
      },
      maintenance: %{
        mode: :normal,  # :normal, :readonly, :maintenance
        message: nil
      }
    }
  end
  
  @doc """
  Update system configuration.
  """
  def update_config(admin_id, key, value) do
    # Would persist to database/runtime config
    log_admin_action(admin_id, :update_config, %{key: key, value: value})
    {:ok, :updated}
  end
  
  @doc """
  Enable maintenance mode.
  """
  def enable_maintenance_mode(admin_id, message \\ "System maintenance in progress") do
    log_admin_action(admin_id, :maintenance_mode, %{enabled: true, message: message})
    {:ok, :maintenance_enabled}
  end
  
  @doc """
  Disable maintenance mode.
  """
  def disable_maintenance_mode(admin_id) do
    log_admin_action(admin_id, :maintenance_mode, %{enabled: false})
    {:ok, :maintenance_disabled}
  end
  
  # ---------------------------------------------------------------------------
  # Data Export & Cleanup
  # ---------------------------------------------------------------------------
  
  @doc """
  Export user data (GDPR compliance).
  """
  def export_user_data(user_id, admin_id) do
    log_admin_action(admin_id, :export_user_data, %{user_id: user_id})
    
    # Would compile all user data into downloadable format
    {:ok, %{
      status: :processing,
      estimated_completion: DateTime.add(DateTime.utc_now(), 300, :second)
    }}
  end
  
  @doc """
  Permanently delete user data (GDPR right to be forgotten).
  """
  def delete_user_data(user_id, admin_id, opts \\ []) do
    confirmation = Keyword.get(opts, :confirmation)
    
    if confirmation != "DELETE_#{user_id}" do
      {:error, :confirmation_required}
    else
      log_admin_action(admin_id, :delete_user_data, %{user_id: user_id})
      
      # Would schedule deletion job
      {:ok, :deletion_scheduled}
    end
  end
end
