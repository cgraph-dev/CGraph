defmodule CGraph.Gamification.EventLifecycleWorker do
  @moduledoc """
  Oban worker that manages the lifecycle of seasonal events.

  Runs every 15 minutes via cron to:
  1. Auto-activate events whose `starts_at` has passed.
  2. End events whose `ends_at` has passed.
  3. Distribute rewards when an event ends.
  4. Broadcast `event_ended` via PubSub.
  """

  use Oban.Worker,
    queue: :gamification,
    max_attempts: 3,
    tags: ["gamification", "events", "lifecycle"]

  import Ecto.Query, warn: false

  alias CGraph.Gamification.{SeasonalEvent, UserEventProgress}
  alias CGraph.Repo

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"action" => "check_lifecycle"}}) do
    Logger.info("EventLifecycleWorker: checking event lifecycle")

    activated = activate_pending_events()
    ended = end_expired_events()

    Logger.info("EventLifecycleWorker: activated=#{activated}, ended=#{ended}")
    :ok
  end

  def perform(%Oban.Job{args: _args}) do
    # Default action
    perform(%Oban.Job{args: %{"action" => "check_lifecycle"}})
  end

  # ---------------------------------------------------------------------------
  # Activation: events whose starts_at <= now and are not yet active
  # ---------------------------------------------------------------------------

  defp activate_pending_events do
    now = DateTime.utc_now()

    {count, _} =
      from(e in SeasonalEvent,
        where: e.is_active == false and e.starts_at <= ^now and e.ends_at > ^now
      )
      |> Repo.update_all(set: [is_active: true])

    if count > 0 do
      Logger.info("EventLifecycleWorker: activated #{count} event(s)")

      # Broadcast activation for each newly activated event
      from(e in SeasonalEvent,
        where: e.is_active == true and e.starts_at <= ^now and e.ends_at > ^now,
        select: e.id
      )
      |> Repo.all()
      |> Enum.each(fn event_id ->
        Phoenix.PubSub.broadcast(
          CGraph.PubSub,
          "gamification:events",
          {:event_activated, %{event_id: event_id}}
        )
      end)
    end

    count
  end

  # ---------------------------------------------------------------------------
  # Ending: events whose ends_at <= now and are still active
  # ---------------------------------------------------------------------------

  defp end_expired_events do
    now = DateTime.utc_now()

    expired_events =
      from(e in SeasonalEvent,
        where: e.is_active == true and e.ends_at <= ^now
      )
      |> Repo.all()

    Enum.each(expired_events, fn event ->
      # Mark event as inactive
      event
      |> Ecto.Changeset.change(%{is_active: false})
      |> Repo.update!()

      # Distribute final rewards to participants
      distribute_event_rewards(event)

      # Broadcast event ended
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "gamification:events",
        {:event_ended, %{
          event_id: event.id,
          name: event.name,
          ended_at: now
        }}
      )

      Logger.info("EventLifecycleWorker: ended event",
        event_id: event.id,
        name: event.name
      )
    end)

    length(expired_events)
  end

  # ---------------------------------------------------------------------------
  # Reward Distribution
  # ---------------------------------------------------------------------------

  defp distribute_event_rewards(event) do
    # Get top participants for bonus rewards
    top_participants =
      from(p in UserEventProgress,
        where: p.seasonal_event_id == ^event.id,
        order_by: [desc: p.leaderboard_points],
        limit: 10,
        select: %{
          user_id: p.user_id,
          points: p.leaderboard_points,
          tier: p.battle_pass_tier,
          has_battle_pass: p.has_battle_pass
        }
      )
      |> Repo.all()

    # Award placement bonuses to top 3
    top_participants
    |> Enum.with_index(1)
    |> Enum.each(fn {participant, rank} ->
      bonus = placement_bonus(rank)

      if bonus > 0 do
        Task.start(fn ->
          CGraph.Gamification.award_coins(
            %{id: participant.user_id},
            bonus,
            "event_placement",
            description: "#{ordinal(rank)} place in #{event.name}",
            reference_type: "seasonal_event",
            reference_id: event.id
          )
        end)

        # Notify participant of their placement
        Phoenix.PubSub.broadcast(
          CGraph.PubSub,
          "gamification:#{participant.user_id}",
          {:event_placement, %{
            event_id: event.id,
            event_name: event.name,
            rank: rank,
            bonus_coins: bonus
          }}
        )
      end
    end)
  rescue
    error ->
      Logger.error("EventLifecycleWorker: reward distribution failed",
        event_id: event.id,
        error: inspect(error)
      )
  end

  defp placement_bonus(1), do: 5000
  defp placement_bonus(2), do: 3000
  defp placement_bonus(3), do: 1500
  defp placement_bonus(rank) when rank <= 10, do: 500
  defp placement_bonus(_), do: 0

  defp ordinal(1), do: "1st"
  defp ordinal(2), do: "2nd"
  defp ordinal(3), do: "3rd"
  defp ordinal(n), do: "#{n}th"
end
