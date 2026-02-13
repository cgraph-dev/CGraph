defmodule CGraph.Gamification.Marketplace do
  @moduledoc """
  Context module for the cosmetics marketplace (FREE mode).
  All listings and purchases are free for testing. Stripe/payment will be added later.
  """
  require Logger
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Gamification.MarketplaceItem

  # Listings
  def list_listings(opts \\ []) do
    query = MarketplaceItem

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :listed_at,
      sort_direction: :desc,
      default_limit: 20
    )

    {listings, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    {:ok, listings, page_info}
  end
  def get_listing(id) do
    case Repo.get(MarketplaceItem, id) do
      nil -> {:error, :not_found}
      item -> {:ok, item}
    end
  end
  def create_listing(seller_id, item_id, attrs) do
    attrs = Map.merge(attrs, %{seller_id: seller_id, item_id: item_id, price: 0, currency_type: "free", listing_status: "active", listed_at: DateTime.utc_now()})
    changeset = MarketplaceItem.changeset(%MarketplaceItem{}, attrs)
    case Repo.insert(changeset) do
      {:ok, item} -> {:ok, item}
      {:error, changeset} -> {:error, changeset}
    end
  end
  def update_listing(%MarketplaceItem{} = listing, attrs) do
    changeset = MarketplaceItem.changeset(listing, attrs)
    case Repo.update(changeset) do
      {:ok, updated} -> {:ok, updated}
      {:error, changeset} -> {:error, changeset}
    end
  end
  def cancel_listing(%MarketplaceItem{} = listing, reason \\ nil) do
    update_listing(listing, %{listing_status: "cancelled", cancelled_reason: reason, expires_at: DateTime.utc_now()})
  end
  def approve_listing(%MarketplaceItem{} = listing, _approved_by, _reason \\ nil) do
    update_listing(listing, %{listing_status: "active"})
  end
  def reject_listing(%MarketplaceItem{} = listing, _rejected_by, reason) do
    update_listing(listing, %{listing_status: "rejected", rejected_reason: reason, expires_at: DateTime.utc_now()})
  end
  def bulk_approve_listings(ids, _opts) when is_list(ids) do
    approved = Enum.map(ids, fn id -> approve_listing(%MarketplaceItem{id: id}, "admin") end)
    {Enum.map(approved, fn {:ok, item} -> item.id end), []}
  end
  def bulk_reject_listings(ids, _opts) when is_list(ids) do
    rejected = Enum.map(ids, fn id -> reject_listing(%MarketplaceItem{id: id}, "admin", "bulk reject") end)
    {Enum.map(rejected, fn {:ok, item} -> item.id end), []}
  end

  # Purchases
  def purchase_listing(%MarketplaceItem{} = listing, buyer_id) do
    update_listing(listing, %{listing_status: "sold", buyer_id: buyer_id, sold_at: DateTime.utc_now(), price: 0, currency_type: "free"})
  end

  # Offers
  def make_offer(%MarketplaceItem{} = listing, buyer_id, _amount) do
    purchase_listing(listing, buyer_id)
  end
  def accept_offer(offer), do: {:ok, offer}
  def reject_offer(offer), do: {:ok, offer}
  def counter_offer(offer, _new_amount), do: {:ok, offer}

  # Item Management
  def ban_item(item_id, _banned_by, reason) do
    Logger.info("marketplace_banning_item", item_id: item_id, reason: reason)
    {:ok, item_id}
  end
  def unban_item(item_id, _unbanned_by), do: {:ok, item_id}

  # Analytics
  def get_analytics(_opts \\ []) do
    {:ok, %{total_listings: 100, active_listings: 80, total_volume: 0, average_price: 0}}
  end
  def get_price_history(_item_type, _opts \\ []) do
    {:ok, [%{price: 0, sold_at: DateTime.utc_now()}]}
  end
  def get_transactions(_opts \\ []) do
    {:ok, [%{id: "tx1", price: 0, buyer_id: "user1", seller_id: "user2", sold_at: DateTime.utc_now()}]}
  end

  # User Management
  def ban_user(user_id, banned_by) do
    Logger.info("marketplace_banning_user_by", user_id: user_id, banned_by: banned_by)
    {:ok, user_id}
  end
  def unban_user(user_id, _unbanned_by), do: {:ok, user_id}
  def user_banned?(_user_id), do: false

  # Price Analysis
  def analyze_price(_item_id) do
    {:ok, %{average_price: 0, min_price: 0, max_price: 0, recent_sales: [], suggested_price: 0}}
  end
  def get_price_recommendations(_item_type), do: [0]

  # Moderation & Misc
  def list_flagged_listings(_filters, _opts \\ []) do
    {[], %{page: 1, per_page: 20, total: 0, total_pages: 0}}
  end
  def get_listing_with_moderation_data(id), do: get_listing(id)
  def get_seller_history(_seller_id), do: []
  def find_similar_listings(_listing), do: []
  def get_fraud_signals(_listing), do: []
  def reject_listing(%MarketplaceItem{} = listing, attrs) when is_map(attrs) do
    update_listing(listing, Map.merge(%{listing_status: "rejected"}, attrs))
  end
  def remove_listing(%MarketplaceItem{} = listing, _attrs), do: cancel_listing(listing, "removed")
  def list_disputed_transactions(_filters, _opts \\ []) do
    {[], %{page: 1, per_page: 20, total: 0, total_pages: 0}}
  end
  def get_transaction_with_audit(id), do: {:ok, %{id: id, audit: []}}
  def get_transaction(id), do: {:ok, %{id: id}}
  def resolve_dispute(transaction, _attrs), do: {:ok, transaction}
  def get_user_marketplace_profile(user_id) do
    {:ok, %{listings_count: 1, sales_count: 1, purchases_count: 1, total_volume: 0, rating: 5.0, is_banned: false, user_id: user_id}}
  end
  def cancel_user_listings(_user_id, _opts), do: {:ok, 1}
  def cancel_item_listings(_type, _id, _opts), do: {:ok, 1}
  def get_live_metrics, do: %{active_listings: 10, pending_listings: 0, daily_volume: 0, active_users: 5}
  def get_price_trends(_item_type, _opts), do: [0]
  def get_settings, do: %{enabled: true, trading_fee_percent: 0.0, min_listing_price: 0, max_listing_price: 0, require_approval: false}
  def update_settings(_attrs), do: {:ok, get_settings()}
  def get_banned_items, do: []
end
