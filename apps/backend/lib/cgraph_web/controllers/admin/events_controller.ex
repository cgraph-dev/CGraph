defmodule CGraphWeb.Admin.EventsController do
  @moduledoc """
  Admin controller for managing seasonal events and competitions.

  Provides CRUD operations for:
  - Creating and configuring seasonal events
  - Managing battle pass tiers and rewards
  - Controlling event lifecycle (start, pause, end)
  - Viewing event analytics and leaderboards
  - Managing quests and challenges

  Security:
  - All endpoints require admin authentication
  - Actions are audit logged
  - Rate limited to prevent abuse

  Scale considerations:
  - Paginated responses for large datasets
  - Cached analytics queries
  - Background jobs for bulk operations
  """

  use CGraphWeb, :controller

  alias CGraph.Gamification.Events
  # SeasonalEvent, EventReward, BattlePassTier, EventQuest used via Events module
  alias CGraph.Accounts.AuditLog

  plug :require_admin
  plug :rate_limit, max_requests: 100, window_ms: 60_000

  @doc """
  List all events with filtering and pagination.

  ## Query Parameters
  - status: filter by status (draft, scheduled, active, paused, ended)
  - type: filter by event type
  - page: page number (default: 1)
  - per_page: items per page (default: 20, max: 100)
  - sort: field to sort by (default: starts_at)
  - order: asc or desc (default: desc)
  """
  def index(conn, params) do
    page = get_page(params)
    per_page = get_per_page(params)

    filters = %{
      status: params["status"],
      type: params["type"],
      search: params["search"]
    }

    {events, pagination} = Events.list_events_paginated(
      filters,
      page: page,
      per_page: per_page,
      sort: params["sort"] || "starts_at",
      order: params["order"] || "desc"
    )

    render(conn, :index, events: events, pagination: pagination)
  end

  @doc """
  Get detailed event information including analytics.
  """
  def show(conn, %{"id" => id}) do
    with {:ok, event} <- Events.get_event_with_analytics(id) do
      render(conn, :show, event: event)
    end
  end

  @doc """
  Create a new seasonal event.

  ## Request Body
  ```json
  {
    "name": "Winter Wonderland 2026",
    "description": "Celebrate winter with exclusive rewards!",
    "event_type": "seasonal",
    "starts_at": "2026-12-01T00:00:00Z",
    "ends_at": "2026-12-31T23:59:59Z",
    "config": {
      "xp_multiplier": 2.0,
      "primary_color": "#4F46E5",
      "secondary_color": "#EC4899",
      "battle_pass_enabled": true,
      "leaderboard_enabled": true
    },
    "exclusive_rewards": ["reward_id_1", "reward_id_2"]
  }
  ```
  """
  def create(conn, %{"event" => event_params}) do
    admin = conn.assigns.current_admin

    with :ok <- validate_event_dates(event_params),
         {:ok, event} <- Events.create_event(event_params, created_by: admin.id) do

      AuditLog.log(:event_created, admin.id, %{event_id: event.id, name: event.name})

      conn
      |> put_status(:created)
      |> render(:show, event: event)
    end
  end

  @doc """
  Update an existing event.

  Note: Some fields cannot be modified once an event is active
  (e.g., starts_at, battle pass structure).
  """
  def update(conn, %{"id" => id, "event" => event_params}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         :ok <- validate_event_update(event, event_params),
         {:ok, updated_event} <- Events.update_event(event, event_params) do

      AuditLog.log(:event_updated, admin.id, %{
        event_id: event.id,
        changes: get_changes(event, updated_event)
      })

      render(conn, :show, event: updated_event)
    end
  end

  @doc """
  Delete an event.

  Only draft events can be deleted. Active/ended events are archived.
  """
  def delete(conn, %{"id" => id}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         :ok <- validate_can_delete(event),
         {:ok, _} <- Events.delete_event(event) do

      AuditLog.log(:event_deleted, admin.id, %{event_id: event.id, name: event.name})

      send_resp(conn, :no_content, "")
    end
  end

  # ==================== EVENT LIFECYCLE ====================

  @doc """
  Manually start a scheduled event early.
  """
  def start(conn, %{"id" => id}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         {:ok, started_event} <- Events.start_event(event) do

      # Broadcast event start to all connected clients
      CGraphWeb.Endpoint.broadcast!("events:global", "event_started", %{
        event: started_event
      })

      AuditLog.log(:event_started, admin.id, %{event_id: event.id})

      render(conn, :show, event: started_event)
    end
  end

  @doc """
  Pause an active event temporarily.
  """
  def pause(conn, %{"id" => id}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         {:ok, paused_event} <- Events.pause_event(event) do

      CGraphWeb.Endpoint.broadcast!("events:global", "event_paused", %{
        event_id: event.id
      })

      AuditLog.log(:event_paused, admin.id, %{event_id: event.id})

      render(conn, :show, event: paused_event)
    end
  end

  @doc """
  Resume a paused event.
  """
  def resume(conn, %{"id" => id}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         {:ok, resumed_event} <- Events.resume_event(event) do

      CGraphWeb.Endpoint.broadcast!("events:global", "event_resumed", %{
        event_id: event.id
      })

      AuditLog.log(:event_resumed, admin.id, %{event_id: event.id})

      render(conn, :show, event: resumed_event)
    end
  end

  @doc """
  End an event early.
  """
  def end_event(conn, %{"id" => id}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         {:ok, ended_event} <- Events.end_event(event) do

      # Trigger reward distribution in background
      CGraph.Workers.EventRewardDistributor.enqueue(%{event_id: event.id})

      CGraphWeb.Endpoint.broadcast!("events:global", "event_ended", %{
        event_id: event.id
      })

      AuditLog.log(:event_ended, admin.id, %{event_id: event.id})

      render(conn, :show, event: ended_event)
    end
  end

  # ==================== BATTLE PASS MANAGEMENT ====================

  @doc """
  Get battle pass tiers for an event.
  """
  def list_tiers(conn, %{"event_id" => event_id}) do
    with {:ok, tiers} <- Events.list_battle_pass_tiers(event_id) do
      render(conn, :tiers, tiers: tiers)
    end
  end

  @doc """
  Create a new battle pass tier.
  """
  def create_tier(conn, %{"event_id" => event_id, "tier" => tier_params}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(event_id),
         :ok <- validate_can_modify_battle_pass(event),
         {:ok, tier} <- Events.create_battle_pass_tier(event, tier_params) do

      AuditLog.log(:tier_created, admin.id, %{event_id: event_id, tier: tier.tier_number})

      conn
      |> put_status(:created)
      |> render(:tier, tier: tier)
    end
  end

  @doc """
  Bulk create battle pass tiers from template.
  """
  def bulk_create_tiers(conn, %{"event_id" => event_id, "tiers" => tiers_params}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(event_id),
         :ok <- validate_can_modify_battle_pass(event),
         {:ok, tiers} <- Events.bulk_create_tiers(event, tiers_params) do

      AuditLog.log(:tiers_bulk_created, admin.id, %{
        event_id: event_id,
        count: length(tiers)
      })

      conn
      |> put_status(:created)
      |> render(:tiers, tiers: tiers)
    end
  end

  @doc """
  Update a battle pass tier.
  """
  def update_tier(conn, %{"event_id" => event_id, "tier_id" => tier_id, "tier" => tier_params}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(event_id),
         :ok <- validate_can_modify_battle_pass(event),
         {:ok, tier} <- Events.get_battle_pass_tier(tier_id),
         {:ok, updated_tier} <- Events.update_battle_pass_tier(tier, tier_params) do

      AuditLog.log(:tier_updated, admin.id, %{
        event_id: event_id,
        tier_id: tier_id
      })

      render(conn, :tier, tier: updated_tier)
    end
  end

  # ==================== QUEST MANAGEMENT ====================

  @doc """
  List quests for an event.
  """
  def list_quests(conn, %{"event_id" => event_id}) do
    with {:ok, quests} <- Events.list_event_quests(event_id) do
      render(conn, :quests, quests: quests)
    end
  end

  @doc """
  Create a new quest.
  """
  def create_quest(conn, %{"event_id" => event_id, "quest" => quest_params}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(event_id),
         {:ok, quest} <- Events.create_quest(event, quest_params) do

      AuditLog.log(:quest_created, admin.id, %{
        event_id: event_id,
        quest_id: quest.id
      })

      conn
      |> put_status(:created)
      |> render(:quest, quest: quest)
    end
  end

  @doc """
  Update a quest.
  """
  def update_quest(conn, %{"event_id" => event_id, "quest_id" => quest_id, "quest" => quest_params}) do
    admin = conn.assigns.current_admin

    with {:ok, quest} <- Events.get_quest(quest_id),
         {:ok, updated_quest} <- Events.update_quest(quest, quest_params) do

      AuditLog.log(:quest_updated, admin.id, %{
        event_id: event_id,
        quest_id: quest_id
      })

      render(conn, :quest, quest: updated_quest)
    end
  end

  # ==================== LEADERBOARD & ANALYTICS ====================

  @doc """
  Get event leaderboard.
  """
  def leaderboard(conn, %{"event_id" => event_id} = params) do
    page = get_page(params)
    per_page = get_per_page(params)

    with {:ok, {leaderboard, _meta}} <- Events.get_leaderboard(
      event_id,
      page: page,
      per_page: per_page
    ) do
      render(conn, :leaderboard, leaderboard: leaderboard)
    end
  end

  @doc """
  Get event analytics and statistics.
  """
  def analytics(conn, %{"event_id" => event_id}) do
    with {:ok, analytics} <- Events.get_event_analytics(event_id) do
      render(conn, :analytics, analytics: analytics)
    end
  end

  @doc """
  Export event data (participants, leaderboard, etc.).
  """
  def export(conn, %{"event_id" => event_id, "format" => format}) do
    admin = conn.assigns.current_admin

    # Queue export job for large datasets
    {:ok, job} = CGraph.Workers.EventExporter.enqueue(%{
      event_id: event_id,
      format: format,
      requested_by: admin.id
    })

    AuditLog.log(:event_export_requested, admin.id, %{
      event_id: event_id,
      format: format
    })

    conn
    |> put_status(:accepted)
    |> json(%{
      message: "Export job queued",
      job_id: job.id,
      status_url: "/api/v1/admin/jobs/#{job.id}"
    })
  end

  # ==================== PRIVATE FUNCTIONS ====================

  defp require_admin(conn, _opts) do
    case conn.assigns[:current_admin] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Admin authentication required"})
        |> halt()

      admin ->
        if admin.role in [:admin, :super_admin] do
          conn
        else
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Insufficient permissions"})
          |> halt()
        end
    end
  end

  defp rate_limit(conn, opts) do
    max_requests = Keyword.get(opts, :max_requests, 100)
    window_ms = Keyword.get(opts, :window_ms, 60_000)
    key = "admin_events:#{conn.assigns.current_admin.id}"

    case CGraph.RateLimiter.check(key, :admin_api, limit: max_requests, window_ms: window_ms) do
      :ok ->
        conn

      {:error, :rate_limited, info} ->
        conn
        |> put_resp_header("x-ratelimit-limit", to_string(max_requests))
        |> put_resp_header("x-ratelimit-remaining", "0")
        |> put_resp_header("retry-after", to_string(info.retry_after))
        |> put_status(:too_many_requests)
        |> json(%{error: "Rate limit exceeded", retry_after: info.retry_after})
        |> halt()
    end
  end

  defp get_page(params), do: max(1, String.to_integer(params["page"] || "1"))
  defp get_per_page(params), do: min(100, max(1, String.to_integer(params["per_page"] || "20")))

  defp validate_event_dates(%{"starts_at" => starts_at, "ends_at" => ends_at}) do
    with {:ok, start_dt, _} <- DateTime.from_iso8601(starts_at),
         {:ok, end_dt, _} <- DateTime.from_iso8601(ends_at) do
      cond do
        DateTime.compare(end_dt, start_dt) != :gt ->
          {:error, :invalid_dates, "End date must be after start date"}

        DateTime.diff(end_dt, start_dt, :day) > 365 ->
          {:error, :invalid_dates, "Event duration cannot exceed 365 days"}

        true ->
          :ok
      end
    else
      _ -> {:error, :invalid_dates, "Invalid date format"}
    end
  end
  defp validate_event_dates(_), do: :ok

  defp validate_event_update(%{status: :active}, %{"starts_at" => _}) do
    {:error, :immutable_field, "Cannot modify start date of active event"}
  end
  defp validate_event_update(_, _), do: :ok

  defp validate_can_delete(%{status: :draft}), do: :ok
  defp validate_can_delete(_), do: {:error, :cannot_delete, "Only draft events can be deleted"}

  defp validate_can_modify_battle_pass(%{status: status}) when status in [:draft, :scheduled] do
    :ok
  end
  defp validate_can_modify_battle_pass(_) do
    {:error, :immutable, "Cannot modify battle pass of active/ended event"}
  end

  defp get_changes(old, new) do
    [:name, :description, :starts_at, :ends_at, :config, :status]
    |> Enum.reduce(%{}, fn field, acc ->
      old_val = Map.get(old, field)
      new_val = Map.get(new, field)

      if old_val != new_val do
        Map.put(acc, field, %{from: old_val, to: new_val})
      else
        acc
      end
    end)
  end
end
