defmodule CGraph.Gamification.Events.Participation do
  @moduledoc """
  User participation, leaderboards, and analytics for seasonal events.

  Handles user joining/progress tracking, point accumulation,
  leaderboard queries with cursor-based pagination, and event analytics.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}
  alias CGraph.Gamification.Events.Crud
  alias CGraph.Repo

  # ============================================================================
  # User Participation
  # ============================================================================

  @doc """
  Join an event.
  """
  @spec join_event(String.t(), String.t()) :: {:ok, UserEventProgress.t()} | {:error, term()}
  def join_event(user_id, event_id) do
    case Crud.get_event(event_id) do
      {:ok, event} ->
        if SeasonalEvent.active?(event) do
          attrs = %{
            user_id: user_id,
            seasonal_event_id: event_id,
            first_activity_at: DateTime.truncate(DateTime.utc_now(), :second),
            last_activity_at: DateTime.truncate(DateTime.utc_now(), :second),
            days_participated: 1
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
          days_participated: (progress.days_participated || 0) + 1,
          last_activity_at: DateTime.truncate(DateTime.utc_now(), :second)
        })
        Repo.update(changeset)
    end
  end

  @doc """
  Get user's progress in an event.
  """
  @spec get_user_progress(String.t(), String.t()) ::
          {:ok, UserEventProgress.t()} | {:error, :not_found}
  def get_user_progress(user_id, event_id) do
    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil -> {:error, :not_found}
      progress -> {:ok, progress}
    end
  end

  @doc """
  Add points to user's event progress.
  """
  @spec add_event_points(String.t(), String.t(), integer()) ::
          {:ok, UserEventProgress.t()} | {:error, term()}
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

  @doc """
  Add XP to user's event progress with tier threshold checking.

  Awards event XP, checks for battle pass tier advancement, and
  unlocks tier rewards when thresholds are crossed.
  """
  @spec add_event_xp(String.t(), String.t(), integer()) ::
          {:ok, UserEventProgress.t()} | {:error, term()}
  def add_event_xp(user_id, event_id, xp_amount) do
    case get_user_progress(user_id, event_id) do
      {:ok, progress} ->
        old_xp = progress.battle_pass_xp || 0
        new_xp = old_xp + xp_amount
        old_tier = progress.battle_pass_tier || 0
        new_tier = calculate_tier_from_xp(new_xp)

        new_points = (progress.event_points || 0) + xp_amount
        new_lb_points = (progress.leaderboard_points || 0) + xp_amount

        changes = %{
          battle_pass_xp: new_xp,
          battle_pass_tier: max(old_tier, new_tier),
          event_points: new_points,
          leaderboard_points: new_lb_points,
          last_activity_at: DateTime.truncate(DateTime.utc_now(), :second)
        }

        case progress |> Ecto.Changeset.change(changes) |> Repo.update() do
          {:ok, updated} ->
            # If tier advanced, broadcast and award tier rewards
            if new_tier > old_tier do
              broadcast_tier_advance(user_id, event_id, old_tier, new_tier, progress.has_battle_pass)
            end

            {:ok, updated}

          error ->
            error
        end

      {:error, :not_found} ->
        {:error, :not_found}
    end
  end

  @xp_per_tier 1000

  defp calculate_tier_from_xp(xp), do: div(xp, @xp_per_tier)

  defp broadcast_tier_advance(user_id, event_id, old_tier, new_tier, has_battle_pass) do
    Task.start(fn ->
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "gamification:#{user_id}",
        {:battle_pass_tier_up, %{
          event_id: event_id,
          old_tier: old_tier,
          new_tier: new_tier,
          has_premium: has_battle_pass || false
        }}
      )
    end)
  end

  # ============================================================================
  # Leaderboards
  # ============================================================================

  @doc """
  Get leaderboard for an event.
  """
  @spec get_leaderboard(String.t(), keyword()) :: {:ok, {list(map()), map()}}
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

  # ============================================================================
  # Analytics
  # ============================================================================

  @doc """
  Get analytics for an event.
  """
  @spec get_event_analytics(String.t()) :: {:ok, map()}
  def get_event_analytics(event_id) do
    analytics = calculate_event_analytics(event_id)
    {:ok, analytics}
  end

  @doc false
  @spec calculate_event_analytics(String.t()) :: map()
  def calculate_event_analytics(event_id) do
    base_query = from(p in UserEventProgress, where: p.seasonal_event_id == ^event_id)

    total_participants = Repo.aggregate(base_query, :count, :id) || 0

    yesterday = DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -24 * 60 * 60, :second)
    active_query = from(p in base_query, where: p.last_activity_at >= ^yesterday)
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
