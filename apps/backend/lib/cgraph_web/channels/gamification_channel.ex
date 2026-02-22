defmodule CGraphWeb.GamificationChannel do
  @moduledoc """
  Real-time gamification updates channel for cosmetics, prestige, and events.

  Provides live updates for:
  - Cosmetic unlocks and purchases
  - Prestige level changes
  - Event progress and milestones
  - Marketplace activity
  - Achievement unlocks
  - XP/level gains

  Designed for scale:
  - Efficient message batching
  - Rate limiting per event type
  - Presence tracking for live user counts
  - Graceful degradation under load
  """
  use CGraphWeb, :channel

  alias CGraph.Gamification
  alias CGraphWeb.Presence

  require Logger

  # Rate limits (messages per minute)
  @rate_limits %{
    xp_gain: 60,
    achievement_unlock: 10,
    cosmetic_unlock: 10,
    prestige_update: 5,
    event_progress: 30,
    marketplace_update: 20
  }

  # Intercept outgoing events to allow passthrough
  intercept ["level_up", "xp_gained", "achievement_unlocked", "cosmetic_unlocked",
             "item_sold", "listing_created", "event_milestone"]

  @impl true
  def handle_out(event, payload, socket) do
    push(socket, event, payload)
    {:noreply, socket}
  end

  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("gamification:" <> user_id, _params, socket) do
    # Only allow users to join their own gamification channel
    if socket.assigns.current_user.id == user_id do
      send(self(), :after_join)

      {:ok, %{
        status: "connected",
        server_time: DateTime.utc_now() |> DateTime.to_iso8601()
      }, socket |> assign(:rate_limits, init_rate_limits())}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user

    # Track presence for this user in gamification context
    {:ok, _} = Presence.track(socket, user.id, %{
      online_at: System.system_time(:second),
      user_id: user.id,
      username: user.username
    })

    # Send initial gamification state
    push(socket, "initial_state", get_gamification_state(user))

    # Subscribe to user-specific gamification pubsub topics
    Phoenix.PubSub.subscribe(CGraph.PubSub, "gamification:#{user.id}")
    Phoenix.PubSub.subscribe(CGraph.PubSub, "events:global")
    Phoenix.PubSub.subscribe(CGraph.PubSub, "marketplace:global")

    {:noreply, socket}
  end

  # Handle XP gain broadcasts
  @impl true
  def handle_info({:xp_gained, data}, socket) do
    if check_rate_limit(socket, :xp_gain) do
      push(socket, "xp_gained", data)
      {:noreply, update_rate_limit(socket, :xp_gain)}
    else
      {:noreply, socket}
    end
  end

  # Handle level up broadcasts
  def handle_info({:level_up, data}, socket) do
    push(socket, "level_up", data)
    {:noreply, socket}
  end

  # Handle achievement unlock broadcasts
  def handle_info({:achievement_unlocked, data}, socket) do
    if check_rate_limit(socket, :achievement_unlock) do
      push(socket, "achievement_unlocked", data)
      {:noreply, update_rate_limit(socket, :achievement_unlock)}
    else
      {:noreply, socket}
    end
  end

  # Handle cosmetic unlock broadcasts
  def handle_info({:cosmetic_unlocked, data}, socket) do
    if check_rate_limit(socket, :cosmetic_unlock) do
      push(socket, "cosmetic_unlocked", data)
      {:noreply, update_rate_limit(socket, :cosmetic_unlock)}
    else
      {:noreply, socket}
    end
  end

  # Handle prestige broadcasts
  def handle_info({:prestige_updated, data}, socket) do
    push(socket, "prestige_updated", data)
    {:noreply, socket}
  end

  # Handle event progress broadcasts
  def handle_info({:event_progress, data}, socket) do
    if check_rate_limit(socket, :event_progress) do
      push(socket, "event_progress", data)
      {:noreply, update_rate_limit(socket, :event_progress)}
    else
      {:noreply, socket}
    end
  end

  # Handle event milestone broadcasts
  def handle_info({:event_milestone, data}, socket) do
    push(socket, "event_milestone", data)
    {:noreply, socket}
  end

  # Handle global event broadcasts
  def handle_info({:event_started, data}, socket) do
    push(socket, "event_started", data)
    {:noreply, socket}
  end

  def handle_info({:event_ending_soon, data}, socket) do
    push(socket, "event_ending_soon", data)
    {:noreply, socket}
  end

  def handle_info({:event_ended, data}, socket) do
    push(socket, "event_ended", data)
    {:noreply, socket}
  end

  # Handle marketplace broadcasts
  def handle_info({:listing_sold, data}, socket) do
    # Only push if it's the user's listing
    if data.seller_id == socket.assigns.current_user.id do
      push(socket, "listing_sold", data)
    end
    {:noreply, socket}
  end

  def handle_info({:item_purchased, data}, socket) do
    # Only push if user was the buyer
    if data.buyer_id == socket.assigns.current_user.id do
      push(socket, "item_purchased", data)
    end
    {:noreply, socket}
  end

  def handle_info({:price_alert, data}, socket) do
    push(socket, "price_alert", data)
    {:noreply, socket}
  end

  # Client requests current state
  @impl true
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}
  def handle_in("get_state", _params, socket) do
    state = get_gamification_state(socket.assigns.current_user)
    {:reply, {:ok, state}, socket}
  end

  # Client requests active events
  def handle_in("get_active_events", _params, socket) do
    events = Gamification.list_active_events()
    {:reply, {:ok, %{events: events}}, socket}
  end

  # Client requests event progress
  def handle_in("get_event_progress", %{"event_id" => event_id}, socket) do
    case Gamification.get_user_event_progress(socket.assigns.current_user.id, event_id) do
      {:ok, progress} -> {:reply, {:ok, progress}, socket}
      {:error, reason} -> {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client requests prestige info
  def handle_in("get_prestige", _params, socket) do
    {:ok, prestige} = Gamification.get_user_prestige(socket.assigns.current_user.id)
    {:reply, {:ok, prestige}, socket}
  end

  # Client subscribes to marketplace item price alerts
  def handle_in("subscribe_price_alert", %{"item_id" => item_id, "target_price" => price}, socket) do
    # Store price alert subscription
    alerts = Map.get(socket.assigns, :price_alerts, [])
    new_alert = %{item_id: item_id, target_price: price}

    {:reply, {:ok, %{subscribed: true}},
     assign(socket, :price_alerts, [new_alert | alerts] |> Enum.take(10))}
  end

  # Client requests leaderboard
  def handle_in("get_leaderboard", %{"type" => type} = params, socket) do
    limit = Map.get(params, "limit", 10)

    leaderboard = case type do
      "xp" -> Gamification.get_xp_leaderboard(limit)
      "prestige" -> Gamification.get_prestige_leaderboard(limit)
      "event" ->
        event_id = Map.get(params, "event_id")
        Gamification.get_event_leaderboard(event_id, limit)
      _ -> []
    end

    {:reply, {:ok, %{leaderboard: leaderboard}}, socket}
  end

  # Heartbeat for connection health
  def handle_in("heartbeat", _params, socket) do
    {:reply, {:ok, %{
      server_time: DateTime.utc_now() |> DateTime.to_iso8601(),
      status: "alive"
    }}, socket}
  end

  # Private helpers

  defp get_gamification_state(user) do
    %{
      user_id: user.id,
      xp: user.xp || 0,
      level: user.level || 1,
      coins: user.coins || 0,
      streak_days: user.streak_days || 0,
      equipped_title_id: user.equipped_title_id,
      equipped_badge_ids: user.equipped_badge_ids || [],
      subscription_tier: user.subscription_tier || "free",
      active_events: get_active_event_ids(),
      server_time: DateTime.utc_now() |> DateTime.to_iso8601()
    }
  end

  defp get_active_event_ids do
    # Get IDs of currently active events
    case Gamification.list_active_events() do
      events when is_list(events) -> Enum.map(events, & &1.id)
      _ -> []
    end
  rescue
    _ -> []
  end

  defp init_rate_limits do
    now = System.system_time(:second)
    Enum.into(@rate_limits, %{}, fn {key, _limit} ->
      {key, %{count: 0, window_start: now}}
    end)
  end

  defp check_rate_limit(socket, event_type) do
    limits = socket.assigns[:rate_limits] || init_rate_limits()
    limit_config = @rate_limits[event_type] || 60
    state = limits[event_type] || %{count: 0, window_start: System.system_time(:second)}

    now = System.system_time(:second)

    # Reset window if more than 60 seconds passed
    if now - state.window_start > 60 do
      true
    else
      state.count < limit_config
    end
  end

  defp update_rate_limit(socket, event_type) do
    limits = socket.assigns[:rate_limits] || init_rate_limits()
    state = limits[event_type] || %{count: 0, window_start: System.system_time(:second)}

    now = System.system_time(:second)

    new_state = if now - state.window_start > 60 do
      %{count: 1, window_start: now}
    else
      %{state | count: state.count + 1}
    end

    assign(socket, :rate_limits, Map.put(limits, event_type, new_state))
  end
end
