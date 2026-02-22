defmodule CGraphWeb.EventsController do
  @moduledoc """
  Controller for seasonal events endpoints.

  ## Endpoints

  - GET /api/v1/events - List all active/upcoming events
  - GET /api/v1/events/:id - Get event details
  - GET /api/v1/events/:id/progress - Get user's event progress
  - POST /api/v1/events/:id/join - Join an event
  - POST /api/v1/events/:id/claim-reward - Claim event reward
  - GET /api/v1/events/:id/leaderboard - Get event leaderboard
  - POST /api/v1/events/:id/battle-pass/purchase - Purchase battle pass
  """
  use CGraphWeb, :controller

  import Ecto.Query, warn: false

  alias CGraph.Gamification
  alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}
  alias CGraph.Repo

  import CGraphWeb.EventsController.Helpers

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/events
  List all active and upcoming seasonal events.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    include_ended = params["include_ended"] == "true"

    now = DateTime.utc_now()

    query = from e in SeasonalEvent,
      where: e.is_active == true,
      order_by: [asc: e.starts_at]

    query = if include_ended do
      query
    else
      from e in query, where: e.ends_at > ^now or e.grace_period_ends_at > ^now
    end

    events = Repo.all(query)

    # Categorize events
    {active, upcoming, ended} = categorize_events(events, now)

    conn
    |> put_status(:ok)
    |> json(%{
      active: Enum.map(active, &serialize_event/1),
      upcoming: Enum.map(upcoming, &serialize_event/1),
      ended: Enum.map(ended, &serialize_event/1),
      featured: Enum.find(active, & &1.featured) |> serialize_event()
    })
  end

  @doc """
  GET /api/v1/events/:id
  Get detailed event information.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => event_id}) do
    case Repo.get(SeasonalEvent, event_id) do
      nil -> {:error, :not_found}
      event ->
        conn
        |> put_status(:ok)
        |> json(%{event: serialize_event_detailed(event)})
    end
  end

  @doc """
  GET /api/v1/events/:id/progress
  Get user's progress in an event.
  """
  @spec progress(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def progress(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user

    case Repo.get(SeasonalEvent, event_id) do
      nil ->
        {:error, :not_found}

      event ->
        progress = Repo.get_by(UserEventProgress, user_id: user.id, seasonal_event_id: event_id)

        if progress do
          conn
          |> put_status(:ok)
          |> json(%{
            progress: serialize_progress(progress),
            event: serialize_event(event),
            nextMilestone: get_next_milestone(progress, event),
            availableRewards: get_available_rewards(progress, event)
          })
        else
          conn
          |> put_status(:ok)
          |> json(%{
            progress: nil,
            event: serialize_event(event),
            joined: false
          })
        end
    end
  end

  @doc """
  POST /api/v1/events/:id/join
  Join a seasonal event.
  """
  @spec join(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def join(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user

    case Repo.get(SeasonalEvent, event_id) do
      nil ->
        {:error, :not_found}

      event ->
        # Check if event is active
        if SeasonalEvent.active?(event) do
          # Check if already joined
          case Repo.get_by(UserEventProgress, user_id: user.id, seasonal_event_id: event_id) do
            nil ->
              {:ok, progress} = %UserEventProgress{}
              |> UserEventProgress.changeset(%{
                user_id: user.id,
                seasonal_event_id: event_id,
                first_activity_at: DateTime.truncate(DateTime.utc_now(), :second),
                last_activity_at: DateTime.truncate(DateTime.utc_now(), :second),
                days_participated: 1
              })
              |> Repo.insert()

              conn
              |> put_status(:created)
              |> json(%{
                success: true,
                progress: serialize_progress(progress),
                welcomeRewards: event.participation_rewards
              })

            progress ->
              conn
              |> put_status(:ok)
              |> json(%{
                success: true,
                alreadyJoined: true,
                progress: serialize_progress(progress)
              })
          end
        else
          conn
          |> put_status(:bad_request)
          |> json(%{error: "Event is not currently active"})
        end
    end
  end

  @doc """
  POST /api/v1/events/:id/claim-reward
  Claim an event milestone or participation reward.
  """
  @spec claim_reward(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def claim_reward(conn, %{"id" => event_id, "reward_id" => reward_id}) do
    user = conn.assigns.current_user

    with %UserEventProgress{} = progress <- Repo.get_by(UserEventProgress, user_id: user.id, seasonal_event_id: event_id),
         %SeasonalEvent{} = event <- Repo.get(SeasonalEvent, event_id),
         {:ok, reward} <- find_claimable_reward(progress, event, reward_id),
         {:ok, updated_progress} <- mark_reward_claimed(progress, reward_id, reward) do

      # Grant the actual reward
      grant_reward(user.id, reward)

      conn
      |> put_status(:ok)
      |> json(%{
        success: true,
        reward: reward,
        progress: serialize_progress(updated_progress)
      })
    else
      nil ->
        {:error, :not_found}

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: reason})
    end
  end

  @doc """
  GET /api/v1/events/:id/leaderboard
  Get event leaderboard.
  """
  @spec leaderboard(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def leaderboard(conn, %{"id" => event_id} = params) do
    limit = min(String.to_integer(params["limit"] || "50"), 100)
    cursor = params["cursor"]

    cursor_data = decode_lb_cursor(cursor)
    rank_start = if cursor_data, do: cursor_data.rank, else: 1

    query = from p in UserEventProgress,
      join: u in assoc(p, :user),
      where: p.seasonal_event_id == ^event_id,
      order_by: [desc: p.leaderboard_points, asc: p.inserted_at],
      limit: ^(limit + 1),
      select: %{
        user_id: u.id,
        username: u.username,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        points: p.leaderboard_points,
        event_points: p.event_points,
        battle_pass_tier: p.battle_pass_tier,
        inserted_at: p.inserted_at
      }

    query = if cursor_data do
      cursor_dt = parse_lb_cursor_dt(cursor_data.inserted_at)
      from [p, u] in query,
        where: p.leaderboard_points < ^cursor_data.points or
               (p.leaderboard_points == ^cursor_data.points and p.inserted_at > ^cursor_dt)
    else
      query
    end

    results = Repo.all(query)
    has_more = length(results) > limit
    items = Enum.take(results, limit)

    entries_with_rank = items
    |> Enum.with_index(rank_start)
    |> Enum.map(fn {entry, rank} -> Map.put(entry, :rank, rank) end)

    next_cursor = if has_more && items != [] do
      last = List.last(items)
      encode_lb_cursor(rank_start + length(items), last.points, last.inserted_at)
    else
      nil
    end

    # Get current user's rank
    user = conn.assigns.current_user
    user_rank = get_user_rank(user.id, event_id)

    conn
    |> put_status(:ok)
    |> json(%{
      leaderboard: entries_with_rank,
      yourRank: user_rank,
      pagination: %{
        limit: limit,
        hasMore: has_more,
        nextCursor: next_cursor
      }
    })
  end

  @doc """
  POST /api/v1/events/:id/battle-pass/purchase
  Purchase the battle pass for an event.
  """
  @spec purchase_battle_pass(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def purchase_battle_pass(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user

    case Repo.get(SeasonalEvent, event_id) do
      nil ->
        {:error, :not_found}

      event ->
        if event.has_battle_pass do
          progress = Repo.get_by(UserEventProgress, user_id: user.id, seasonal_event_id: event_id)

          cond do
            is_nil(progress) ->
              {:error, :not_found}

            progress.has_battle_pass ->
              conn
              |> put_status(:bad_request)
              |> json(%{error: "Already purchased battle pass"})

            true ->
              # Deduct gems
              case Gamification.deduct_currency(user.id, "gems", event.battle_pass_cost) do
                {:ok, _} ->
                  {:ok, updated} = progress
                  |> UserEventProgress.purchase_battle_pass_changeset()
                  |> Repo.update()

                  # Grant any retroactive premium rewards
                  retroactive_rewards = get_retroactive_rewards(updated, event)

                  conn
                  |> put_status(:ok)
                  |> json(%{
                    success: true,
                    progress: serialize_progress(updated),
                    retroactiveRewards: retroactive_rewards
                  })

                {:error, _} ->
                  conn
                  |> put_status(:bad_request)
                  |> json(%{error: "Insufficient gems"})
              end
          end
        else
          conn
          |> put_status(:bad_request)
          |> json(%{error: "This event does not have a battle pass"})
        end
    end
  end
end
