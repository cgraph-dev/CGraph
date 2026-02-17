defmodule CGraph.Marketplace do
  @moduledoc """
  High-level marketplace API.
  Delegates core CRUD to CGraph.Gamification.Marketplace and provides
  query-based implementations for analytics, browsing, and notifications.
  """

  alias CGraph.Gamification.Marketplace, as: GMarketplace
  alias CGraph.Gamification.MarketplaceItem
  alias CGraph.Repo
  import Ecto.Query, warn: false

  defdelegate list_listings(opts \\ []), to: GMarketplace
  defdelegate get_listing(id), to: GMarketplace
  defdelegate create_listing(seller_id, item_id, attrs), to: GMarketplace
  defdelegate update_listing(listing, attrs), to: GMarketplace
  defdelegate cancel_listing(listing, reason \\ nil), to: GMarketplace
  defdelegate purchase_listing(listing, buyer_id), to: GMarketplace
  defdelegate make_offer(listing, buyer_id, amount), to: GMarketplace
  defdelegate accept_offer(offer), to: GMarketplace
  defdelegate reject_offer(offer), to: GMarketplace
  defdelegate get_analytics(opts \\ []), to: GMarketplace

  # ==========================================================================
  # Browse & Filter
  # ==========================================================================

  @doc """
  Browse listings with filters.
  Supports: item_type, currency_type, min_price, max_price, sort_by, limit.
  """
  def browse_listings(filters) when is_map(filters) do
    query = from(i in MarketplaceItem, where: i.listing_status == "active")

    query = if type = Map.get(filters, :item_type),
      do: from(i in query, where: i.item_type == ^type), else: query
    query = if currency = Map.get(filters, :currency_type),
      do: from(i in query, where: i.currency_type == ^currency), else: query
    query = if min_p = Map.get(filters, :min_price),
      do: from(i in query, where: i.price >= ^min_p), else: query
    query = if max_p = Map.get(filters, :max_price),
      do: from(i in query, where: i.price <= ^max_p), else: query

    query = case Map.get(filters, :sort_by) do
      "price_asc"  -> from(i in query, order_by: [asc: i.price])
      "price_desc" -> from(i in query, order_by: [desc: i.price])
      "newest"     -> from(i in query, order_by: [desc: i.listed_at])
      _            -> from(i in query, order_by: [desc: i.listed_at])
    end

    limit = Map.get(filters, :limit, 20)
    query = from(i in query, limit: ^limit)

    {:ok, Repo.all(query)}
  end

  @doc """
  Get price history for an item type over N days.
  """
  def get_price_history(item_type, _item_id, days) do
    since = DateTime.add(DateTime.utc_now(), -days, :day)

    from(i in MarketplaceItem,
      where: i.item_type == ^item_type,
      where: i.listing_status == "sold",
      where: i.sold_at >= ^since,
      order_by: [asc: i.sold_at],
      select: %{price: i.price, sold_at: i.sold_at}
    )
    |> Repo.all()
  end

  @doc """
  Create listing (2-arg version for channels).
  """
  def create_listing(user_id, params) when is_map(params) do
    item_id = Map.get(params, :item_id) || Map.get(params, "item_id")
    attrs = Map.drop(params, [:item_id, "item_id"])
    GMarketplace.create_listing(user_id, item_id, attrs)
  end

  # ==========================================================================
  # Offers
  # ==========================================================================

  @doc """
  Create an offer on a listing.
  """
  def create_offer(buyer_id, listing_id, amount, _message) do
    case GMarketplace.get_listing(listing_id) do
      {:ok, listing} -> GMarketplace.make_offer(listing, buyer_id, amount)
      error -> error
    end
  end

  @doc """
  Respond to an offer (accept/reject).
  """
  def respond_to_offer(_user_id, offer_id, accept, _message) do
    if accept, do: GMarketplace.accept_offer(offer_id), else: GMarketplace.reject_offer(offer_id)
  end

  # ==========================================================================
  # Analytics & Metrics
  # ==========================================================================

  @doc """
  Count currently active listings.
  """
  def count_active_listings do
    from(i in MarketplaceItem, where: i.listing_status == "active")
    |> Repo.aggregate(:count, :id)
  end

  @doc """
  Get total sales volume in last 24 hours.
  """
  def volume_24h do
    since = DateTime.add(DateTime.utc_now(), -1, :day)

    from(i in MarketplaceItem,
      where: i.listing_status == "sold",
      where: i.sold_at >= ^since,
      select: coalesce(sum(i.price), 0)
    )
    |> Repo.one()
  end

  @doc """
  Get trending items (most sales in last 7 days).
  """
  def trending_items(limit) do
    since = DateTime.add(DateTime.utc_now(), -7, :day)

    from(i in MarketplaceItem,
      where: i.listing_status == "sold",
      where: i.sold_at >= ^since,
      group_by: i.item_type,
      order_by: [desc: count(i.id)],
      limit: ^limit,
      select: %{item_type: i.item_type, sales_count: count(i.id), avg_price: avg(i.price)}
    )
    |> Repo.all()
  end

  @doc """
  Get recent sales.
  """
  def recent_sales(limit) do
    from(i in MarketplaceItem,
      where: i.listing_status == "sold",
      order_by: [desc: i.sold_at],
      limit: ^limit,
      select: %{
        id: i.id,
        item_type: i.item_type,
        item_name: i.item_name,
        price: i.price,
        sold_at: i.sold_at
      }
    )
    |> Repo.all()
  end

  @doc """
  Get featured listings (active, sorted by rarity).
  """
  def featured_listings(limit) do
    listings = from(i in MarketplaceItem,
      where: i.listing_status == "active",
      where: not is_nil(i.item_rarity),
      order_by: [asc: fragment("array_position(ARRAY['mythic','legendary','epic','rare','uncommon','common'], ?)", i.item_rarity)],
      limit: ^limit
    )
    |> Repo.all()

    {:ok, listings}
  end

  # ==========================================================================
  # User-Specific
  # ==========================================================================

  @doc """
  Get listings for a specific user, filtered by status.
  """
  def user_listings(user_id, status) do
    query = from(i in MarketplaceItem, where: i.seller_id == ^user_id)
    query = if status, do: from(i in query, where: i.listing_status == ^status), else: query
    query = from(i in query, order_by: [desc: i.listed_at])
    {:ok, Repo.all(query)}
  end

  @doc """
  Get pending marketplace notifications for a user (recent purchases).
  """
  def pending_notifications(user_id) do
    since = DateTime.add(DateTime.utc_now(), -7, :day)

    notifications = from(i in MarketplaceItem,
      where: i.buyer_id == ^user_id,
      where: i.listing_status == "sold",
      where: i.sold_at >= ^since,
      order_by: [desc: i.sold_at],
      limit: 20,
      select: %{
        id: i.id,
        item_name: i.item_name,
        price: i.price,
        sold_at: i.sold_at
      }
    )
    |> Repo.all()

    {:ok, notifications}
  end
end
