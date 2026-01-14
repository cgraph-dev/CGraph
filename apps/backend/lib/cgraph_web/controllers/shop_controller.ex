defmodule CGraphWeb.ShopController do
  @moduledoc """
  Controller for coin shop and purchases.

  ## Security

  - All purchase endpoints require authentication
  - Quantity is validated (1-100) and safely parsed
  - Race conditions in coin spending are handled by optimistic locking
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Gamification

  action_fallback CGraphWeb.FallbackController

  @max_purchase_quantity 100

  @doc """
  GET /api/v1/shop
  List all shop items.
  """
  def index(conn, params) do
    category = parse_string(params["category"])
    items = Gamification.list_shop_items(category: category)

    conn
    |> put_status(:ok)
    |> render(:index, items: items)
  end

  @doc """
  GET /api/v1/shop/:id
  Get a specific shop item.
  """
  def show(conn, %{"id" => item_id}) do
    item = Gamification.get_shop_item(item_id)

    if item do
      conn
      |> put_status(:ok)
      |> render(:show, item: item)
    else
      conn
      |> put_status(:not_found)
      |> json(%{error: "not_found", message: "Item not found"})
    end
  end

  @doc """
  POST /api/v1/shop/:id/purchase
  Purchase a shop item.

  ## Parameters

  - `quantity` - Number of items to purchase (1-100, default: 1)
  """
  def purchase(conn, %{"id" => item_id} = params) do
    user = conn.assigns.current_user
    # Safe parsing with validation: min 1, max 100
    quantity = parse_int(params["quantity"], 1, min: 1, max: @max_purchase_quantity)

    case Gamification.purchase_shop_item(user, item_id, quantity) do
      {:ok, updated_user} ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          coins: updated_user.coins,
          message: "Purchase successful"
        })

      {:error, :not_available} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "not_available", message: "This item is not available for purchase"})

      {:error, :premium_required} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "premium_required", message: "This item requires a premium subscription"})

      {:error, :insufficient_funds} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "insufficient_funds", message: "You don't have enough coins"})

      {:error, :already_owned} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "already_owned", message: "You already own this item"})
    end
  end

  @doc """
  GET /api/v1/shop/purchases
  Get user's purchase history.
  """
  def purchases(conn, params) do
    user = conn.assigns.current_user
    category = parse_string(params["category"])

    purchases = Gamification.list_user_purchases(user.id, category: category)

    conn
    |> put_status(:ok)
    |> render(:purchases, purchases: purchases)
  end

  @doc """
  GET /api/v1/shop/categories
  List available shop categories.
  """
  def categories(conn, _params) do
    categories = [
      %{id: "theme", name: "Themes", icon: "🎨", description: "Customize your look"},
      %{id: "badge", name: "Badges", icon: "🏅", description: "Show off your style"},
      %{id: "effect", name: "Effects", icon: "✨", description: "Special visual effects"},
      %{id: "boost", name: "Boosts", icon: "⚡", description: "Temporary bonuses"},
      %{id: "bundle", name: "Bundles", icon: "📦", description: "Great value packs"}
    ]

    conn
    |> put_status(:ok)
    |> json(%{categories: categories})
  end
end
