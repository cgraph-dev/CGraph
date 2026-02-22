defmodule CGraphWeb.Admin.MarketplaceController.SettingsActions do
  @moduledoc """
  Helper module for admin marketplace analytics, settings, and bulk moderation actions.

  Handles:
  - Analytics dashboard queries
  - Real-time marketplace metrics
  - Price trend reporting
  - Marketplace configuration management
  - Banned item management
  - Bulk listing approve/reject operations
  """
  import Plug.Conn
  import Phoenix.Controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Gamification.Marketplace
  alias CGraph.Accounts.AuditLog

  # ==================== ANALYTICS ====================

  @doc """
  Get marketplace analytics dashboard data.
  """
  @spec analytics(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def analytics(conn, params) do
    date_range = %{
      from: parse_date(params["from"]) || Date.add(Date.utc_today(), -30),
      to: parse_date(params["to"]) || Date.utc_today()
    }

    analytics = Marketplace.get_analytics(date_range)

    render(conn, :analytics, analytics: analytics)
  end

  @doc """
  Get real-time marketplace metrics.
  """
  @spec live_metrics(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def live_metrics(conn, _params) do
    metrics = Marketplace.get_live_metrics()
    render(conn, :live_metrics, metrics: metrics)
  end

  @doc """
  Get price trends for items.
  """
  @spec price_trends(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def price_trends(conn, %{"item_type" => item_type} = params) do
    days = String.to_integer(params["days"] || "30")

    trends = Marketplace.get_price_trends(item_type, days: days)
    render(conn, :price_trends, trends: trends)
  end

  # ==================== SETTINGS ====================

  @doc """
  Get marketplace configuration.
  """
  @spec get_settings(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_settings(conn, _params) do
    settings = Marketplace.get_settings()
    render(conn, :settings, settings: settings)
  end

  @doc """
  Update marketplace configuration.
  """
  @spec update_settings(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_settings(conn, %{"settings" => settings_params}) do
    admin = conn.assigns.current_admin

    with {:ok, settings} <- Marketplace.update_settings(settings_params) do
      AuditLog.log(:marketplace_settings_updated, admin.id, %{
        changes: settings_params,
        ip: get_client_ip(conn)
      })

      render(conn, :settings, settings: settings)
    end
  end

  @doc """
  Get list of banned items (cosmetics that cannot be traded).
  """
  @spec banned_items(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def banned_items(conn, _params) do
    items = Marketplace.get_banned_items()
    render(conn, :banned_items, items: items)
  end

  @doc """
  Ban an item from being traded.
  """
  @spec ban_item(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def ban_item(conn, %{"item_type" => type, "item_id" => id, "reason" => reason}) do
    admin = conn.assigns.current_admin

    with {:ok, _} <- Marketplace.ban_item(type, id, %{
           banned_by: admin.id,
           reason: reason
         }) do

      # Cancel all active listings for this item
      Marketplace.cancel_item_listings(type, id, reason: "Item banned from trading")

      AuditLog.log(:item_banned, admin.id, %{
        item_type: type,
        item_id: id,
        reason: reason,
        ip: get_client_ip(conn)
      })

      send_resp(conn, :no_content, "")
    end
  end

  # ==================== BULK OPERATIONS ====================

  @doc """
  Bulk approve listings.
  """
  @spec bulk_approve(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def bulk_approve(conn, %{"listing_ids" => ids, "note" => note}) do
    admin = conn.assigns.current_admin

    {approved, failed} = Marketplace.bulk_approve_listings(ids, %{
      approved_by: admin.id,
      moderation_note: note
    })

    AuditLog.log(:bulk_listings_approved, admin.id, %{
      approved_count: length(approved),
      failed_count: length(failed),
      ip: get_client_ip(conn)
    })

    render_data(conn, %{
      approved: length(approved),
      failed: length(failed),
      failed_ids: failed
    })
  end

  @doc """
  Bulk reject listings.
  """
  @spec bulk_reject(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def bulk_reject(conn, %{"listing_ids" => ids, "reason" => reason, "note" => note}) do
    admin = conn.assigns.current_admin

    {rejected, failed} = Marketplace.bulk_reject_listings(ids, %{
      rejected_by: admin.id,
      rejection_reason: reason,
      moderation_note: note
    })

    AuditLog.log(:bulk_listings_rejected, admin.id, %{
      rejected_count: length(rejected),
      failed_count: length(failed),
      reason: reason,
      ip: get_client_ip(conn)
    })

    render_data(conn, %{
      rejected: length(rejected),
      failed: length(failed),
      failed_ids: failed
    })
  end

  # ==================== PRIVATE HELPERS ====================

  defp get_client_ip(conn) do
    conn
    |> Plug.Conn.get_req_header("x-forwarded-for")
    |> List.first()
    |> case do
      nil -> to_string(:inet.ntoa(conn.remote_ip))
      ip -> ip |> String.split(",") |> List.first() |> String.trim()
    end
  end

  defp parse_date(nil), do: nil
  defp parse_date(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      _ -> nil
    end
  end
end
