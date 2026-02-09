defmodule CGraphWeb.MarketplaceController do
  @moduledoc """
  Controller for cosmetics marketplace endpoints.

  ## Endpoints
  
  - GET /api/v1/marketplace - Browse marketplace listings
  - GET /api/v1/marketplace/:id - Get listing details
  - POST /api/v1/marketplace - Create a new listing
  - PUT /api/v1/marketplace/:id - Update listing price
  - DELETE /api/v1/marketplace/:id - Cancel listing
  - POST /api/v1/marketplace/:id/buy - Purchase a listing
  - GET /api/v1/marketplace/my-listings - Get user's active listings
  - GET /api/v1/marketplace/history - Get user's transaction history
  """
  use CGraphWeb, :controller

  import Ecto.Query, warn: false

  alias CGraph.Repo
  alias CGraph.Gamification
  alias CGraph.Gamification.MarketplaceItem

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/marketplace
  Browse marketplace listings with filters.
  """
  def index(conn, params) do
    item_type = params["type"]
    rarity = params["rarity"]
    min_price = params["min_price"] && String.to_integer(params["min_price"])
    max_price = params["max_price"] && String.to_integer(params["max_price"])
    currency = params["currency"]
    sort_by = params["sort"] || "newest"
    
    query = from m in MarketplaceItem,
      where: m.listing_status == "active"
    
    # Apply filters
    query = if item_type, do: from(m in query, where: m.item_type == ^item_type), else: query
    query = if rarity, do: from(m in query, where: m.item_rarity == ^rarity), else: query
    query = if currency, do: from(m in query, where: m.currency_type == ^currency), else: query
    query = if min_price, do: from(m in query, where: m.price >= ^min_price), else: query
    query = if max_price, do: from(m in query, where: m.price <= ^max_price), else: query
    
    {sort_field, sort_dir} = case sort_by do
      "oldest" -> {:listed_at, :asc}
      "price_low" -> {:price, :asc}
      "price_high" -> {:price, :desc}
      "rarity" -> {:item_rarity, :desc}
      _ -> {:listed_at, :desc}
    end

    pagination_opts = CGraph.Pagination.parse_params(
      params,
      sort_field: sort_field,
      sort_direction: sort_dir,
      default_limit: 20,
      max_limit: 50
    )

    {listings, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    listings = Repo.preload(listings, [:seller])
    
    # Get market stats
    stats = get_market_stats()
    
    conn
    |> put_status(:ok)
    |> json(%{
      listings: Enum.map(listings, &serialize_listing/1),
      stats: stats,
      pagination: %{
        cursor: page_info.end_cursor,
        hasMore: page_info.has_next_page
      },
      filters: %{
        types: MarketplaceItem.item_types(),
        currencies: MarketplaceItem.currency_types()
      }
    })
  end

  @doc """
  GET /api/v1/marketplace/:id
  Get detailed listing information.
  """
  def show(conn, %{"id" => listing_id}) do
    listing = Repo.get!(MarketplaceItem, listing_id)
    |> Repo.preload(:seller)
    
    # Get price history for this item type
    price_history = get_price_history(listing.item_type, listing.item_id)
    
    conn
    |> put_status(:ok)
    |> json(%{
      listing: serialize_listing_detailed(listing),
      priceHistory: price_history,
      recommendedPrice: MarketplaceItem.recommended_price_for_rarity(listing.item_rarity)
    })
  end

  @doc """
  POST /api/v1/marketplace
  Create a new marketplace listing.
  """
  def create(conn, params) do
    user = conn.assigns.current_user
    
    with {:ok, item_type} <- validate_item_type(params["item_type"]),
         {:ok, item} <- get_owned_item(user.id, item_type, params["item_id"]),
         {:ok, _} <- check_not_already_listed(params["item_id"], item_type),
         {:ok, price} <- validate_price(params["price"], item.rarity) do
      
      # Calculate listing fee
      recommended = MarketplaceItem.recommended_price_for_rarity(item.rarity)
      listing_fee = calculate_listing_fee(recommended.suggested)
      
      # Deduct listing fee
      case Gamification.deduct_currency(user.id, "coins", listing_fee) do
        {:ok, _} ->
          {:ok, listing} = %MarketplaceItem{}
          |> MarketplaceItem.changeset(%{
            item_type: item_type,
            item_id: params["item_id"],
            price: price,
            currency_type: params["currency"] || "coins",
            listing_fee: listing_fee,
            listed_at: DateTime.utc_now(),
            expires_at: DateTime.add(DateTime.utc_now(), 7 * 24 * 60 * 60, :second),
            item_name: item.name,
            item_rarity: item.rarity,
            item_preview_url: item.preview_url,
            accepts_trades: params["accepts_trades"] || false,
            seller_id: user.id
          })
          |> Repo.insert()
          
          conn
          |> put_status(:created)
          |> json(%{
            success: true,
            listing: serialize_listing(Repo.preload(listing, :seller)),
            listingFee: listing_fee
          })
        
        {:error, _} ->
          conn
          |> put_status(:bad_request)
          |> json(%{error: "Insufficient coins for listing fee (#{listing_fee} coins)"})
      end
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  @doc """
  PUT /api/v1/marketplace/:id
  Update listing price.
  """
  def update(conn, %{"id" => listing_id} = params) do
    user = conn.assigns.current_user
    listing = Repo.get!(MarketplaceItem, listing_id)
    
    if listing.seller_id != user.id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Not your listing"})
    else
      case MarketplaceItem.update_price_changeset(listing, params["price"]) |> Repo.update() do
        {:ok, updated} ->
          conn
          |> put_status(:ok)
          |> json(%{success: true, listing: serialize_listing(Repo.preload(updated, :seller))})
        
        {:error, changeset} ->
          conn
          |> put_status(:bad_request)
          |> json(%{error: format_errors(changeset)})
      end
    end
  end

  @doc """
  DELETE /api/v1/marketplace/:id
  Cancel a listing.
  """
  def delete(conn, %{"id" => listing_id}) do
    user = conn.assigns.current_user
    listing = Repo.get!(MarketplaceItem, listing_id)
    
    if listing.seller_id != user.id do
      conn
      |> put_status(:forbidden)
      |> json(%{error: "Not your listing"})
    else
      {:ok, _} = listing
      |> MarketplaceItem.cancel_changeset()
      |> Repo.update()
      
      conn
      |> put_status(:ok)
      |> json(%{success: true})
    end
  end

  @doc """
  POST /api/v1/marketplace/:id/buy
  Purchase a marketplace listing.
  """
  def buy(conn, %{"id" => listing_id}) do
    user = conn.assigns.current_user
    listing = Repo.get!(MarketplaceItem, listing_id) |> Repo.preload(:seller)
    
    cond do
      listing.listing_status != "active" ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Listing is no longer available"})
      
      listing.seller_id == user.id ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Cannot buy your own listing"})
      
      true ->
        # Deduct buyer's currency
        case Gamification.deduct_currency(user.id, listing.currency_type, listing.price) do
          {:ok, _} ->
            # Calculate seller proceeds
            fee = MarketplaceItem.calculate_fee(listing)
            proceeds = MarketplaceItem.calculate_proceeds(listing)
            
            # Credit seller
            Gamification.add_currency(listing.seller_id, listing.currency_type, proceeds)
            
            # Transfer item ownership
            transfer_item(listing, user.id)
            
            # Update listing
            {:ok, updated} = listing
            |> MarketplaceItem.purchase_changeset(user.id)
            |> Repo.update()
            
            conn
            |> put_status(:ok)
            |> json(%{
              success: true,
              listing: serialize_listing(Repo.preload(updated, [:seller, :buyer])),
              paid: listing.price,
              fee: fee,
              sellerReceived: proceeds
            })
          
          {:error, _} ->
            conn
            |> put_status(:bad_request)
            |> json(%{error: "Insufficient #{listing.currency_type}"})
        end
    end
  end

  @doc """
  GET /api/v1/marketplace/my-listings
  Get user's active listings.
  """
  def my_listings(conn, params) do
    user = conn.assigns.current_user
    status = params["status"] || "active"
    
    query = from m in MarketplaceItem,
      where: m.seller_id == ^user.id and m.listing_status == ^status,
      order_by: [desc: m.listed_at]
    
    listings = Repo.all(query)
    
    conn
    |> put_status(:ok)
    |> json(%{listings: Enum.map(listings, &serialize_listing/1)})
  end

  @doc """
  GET /api/v1/marketplace/history
  Get user's transaction history (buys and sells).
  """
  def history(conn, params) do
    user = conn.assigns.current_user
    type = params["type"]  # "buys", "sells", or nil for all
    
    query = from m in MarketplaceItem,
      where: m.listing_status == "sold"
    
    query = case type do
      "buys" -> from(m in query, where: m.buyer_id == ^user.id)
      "sells" -> from(m in query, where: m.seller_id == ^user.id)
      _ -> from(m in query, where: m.buyer_id == ^user.id or m.seller_id == ^user.id)
    end

    pagination_opts = CGraph.Pagination.parse_params(
      params,
      sort_field: :sold_at,
      sort_direction: :desc,
      default_limit: 20,
      max_limit: 50
    )

    {transactions, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    transactions = Repo.preload(transactions, [:seller, :buyer])
    
    # Calculate totals
    totals = calculate_user_totals(user.id)
    
    conn
    |> put_status(:ok)
    |> json(%{
      transactions: Enum.map(transactions, fn t ->
        serialize_listing(t)
        |> Map.put(:transactionType, if(t.buyer_id == user.id, do: "buy", else: "sell"))
      end),
      totals: totals,
      pagination: %{
        cursor: page_info.end_cursor,
        hasMore: page_info.has_next_page
      }
    })
  end

  # ==================== PRIVATE HELPERS ====================

  defp validate_item_type(type) when type in ~w(avatar_border profile_theme chat_effect title badge) do
    {:ok, type}
  end
  defp validate_item_type(_), do: {:error, "Invalid item type"}

  defp get_owned_item(user_id, item_type, item_id) do
    # Check ownership based on item type
    owned = case item_type do
      "avatar_border" ->
        Repo.get_by(Gamification.UserAvatarBorder, user_id: user_id, avatar_border_id: item_id)
      "profile_theme" ->
        Repo.get_by(Gamification.UserProfileTheme, user_id: user_id, profile_theme_id: item_id)
      "chat_effect" ->
        Repo.get_by(Gamification.UserChatEffect, user_id: user_id, chat_effect_id: item_id)
      _ -> nil
    end
    
    if owned do
      # Get the actual item details
      item = case item_type do
        "avatar_border" -> Repo.get(Gamification.AvatarBorder, item_id)
        "profile_theme" -> Repo.get(Gamification.ProfileTheme, item_id)
        "chat_effect" -> Repo.get(Gamification.ChatEffect, item_id)
        _ -> nil
      end
      
      if item, do: {:ok, item}, else: {:error, "Item not found"}
    else
      {:error, "You don't own this item"}
    end
  end

  defp check_not_already_listed(item_id, item_type) do
    existing = Repo.get_by(MarketplaceItem,
      item_id: item_id,
      item_type: item_type,
      listing_status: "active"
    )
    
    if existing, do: {:error, "Item is already listed"}, else: {:ok, :not_listed}
  end

  defp validate_price(price, rarity) when is_integer(price) do
    recommended = MarketplaceItem.recommended_price_for_rarity(rarity)
    
    cond do
      price < recommended.min -> {:error, "Price too low (minimum: #{recommended.min})"}
      price > recommended.max -> {:error, "Price too high (maximum: #{recommended.max})"}
      true -> {:ok, price}
    end
  end
  defp validate_price(price, rarity) when is_binary(price) do
    validate_price(String.to_integer(price), rarity)
  end
  defp validate_price(_, _), do: {:error, "Invalid price"}

  defp calculate_listing_fee(suggested_price) do
    # 1% listing fee, minimum 10 coins
    max(round(suggested_price * 0.01), 10)
  end

  defp transfer_item(listing, buyer_id) do
    case listing.item_type do
      "avatar_border" ->
        # Update ownership
        from(ub in Gamification.UserAvatarBorder,
          where: ub.user_id == ^listing.seller_id and ub.avatar_border_id == ^listing.item_id
        )
        |> Repo.update_all(set: [user_id: buyer_id, is_equipped: false])
      
      "profile_theme" ->
        from(ut in Gamification.UserProfileTheme,
          where: ut.user_id == ^listing.seller_id and ut.profile_theme_id == ^listing.item_id
        )
        |> Repo.update_all(set: [user_id: buyer_id, is_active: false])
      
      "chat_effect" ->
        from(ue in Gamification.UserChatEffect,
          where: ue.user_id == ^listing.seller_id and ue.chat_effect_id == ^listing.item_id
        )
        |> Repo.update_all(set: [user_id: buyer_id, is_active: false])
      
      _ -> :ok
    end
  end

  defp get_market_stats do
    %{
      totalListings: Repo.aggregate(from(m in MarketplaceItem, where: m.listing_status == "active"), :count),
      totalSold: Repo.aggregate(from(m in MarketplaceItem, where: m.listing_status == "sold"), :count),
      averagePrice: Repo.aggregate(from(m in MarketplaceItem, where: m.listing_status == "sold"), :avg, :price) || 0
    }
  end

  defp get_price_history(item_type, item_id) do
    from(m in MarketplaceItem,
      where: m.item_type == ^item_type and m.item_id == ^item_id and m.listing_status == "sold",
      order_by: [desc: m.sold_at],
      limit: 10,
      select: %{price: m.price, sold_at: m.sold_at}
    )
    |> Repo.all()
  end

  defp calculate_user_totals(user_id) do
    sells = from(m in MarketplaceItem,
      where: m.seller_id == ^user_id and m.listing_status == "sold",
      select: %{
        count: count(m.id),
        total: sum(m.price),
        fees: sum(fragment("? * ?", m.price, m.transaction_fee_percent))
      }
    ) |> Repo.one()
    
    buys = from(m in MarketplaceItem,
      where: m.buyer_id == ^user_id and m.listing_status == "sold",
      select: %{count: count(m.id), total: sum(m.price)}
    ) |> Repo.one()
    
    %{
      sells: %{
        count: sells.count || 0,
        total: sells.total || 0,
        fees: sells.fees || 0,
        proceeds: (sells.total || 0) - (sells.fees || 0)
      },
      buys: %{
        count: buys.count || 0,
        total: buys.total || 0
      }
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  # ==================== SERIALIZERS ====================

  defp serialize_listing(listing) do
    %{
      id: listing.id,
      itemType: listing.item_type,
      itemId: listing.item_id,
      status: listing.listing_status,
      price: listing.price,
      currency: listing.currency_type,
      itemName: listing.item_name,
      itemRarity: listing.item_rarity,
      itemPreviewUrl: listing.item_preview_url,
      acceptsTrades: listing.accepts_trades,
      listedAt: listing.listed_at,
      expiresAt: listing.expires_at,
      soldAt: listing.sold_at,
      seller: listing.seller && %{
        id: listing.seller.id,
        username: listing.seller.username,
        displayName: listing.seller.display_name,
        avatarUrl: listing.seller.avatar_url
      },
      buyer: listing.buyer && %{
        id: listing.buyer.id,
        username: listing.buyer.username
      }
    }
  end

  defp serialize_listing_detailed(listing) do
    serialize_listing(listing)
    |> Map.merge(%{
      originalPrice: listing.original_price,
      listingFee: listing.listing_fee,
      transactionFee: MarketplaceItem.calculate_fee(listing),
      itemMetadata: listing.item_metadata,
      tradePreferences: listing.trade_preferences
    })
  end
end
