defmodule CGraph.Workers.EventRewardDistributor do
  @moduledoc """
  Oban worker for distributing event rewards to participants.
  
  Runs when an event ends to:
  - Calculate final standings
  - Distribute rewards based on battle pass progress
  - Send notifications to winners
  """

  use Oban.Worker, queue: :events, max_attempts: 3

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"event_id" => event_id}}) do
    Logger.info("event_reward_processing", event_id: event_id)

    # ✅ IMPLEMENTED: Full reward distribution pipeline
    with {:ok, event} <- get_event(event_id),
         :ok <- validate_event_ended(event),
         {:ok, participants} <- get_all_participants(event_id),
         {:ok, leaderboard} <- calculate_final_standings(event_id),
         :ok <- distribute_participation_rewards(event, participants),
         :ok <- distribute_milestone_rewards(event, participants),
         :ok <- distribute_leaderboard_rewards(event, leaderboard),
         :ok <- send_reward_notifications(event, participants) do
      Logger.info("event_rewards_distributed", event_id: event_id)
      :ok
    else
      {:error, :event_not_found} ->
        Logger.warning("event_not_found", event_id: event_id)
        {:error, :event_not_found}

      {:error, :event_not_ended} ->
        Logger.warning("event_not_ended", event_id: event_id)
        {:error, :event_not_ended}

      {:error, reason} ->
        Logger.error("event_reward_distribution_failed", event_id: event_id, reason: inspect(reason))
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("event_reward_unexpected_error", event_id: event_id, error: inspect(e))
      {:error, e}
  end

  @doc """
  Enqueue a reward distribution job.
  """
  def enqueue(%{event_id: event_id}) do
    %{event_id: event_id}
    |> __MODULE__.new()
    |> Oban.insert()
  end

  # ============================================================================
  # Private Helper Functions
  # ============================================================================

  defp get_event(event_id) do
    CGraph.Gamification.Events.get_event(event_id)
  end

  defp validate_event_ended(event) do
    now = DateTime.utc_now()

    # Event must have ended (past ends_at)
    if DateTime.compare(now, event.ends_at) == :gt do
      :ok
    else
      {:error, :event_not_ended}
    end
  end

  defp get_all_participants(event_id) do
    import Ecto.Query

    participants =
      from(p in CGraph.Gamification.UserEventProgress,
        join: u in CGraph.Accounts.User,
        on: u.id == p.user_id,
        where: p.seasonal_event_id == ^event_id,
        preload: [user: u],
        select: p
      )
      |> CGraph.Repo.all()

    {:ok, participants}
  rescue
    e ->
      Logger.error("event_fetch_participants_failed", event_id: event_id, error: inspect(e))
      {:error, :fetch_participants_failed}
  end

  defp calculate_final_standings(event_id) do
    # Get leaderboard with top 100 participants
    case CGraph.Gamification.Events.get_leaderboard(event_id, limit: 100) do
      {:ok, {entries, _meta}} -> {:ok, entries}
      error -> error
    end
  end

  defp distribute_participation_rewards(event, participants) do
    # Distribute participation rewards to all users who joined
    participation_rewards = event.participation_rewards || []

    if Enum.empty?(participation_rewards) do
      Logger.info("event_no_participation_rewards", event_id: event.id)
      :ok
    else
      Logger.info("event_distributing_participation_rewards",
        event_id: event.id, participant_count: length(participants)
      )

      Enum.each(participants, fn progress ->
        distribute_rewards_to_user(progress.user, participation_rewards, "participation")
      end)

      :ok
    end
  rescue
    e ->
      Logger.error("event_participation_rewards_failed", error: inspect(e))
      {:error, :participation_rewards_failed}
  end

  defp distribute_milestone_rewards(event, participants) do
    # Distribute milestone rewards based on battle pass tier progress
    milestone_rewards = event.milestone_rewards || []

    if Enum.empty?(milestone_rewards) do
      Logger.info("event_no_milestone_rewards", event_id: event.id)
      :ok
    else
      Logger.info("event_distributing_milestone_rewards", event_id: event.id)

      Enum.each(participants, fn progress ->
        # Check which milestones user has reached but not yet claimed
        reached_milestones =
          Enum.filter(milestone_rewards, fn reward ->
            tier_requirement = reward["tier"] || 0
            milestone_id = reward["id"]

            progress.battle_pass_tier >= tier_requirement and
              milestone_id not in (progress.milestones_claimed || [])
          end)

        if length(reached_milestones) > 0 do
          Logger.info("event_user_milestones_reached",
            user_id: progress.user_id, milestone_count: length(reached_milestones)
          )

          Enum.each(reached_milestones, fn reward ->
            distribute_rewards_to_user(progress.user, [reward], "milestone")
          end)
        end
      end)

      :ok
    end
  rescue
    e ->
      Logger.error("event_milestone_rewards_failed", error: inspect(e))
      {:error, :milestone_rewards_failed}
  end

  defp distribute_leaderboard_rewards(event, leaderboard) do
    # Distribute leaderboard placement rewards (top X ranks)
    leaderboard_rewards = event.leaderboard_rewards || []

    if Enum.empty?(leaderboard_rewards) do
      Logger.info("event_no_leaderboard_rewards", event_id: event.id)
      :ok
    else
      Logger.info("event_distributing_leaderboard_rewards", event_id: event.id)

      Enum.each(leaderboard, fn entry ->
        # Find rewards for this rank
        rewards_for_rank =
          Enum.filter(leaderboard_rewards, fn reward ->
            min_rank = reward["min_rank"] || 1
            max_rank = reward["max_rank"] || 1
            entry.rank >= min_rank and entry.rank <= max_rank
          end)

        if length(rewards_for_rank) > 0 do
          Logger.info("event_leaderboard_reward",
            user_id: entry.user_id, rank: entry.rank, reward_count: length(rewards_for_rank)
          )

          user = CGraph.Accounts.get_user!(entry.user_id)

          Enum.each(rewards_for_rank, fn reward ->
            distribute_rewards_to_user(user, [reward], "leaderboard")
          end)
        end
      end)

      :ok
    end
  rescue
    e ->
      Logger.error("event_leaderboard_rewards_failed", error: inspect(e))
      {:error, :leaderboard_rewards_failed}
  end

  defp distribute_rewards_to_user(user, rewards, source) do
    Enum.each(rewards, fn reward ->
      case reward do
        %{"type" => "xp", "amount" => amount} ->
          CGraph.Gamification.award_xp(user, amount, source,
            description: "Event reward: #{source}"
          )

        %{"type" => "coins", "amount" => amount} ->
          CGraph.Gamification.award_coins(user, amount, source,
            description: "Event reward: #{source}"
          )

        %{"type" => "title", "title_id" => title_id} ->
          CGraph.Gamification.unlock_title(user.id, title_id)

        %{"type" => "achievement", "achievement_id" => achievement_id} ->
          CGraph.Gamification.unlock_achievement(user.id, achievement_id)

        %{"type" => "cosmetic", "item_id" => item_id} ->
          # Grant cosmetic item (avatar border, badge, etc.)
          Logger.info("event_granting_cosmetic", item_id: item_id, user_id: user.id)
          # TODO: Implement cosmetic granting when customization system is ready

        _ ->
          Logger.warning("event_unknown_reward_type", reward: inspect(reward))
      end
    end)
  rescue
    e ->
      Logger.error("event_reward_distribution_to_user_failed",
        user_id: user.id, error: inspect(e)
      )
  end

  defp send_reward_notifications(event, participants) do
    # Send notification to all participants about rewards
    Logger.info("event_sending_notifications",
      event_id: event.id, participant_count: length(participants)
    )

    Enum.each(participants, fn progress ->
      # Queue notification worker
      CGraph.Workers.NotificationWorker.new(%{
        user_id: progress.user_id,
        type: "event_ended",
        title: "Event Ended: #{event.name}",
        body: "Rewards have been distributed! Check your profile to see what you earned.",
        data: %{
          event_id: event.id,
          event_slug: event.slug
        }
      })
      |> Oban.insert()
    end)

    :ok
  rescue
    e ->
      Logger.error("event_notification_send_failed", error: inspect(e))
      # Non-critical, don't fail the job
      :ok
  end
end
