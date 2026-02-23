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
  alias CGraph.Workers.EventExporter
  alias CGraph.Workers.EventRewardDistributor

  import CGraphWeb.Admin.EventsHelpers,
    only: [
      require_admin: 2,
      rate_limit: 2,
      get_page: 1,
      get_per_page: 1,
      validate_event_dates: 1,
      validate_event_update: 2,
      validate_can_delete: 1,
      validate_can_modify_battle_pass: 1,
      get_changes: 2
    ]

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
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @doc "Creates a new event."
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec start(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec pause(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec resume(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec end_event(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def end_event(conn, %{"id" => id}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(id),
         {:ok, ended_event} <- Events.end_event(event) do

      # Trigger reward distribution in background
      EventRewardDistributor.enqueue(%{event_id: event.id})

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
  @spec list_tiers(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_tiers(conn, %{"event_id" => event_id}) do
    with {:ok, tiers} <- Events.list_battle_pass_tiers(event_id) do
      render(conn, :tiers, tiers: tiers)
    end
  end

  @doc """
  Create a new battle pass tier.
  """
  @spec create_tier(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec bulk_create_tiers(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec update_tier(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_tier(conn, %{"event_id" => event_id, "tier_id" => tier_id, "tier" => tier_params}) do
    admin = conn.assigns.current_admin

    with {:ok, event} <- Events.get_event(event_id),
         :ok <- validate_can_modify_battle_pass(event),
         {:ok, tier} <- Events.get_battle_pass_tier(event_id, tier_id),
         {:ok, updated_tier} <- Events.update_battle_pass_tier(event_id, tier, tier_params) do

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
  @spec list_quests(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_quests(conn, %{"event_id" => event_id}) do
    with {:ok, quests} <- Events.list_event_quests(event_id) do
      render(conn, :quests, quests: quests)
    end
  end

  @doc """
  Create a new quest.
  """
  @spec create_quest(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec update_quest(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_quest(conn, %{"event_id" => event_id, "quest_id" => quest_id, "quest" => quest_params}) do
    admin = conn.assigns.current_admin

    with {:ok, quest} <- Events.get_quest(event_id, quest_id),
         {:ok, updated_quest} <- Events.update_quest(event_id, quest, quest_params) do

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
  @spec leaderboard(Plug.Conn.t(), map()) :: Plug.Conn.t()
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
  @spec analytics(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def analytics(conn, %{"event_id" => event_id}) do
    with {:ok, analytics} <- Events.get_event_analytics(event_id) do
      render(conn, :analytics, analytics: analytics)
    end
  end

  @doc """
  Export event data (participants, leaderboard, etc.).
  """
  @spec export(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def export(conn, %{"event_id" => event_id, "format" => format}) do
    admin = conn.assigns.current_admin

    # Queue export job for large datasets
    {:ok, job} = EventExporter.enqueue(%{
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
  # Moved to CGraphWeb.Admin.EventsHelpers
end
