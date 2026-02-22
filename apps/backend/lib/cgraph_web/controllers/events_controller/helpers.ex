defmodule CGraphWeb.EventsController.Helpers do
  @moduledoc """
  Helper functions for the events controller.

  Contains serialization, reward logic, and cursor-based
  leaderboard pagination helpers.
  """
  alias CGraph.Gamification
  alias CGraph.Gamification.SeasonalEvent
  alias CGraph.Repo

  # ==================== EVENT HELPERS ====================

  @doc "Separate events into active, upcoming, and ended buckets."
  @spec categorize_events([SeasonalEvent.t()], DateTime.t()) :: {[SeasonalEvent.t()], [SeasonalEvent.t()], [SeasonalEvent.t()]}
  def categorize_events(events, now) do
    events
    |> Enum.reduce({[], [], []}, fn event, {active, upcoming, ended} ->
      cond do
        SeasonalEvent.active?(event) -> {[event | active], upcoming, ended}
        DateTime.compare(event.starts_at, now) == :gt -> {active, [event | upcoming], ended}
        true -> {active, upcoming, [event | ended]}
      end
    end)
    |> then(fn {a, u, e} -> {Enum.reverse(a), Enum.reverse(u), Enum.reverse(e)} end)
  end

  @doc "Find a claimable reward for the given progress and event."
  @spec find_claimable_reward(term(), SeasonalEvent.t(), String.t()) :: {:ok, map()} | {:error, String.t()}
  def find_claimable_reward(progress, event, reward_id) do
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

  @doc "Mark a specific reward as claimed in the user's progress."
  @spec mark_reward_claimed(term(), String.t(), map()) :: {:ok, term()} | {:error, Ecto.Changeset.t()}
  def mark_reward_claimed(progress, reward_id, _reward) do
    claimed = [reward_id | progress.milestones_claimed || []]

    progress
    |> Ecto.Changeset.change(%{
      milestones_claimed: claimed
    })
    |> Repo.update()
  end

  @doc "Grant a reward (coins, gems, xp, title, or border) to the user."
  @spec grant_reward(String.t(), map()) :: term()
  def grant_reward(user_id, reward) do
    # Grant the reward based on type
    case reward["type"] do
      "coins" -> Gamification.add_currency(user_id, reward["amount"], :coins)
      "gems" -> Gamification.add_currency(user_id, reward["amount"], :gems)
      "xp" -> Gamification.add_xp(user_id, reward["amount"])
      "title" -> Gamification.unlock_title(user_id, reward["title_id"])
      "border" -> Gamification.unlock_border(user_id, reward["border_id"])
      _ -> :ok
    end
  end

  @doc "Get the next unclaimed milestone for a user's progress."
  @spec get_next_milestone(term(), SeasonalEvent.t()) :: map() | nil
  def get_next_milestone(progress, event) do
    event.milestone_rewards
    |> Enum.filter(& &1["points_required"] > progress.event_points)
    |> Enum.min_by(& &1["points_required"], fn -> nil end)
  end

  @doc "Get all rewards the user has earned but not yet claimed."
  @spec get_available_rewards(term(), SeasonalEvent.t()) :: [map()]
  def get_available_rewards(progress, event) do
    event.milestone_rewards
    |> Enum.filter(fn m ->
      progress.event_points >= m["points_required"] &&
      m["id"] not in (progress.milestones_claimed || [])
    end)
  end

  @doc "Get retroactive premium rewards up to the user's current battle-pass tier."
  @spec get_retroactive_rewards(term(), SeasonalEvent.t()) :: [map()]
  def get_retroactive_rewards(progress, event) do
    # Get all premium rewards up to current tier
    0..progress.battle_pass_tier
    |> Enum.flat_map(fn tier ->
      case Enum.at(event.battle_pass_tiers, tier) do
        nil -> []
        tier_data -> tier_data["premium_rewards"] || []
      end
    end)
  end

  @doc "Look up the user's rank within a specific event leaderboard."
  @spec get_user_rank(String.t(), String.t()) :: integer() | nil
  def get_user_rank(user_id, event_id) do
    query = """
    SELECT rank FROM (
      SELECT user_id, RANK() OVER (ORDER BY leaderboard_points DESC) as rank
      FROM user_event_progress
      WHERE seasonal_event_id = $1
    ) ranked
    WHERE user_id = $2
    """

    case Repo.query(query, [Ecto.UUID.dump!(event_id), Ecto.UUID.dump!(user_id)]) do
      {:ok, %{rows: [[rank]]}} -> rank
      _ -> nil
    end
  end

  # ==================== SERIALIZERS ====================

  @doc "Serialize a seasonal event for API responses."
  @spec serialize_event(SeasonalEvent.t() | nil) :: map() | nil
  def serialize_event(nil), do: nil
  def serialize_event(event) do
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
      isActive: SeasonalEvent.active?(event),
      inGracePeriod: SeasonalEvent.in_grace_period?(event)
    }
  end

  @doc "Serialize a seasonal event with full detail."
  @spec serialize_event_detailed(SeasonalEvent.t()) :: map()
  def serialize_event_detailed(event) do
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

  @doc "Serialize user event progress for API responses."
  @spec serialize_progress(term()) :: map()
  def serialize_progress(progress) do
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
      leaderboardRank: progress.leaderboard_rank,
      firstActivityAt: progress.first_activity_at,
      lastActivityAt: progress.last_activity_at,
      daysParticipated: progress.days_participated
    }
  end

  # ==================== CURSOR HELPERS ====================

  @doc "Encode a leaderboard cursor."
  @spec encode_lb_cursor(integer(), integer(), DateTime.t() | NaiveDateTime.t() | term()) :: String.t()
  def encode_lb_cursor(rank, points, %DateTime{} = dt) do
    "#{rank}|#{points}|#{DateTime.to_iso8601(dt)}" |> Base.url_encode64(padding: false)
  end

  def encode_lb_cursor(rank, points, %NaiveDateTime{} = ndt) do
    "#{rank}|#{points}|#{NaiveDateTime.to_iso8601(ndt)}" |> Base.url_encode64(padding: false)
  end

  def encode_lb_cursor(rank, points, ts) do
    "#{rank}|#{points}|#{ts}" |> Base.url_encode64(padding: false)
  end

  @doc "Decode a leaderboard cursor."
  @spec decode_lb_cursor(String.t() | nil) :: map() | nil
  def decode_lb_cursor(nil), do: nil

  def decode_lb_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         [rank_str, points_str, ts] <- String.split(decoded, "|", parts: 3),
         {rank, _} <- Integer.parse(rank_str),
         {points, _} <- Integer.parse(points_str) do
      %{rank: rank, points: points, inserted_at: ts}
    else
      _ -> nil
    end
  end

  @doc "Parse a leaderboard cursor timestamp into a DateTime or NaiveDateTime."
  @spec parse_lb_cursor_dt(String.t()) :: DateTime.t() | NaiveDateTime.t()
  def parse_lb_cursor_dt(ts_string) do
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
