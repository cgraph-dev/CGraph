defmodule CGraph.Gamification.EventSystem do
  @moduledoc """
  Seasonal events, battle passes, and event leaderboards.

  Manages event lifecycle, user progress tracking, reward claiming,
  and community milestones.
  """

  import Ecto.Query, warn: false
  alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}
  alias CGraph.Repo

  @doc "List currently active events."
  @spec list_active_events() :: [SeasonalEvent.t()]
  def list_active_events do
    now = DateTime.utc_now()
    from(e in SeasonalEvent,
      where: e.is_active == true and e.starts_at <= ^now and e.ends_at > ^now,
      order_by: [asc: e.sort_order, desc: e.featured]
    ) |> Repo.all()
  end

  @doc "List upcoming events within N days."
  @spec list_upcoming_events(pos_integer()) :: [SeasonalEvent.t()]
  def list_upcoming_events(days \\ 7) do
    now = DateTime.utc_now()
    future = DateTime.add(now, days * 86_400, :second)
    from(e in SeasonalEvent,
      where: e.is_active == true and e.starts_at > ^now and e.starts_at <= ^future,
      order_by: [asc: e.starts_at]
    ) |> Repo.all()
  end

  @doc "Get event by ID."
  @spec get_event(binary()) :: SeasonalEvent.t() | nil
  def get_event(event_id), do: Repo.get(SeasonalEvent, event_id)

  @doc "Get user's progress in an event."
  @spec get_user_event_progress(binary(), binary()) :: {:ok, map()} | {:error, :not_found}
  def get_user_event_progress(user_id, event_id) do
    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil -> {:error, :not_found}
      progress ->
        {:ok, %{
          joined: true,
          event_points: progress.event_points || 0,
          battle_pass_tier: progress.battle_pass_tier || 0,
          has_battle_pass: progress.has_battle_pass || false,
          quests_completed: length(progress.quests_completed || []),
          milestones_claimed: progress.milestones_claimed || [],
          leaderboard_points: progress.leaderboard_points || 0
        }}
    end
  end

  @doc "Get user's rank in an event."
  @spec get_user_event_rank(binary(), binary()) :: {:ok, non_neg_integer() | nil}
  def get_user_event_rank(user_id, event_id) do
    query = """
    SELECT rank FROM (
      SELECT user_id, RANK() OVER (ORDER BY leaderboard_points DESC) as rank
      FROM user_event_progress WHERE seasonal_event_id = $1
    ) ranked WHERE user_id = $2
    """
    case Repo.query(query, [Ecto.UUID.dump!(event_id), Ecto.UUID.dump!(user_id)]) do
      {:ok, %{rows: [[rank]]}} -> {:ok, rank}
      _ -> {:ok, nil}
    end
  end

  @doc "Get event quests for a user."
  @spec get_event_quests(binary(), binary()) :: list()
  def get_event_quests(user_id, event_id) do
    case Repo.get(SeasonalEvent, event_id) do
      nil ->
        []

      event ->
        quest_ids = event.quests || []

        if quest_ids == [] do
          []
        else
          alias CGraph.Gamification.{Quest, UserQuest}

          quests =
            from(q in Quest, where: q.id in ^quest_ids and q.is_active == true)
            |> Repo.all()

          user_progress =
            from(uq in UserQuest,
              where: uq.user_id == ^user_id and uq.quest_id in ^quest_ids
            )
            |> Repo.all()
            |> Map.new(&{&1.quest_id, &1})

          Enum.map(quests, fn quest ->
            progress = Map.get(user_progress, quest.id)

            %{
              id: quest.id,
              title: quest.title,
              description: quest.description,
              xp_reward: quest.xp_reward,
              coin_reward: quest.coin_reward,
              objectives: quest.objectives,
              completed: if(progress, do: progress.completed, else: false),
              progress: if(progress, do: progress.progress, else: %{})
            }
          end)
        end
    end
  end

  @doc "Get battle pass info."
  @spec get_battle_pass_info(binary(), binary()) :: {:ok, map()} | {:error, :event_not_found}
  def get_battle_pass_info(event_id, user_id) do
    case {Repo.get(SeasonalEvent, event_id),
          Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id)} do
      {nil, _} -> {:error, :event_not_found}
      {event, nil} ->
        {:ok, %{current_tier: 0, max_tier: length(event.battle_pass_tiers || []),
                xp: 0, xp_to_next_tier: 1000, is_premium: false,
                rewards_available: [], tiers: event.battle_pass_tiers || []}}
      {event, progress} ->
        {:ok, %{
          current_tier: progress.battle_pass_tier || 0,
          max_tier: length(event.battle_pass_tiers || []),
          xp: progress.battle_pass_xp || 0,
          xp_to_next_tier: calculate_xp_to_next_tier(progress.battle_pass_xp || 0),
          is_premium: progress.has_battle_pass || false,
          rewards_available: get_available_tier_rewards(progress, event),
          tiers: event.battle_pass_tiers || []
        }}
    end
  end

  @doc "Claim an event reward."
  @spec claim_event_reward(binary(), binary(), non_neg_integer(), String.t()) :: {:ok, map()} | {:error, atom()}
  def claim_event_reward(user_id, event_id, tier, reward_type) do
    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil -> {:error, :not_joined}
      progress when progress.battle_pass_tier < tier -> {:error, :tier_not_reached}
      progress -> do_claim_reward(progress, tier, reward_type)
    end
  end

  @doc "Get event leaderboard (2-arg)."
  @spec get_event_leaderboard(binary(), integer()) :: {list(), map()}
  def get_event_leaderboard(event_id, limit) when is_integer(limit),
    do: get_event_leaderboard(event_id, limit, 0)

  @doc "Get event leaderboard with cursor."
  @spec get_event_leaderboard(binary(), integer(), binary() | integer()) :: {list(), map()}
  def get_event_leaderboard(event_id, limit, cursor_or_offset) when is_integer(limit) do
    base_query = from p in UserEventProgress,
      join: u in assoc(p, :user),
      where: p.seasonal_event_id == ^event_id,
      select: %{
        id: p.id, user_id: u.id, username: u.username,
        display_name: u.display_name, avatar_url: u.avatar_url,
        points: p.leaderboard_points, battle_pass_tier: p.battle_pass_tier
      }

    pagination_opts = %{
      cursor: if(is_binary(cursor_or_offset), do: cursor_or_offset, else: nil),
      after_cursor: nil, before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :leaderboard_points, sort_direction: :desc, include_total: false
    }

    {entries, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)
    entries_with_rank = entries |> Enum.with_index(1) |> Enum.map(fn {e, i} -> Map.put(e, :rank, i) end)
    {entries_with_rank, page_info}
  end

  @doc "Purchase battle pass with retroactive premium reward unlocking."
  @spec purchase_battle_pass(binary(), binary()) :: {:ok, map()} | {:error, atom()}
  def purchase_battle_pass(user_id, event_id) do
    with event when not is_nil(event) <- Repo.get(SeasonalEvent, event_id),
         true <- event.has_battle_pass,
         progress when not is_nil(progress) <- Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id),
         false <- progress.has_battle_pass,
         {:ok, _} <- CGraph.Gamification.deduct_currency(user_id, event.battle_pass_cost, :gems) do
      {:ok, updated} = progress |> UserEventProgress.purchase_battle_pass_changeset() |> Repo.update()

      # Calculate retroactive premium rewards for tiers already reached
      retroactive_rewards = get_retroactive_premium_rewards(event, updated.battle_pass_tier || 0)

      # Broadcast battle pass purchase
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "gamification:#{user_id}",
        {:battle_pass_purchased, %{
          event_id: event_id,
          tier: updated.battle_pass_tier,
          retroactive_rewards: length(retroactive_rewards)
        }}
      )

      {:ok, %{success: true, has_battle_pass: true, tier: updated.battle_pass_tier, retroactive_rewards: retroactive_rewards}}
    else
      nil -> {:error, :not_found}
      false -> {:error, :no_battle_pass_available}
      true -> {:error, :already_purchased}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Update quest progress (event-specific, 4-arg)."
  @spec update_quest_progress(binary(), binary(), binary(), non_neg_integer()) :: {:ok, map()} | {:error, atom()}
  def update_quest_progress(user_id, event_id, quest_id, progress_increment) do
    case Repo.get_by(UserEventProgress, user_id: user_id, seasonal_event_id: event_id) do
      nil -> {:error, :not_joined}
      progress ->
        if quest_id in (progress.quests_completed || []) do
          {:ok, %{quest_id: quest_id, status: :already_completed}}
        else
          new_completed = [quest_id | progress.quests_completed || []]
          new_points = (progress.event_points || 0) + progress_increment
          {:ok, _} = progress
            |> Ecto.Changeset.change(%{
              quests_completed: new_completed,
              event_points: new_points,
              leaderboard_points: (progress.leaderboard_points || 0) + progress_increment
            })
            |> Repo.update()
          {:ok, %{quest_id: quest_id, status: :completed, points_earned: progress_increment}}
        end
    end
  end

  @doc "Get community milestones for an event."
  @spec get_community_milestones(binary() | term()) :: {:ok, map()}
  def get_community_milestones(event_id) when is_binary(event_id) do
    case Repo.get(SeasonalEvent, event_id) do
      nil -> {:ok, %{current_total: 0, milestones: [], next_milestone: nil}}
      event ->
        total_points = from(p in UserEventProgress,
          where: p.seasonal_event_id == ^event_id, select: sum(p.event_points)
        ) |> Repo.one() || 0

        milestones = event.milestone_rewards || []
        next_milestone = Enum.find(milestones, fn m -> m["points_required"] > total_points end)
        {:ok, %{current_total: total_points, milestones: milestones, next_milestone: next_milestone}}
    end
  end

  def get_community_milestones(_opts),
    do: {:ok, %{current_total: 0, milestones: [], next_milestone: nil}}

  # Private helpers

  defp calculate_xp_to_next_tier(current_xp) do
    xp_per_tier = 1000
    tier = div(current_xp, xp_per_tier)
    (tier + 1) * xp_per_tier - current_xp
  end

  defp get_retroactive_premium_rewards(event, current_tier) do
    tiers = event.battle_pass_tiers || []

    0..min(current_tier, length(tiers) - 1)
    |> Enum.flat_map(fn idx ->
      tier_data = Enum.at(tiers, idx) || %{}
      tier_data["premium_rewards"] || []
    end)
  end

  defp get_available_tier_rewards(progress, event) do
    tiers = event.battle_pass_tiers || []
    current_tier = progress.battle_pass_tier || 0
    claimed_free = progress.claimed_free_rewards || []
    claimed_premium = progress.claimed_premium_rewards || []

    0..current_tier
    |> Enum.flat_map(fn idx ->
      tier_data = Enum.at(tiers, idx) || %{}
      free = if idx in claimed_free, do: [], else: tier_data["free_rewards"] || []
      premium = if progress.has_battle_pass and idx not in claimed_premium,
        do: tier_data["premium_rewards"] || [], else: []
      free ++ premium
    end)
  end

  defp do_claim_reward(progress, tier, "free") do
    if tier in (progress.claimed_free_rewards || []) do
      {:error, :already_claimed}
    else
      new_claimed = [tier | progress.claimed_free_rewards || []]
      {:ok, _} = progress |> Ecto.Changeset.change(%{claimed_free_rewards: new_claimed}) |> Repo.update()
      {:ok, %{tier: tier, type: "free", claimed: true}}
    end
  end

  defp do_claim_reward(progress, tier, "premium") when progress.has_battle_pass do
    if tier in (progress.claimed_premium_rewards || []) do
      {:error, :already_claimed}
    else
      new_claimed = [tier | progress.claimed_premium_rewards || []]
      {:ok, _} = progress |> Ecto.Changeset.change(%{claimed_premium_rewards: new_claimed}) |> Repo.update()
      {:ok, %{tier: tier, type: "premium", claimed: true}}
    end
  end

  defp do_claim_reward(_progress, _tier, "premium"), do: {:error, :no_battle_pass}
  defp do_claim_reward(_progress, _tier, _type), do: {:error, :invalid_reward_type}
end
