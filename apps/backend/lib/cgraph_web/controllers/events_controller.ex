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

  alias CGraph.Repo
  alias CGraph.Gamification
  alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/events
  List all active and upcoming seasonal events.
  """
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
  def show(conn, %{"id" => event_id}) do
    event = Repo.get!(SeasonalEvent, event_id)
    
    conn
    |> put_status(:ok)
    |> json(%{event: serialize_event_detailed(event)})
  end

  @doc """
  GET /api/v1/events/:id/progress
  Get user's progress in an event.
  """
  def progress(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user
    
    progress = Repo.get_by(UserEventProgress, user_id: user.id, seasonal_event_id: event_id)
    event = Repo.get!(SeasonalEvent, event_id)
    
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

  @doc """
  POST /api/v1/events/:id/join
  Join a seasonal event.
  """
  def join(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user
    event = Repo.get!(SeasonalEvent, event_id)
    
    # Check if event is active
    unless SeasonalEvent.is_active?(event) do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "Event is not currently active"})
    else
      # Check if already joined
      case Repo.get_by(UserEventProgress, user_id: user.id, seasonal_event_id: event_id) do
        nil ->
          {:ok, progress} = %UserEventProgress{}
          |> UserEventProgress.changeset(%{
            user_id: user.id,
            seasonal_event_id: event_id,
            first_participated_at: DateTime.utc_now(),
            last_participated_at: DateTime.utc_now(),
            total_sessions: 1
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
    end
  end

  @doc """
  POST /api/v1/events/:id/claim-reward
  Claim an event milestone or participation reward.
  """
  def claim_reward(conn, %{"id" => event_id, "reward_id" => reward_id}) do
    user = conn.assigns.current_user
    
    progress = Repo.get_by!(UserEventProgress, user_id: user.id, seasonal_event_id: event_id)
    event = Repo.get!(SeasonalEvent, event_id)
    
    # Check if reward is claimable
    with {:ok, reward} <- find_claimable_reward(progress, event, reward_id),
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
  def purchase_battle_pass(conn, %{"id" => event_id}) do
    user = conn.assigns.current_user
    event = Repo.get!(SeasonalEvent, event_id)
    
    unless event.has_battle_pass do
      conn
      |> put_status(:bad_request)
      |> json(%{error: "This event does not have a battle pass"})
    else
      progress = Repo.get_by!(UserEventProgress, user_id: user.id, seasonal_event_id: event_id)
      
      if progress.has_battle_pass do
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Already purchased battle pass"})
      else
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
    end
  end

  # ==================== PRIVATE HELPERS ====================

  defp categorize_events(events, now) do
    events
    |> Enum.reduce({[], [], []}, fn event, {active, upcoming, ended} ->
      cond do
        SeasonalEvent.is_active?(event) -> {[event | active], upcoming, ended}
        DateTime.compare(event.starts_at, now) == :gt -> {active, [event | upcoming], ended}
        true -> {active, upcoming, [event | ended]}
      end
    end)
    |> then(fn {a, u, e} -> {Enum.reverse(a), Enum.reverse(u), Enum.reverse(e)} end)
  end

  defp find_claimable_reward(progress, event, reward_id) do
    # Check milestones
    milestone = Enum.find(event.milestone_rewards, & &1["id"] == reward_id)
    
    cond do
      milestone && reward_id in (progress.milestones_claimed || []) ->
        {:error, "Already claimed"}
      
      milestone && progress.event_points >= milestone["points_required"] ->
        {:ok, milestone}
      
      milestone ->
        {:error, "Not enough points for this milestone"}
      
      true ->
        {:error, "Reward not found"}
    end
  end

  defp mark_reward_claimed(progress, reward_id, reward) do
    claimed = [reward_id | progress.milestones_claimed || []]
    rewards_claimed = [
      %{"id" => reward_id, "claimed_at" => DateTime.utc_now() |> DateTime.to_iso8601(), "reward" => reward}
      | progress.rewards_claimed || []
    ]
    
    progress
    |> Ecto.Changeset.change(%{
      milestones_claimed: claimed,
      rewards_claimed: rewards_claimed
    })
    |> Repo.update()
  end

  defp grant_reward(user_id, reward) do
    # Grant the reward based on type
    case reward["type"] do
      "coins" -> Gamification.add_currency(user_id, "coins", reward["amount"])
      "gems" -> Gamification.add_currency(user_id, "gems", reward["amount"])
      "xp" -> Gamification.add_xp(user_id, reward["amount"])
      "title" -> Gamification.unlock_title(user_id, reward["title_id"])
      "border" -> Gamification.unlock_border(user_id, reward["border_id"])
      _ -> :ok
    end
  end

  defp get_next_milestone(progress, event) do
    event.milestone_rewards
    |> Enum.filter(& &1["points_required"] > progress.event_points)
    |> Enum.min_by(& &1["points_required"], fn -> nil end)
  end

  defp get_available_rewards(progress, event) do
    event.milestone_rewards
    |> Enum.filter(fn m ->
      progress.event_points >= m["points_required"] &&
      m["id"] not in (progress.milestones_claimed || [])
    end)
  end

  defp get_retroactive_rewards(progress, event) do
    # Get all premium rewards up to current tier
    0..progress.battle_pass_tier
    |> Enum.flat_map(fn tier ->
      case Enum.at(event.battle_pass_tiers, tier) do
        nil -> []
        tier_data -> tier_data["premium_rewards"] || []
      end
    end)
  end

  defp get_user_rank(user_id, event_id) do
    query = """
    SELECT rank FROM (
      SELECT user_id, RANK() OVER (ORDER BY leaderboard_points DESC) as rank
      FROM user_event_progress
      WHERE seasonal_event_id = $1
    ) ranked
    WHERE user_id = $2
    """
    
    case Repo.query(query, [event_id, user_id]) do
      {:ok, %{rows: [[rank]]}} -> rank
      _ -> nil
    end
  end

  # ==================== SERIALIZERS ====================

  defp serialize_event(nil), do: nil
  defp serialize_event(event) do
    %{
      id: event.id,
      slug: event.slug,
      name: event.name,
      description: event.description,
      type: event.event_type,
      status: event.status,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      bannerUrl: event.banner_url,
      iconUrl: event.icon_url,
      colors: event.colors,
      hasBattlePass: event.has_battle_pass,
      battlePassCost: event.battle_pass_cost,
      hasLeaderboard: event.has_leaderboard,
      featured: event.featured,
      isActive: SeasonalEvent.is_active?(event),
      inGracePeriod: SeasonalEvent.in_grace_period?(event)
    }
  end

  defp serialize_event_detailed(event) do
    serialize_event(event)
    |> Map.merge(%{
      theme: event.theme,
      rewards: event.rewards,
      milestoneRewards: event.milestone_rewards,
      participationRewards: event.participation_rewards,
      eventCurrency: event.event_currency,
      eventCurrencyIcon: event.event_currency_icon,
      multipliers: event.multipliers,
      dailyChallenges: event.daily_challenges,
      battlePassTiers: event.battle_pass_tiers,
      leaderboardRewards: event.leaderboard_rewards
    })
  end

  defp serialize_progress(progress) do
    %{
      eventPoints: progress.event_points,
      currencyEarned: progress.event_currency_earned,
      currencyBalance: progress.event_currency_earned - progress.event_currency_spent,
      questsCompleted: length(progress.quests_completed || []),
      milestonesClaimed: progress.milestones_claimed,
      hasBattlePass: progress.has_battle_pass,
      battlePassTier: progress.battle_pass_tier,
      battlePassXp: progress.battle_pass_xp,
      leaderboardPoints: progress.leaderboard_points,
      bestRank: progress.best_rank,
      firstParticipatedAt: progress.first_participated_at,
      lastParticipatedAt: progress.last_participated_at,
      totalSessions: progress.total_sessions
    }
  end

  # Cursor helpers for leaderboard pagination
  defp encode_lb_cursor(rank, points, %DateTime{} = dt) do
    "#{rank}|#{points}|#{DateTime.to_iso8601(dt)}" |> Base.url_encode64(padding: false)
  end

  defp encode_lb_cursor(rank, points, %NaiveDateTime{} = ndt) do
    "#{rank}|#{points}|#{NaiveDateTime.to_iso8601(ndt)}" |> Base.url_encode64(padding: false)
  end

  defp encode_lb_cursor(rank, points, ts) do
    "#{rank}|#{points}|#{ts}" |> Base.url_encode64(padding: false)
  end

  defp decode_lb_cursor(nil), do: nil

  defp decode_lb_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         [rank_str, points_str, ts] <- String.split(decoded, "|", parts: 3),
         {rank, _} <- Integer.parse(rank_str),
         {points, _} <- Integer.parse(points_str) do
      %{rank: rank, points: points, inserted_at: ts}
    else
      _ -> nil
    end
  end

  defp parse_lb_cursor_dt(ts_string) do
    case DateTime.from_iso8601(ts_string) do
      {:ok, dt, _} -> dt
      _ ->
        case NaiveDateTime.from_iso8601(ts_string) do
          {:ok, ndt} -> ndt
          _ -> ~N[2000-01-01 00:00:00]
        end
    end
  end
end
