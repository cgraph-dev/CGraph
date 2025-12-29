defmodule CgraphWeb.API.V1.AdminController do
  @moduledoc """
  Admin dashboard API controller.
  
  ## Overview
  
  Provides REST endpoints for administrative operations:
  
  | Endpoint | Description |
  |----------|-------------|
  | `GET /admin/metrics` | System metrics dashboard |
  | `GET /admin/realtime` | Real-time stats (SSE) |
  | `GET /admin/users` | List/search users |
  | `POST /admin/users/:id/ban` | Ban a user |
  | `DELETE /admin/users/:id/ban` | Unban a user |
  | `GET /admin/reports` | List content reports |
  | `POST /admin/reports/:id/resolve` | Resolve a report |
  | `GET /admin/audit` | Audit log |
  | `GET /admin/config` | System configuration |
  | `PUT /admin/config` | Update configuration |
  
  ## Authorization
  
  All endpoints require admin privileges. The `RequireAdmin` plug
  verifies the user has appropriate permissions before allowing access.
  
  ## Example Usage
  
  ```bash
  # Get system metrics
  curl -H "Authorization: Bearer $TOKEN" \\
       https://api.example.com/api/v1/admin/metrics
  
  # Ban a user
  curl -X POST -H "Authorization: Bearer $TOKEN" \\
       -d '{"reason": "TOS violation", "duration": 86400}' \\
       https://api.example.com/api/v1/admin/users/123/ban
  ```
  """
  
  use CgraphWeb, :controller
  
  alias Cgraph.Admin
  alias CgraphWeb.API.V1.AdminJSON
  
  action_fallback CgraphWeb.FallbackController
  
  # ---------------------------------------------------------------------------
  # System Metrics
  # ---------------------------------------------------------------------------
  
  @doc """
  Get comprehensive system metrics.
  
  Returns user counts, message stats, system health, and job status.
  """
  def metrics(conn, _params) do
    admin_id = conn.assigns.current_user.id
    
    with {:ok, metrics} <- Admin.get_system_metrics() do
      # Log admin access
      Admin.log_admin_action(admin_id, :view_metrics, %{})
      
      conn
      |> put_status(:ok)
      |> json(AdminJSON.metrics(metrics))
    end
  end
  
  @doc """
  Get real-time stats for live dashboard.
  
  Returns current snapshot of system performance.
  """
  def realtime(conn, _params) do
    stats = Admin.get_realtime_stats()
    
    conn
    |> put_status(:ok)
    |> json(AdminJSON.realtime(stats))
  end
  
  # ---------------------------------------------------------------------------
  # User Management
  # ---------------------------------------------------------------------------
  
  @doc """
  List users with search and filtering.
  
  ## Query Parameters
  
  - `search` - Search term for username/email
  - `status` - Filter: active, banned, deleted
  - `sort` - Sort by: inserted_at, last_seen_at, username
  - `order` - Order: asc, desc
  - `page` - Page number (default: 1)
  - `per_page` - Items per page (default: 50, max: 100)
  """
  def list_users(conn, params) do
    opts = [
      search: params["search"],
      status: parse_status(params["status"]),
      sort: parse_sort(params["sort"]),
      order: parse_order(params["order"]),
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 50), 100)
    ]
    
    with {:ok, result} <- Admin.list_users(opts) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.users(result))
    end
  end
  
  @doc """
  Get detailed user information.
  """
  def show_user(conn, %{"id" => user_id}) do
    with {:ok, details} <- Admin.get_user_details(user_id) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.user_details(details))
    end
  end
  
  @doc """
  Ban a user.
  
  ## Request Body
  
  ```json
  {
    "reason": "TOS violation",
    "duration": 86400,  // seconds, or "permanent"
    "notify": true
  }
  ```
  """
  def ban_user(conn, %{"id" => user_id} = params) do
    admin_id = conn.assigns.current_user.id
    
    opts = [
      reason: params["reason"] || "No reason provided",
      duration: parse_duration(params["duration"]),
      notify: params["notify"] != false
    ]
    
    with {:ok, user} <- Admin.ban_user(user_id, admin_id, opts) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.user(user))
    end
  end
  
  @doc """
  Unban a user.
  
  ## Request Body
  
  ```json
  {
    "reason": "Appeal approved"
  }
  ```
  """
  def unban_user(conn, %{"id" => user_id} = params) do
    admin_id = conn.assigns.current_user.id
    
    opts = [reason: params["reason"]]
    
    with {:ok, user} <- Admin.unban_user(user_id, admin_id, opts) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.user(user))
    end
  end
  
  @doc """
  Verify a user (add verified badge).
  """
  def verify_user(conn, %{"id" => user_id}) do
    admin_id = conn.assigns.current_user.id
    
    with {:ok, user} <- Admin.verify_user(user_id, admin_id) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.user(user))
    end
  end
  
  # ---------------------------------------------------------------------------
  # Content Moderation
  # ---------------------------------------------------------------------------
  
  @doc """
  List content reports.
  
  ## Query Parameters
  
  - `status` - Filter: pending, resolved, dismissed
  - `type` - Filter: message, post, comment, user
  - `page`, `per_page` - Pagination
  """
  def list_reports(conn, params) do
    opts = [
      status: params["status"],
      type: params["type"],
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 50), 100)
    ]
    
    with {:ok, result} <- Admin.list_reports(opts) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.reports(result))
    end
  end
  
  @doc """
  Resolve a content report.
  
  ## Request Body
  
  ```json
  {
    "action": "remove",  // dismiss, warn, remove, ban
    "notes": "Content violated community guidelines"
  }
  ```
  """
  def resolve_report(conn, %{"id" => report_id} = params) do
    admin_id = conn.assigns.current_user.id
    action = String.to_existing_atom(params["action"] || "dismiss")
    
    opts = [notes: params["notes"]]
    
    with {:ok, _} <- Admin.resolve_report(report_id, admin_id, action, opts) do
      conn
      |> put_status(:ok)
      |> json(%{status: "resolved", action: action})
    end
  end
  
  # ---------------------------------------------------------------------------
  # Audit Log
  # ---------------------------------------------------------------------------
  
  @doc """
  List audit log entries.
  
  ## Query Parameters
  
  - `admin_id` - Filter by admin user
  - `action` - Filter by action type
  - `from`, `to` - Date range (ISO 8601)
  - `page`, `per_page` - Pagination
  """
  def list_audit_log(conn, params) do
    admin_id = conn.assigns.current_user.id
    
    # Log that admin is viewing the audit log
    Admin.log_admin_action(admin_id, :view_audit_log, %{})
    
    opts = [
      admin_id: params["admin_id"],
      action: params["action"],
      from: params["from"],
      to: params["to"],
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 50), 100)
    ]
    
    with {:ok, result} <- Admin.list_audit_log(opts) do
      conn
      |> put_status(:ok)
      |> json(AdminJSON.audit_log(result))
    end
  end
  
  # ---------------------------------------------------------------------------
  # System Configuration
  # ---------------------------------------------------------------------------
  
  @doc """
  Get current system configuration.
  """
  def get_config(conn, _params) do
    config = Admin.get_config()
    
    conn
    |> put_status(:ok)
    |> json(AdminJSON.config(config))
  end
  
  @doc """
  Update system configuration.
  
  ## Request Body
  
  ```json
  {
    "key": "features.registration_enabled",
    "value": false
  }
  ```
  """
  def update_config(conn, %{"key" => key, "value" => value}) do
    admin_id = conn.assigns.current_user.id
    
    with {:ok, _} <- Admin.update_config(admin_id, key, value) do
      conn
      |> put_status(:ok)
      |> json(%{status: "updated", key: key})
    end
  end
  
  @doc """
  Enable maintenance mode.
  
  ## Request Body
  
  ```json
  {
    "message": "Scheduled maintenance - back in 30 minutes"
  }
  ```
  """
  def enable_maintenance(conn, params) do
    admin_id = conn.assigns.current_user.id
    message = params["message"] || "System maintenance in progress"
    
    with {:ok, _} <- Admin.enable_maintenance_mode(admin_id, message) do
      conn
      |> put_status(:ok)
      |> json(%{status: "maintenance_enabled", message: message})
    end
  end
  
  @doc """
  Disable maintenance mode.
  """
  def disable_maintenance(conn, _params) do
    admin_id = conn.assigns.current_user.id
    
    with {:ok, _} <- Admin.disable_maintenance_mode(admin_id) do
      conn
      |> put_status(:ok)
      |> json(%{status: "maintenance_disabled"})
    end
  end
  
  # ---------------------------------------------------------------------------
  # Data Export/Deletion
  # ---------------------------------------------------------------------------
  
  @doc """
  Export user data (GDPR).
  """
  def export_user_data(conn, %{"id" => user_id}) do
    admin_id = conn.assigns.current_user.id
    
    with {:ok, result} <- Admin.export_user_data(user_id, admin_id) do
      conn
      |> put_status(:accepted)
      |> json(result)
    end
  end
  
  @doc """
  Delete user data (GDPR right to be forgotten).
  
  Requires confirmation parameter: "DELETE_{user_id}"
  """
  def delete_user_data(conn, %{"id" => user_id, "confirmation" => confirmation}) do
    admin_id = conn.assigns.current_user.id
    
    with {:ok, _} <- Admin.delete_user_data(user_id, admin_id, confirmation: confirmation) do
      conn
      |> put_status(:accepted)
      |> json(%{status: "deletion_scheduled"})
    end
  end
  
  # ---------------------------------------------------------------------------
  # Helper Functions
  # ---------------------------------------------------------------------------
  
  defp parse_status(nil), do: nil
  defp parse_status("active"), do: :active
  defp parse_status("banned"), do: :banned
  defp parse_status("deleted"), do: :deleted
  defp parse_status(_), do: nil
  
  defp parse_sort(nil), do: :inserted_at
  defp parse_sort("inserted_at"), do: :inserted_at
  defp parse_sort("last_seen_at"), do: :last_seen_at
  defp parse_sort("username"), do: :username
  defp parse_sort(_), do: :inserted_at
  
  defp parse_order(nil), do: :desc
  defp parse_order("asc"), do: :asc
  defp parse_order("desc"), do: :desc
  defp parse_order(_), do: :desc
  
  defp parse_int(nil, default), do: default
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  
  defp parse_duration(nil), do: :permanent
  defp parse_duration("permanent"), do: :permanent
  defp parse_duration(val) when is_integer(val), do: val
  defp parse_duration(val) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> :permanent
    end
  end
end
