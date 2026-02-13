defmodule CGraphWeb.MarketplaceChannel do
  @moduledoc """
  Real-time marketplace updates channel for live trading and notifications.
  
  Provides:
  - Live listing updates (new, sold, price changes)
  - Real-time auction bidding
  - Price alerts and notifications
  - Featured listings rotation
  - Market statistics updates
  
  Topics:
  - marketplace:lobby - Global marketplace updates
  - marketplace:{user_id} - User-specific notifications
  - marketplace:item:{item_type}:{item_id} - Item-specific price tracking
  """
  use CGraphWeb, :channel

  alias CGraph.Marketplace
  alias CGraphWeb.Presence

  require Logger

  @broadcast_throttle_ms 100
  @max_subscribed_items 50

  @impl true
  def join("marketplace:lobby", _params, socket) do
    send(self(), :after_join)
    
    {:ok, %{
      status: "connected",
      server_time: DateTime.utc_now() |> DateTime.to_iso8601()
    }, socket 
    |> assign(:subscribed_items, MapSet.new())
    |> assign(:last_broadcast, %{})}
  end

  def join("marketplace:" <> user_id, _params, socket) do
    # User-specific channel for their listings and purchases
    if socket.assigns.current_user.id == user_id do
      send(self(), :after_join_user)
      {:ok, %{status: "connected"}, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user
    
    # Track presence in marketplace
    {:ok, _} = Presence.track(socket, user.id, %{
      online_at: System.system_time(:second),
      user_id: user.id,
      username: user.username
    })

    # Subscribe to global marketplace updates
    Phoenix.PubSub.subscribe(CGraph.PubSub, "marketplace:global")
    
    # Send current marketplace stats
    push(socket, "marketplace_stats", get_marketplace_stats())
    
    # Send featured listings
    push(socket, "featured_listings", get_featured_listings())

    {:noreply, socket}
  end

  def handle_info(:after_join_user, socket) do
    user = socket.assigns.current_user
    
    # Subscribe to user-specific updates
    Phoenix.PubSub.subscribe(CGraph.PubSub, "marketplace:user:#{user.id}")
    
    # Send user's active listings
    push(socket, "my_listings", get_user_listings(user.id))
    
    # Send pending notifications
    push(socket, "notifications", get_pending_notifications(user.id))

    {:noreply, socket}
  end

  # Global broadcasts - new listing
  def handle_info({:new_listing, listing}, socket) do
    if should_broadcast?(socket, :new_listing) do
      push(socket, "new_listing", sanitize_listing(listing))
      {:noreply, update_broadcast_time(socket, :new_listing)}
    else
      {:noreply, socket}
    end
  end

  # Global broadcasts - listing sold
  def handle_info({:listing_sold, data}, socket) do
    push(socket, "listing_sold", %{
      listing_id: data.listing_id,
      item_type: data.item_type,
      item_name: data.item_name,
      price: data.price,
      sold_at: data.sold_at
    })
    {:noreply, socket}
  end

  # Global broadcasts - price drop alert
  def handle_info({:price_drop, data}, socket) do
    # Check if user is subscribed to this item
    item_key = {data.item_type, data.item_id}
    if MapSet.member?(socket.assigns.subscribed_items, item_key) do
      push(socket, "price_drop", data)
    end
    {:noreply, socket}
  end

  # User-specific - your listing sold
  def handle_info({:your_listing_sold, data}, socket) do
    push(socket, "your_listing_sold", data)
    {:noreply, socket}
  end

  # User-specific - you purchased an item
  def handle_info({:purchase_complete, data}, socket) do
    push(socket, "purchase_complete", data)
    {:noreply, socket}
  end

  # User-specific - offer received on your listing
  def handle_info({:offer_received, data}, socket) do
    push(socket, "offer_received", data)
    {:noreply, socket}
  end

  # User-specific - your offer was accepted/rejected
  def handle_info({:offer_response, data}, socket) do
    push(socket, "offer_response", data)
    {:noreply, socket}
  end

  # Market stats update (periodic)
  def handle_info({:stats_update, stats}, socket) do
    push(socket, "stats_update", stats)
    {:noreply, socket}
  end

  # Client requests - browse listings
  @impl true
  def handle_in("browse", params, socket) do
    filters = %{
      type: Map.get(params, "type"),
      rarity: Map.get(params, "rarity"),
      min_price: Map.get(params, "min_price"),
      max_price: Map.get(params, "max_price"),
      sort: Map.get(params, "sort", "newest"),
      page: Map.get(params, "page", 1),
      per_page: min(Map.get(params, "per_page", 20), 50)
    }
    
    {:ok, result} = Marketplace.browse_listings(filters)
    {:reply, {:ok, result}, socket}
  end

  # Client requests - get listing details
  def handle_in("get_listing", %{"listing_id" => listing_id}, socket) do
    case Marketplace.get_listing(listing_id) do
      {:ok, listing} -> 
        {:reply, {:ok, listing}, socket}
      {:error, reason} -> 
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client requests - get price history
  def handle_in("price_history", %{"item_type" => type, "item_id" => id}, socket) do
    days = 30
    history = Marketplace.get_price_history(type, id, days)
    {:reply, {:ok, %{history: history}}, socket}
  end

  # Client action - subscribe to item price alerts
  def handle_in("subscribe_item", %{"item_type" => type, "item_id" => id}, socket) do
    subscribed = socket.assigns.subscribed_items
    item_key = {type, id}
    
    if MapSet.size(subscribed) < @max_subscribed_items do
      new_subscribed = MapSet.put(subscribed, item_key)
      
      # Subscribe to item-specific pubsub
      Phoenix.PubSub.subscribe(CGraph.PubSub, "marketplace:item:#{type}:#{id}")
      
      {:reply, {:ok, %{subscribed: true}}, assign(socket, :subscribed_items, new_subscribed)}
    else
      {:reply, {:error, %{reason: "max_subscriptions_reached"}}, socket}
    end
  end

  # Client action - unsubscribe from item
  def handle_in("unsubscribe_item", %{"item_type" => type, "item_id" => id}, socket) do
    subscribed = socket.assigns.subscribed_items
    item_key = {type, id}
    new_subscribed = MapSet.delete(subscribed, item_key)
    
    Phoenix.PubSub.unsubscribe(CGraph.PubSub, "marketplace:item:#{type}:#{id}")
    
    {:reply, {:ok, %{unsubscribed: true}}, assign(socket, :subscribed_items, new_subscribed)}
  end

  # Client action - create listing (via channel for real-time feedback)
  def handle_in("create_listing", params, socket) do
    user = socket.assigns.current_user
    
    {:error, changeset} = Marketplace.create_listing(user.id, params)
    errors = format_changeset_errors(changeset)
    {:reply, {:error, %{errors: errors}}, socket}
  end

  # Client action - purchase listing
  def handle_in("purchase", %{"listing_id" => listing_id}, socket) do
    user = socket.assigns.current_user
    
    case Marketplace.purchase_listing(user.id, listing_id) do
      {:ok, transaction} ->
        # Notify seller
        notify_seller(transaction)
        {:reply, {:ok, %{transaction: transaction}}, socket}
      
      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client action - make offer
  def handle_in("make_offer", params, socket) do
    user = socket.assigns.current_user
    listing_id = Map.get(params, "listing_id")
    amount = Map.get(params, "amount")
    message = Map.get(params, "message")
    
    {:error, reason} = Marketplace.create_offer(user.id, listing_id, amount, message)
    {:reply, {:error, %{reason: reason}}, socket}
  end

  # Client action - respond to offer
  def handle_in("respond_offer", %{"offer_id" => offer_id, "accept" => accept} = params, socket) do
    user = socket.assigns.current_user
    message = Map.get(params, "message")
    
    {:error, reason} = Marketplace.respond_to_offer(user.id, offer_id, accept, message)
    {:reply, {:error, %{reason: reason}}, socket}
  end

  # Heartbeat
  def handle_in("ping", _params, socket) do
    {:reply, {:ok, %{pong: true, time: DateTime.utc_now() |> DateTime.to_iso8601()}}, socket}
  end

  # Private helpers

  defp get_marketplace_stats do
    %{
      total_active_listings: Marketplace.count_active_listings(),
      total_volume_24h: Marketplace.volume_24h(),
      trending_items: Marketplace.trending_items(5),
      recent_sales: Marketplace.recent_sales(5)
    }
  rescue
    _ -> %{total_active_listings: 0, total_volume_24h: 0, trending_items: [], recent_sales: []}
  end

  defp get_featured_listings do
    case Marketplace.featured_listings(10) do
      listings when is_list(listings) -> listings
      _ -> []
    end
  rescue
    _ -> []
  end

  defp get_user_listings(user_id) do
    case Marketplace.user_listings(user_id, "active") do
      {:ok, listings} -> listings
      _ -> []
    end
  rescue
    _ -> []
  end

  defp get_pending_notifications(user_id) do
    case Marketplace.pending_notifications(user_id) do
      {:ok, notifications} -> notifications
      _ -> []
    end
  rescue
    _ -> []
  end

  defp sanitize_listing(listing) do
    Map.take(listing, [
      :id, :listing_number, :item_type, :item_name, :item_rarity,
      :item_preview_url, :price, :currency, :listed_at
    ])
  end

  defp should_broadcast?(socket, event_type) do
    last = socket.assigns.last_broadcast[event_type] || 0
    now = System.monotonic_time(:millisecond)
    now - last > @broadcast_throttle_ms
  end

  defp update_broadcast_time(socket, event_type) do
    last_broadcast = socket.assigns.last_broadcast
    now = System.monotonic_time(:millisecond)
    assign(socket, :last_broadcast, Map.put(last_broadcast, event_type, now))
  end

  defp notify_seller(transaction) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub, 
      "marketplace:user:#{transaction.seller_id}", 
      {:your_listing_sold, transaction}
    )
  end

  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
