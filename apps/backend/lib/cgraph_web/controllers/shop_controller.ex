defmodule CgraphWeb.ShopController do
  @moduledoc """
  Controller for coin shop and purchases.
  """
  use CgraphWeb, :controller

  alias Cgraph.Gamification

  action_fallback CgraphWeb.FallbackController

  @doc """
  GET /api/v1/shop
  List all shop items.
  """
  def index(conn, params) do
    category = params["category"]
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
  """
  def purchase(conn, %{"id" => item_id} = params) do
    user = conn.assigns.current_user
    quantity = params["quantity"] && String.to_integer(params["quantity"]) || 1
    
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
    category = params["category"]
    
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
