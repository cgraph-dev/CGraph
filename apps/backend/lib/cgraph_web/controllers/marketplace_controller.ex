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

  alias CGraph.Gamification
  alias CGraph.Gamification.MarketplaceItem
  alias CGraph.Repo

  import CGraphWeb.MarketplaceController.Helpers

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/marketplace
  Browse marketplace listings with filters.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
      Map.drop(params, ["sort"]),
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
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => listing_id}) do
    case Repo.get(MarketplaceItem, listing_id) do
      nil ->
        {:error, :not_found}

      listing ->
        listing = Repo.preload(listing, :seller)

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
  end

  @doc """
  POST /api/v1/marketplace
  Create a new marketplace listing.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
      case Gamification.deduct_currency(user.id, listing_fee, :coins) do
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
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"id" => listing_id} = params) do
    user = conn.assigns.current_user

    case Repo.get(MarketplaceItem, listing_id) do
      nil ->
        {:error, :not_found}

      listing ->
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
  end

  @doc """
  DELETE /api/v1/marketplace/:id
  Cancel a listing.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => listing_id}) do
    user = conn.assigns.current_user

    case Repo.get(MarketplaceItem, listing_id) do
      nil ->
        {:error, :not_found}

      listing ->
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
  end

  @doc """
  POST /api/v1/marketplace/:id/buy
  Purchase a marketplace listing.
  """
  @spec buy(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def buy(conn, %{"id" => listing_id}) do
    user = conn.assigns.current_user

    case Repo.get(MarketplaceItem, listing_id) do
      nil ->
        {:error, :not_found}

      listing ->
        listing = Repo.preload(listing, :seller)

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
            case Gamification.deduct_currency(user.id, listing.price, String.to_existing_atom(listing.currency_type || "coins")) do
              {:ok, _} ->
                # Calculate seller proceeds
                fee = MarketplaceItem.calculate_fee(listing)
                proceeds = MarketplaceItem.calculate_proceeds(listing)

                # Credit seller
                Gamification.add_currency(listing.seller_id, proceeds, String.to_existing_atom(listing.currency_type || "coins"))

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
  end

  @doc """
  GET /api/v1/marketplace/my-listings
  Get user's active listings.
  """
  @spec my_listings(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec history(Plug.Conn.t(), map()) :: Plug.Conn.t()
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

end
