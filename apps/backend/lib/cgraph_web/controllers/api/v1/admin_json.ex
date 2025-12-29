defmodule CgraphWeb.API.V1.AdminJSON do
  @moduledoc """
  JSON rendering for Admin API responses.
  
  ## Response Formats
  
  All responses follow consistent structure with:
  
  - Timestamps in ISO 8601 format
  - Pagination metadata for list endpoints
  - Nested objects flattened appropriately
  
  ## Usage
  
      AdminJSON.metrics(metrics)
      AdminJSON.users(users_result)
      AdminJSON.user(user)
  """
  
  # ---------------------------------------------------------------------------
  # System Metrics
  # ---------------------------------------------------------------------------
  
  @doc """
  Render comprehensive system metrics.
  """
  def metrics(metrics) do
    %{
      data: %{
        users: %{
          total: metrics.users.total,
          new_today: metrics.users.new_today,
          active_24h: metrics.users.active_24h,
          premium: metrics.users.premium,
          verified: metrics.users.verified
        },
        messages: %{
          total: metrics.messages.total,
          today: metrics.messages.today,
          avg_per_user: metrics.messages.avg_per_user
        },
        groups: %{
          total: metrics.groups.total,
          public: metrics.groups.public,
          private: metrics.groups.private,
          avg_members: metrics.groups.avg_members
        },
        system: %{
          uptime_seconds: metrics.system.uptime_seconds,
          uptime_formatted: format_uptime(metrics.system.uptime_seconds),
          memory: metrics.system.memory,
          processes: metrics.system.processes,
          schedulers: metrics.system.schedulers,
          otp_release: metrics.system.otp_release,
          elixir_version: metrics.system.elixir_version
        },
        jobs: %{
          pending: metrics.jobs.pending,
          running: metrics.jobs.running,
          completed_24h: metrics.jobs.completed_24h,
          failed_24h: metrics.jobs.failed_24h
        }
      },
      collected_at: DateTime.to_iso8601(metrics.collected_at)
    }
  end
  
  @doc """
  Render real-time stats.
  """
  def realtime(stats) do
    %{
      data: %{
        active_connections: stats.active_connections,
        requests_per_minute: stats.requests_per_minute,
        database_latency_ms: stats.database_latency_ms,
        cache_hit_rate: stats.cache_hit_rate,
        memory_usage_mb: stats.memory_usage_mb
      },
      timestamp: DateTime.to_iso8601(stats.timestamp)
    }
  end
  
  # ---------------------------------------------------------------------------
  # User Management
  # ---------------------------------------------------------------------------
  
  @doc """
  Render paginated users list.
  """
  def users(%{users: users, pagination: pagination}) do
    %{
      data: Enum.map(users, &user/1),
      pagination: %{
        total: pagination.total,
        page: pagination.page,
        per_page: pagination.per_page,
        total_pages: pagination.total_pages
      }
    }
  end
  
  @doc """
  Render single user for admin view.
  """
  def user(user) do
    %{
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      is_premium: user.is_premium,
      is_admin: Map.get(user, :is_admin, false),
      status: determine_user_status(user),
      banned_at: format_datetime(Map.get(user, :banned_at)),
      banned_until: format_datetime(Map.get(user, :banned_until)),
      deleted_at: format_datetime(Map.get(user, :deleted_at)),
      last_seen_at: format_datetime(user.last_seen_at),
      created_at: format_datetime(user.inserted_at)
    }
  end
  
  @doc """
  Render detailed user information.
  """
  def user_details(%{user: user, stats: stats, sessions: sessions, moderation_history: history}) do
    %{
      data: %{
        user: user(user),
        stats: %{
          messages_sent: stats.messages_sent,
          groups_joined: stats.groups_joined,
          reports_received: stats.reports_received,
          reports_made: stats.reports_made
        },
        sessions: Enum.map(sessions, fn session ->
          %{
            id: session.id,
            device: session.device,
            ip_address: session.ip_address,
            last_active: format_datetime(session.last_active_at),
            created_at: format_datetime(session.inserted_at)
          }
        end),
        moderation_history: Enum.map(history, fn action ->
          %{
            action: action.action,
            reason: action.reason,
            admin_id: action.admin_id,
            created_at: format_datetime(action.inserted_at)
          }
        end)
      }
    }
  end
  
  # ---------------------------------------------------------------------------
  # Content Moderation
  # ---------------------------------------------------------------------------
  
  @doc """
  Render paginated reports list.
  """
  def reports(%{reports: reports, pagination: pagination}) do
    %{
      data: Enum.map(reports, &report/1),
      pagination: %{
        total: pagination.total,
        page: pagination.page,
        per_page: pagination.per_page,
        total_pages: pagination.total_pages
      }
    }
  end
  
  @doc """
  Render single report.
  """
  def report(report) do
    %{
      id: report.id,
      type: report.type,
      status: report.status,
      reason: report.reason,
      content_preview: report.content_preview,
      reporter: %{
        id: report.reporter_id,
        username: report.reporter_username
      },
      target: %{
        id: report.target_id,
        type: report.target_type
      },
      resolved_by: report.resolved_by_id,
      resolution_notes: report.resolution_notes,
      created_at: format_datetime(report.inserted_at),
      resolved_at: format_datetime(report.resolved_at)
    }
  end
  
  # ---------------------------------------------------------------------------
  # Audit Log
  # ---------------------------------------------------------------------------
  
  @doc """
  Render paginated audit log.
  """
  def audit_log(%{entries: entries, pagination: pagination}) do
    %{
      data: Enum.map(entries, &audit_entry/1),
      pagination: %{
        total: pagination.total,
        page: pagination.page,
        per_page: pagination.per_page,
        total_pages: pagination.total_pages
      }
    }
  end
  
  @doc """
  Render single audit log entry.
  """
  def audit_entry(entry) do
    %{
      id: entry.id,
      admin: %{
        id: entry.admin_id,
        username: entry.admin_username
      },
      action: entry.action,
      details: entry.details,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: format_datetime(entry.inserted_at)
    }
  end
  
  # ---------------------------------------------------------------------------
  # System Configuration
  # ---------------------------------------------------------------------------
  
  @doc """
  Render system configuration.
  """
  def config(config) do
    %{
      data: %{
        features: config.features,
        limits: config.limits,
        maintenance: %{
          mode: config.maintenance.mode,
          message: config.maintenance.message
        }
      }
    }
  end
  
  # ---------------------------------------------------------------------------
  # Helper Functions
  # ---------------------------------------------------------------------------
  
  defp format_datetime(nil), do: nil
  defp format_datetime(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp format_datetime(%NaiveDateTime{} = ndt) do
    ndt
    |> DateTime.from_naive!("Etc/UTC")
    |> DateTime.to_iso8601()
  end
  
  defp format_uptime(seconds) when seconds < 60 do
    "#{seconds}s"
  end
  
  defp format_uptime(seconds) when seconds < 3600 do
    minutes = div(seconds, 60)
    secs = rem(seconds, 60)
    "#{minutes}m #{secs}s"
  end
  
  defp format_uptime(seconds) when seconds < 86400 do
    hours = div(seconds, 3600)
    minutes = div(rem(seconds, 3600), 60)
    "#{hours}h #{minutes}m"
  end
  
  defp format_uptime(seconds) do
    days = div(seconds, 86400)
    hours = div(rem(seconds, 86400), 3600)
    "#{days}d #{hours}h"
  end
  
  defp determine_user_status(user) do
    cond do
      Map.get(user, :deleted_at) != nil -> "deleted"
      Map.get(user, :banned_at) != nil -> "banned"
      true -> "active"
    end
  end
end
