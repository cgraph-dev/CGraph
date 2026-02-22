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
  import CGraphWeb.ControllerHelpers, only: [render_error: 3]

  alias CGraph.Gamification.Marketplace
  # MarketplaceListing, MarketplaceTransaction accessed via Marketplace module
  alias CGraph.Accounts.AuditLog

  plug :require_admin
  plug :rate_limit, max_requests: 200, window_ms: 60_000

  alias CGraphWeb.Admin.MarketplaceController.SettingsActions

  # Delegated analytics, settings, and bulk operations
  defdelegate analytics(conn, params), to: SettingsActions
  defdelegate live_metrics(conn, params), to: SettingsActions
  defdelegate price_trends(conn, params), to: SettingsActions
  defdelegate get_settings(conn, params), to: SettingsActions
  defdelegate update_settings(conn, params), to: SettingsActions
  defdelegate banned_items(conn, params), to: SettingsActions
  defdelegate ban_item(conn, params), to: SettingsActions
  defdelegate bulk_approve(conn, params), to: SettingsActions
  defdelegate bulk_reject(conn, params), to: SettingsActions

  # ==================== LISTING MODERATION ====================

  @doc """
  List flagged or reported listings for review.

  ## Query Parameters
  - status: pending, approved, rejected, escalated
  - risk_level: low, medium, high, critical
  - page, per_page: pagination
  """
  @spec flagged_listings(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec show_listing(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec approve_listing(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec reject_listing(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec remove_listing(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec disputed_transactions(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec show_transaction(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show_transaction(conn, %{"id" => id}) do
    with {:ok, transaction} <- Marketplace.get_transaction_with_audit(id) do
      render(conn, :transaction_detail, transaction: transaction)
    end
  end

  @doc """
  Resolve a disputed transaction.

  Actions: refund_buyer, release_to_seller, split_refund
  """
  @spec resolve_transaction(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec user_profile(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def user_profile(conn, %{"user_id" => user_id}) do
    with {:ok, profile} <- Marketplace.get_user_marketplace_profile(user_id) do
      render(conn, :user_profile, profile: profile)
    end
  end

  @doc """
  Ban user from marketplace.
  """
  @spec ban_user(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec unban_user(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
end
