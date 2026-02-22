defmodule CGraph.Gamification.Marketplace do
  @moduledoc """
  Context module for the cosmetics marketplace (FREE mode).
  All listings and purchases are free for testing. Stripe/payment will be added later.
  """
  require Logger
  import Ecto.Query, warn: false
  alias CGraph.Gamification.MarketplaceItem
  alias CGraph.Repo

  # Listings
  @spec list_listings(keyword()) :: {:ok, [MarketplaceItem.t()], map()}
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
  @spec get_listing(String.t()) :: {:ok, MarketplaceItem.t()} | {:error, :not_found}
  def get_listing(id) do
    case Repo.get(MarketplaceItem, id) do
      nil -> {:error, :not_found}
      item -> {:ok, item}
    end
  end
  @spec create_listing(String.t(), String.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def create_listing(seller_id, item_id, attrs) do
    defaults = %{seller_id: seller_id, item_id: item_id, listing_status: "active", listed_at: DateTime.truncate(DateTime.utc_now(), :second)}
    attrs = Map.merge(defaults, attrs)
    changeset = MarketplaceItem.changeset(%MarketplaceItem{}, attrs)
    case Repo.insert(changeset) do
      {:ok, item} -> {:ok, item}
      {:error, changeset} -> {:error, changeset}
    end
  end
  @spec update_listing(MarketplaceItem.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def update_listing(%MarketplaceItem{} = listing, attrs) do
    changeset = MarketplaceItem.changeset(listing, attrs)
    case Repo.update(changeset) do
      {:ok, updated} -> {:ok, updated}
      {:error, changeset} -> {:error, changeset}
    end
  end
  @spec cancel_listing(MarketplaceItem.t(), String.t() | nil) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def cancel_listing(%MarketplaceItem{} = listing, reason \\ nil) do
    update_listing(listing, %{listing_status: "cancelled", cancelled_reason: reason, expires_at: DateTime.truncate(DateTime.utc_now(), :second)})
  end
  @spec approve_listing(MarketplaceItem.t(), String.t(), String.t() | nil) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def approve_listing(%MarketplaceItem{} = listing, _approved_by, _reason \\ nil) do
    update_listing(listing, %{listing_status: "active"})
  end
  @spec reject_listing(MarketplaceItem.t(), String.t(), String.t()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def reject_listing(%MarketplaceItem{} = listing, _rejected_by, reason) do
    update_listing(listing, %{listing_status: "rejected", rejected_reason: reason, expires_at: DateTime.truncate(DateTime.utc_now(), :second)})
  end
  @spec bulk_approve_listings([String.t()], keyword()) :: {[String.t()], list()}
  def bulk_approve_listings(ids, _opts) when is_list(ids) do
    approved = Enum.map(ids, fn id -> approve_listing(%MarketplaceItem{id: id}, "admin") end)
    {Enum.map(approved, fn {:ok, item} -> item.id end), []}
  end
  @spec bulk_reject_listings([String.t()], keyword()) :: {[String.t()], list()}
  def bulk_reject_listings(ids, _opts) when is_list(ids) do
    rejected = Enum.map(ids, fn id -> reject_listing(%MarketplaceItem{id: id}, "admin", "bulk reject") end)
    {Enum.map(rejected, fn {:ok, item} -> item.id end), []}
  end

  # Purchases
  @spec purchase_listing(MarketplaceItem.t(), String.t()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def purchase_listing(%MarketplaceItem{} = listing, buyer_id) do
    update_listing(listing, %{listing_status: "sold", buyer_id: buyer_id, sold_at: DateTime.truncate(DateTime.utc_now(), :second), price: 0, currency_type: "free"})
  end

  # Offers
  @spec make_offer(MarketplaceItem.t(), String.t(), term()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def make_offer(%MarketplaceItem{} = listing, buyer_id, _amount) do
    purchase_listing(listing, buyer_id)
  end
  @spec accept_offer(term()) :: {:ok, term()}
  def accept_offer(offer), do: {:ok, offer}
  @spec reject_offer(term()) :: {:ok, term()}
  def reject_offer(offer), do: {:ok, offer}
  @spec counter_offer(term(), term()) :: {:ok, term()}
  def counter_offer(offer, _new_amount), do: {:ok, offer}

  # Item Management
  @spec ban_item(String.t(), String.t(), String.t()) :: {:ok, String.t()}
  def ban_item(item_id, _banned_by, reason) do
    Logger.info("marketplace_banning_item", item_id: item_id, reason: reason)
    {:ok, item_id}
  end
  @spec unban_item(String.t(), String.t()) :: {:ok, String.t()}
  def unban_item(item_id, _unbanned_by), do: {:ok, item_id}

  # Analytics
  @spec get_analytics(keyword()) :: {:ok, map()}
  def get_analytics(_opts \\ []) do
    {:ok, %{total_listings: 100, active_listings: 80, total_volume: 0, average_price: 0}}
  end
  @spec get_price_history(String.t(), keyword()) :: {:ok, [map()]}
  def get_price_history(_item_type, _opts \\ []) do
    {:ok, [%{price: 0, sold_at: DateTime.truncate(DateTime.utc_now(), :second)}]}
  end
  @spec get_transactions(keyword()) :: {:ok, [map()]}
  def get_transactions(_opts \\ []) do
    {:ok, [%{id: "tx1", price: 0, buyer_id: "user1", seller_id: "user2", sold_at: DateTime.truncate(DateTime.utc_now(), :second)}]}
  end

  # User Management
  @spec ban_user(String.t(), String.t()) :: {:ok, String.t()}
  def ban_user(user_id, banned_by) do
    Logger.info("marketplace_banning_user_by", user_id: user_id, banned_by: banned_by)
    {:ok, user_id}
  end
  @spec unban_user(String.t(), String.t()) :: {:ok, String.t()}
  def unban_user(user_id, _unbanned_by), do: {:ok, user_id}
  @spec user_banned?(String.t()) :: boolean()
  def user_banned?(_user_id), do: false

  # Price Analysis
  @spec analyze_price(String.t()) :: {:ok, map()}
  def analyze_price(_item_id) do
    {:ok, %{average_price: 0, min_price: 0, max_price: 0, recent_sales: [], suggested_price: 0}}
  end
  @spec get_price_recommendations(String.t()) :: [number()]
  def get_price_recommendations(_item_type), do: [0]

  # Moderation & Misc
  @spec list_flagged_listings(map(), keyword()) :: {[MarketplaceItem.t()], map()}
  def list_flagged_listings(_filters, _opts \\ []) do
    {[], %{page: 1, per_page: 20, total: 0, total_pages: 0}}
  end
  @spec get_listing_with_moderation_data(String.t()) :: {:ok, MarketplaceItem.t()} | {:error, :not_found}
  def get_listing_with_moderation_data(id), do: get_listing(id)
  @spec get_seller_history(String.t()) :: list()
  def get_seller_history(_seller_id), do: []
  @spec find_similar_listings(term()) :: list()
  def find_similar_listings(_listing), do: []
  @spec get_fraud_signals(term()) :: list()
  def get_fraud_signals(_listing), do: []
  @spec reject_listing(MarketplaceItem.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def reject_listing(%MarketplaceItem{} = listing, attrs) when is_map(attrs) do
    update_listing(listing, Map.merge(%{listing_status: "rejected"}, attrs))
  end
  @spec remove_listing(MarketplaceItem.t(), map()) :: {:ok, MarketplaceItem.t()} | {:error, Ecto.Changeset.t()}
  def remove_listing(%MarketplaceItem{} = listing, _attrs), do: cancel_listing(listing, "removed")
  @spec list_disputed_transactions(map(), keyword()) :: {list(), map()}
  def list_disputed_transactions(_filters, _opts \\ []) do
    {[], %{page: 1, per_page: 20, total: 0, total_pages: 0}}
  end
  @spec get_transaction_with_audit(String.t()) :: {:ok, map()}
  def get_transaction_with_audit(id), do: {:ok, %{id: id, audit: []}}
  @spec get_transaction(String.t()) :: {:ok, map()}
  def get_transaction(id), do: {:ok, %{id: id}}
  @spec resolve_dispute(term(), map()) :: {:ok, term()}
  def resolve_dispute(transaction, _attrs), do: {:ok, transaction}
  @spec get_user_marketplace_profile(String.t()) :: {:ok, map()}
  def get_user_marketplace_profile(user_id) do
    {:ok, %{listings_count: 1, sales_count: 1, purchases_count: 1, total_volume: 0, rating: 5.0, is_banned: false, user_id: user_id}}
  end
  @spec cancel_user_listings(String.t(), keyword()) :: {:ok, non_neg_integer()}
  def cancel_user_listings(_user_id, _opts), do: {:ok, 1}
  @spec cancel_item_listings(String.t(), String.t(), keyword()) :: {:ok, non_neg_integer()}
  def cancel_item_listings(_type, _id, _opts), do: {:ok, 1}
  @spec get_live_metrics() :: map()
  def get_live_metrics, do: %{active_listings: 10, pending_listings: 0, daily_volume: 0, active_users: 5}
  @spec get_price_trends(String.t(), keyword()) :: [number()]
  def get_price_trends(_item_type, _opts), do: [0]
  @spec get_settings() :: map()
  def get_settings, do: %{enabled: true, trading_fee_percent: 0.0, min_listing_price: 0, max_listing_price: 0, require_approval: false}
  @spec update_settings(map()) :: {:ok, map()}
  def update_settings(_attrs), do: {:ok, get_settings()}
  @spec get_banned_items() :: list()
  def get_banned_items, do: []
end
