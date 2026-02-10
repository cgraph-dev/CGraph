defmodule CGraph.Gamification.Events do
  @moduledoc """
  Context module for managing seasonal events and battle passes.
  
  Handles:
  - Creating and managing seasonal events
  - Battle pass tiers and rewards
  - Event quests and challenges
  - Leaderboards and analytics
  
  ## Architecture
  
  Events are time-limited campaigns with:
  - Configurable start/end dates with grace periods
  - Battle pass progression (free + premium tiers)
  - Event-specific currency and rewards
  - Leaderboards with ranking
  - Community milestones
  
  ## Security
  
  - All admin operations require proper authorization
  - Event creation validates date ranges and configurations
  - Reward claims are atomic with proper locking
  """

  import Ecto.Query, warn: false
  require Logger

  alias CGraph.Repo
  alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}
  alias CGraph.Accounts.User

  # ============================================================================
  # Event CRUD Operations
  # ============================================================================

  @doc """
  List events with pagination and filtering.
  """
  def list_events_paginated(filters \\ %{}, opts \\ []) do
    base_query = from(e in SeasonalEvent)
    
    query = base_query
    |> filter_by_status(filters[:status])
    |> filter_by_type(filters[:event_type])
    |> filter_by_active(Keyword.get(opts, :include_inactive, false))

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :starts_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end
  
  defp filter_by_status(query, nil), do: query
  defp filter_by_status(query, status) when is_binary(status) do
    from(e in query, where: e.status == ^status)
  end
  
  defp filter_by_type(query, nil), do: query
  defp filter_by_type(query, type) when is_binary(type) do
    from(e in query, where: e.event_type == ^type)
  end
  
  defp filter_by_active(query, true), do: query
  defp filter_by_active(query, false) do
    from(e in query, where: e.is_active == true)
  end

  @doc """
  Get a single event by ID.
  """
  def get_event(id) do
    case Repo.get(SeasonalEvent, id) do
      nil -> {:error, :not_found}
      event -> {:ok, event}
    end
  end
  
  @doc """
  Get event by slug.
  """
  def get_event_by_slug(slug) do
    case Repo.get_by(SeasonalEvent, slug: slug) do
      nil -> {:error, :not_found}
      event -> {:ok, event}
    end
  end

  @doc """
  Get event with analytics data.
  """
  def get_event_with_analytics(id) do
    case Repo.get(SeasonalEvent, id) do
      nil -> 
        {:error, :not_found}
      event ->
        analytics = calculate_event_analytics(id)
        {:ok, %{event: event, analytics: analytics}}
    end
  end

  @doc """
  Create a new event.
  """
  def create_event(attrs, opts \\ []) do
    created_by = Keyword.get(opts, :created_by)
    Logger.info("events_creating_event_by", attrs: inspect(attrs), created_by: inspect(created_by))
    
    changeset = %SeasonalEvent{} |> SeasonalEvent.changeset(attrs)
    
    case Repo.insert(changeset) do
      {:ok, event} ->
        Logger.info("events_created_event", event_id: event.id, event_name: event.name)
        {:ok, event}
      {:error, changeset} ->
        Logger.warning("[Events] Failed to create event: #{inspect(changeset.errors)}")
        {:error, changeset}
    end
  end

  @doc """
  Update an existing event.
  """
  def update_event(%SeasonalEvent{} = event, attrs) do
    changeset = SeasonalEvent.changeset(event, attrs)
    
    case Repo.update(changeset) do
      {:ok, updated} ->
        Logger.info("events_updated_event", updated_id: updated.id)
        {:ok, updated}
      {:error, changeset} ->
        {:error, changeset}
    end
  end
  
  def update_event(event_id, attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> update_event(event, attrs)
      error -> error
    end
  end

  @doc """
  Delete an event (soft delete).
  """
  def delete_event(%SeasonalEvent{} = event) do
    update_event(event, %{is_active: false})
  end
  
  def delete_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> delete_event(event)
      error -> error
    end
  end

  # ============================================================================
  # Event State Management
  # ============================================================================

  @doc """
  Start an event.
  """
  def start_event(%SeasonalEvent{} = event) do
    now = DateTime.utc_now()
    attrs = %{status: "active", starts_at: min_datetime(event.starts_at, now)}
    update_event(event, attrs)
  end
  
  def start_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> start_event(event)
      error -> error
    end
  end
  
  defp min_datetime(a, b) do
    if DateTime.compare(a, b) == :lt, do: a, else: b
  end

  @doc """
  Pause an active event.
  """
  def pause_event(%SeasonalEvent{} = event) do
    update_event(event, %{status: "upcoming"})
  end
  
  def pause_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> pause_event(event)
      error -> error
    end
  end

  @doc """
  Resume a paused event.
  """
  def resume_event(%SeasonalEvent{} = event) do
    update_event(event, %{status: "active"})
  end
  
  def resume_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> resume_event(event)
      error -> error
    end
  end

  @doc """
  End an event.
  """
  def end_event(%SeasonalEvent{} = event) do
    now = DateTime.utc_now()
    attrs = %{status: "ended", ends_at: min_datetime(event.ends_at, now)}
    update_event(event, attrs)
  end
  
  def end_event(event_id) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> end_event(event)
      error -> error
    end
  end

  # ============================================================================
  # Battle Pass Tiers
  # ============================================================================

  @doc """
  List battle pass tiers for an event.
  """
  def list_battle_pass_tiers(event_id) do
    case get_event(event_id) do
      {:ok, event} ->
        tiers = event.battle_pass_tiers || []
        tiers_with_index = tiers
        |> Enum.with_index(1)
        |> Enum.map(fn {tier, idx} -> Map.put(tier, "tier", idx) end)
        {:ok, tiers_with_index}
      error -> error
    end
  end

  @doc """
  Get a specific battle pass tier.
  """
  def get_battle_pass_tier(event_id, tier_number) do
    case list_battle_pass_tiers(event_id) do
      {:ok, tiers} ->
        case Enum.find(tiers, & &1["tier"] == tier_number) do
          nil -> {:error, :not_found}
          tier -> {:ok, tier}
        end
      error -> error
    end
  end

  @doc """
  Create a battle pass tier.
  """
  def create_battle_pass_tier(event_id, tier_attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> create_battle_pass_tier(event, tier_attrs)
      error -> error
    end
  end
  
  def create_battle_pass_tier(%SeasonalEvent{} = event, tier_attrs) do
    existing_tiers = event.battle_pass_tiers || []
    new_tiers = existing_tiers ++ [tier_attrs]
    update_event(event, %{battle_pass_tiers: new_tiers, has_battle_pass: true})
  end

  @doc """
  Update a battle pass tier.
  """
  def update_battle_pass_tier(event_id, tier_number, tier_attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> update_battle_pass_tier(event, tier_number, tier_attrs)
      error -> error
    end
  end
  
  def update_battle_pass_tier(%SeasonalEvent{} = event, tier_number, tier_attrs) do
    existing_tiers = event.battle_pass_tiers || []
    idx = tier_number - 1
    
    if idx >= 0 and idx < length(existing_tiers) do
      updated_tier = Map.merge(Enum.at(existing_tiers, idx), tier_attrs)
      new_tiers = List.replace_at(existing_tiers, idx, updated_tier)
      update_event(event, %{battle_pass_tiers: new_tiers})
    else
      {:error, :tier_not_found}
    end
  end

  @doc """
  Bulk create/replace tiers.
  """
  def bulk_create_tiers(event_id, tiers_attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> bulk_create_tiers(event, tiers_attrs)
      error -> error
    end
  end
  
  def bulk_create_tiers(%SeasonalEvent{} = event, tiers_attrs) when is_list(tiers_attrs) do
    case update_event(event, %{battle_pass_tiers: tiers_attrs, has_battle_pass: true}) do
      {:ok, updated} -> {:ok, updated.battle_pass_tiers}
      error -> error
    end
  end

  # ============================================================================
  # Event Quests
  # ============================================================================

  @doc """
  List quests for an event.
  """
  def list_event_quests(event_id) do
    case get_event(event_id) do
      {:ok, event} ->
        quests = event.daily_challenges || []
        {:ok, quests}
      error -> error
    end
  end

  @doc """
  Get a specific quest by ID.
  """
  def get_quest(event_id, quest_id) do
    case list_event_quests(event_id) do
      {:ok, quests} ->
        case Enum.find(quests, & &1["id"] == quest_id) do
          nil -> {:error, :not_found}
          quest -> {:ok, quest}
        end
      error -> error
    end
  end

  @doc """
  Create a quest for an event.
  """
  def create_quest(event_id, quest_attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> create_quest(event, quest_attrs)
      error -> error
    end
  end
  
  def create_quest(%SeasonalEvent{} = event, quest_attrs) do
    existing_quests = event.daily_challenges || []
    quest_id = quest_attrs["id"] || Ecto.UUID.generate()
    quest_with_id = Map.put(quest_attrs, "id", quest_id)
    new_quests = existing_quests ++ [quest_with_id]
    
    case update_event(event, %{daily_challenges: new_quests}) do
      {:ok, _} -> {:ok, quest_with_id}
      error -> error
    end
  end

  @doc """
  Update a quest.
  """
  def update_quest(event_id, quest_id, quest_attrs) when is_binary(event_id) do
    case get_event(event_id) do
      {:ok, event} -> update_quest(event, quest_id, quest_attrs)
      error -> error
    end
  end
  
  def update_quest(%SeasonalEvent{} = event, quest_id, quest_attrs) do
    existing_quests = event.daily_challenges || []
    
    case Enum.find_index(existing_quests, & &1["id"] == quest_id) do
      nil -> {:error, :quest_not_found}
      idx ->
        updated_quest = Map.merge(Enum.at(existing_quests, idx), quest_attrs)
        new_quests = List.replace_at(existing_quests, idx, updated_quest)
        case update_event(event, %{daily_challenges: new_quests}) do
          {:ok, _} -> {:ok, updated_quest}
          error -> error
        end
    end
  end

  # ============================================================================
  # User Participation
  # ============================================================================

  @doc """
  Join an event.
  """
  def join_event(user_id, event_id) do
    case get_event(event_id) do
      {:ok, event} ->
        if SeasonalEvent.is_active?(event) do
          attrs = %{
            user_id: user_id,
            seasonal_event_id: event_id,
            first_participated_at: DateTime.utc_now(),
            last_participated_at: DateTime.utc_now(),
            total_sessions: 1
          }
          
          case Repo.insert(%UserEventProgress{} |> UserEventProgress.changeset(attrs)) do
            {:ok, progress} -> {:ok, progress}
            {:error, %{errors: [user_id: {"has already been taken", _}]}} ->
              increment_session(user_id, event_id)
            {:error, changeset} -> {:error, changeset}
          end
        else
          {:error, :event_not_active}
        end
      error -> error
    end
  end
  
  defp increment_session(user_id, event_id) do
    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil -> {:error, :not_found}
      progress ->
        changeset = Ecto.Changeset.change(progress, %{
          total_sessions: (progress.total_sessions || 0) + 1,
          last_participated_at: DateTime.utc_now()
        })
        Repo.update(changeset)
    end
  end

  @doc """
  Get user's progress in an event.
  """
  def get_user_progress(user_id, event_id) do
    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil -> {:error, :not_found}
      progress -> {:ok, progress}
    end
  end

  @doc """
  Add points to user's event progress.
  """
  def add_event_points(user_id, event_id, points) do
    case get_user_progress(user_id, event_id) do
      {:ok, progress} ->
        changeset = UserEventProgress.add_points_changeset(progress, points)
        Repo.update(changeset)
      {:error, :not_found} ->
        case join_event(user_id, event_id) do
          {:ok, _progress} -> add_event_points(user_id, event_id, points)
          error -> error
        end
    end
  end

  # ============================================================================
  # Leaderboards & Analytics
  # ============================================================================

  @doc """
  Get leaderboard for an event.
  """
  def get_leaderboard(event_id, opts \\ []) do
    limit = min(Keyword.get(opts, :limit, 50), 100)
    cursor = Keyword.get(opts, :cursor)
    
    cursor_data = decode_event_cursor(cursor)
    rank_start = if cursor_data, do: cursor_data.rank, else: 1
    
    query = from p in UserEventProgress,
      join: u in User, on: u.id == p.user_id,
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
        has_battle_pass: p.has_battle_pass,
        inserted_at: p.inserted_at
      }
    
    query = if cursor_data do
      cursor_dt = parse_event_cursor_datetime(cursor_data.inserted_at)
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
      encode_event_cursor(rank_start + length(items), last.points, last.inserted_at)
    else
      nil
    end
    
    {:ok, {entries_with_rank, %{has_more: has_more, next_cursor: next_cursor, limit: limit}}}
  end

  defp encode_event_cursor(rank, points, %DateTime{} = dt) do
    "#{rank}|#{points}|#{DateTime.to_iso8601(dt)}" |> Base.url_encode64(padding: false)
  end

  defp encode_event_cursor(rank, points, %NaiveDateTime{} = ndt) do
    "#{rank}|#{points}|#{NaiveDateTime.to_iso8601(ndt)}" |> Base.url_encode64(padding: false)
  end

  defp encode_event_cursor(rank, points, ts) do
    "#{rank}|#{points}|#{ts}" |> Base.url_encode64(padding: false)
  end

  defp decode_event_cursor(nil), do: nil

  defp decode_event_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         [rank_str, points_str, ts] <- String.split(decoded, "|", parts: 3),
         {rank, _} <- Integer.parse(rank_str),
         {points, _} <- Integer.parse(points_str) do
      %{rank: rank, points: points, inserted_at: ts}
    else
      _ -> nil
    end
  end

  defp parse_event_cursor_datetime(ts_string) do
    case DateTime.from_iso8601(ts_string) do
      {:ok, dt, _} -> dt
      _ ->
        case NaiveDateTime.from_iso8601(ts_string) do
          {:ok, ndt} -> ndt
          _ -> ~N[2000-01-01 00:00:00]
        end
    end
  end

  @doc """
  Get analytics for an event.
  """
  def get_event_analytics(event_id) do
    analytics = calculate_event_analytics(event_id)
    {:ok, analytics}
  end
  
  defp calculate_event_analytics(event_id) do
    base_query = from(p in UserEventProgress, where: p.seasonal_event_id == ^event_id)
    
    total_participants = Repo.aggregate(base_query, :count, :id) || 0
    
    yesterday = DateTime.add(DateTime.utc_now(), -24 * 60 * 60, :second)
    active_query = from(p in base_query, where: p.last_participated_at >= ^yesterday)
    active_participants = Repo.aggregate(active_query, :count, :id) || 0
    
    bp_query = from(p in base_query, where: p.has_battle_pass == true)
    battle_pass_holders = Repo.aggregate(bp_query, :count, :id) || 0
    
    avg_tier = Repo.aggregate(base_query, :avg, :battle_pass_tier) || 0
    
    %{
      total_participants: total_participants,
      active_participants: active_participants,
      quests_completed: 0,
      rewards_claimed: 0,
      battle_pass_holders: battle_pass_holders,
      average_tier: if(is_float(avg_tier), do: Float.round(avg_tier, 1), else: avg_tier)
    }
  end
end
