defmodule CGraphWeb.Admin.MarketplaceController do
  @moduledoc """
  Admin controller for marketplace moderation and management.

  Provides functionality for:
  - Reviewing flagged listings
  - Managing reported transactions
  - Viewing marketplace analytics
  - Configuring marketplace settings
  - Managing banned items/users

  Security:
  - All endpoints require admin authentication
  - Actions are audit logged with IP tracking
  - Rate limited to prevent abuse
  - Soft delete for audit trail

  Scale considerations:
  - Async moderation queue processing
  - Cached analytics with 5-minute TTL
  - Paginated responses with cursor support
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Gamification.Marketplace
  # MarketplaceListing, MarketplaceTransaction accessed via Marketplace module
  alias CGraph.Accounts.AuditLog

  plug :require_admin
  plug :rate_limit, max_requests: 200, window_ms: 60_000

  # ==================== LISTING MODERATION ====================

  @doc """
  List flagged or reported listings for review.

  ## Query Parameters
  - status: pending, approved, rejected, escalated
  - risk_level: low, medium, high, critical
  - page, per_page: pagination
  """
  def flagged_listings(conn, params) do
    page = get_page(params)
    per_page = get_per_page(params)

    filters = %{
      status: params["status"] || "pending",
      risk_level: params["risk_level"],
      item_type: params["item_type"],
      date_from: params["date_from"],
      date_to: params["date_to"]
    }

    {listings, pagination} = Marketplace.list_flagged_listings(
      filters,
      page: page,
      per_page: per_page
    )

    render(conn, :flagged_listings, listings: listings, pagination: pagination)
  end

  @doc """
  Get details of a specific listing for moderation.
  """
  def show_listing(conn, %{"id" => id}) do
    with {:ok, listing} <- Marketplace.get_listing_with_moderation_data(id) do
      # Include related data for moderation context
      moderation_context = %{
        seller_history: Marketplace.get_seller_history(listing.seller_id),
        similar_listings: Marketplace.find_similar_listings(listing),
        price_analysis: Marketplace.analyze_price(listing),
        fraud_signals: Marketplace.get_fraud_signals(listing)
      }

      render(conn, :listing_detail, listing: listing, context: moderation_context)
    end
  end

  @doc """
  Approve a flagged listing.
  """
  def approve_listing(conn, %{"id" => id, "note" => note}) do
    admin = conn.assigns.current_admin

    with {:ok, listing} <- Marketplace.get_listing(id),
         {:ok, approved_listing} <- Marketplace.approve_listing(listing, %{
           approved_by: admin.id,
           moderation_note: note
         }) do

      AuditLog.log(:listing_approved, admin.id, %{
        listing_id: id,
        note: note,
        ip: get_client_ip(conn)
      })

      render(conn, :listing_detail, listing: approved_listing)
    end
  end

  @doc """
  Reject a listing with reason.
  """
  def reject_listing(conn, %{"id" => id, "reason" => reason, "note" => note}) do
    admin = conn.assigns.current_admin

    with {:ok, listing} <- Marketplace.get_listing(id),
         {:ok, rejected_listing} <- Marketplace.reject_listing(listing, %{
           rejected_by: admin.id,
           rejection_reason: reason,
           moderation_note: note
         }) do

      # Notify seller
      CGraph.Notifications.send(listing.seller_id, :listing_rejected, %{
        listing_id: id,
        reason: reason
      })

      AuditLog.log(:listing_rejected, admin.id, %{
        listing_id: id,
        reason: reason,
        note: note,
        ip: get_client_ip(conn)
      })

      render(conn, :listing_detail, listing: rejected_listing)
    end
  end

  @doc """
  Remove a listing (soft delete with reason).
  """
  def remove_listing(conn, %{"id" => id, "reason" => reason}) do
    admin = conn.assigns.current_admin

    with {:ok, listing} <- Marketplace.get_listing(id),
         {:ok, _removed} <- Marketplace.remove_listing(listing, %{
           removed_by: admin.id,
           removal_reason: reason
         }) do

      # Notify seller
      CGraph.Notifications.send(listing.seller_id, :listing_removed, %{
        listing_id: id,
        reason: reason
      })

      # Broadcast removal
      CGraphWeb.Endpoint.broadcast!("marketplace:lobby", "listing_removed", %{
        listing_id: id
      })

      AuditLog.log(:listing_removed, admin.id, %{
        listing_id: id,
        seller_id: listing.seller_id,
        reason: reason,
        ip: get_client_ip(conn)
      })

      send_resp(conn, :no_content, "")
    end
  end

  # ==================== TRANSACTION MANAGEMENT ====================

  @doc """
  List disputed or flagged transactions.
  """
  def disputed_transactions(conn, params) do
    page = get_page(params)
    per_page = get_per_page(params)

    filters = %{
      status: params["status"] || "disputed",
      date_from: params["date_from"],
      date_to: params["date_to"]
    }

    {transactions, pagination} = Marketplace.list_disputed_transactions(
      filters,
      page: page,
      per_page: per_page
    )

    render(conn, :transactions, transactions: transactions, pagination: pagination)
  end

  @doc """
  Get transaction details with full audit trail.
  """
  def show_transaction(conn, %{"id" => id}) do
    with {:ok, transaction} <- Marketplace.get_transaction_with_audit(id) do
      render(conn, :transaction_detail, transaction: transaction)
    end
  end

  @doc """
  Resolve a disputed transaction.

  Actions: refund_buyer, release_to_seller, split_refund
  """
  def resolve_transaction(conn, %{"id" => id, "action" => action, "note" => note}) do
    admin = conn.assigns.current_admin

    with {:ok, transaction} <- Marketplace.get_transaction(id),
         {:ok, resolved} <- Marketplace.resolve_dispute(transaction, %{
           action: action,
           resolved_by: admin.id,
           resolution_note: note
         }) do

      # Notify parties
      CGraph.Notifications.send(transaction.buyer_id, :dispute_resolved, %{
        transaction_id: id,
        action: action
      })
      CGraph.Notifications.send(transaction.seller_id, :dispute_resolved, %{
        transaction_id: id,
        action: action
      })

      AuditLog.log(:dispute_resolved, admin.id, %{
        transaction_id: id,
        action: action,
        note: note,
        ip: get_client_ip(conn)
      })

      render(conn, :transaction_detail, transaction: resolved)
    end
  end

  # ==================== USER MANAGEMENT ====================

  @doc """
  Get user's marketplace activity and violations.
  """
  def user_profile(conn, %{"user_id" => user_id}) do
    with {:ok, profile} <- Marketplace.get_user_marketplace_profile(user_id) do
      render(conn, :user_profile, profile: profile)
    end
  end

  @doc """
  Ban user from marketplace.
  """
  def ban_user(conn, %{"user_id" => user_id, "reason" => reason, "duration" => duration}) do
    admin = conn.assigns.current_admin

    with {:ok, ban} <- Marketplace.ban_user(user_id, %{
           banned_by: admin.id,
           reason: reason,
           duration: parse_duration(duration)
         }) do

      # Cancel all active listings
      Marketplace.cancel_user_listings(user_id, reason: "Account banned")

      # Notify user
      CGraph.Notifications.send(user_id, :marketplace_banned, %{
        reason: reason,
        until: ban.banned_until
      })

      AuditLog.log(:user_marketplace_banned, admin.id, %{
        user_id: user_id,
        reason: reason,
        duration: duration,
        ip: get_client_ip(conn)
      })

      render(conn, :ban, ban: ban)
    end
  end

  @doc """
  Unban user from marketplace.
  """
  def unban_user(conn, %{"user_id" => user_id, "reason" => reason}) do
    admin = conn.assigns.current_admin

    with {:ok, _} <- Marketplace.unban_user(user_id, %{
           unbanned_by: admin.id,
           reason: reason
         }) do

      CGraph.Notifications.send(user_id, :marketplace_unbanned, %{reason: reason})

      AuditLog.log(:user_marketplace_unbanned, admin.id, %{
        user_id: user_id,
        reason: reason,
        ip: get_client_ip(conn)
      })

      send_resp(conn, :no_content, "")
    end
  end

  # ==================== ANALYTICS ====================

  @doc """
  Get marketplace analytics dashboard data.
  """
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
  def live_metrics(conn, _params) do
    metrics = Marketplace.get_live_metrics()
    render(conn, :live_metrics, metrics: metrics)
  end

  @doc """
  Get price trends for items.
  """
  def price_trends(conn, %{"item_type" => item_type} = params) do
    days = String.to_integer(params["days"] || "30")

    trends = Marketplace.get_price_trends(item_type, days: days)
    render(conn, :price_trends, trends: trends)
  end

  # ==================== SETTINGS ====================

  @doc """
  Get marketplace configuration.
  """
  def get_settings(conn, _params) do
    settings = Marketplace.get_settings()
    render(conn, :settings, settings: settings)
  end

  @doc """
  Update marketplace configuration.
  """
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
  def banned_items(conn, _params) do
    items = Marketplace.get_banned_items()
    render(conn, :banned_items, items: items)
  end

  @doc """
  Ban an item from being traded.
  """
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

  # ==================== PRIVATE FUNCTIONS ====================

  defp require_admin(conn, _opts) do
    case conn.assigns[:current_admin] do
      nil ->
        conn
        |> render_error(401, "Admin authentication required")
        |> halt()

      admin ->
        if admin.role in [:admin, :super_admin, :moderator] do
          conn
        else
          conn
          |> render_error(403, "Insufficient permissions")
          |> halt()
        end
    end
  end

  defp rate_limit(conn, opts) do
    max_requests = Keyword.get(opts, :max_requests, 200)
    window_ms = Keyword.get(opts, :window_ms, 60_000)
    key = "admin_marketplace:#{conn.assigns.current_admin.id}"

    case CGraph.RateLimiter.check(key, :admin_api, limit: max_requests, window_ms: window_ms) do
      :ok -> conn
      {:error, :rate_limited, _info} ->
        conn
        |> render_error(429, "Rate limit exceeded")
        |> halt()
    end
  end

  defp get_page(params), do: max(1, String.to_integer(params["page"] || "1"))
  defp get_per_page(params), do: min(100, max(1, String.to_integer(params["per_page"] || "20")))

  defp get_client_ip(conn) do
    conn
    |> get_req_header("x-forwarded-for")
    |> List.first()
    |> case do
      nil -> to_string(:inet.ntoa(conn.remote_ip))
      ip -> ip |> String.split(",") |> List.first() |> String.trim()
    end
  end

  defp parse_duration("permanent"), do: nil
  defp parse_duration(duration) do
    case Integer.parse(duration) do
      {days, _} -> DateTime.add(DateTime.utc_now(), days * 24 * 60 * 60)
      :error -> DateTime.add(DateTime.utc_now(), 30 * 24 * 60 * 60) # Default 30 days
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
