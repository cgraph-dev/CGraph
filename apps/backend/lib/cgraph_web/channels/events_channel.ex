defmodule CGraphWeb.EventsChannel do
  @moduledoc """
  Real-time channel for seasonal events and live event updates.

  Provides:
  - Event start/end notifications
  - Live leaderboard updates
  - Quest progress updates
  - Battle pass tier unlocks
  - Community milestone announcements
  - Event countdown timers

  Topics:
  - events:global - Global event announcements
  - events:{event_id} - Specific event updates
  - events:{event_id}:leaderboard - Live leaderboard for an event
  """
  use CGraphWeb, :channel

  alias CGraph.Gamification
  alias CGraphWeb.Presence

  require Logger

  @leaderboard_update_interval 30_000  # 30 seconds
  # Max subscriptions enforced at runtime
  @max_leaderboard_subscriptions 3
  _ = @max_leaderboard_subscriptions

  @doc "Handles channel join requests and initializes socket state."
  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("events:global", _params, socket) do
    send(self(), :after_join_global)
    {:ok, %{status: "connected"}, socket}
  end

  def join("events:" <> event_id, _params, socket) do
    case Gamification.get_event(event_id) do
      {:ok, event} ->
        send(self(), {:after_join_event, event})
        {:ok, %{event: sanitize_event(event)}, socket |> assign(:current_event_id, event_id)}

      {:error, :not_found} ->
        {:error, %{reason: "event_not_found"}}
    end
  end

  @doc "Handles asynchronous process messages."
  @impl true
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info(:after_join_global, socket) do
    user = socket.assigns.current_user

    # Track presence
    {:ok, _} = Presence.track(socket, user.id, %{
      online_at: System.system_time(:second),
      user_id: user.id
    })

    # Subscribe to global event broadcasts
    Phoenix.PubSub.subscribe(CGraph.PubSub, "events:global")

    # Send active events
    push(socket, "active_events", %{events: get_active_events()})

    # Send upcoming events
    push(socket, "upcoming_events", %{events: get_upcoming_events()})

    {:noreply, socket}
  end

  def handle_info({:after_join_event, event}, socket) do
    user = socket.assigns.current_user
    event_id = event.id

    # Track presence in this event
    {:ok, _} = Presence.track(socket, "#{event_id}:#{user.id}", %{
      online_at: System.system_time(:second),
      user_id: user.id,
      username: user.username
    })

    # Subscribe to event-specific updates
    Phoenix.PubSub.subscribe(CGraph.PubSub, "events:#{event_id}")

    # Get user's progress in this event
    progress = get_user_event_progress(user.id, event_id)
    push(socket, "your_progress", progress)

    # Get current leaderboard top 10
    leaderboard = get_event_leaderboard(event_id, 10)
    push(socket, "leaderboard", %{entries: leaderboard})

    # Get community milestones
    milestones = get_community_milestones(event_id)
    push(socket, "community_milestones", milestones)

    # Schedule periodic leaderboard updates
    Process.send_after(self(), :update_leaderboard, @leaderboard_update_interval)

    {:noreply, socket}
  end

  # Periodic leaderboard update
  def handle_info(:update_leaderboard, socket) do
    if socket.assigns[:current_event_id] do
      leaderboard = get_event_leaderboard(socket.assigns.current_event_id, 10)
      push(socket, "leaderboard_update", %{entries: leaderboard})
      Process.send_after(self(), :update_leaderboard, @leaderboard_update_interval)
    end
    {:noreply, socket}
  end

  # Global event broadcasts
  def handle_info({:event_started, event}, socket) do
    push(socket, "event_started", sanitize_event(event))
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

  # Event-specific broadcasts
  def handle_info({:leaderboard_change, data}, socket) do
    push(socket, "leaderboard_change", data)
    {:noreply, socket}
  end

  def handle_info({:community_milestone_reached, data}, socket) do
    push(socket, "community_milestone_reached", data)
    {:noreply, socket}
  end

  def handle_info({:quest_available, quest}, socket) do
    push(socket, "quest_available", quest)
    {:noreply, socket}
  end

  # User-specific (via targeted broadcast)
  def handle_info({:progress_update, data}, socket) do
    if data.user_id == socket.assigns.current_user.id do
      push(socket, "progress_update", data)
    end
    {:noreply, socket}
  end

  def handle_info({:tier_unlocked, data}, socket) do
    if data.user_id == socket.assigns.current_user.id do
      push(socket, "tier_unlocked", data)
    end
    {:noreply, socket}
  end

  def handle_info({:reward_available, data}, socket) do
    if data.user_id == socket.assigns.current_user.id do
      push(socket, "reward_available", data)
    end
    {:noreply, socket}
  end

  # Client requests - get full event details
  @doc "Handles incoming channel events from clients."
  @impl true
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}
  def handle_in("get_event", %{"event_id" => event_id}, socket) do
    case Gamification.get_event(event_id) do
      {:ok, event} ->
        {:reply, {:ok, %{event: event}}, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client requests - get user progress
  def handle_in("get_progress", %{"event_id" => event_id}, socket) do
    user_id = socket.assigns.current_user.id
    progress = get_user_event_progress(user_id, event_id)
    {:reply, {:ok, progress}, socket}
  end

  # Client requests - get leaderboard
  def handle_in("get_leaderboard", params, socket) do
    event_id = Map.get(params, "event_id", socket.assigns[:current_event_id])
    limit = min(Map.get(params, "limit", 100), 100)
    cursor = Map.get(params, "cursor")

    if event_id do
      {entries, page_info} = get_event_leaderboard(event_id, limit, cursor)
      user_rank = get_user_rank(socket.assigns.current_user.id, event_id)

      {:reply, {:ok, %{
        entries: entries,
        your_rank: user_rank,
        has_more: page_info.has_next_page,
        end_cursor: page_info.end_cursor
      }}, socket}
    else
      {:reply, {:error, %{reason: "no_event_specified"}}, socket}
    end
  end

  # Client requests - get quests
  def handle_in("get_quests", %{"event_id" => event_id}, socket) do
    user_id = socket.assigns.current_user.id
    quests = Gamification.get_event_quests(event_id, user_id)
    {:reply, {:ok, %{quests: quests}}, socket}
  end

  # Client requests - get battle pass
  def handle_in("get_battle_pass", %{"event_id" => event_id}, socket) do
    user_id = socket.assigns.current_user.id

    case Gamification.get_battle_pass_info(event_id, user_id) do
      {:ok, info} -> {:reply, {:ok, info}, socket}
      {:error, reason} -> {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client action - claim reward
  def handle_in("claim_reward", %{"event_id" => event_id, "reward_type" => type, "tier" => tier}, socket) do
    user_id = socket.assigns.current_user.id

    case Gamification.claim_event_reward(user_id, event_id, type, tier) do
      {:ok, reward} ->
        {:reply, {:ok, %{reward: reward}}, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client action - purchase battle pass
  def handle_in("purchase_battle_pass", %{"event_id" => event_id}, socket) do
    user_id = socket.assigns.current_user.id

    case Gamification.purchase_battle_pass(user_id, event_id) do
      {:ok, result} ->
        {:reply, {:ok, result}, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Client action - complete quest objective
  def handle_in("update_quest_progress", %{"event_id" => event_id, "quest_id" => quest_id, "progress" => progress}, socket) do
    user_id = socket.assigns.current_user.id

    case Gamification.update_quest_progress(user_id, event_id, quest_id, progress) do
      {:ok, result} ->
        # Check if quest completed
        if result.status == :completed do
          push(socket, "quest_completed", %{quest_id: quest_id, rewards: %{points: result.points_earned}})
        end
        {:reply, {:ok, result}, socket}
      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  # Get countdown to event end
  def handle_in("get_countdown", %{"event_id" => event_id}, socket) do
    case Gamification.get_event(event_id) do
      {:ok, event} ->
        now = DateTime.utc_now()
        seconds_remaining = DateTime.diff(event.ends_at, now)
        {:reply, {:ok, %{
          ends_at: event.ends_at,
          seconds_remaining: max(0, seconds_remaining),
          is_active: seconds_remaining > 0
        }}, socket}
      {:error, _} ->
        {:reply, {:error, %{reason: "event_not_found"}}, socket}
    end
  end

  # Heartbeat
  def handle_in("ping", _params, socket) do
    {:reply, {:ok, %{pong: true}}, socket}
  end

  # Private helpers

  @spec get_active_events() :: [map()]
  defp get_active_events do
    case Gamification.list_active_events() do
      events when is_list(events) -> Enum.map(events, &sanitize_event/1)
      _ -> []
    end
  rescue
    _ -> []
  end

  @spec get_upcoming_events() :: [map()]
  defp get_upcoming_events do
    case Gamification.list_upcoming_events(7) do  # Next 7 days
      events when is_list(events) -> Enum.map(events, &sanitize_event/1)
      _ -> []
    end
  rescue
    _ -> []
  end

  @spec get_user_event_progress(String.t(), String.t()) :: map()
  defp get_user_event_progress(user_id, event_id) do
    case Gamification.get_user_event_progress(user_id, event_id) do
      {:ok, progress} -> progress
      {:error, _} -> %{joined: false, event_points: 0, battle_pass_tier: 0}
    end
  rescue
    _ -> %{joined: false, event_points: 0, battle_pass_tier: 0}
  end
  @spec get_event_leaderboard(String.t(), pos_integer(), String.t() | nil) :: {list(), map()}
  defp get_event_leaderboard(event_id, limit, cursor \\ nil) do
    case Gamification.get_event_leaderboard(event_id, limit, cursor) do
      {entries, page_info} when is_list(entries) -> {entries, page_info}
      entries when is_list(entries) -> {entries, %{has_next_page: false, end_cursor: nil}}
      _ -> {[], %{has_next_page: false, end_cursor: nil}}
    end
  rescue
    _ -> {[], %{has_next_page: false, end_cursor: nil}}
  end

  @spec get_user_rank(String.t(), String.t()) :: non_neg_integer() | nil
  defp get_user_rank(user_id, event_id) do
    case Gamification.get_user_event_rank(user_id, event_id) do
      {:ok, rank} -> rank
      _ -> nil
    end
  rescue
    _ -> nil
  end

  @spec get_community_milestones(String.t()) :: map()
  defp get_community_milestones(event_id) do
    case Gamification.get_community_milestones(event_id) do
      {:ok, milestones} -> milestones
      _ -> %{current_total: 0, milestones: [], next_milestone: nil}
    end
  rescue
    _ -> %{current_total: 0, milestones: [], next_milestone: nil}
  end

  @spec sanitize_event(map()) :: map()
  defp sanitize_event(event) do
    Map.take(event, [
      :id, :slug, :name, :short_description, :event_type,
      :starts_at, :ends_at, :theme_color_primary, :theme_color_secondary,
      :banner_url, :icon_url, :has_battle_pass, :has_leaderboard,
      :xp_multiplier, :is_active, :featured
    ])
  end
end
