defmodule CGraph.Admin do
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
  import CGraph.Query.SoftDelete

  alias CGraph.Accounts.User
  alias CGraph.Repo
  # Schemas to be implemented:
  # alias CGraph.Admin.{AuditEntry, Report, SystemConfig}

  # ---------------------------------------------------------------------------
  # System Metrics — delegated to CGraph.Admin.Metrics
  # ---------------------------------------------------------------------------

  defdelegate get_system_metrics, to: CGraph.Admin.Metrics
  defdelegate get_realtime_stats, to: CGraph.Admin.Metrics

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
      :active -> from u in query, where: is_nil(u.banned_at) and not_deleted(u)
      _ -> query
    end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: sort,
      sort_direction: order,
      default_limit: 50
    )

    {users, page_info} = CGraph.Pagination.paginate(query, pagination_opts)

    {:ok, %{
      users: users,
      pagination: page_info
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
    from(s in CGraph.Accounts.Session, where: s.user_id == ^user_id)
    |> Repo.delete_all()

    # Broadcast disconnect to any active sockets
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
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
        max_forums_free_tier: 5,
        max_groups_free_tier: 5,
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
