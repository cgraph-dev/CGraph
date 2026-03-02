defmodule CGraph.Gamification.QuestRotationWorker do
  @moduledoc """
  Oban cron worker that generates fresh daily and weekly quests from templates.

  ## Schedule

  - **Daily quests**: Generated at 00:00 UTC every day (3 quests)
  - **Weekly quests**: Generated at 00:00 UTC every Monday (3 quests)

  ## Process

  1. Expire old quests of the given type (set `is_active = false`, `ends_at = now`)
  2. Generate new quests from the template pool via `QuestTemplates`
  3. Broadcast availability to connected clients via PubSub

  ## Configuration

  Registered in Oban cron config (config.exs) with:
  - `{"0 0 * * *", QuestRotationWorker, args: %{type: "daily"}}`
  - `{"0 0 * * 1", QuestRotationWorker, args: %{type: "weekly"}}`
  """

  use Oban.Worker, queue: :gamification, max_attempts: 3

  alias CGraph.Gamification.{Quest, QuestTemplates}
  alias CGraph.Repo

  import Ecto.Query, warn: false

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"type" => "daily"}}) do
    Logger.info("QuestRotationWorker: generating daily quests")
    expire_old_quests("daily")
    templates = QuestTemplates.pick_daily(3)
    generate_quests("daily", templates)
    broadcast_new_quests("daily")
    :ok
  end

  def perform(%Oban.Job{args: %{"type" => "weekly"}}) do
    Logger.info("QuestRotationWorker: generating weekly quests")
    expire_old_quests("weekly")
    templates = QuestTemplates.pick_weekly(3)
    generate_quests("weekly", templates)
    broadcast_new_quests("weekly")
    :ok
  end

  def perform(%Oban.Job{args: %{"type" => "monthly"}}) do
    Logger.info("QuestRotationWorker: generating monthly quests")
    expire_old_quests("monthly")
    templates = QuestTemplates.pick_monthly(2)
    generate_quests("monthly", templates)
    broadcast_new_quests("monthly")
    :ok
  end

  def perform(%Oban.Job{args: args}) do
    Logger.warning("QuestRotationWorker: unknown type", args: inspect(args))
    {:error, :unknown_quest_type}
  end

  # ── Private Helpers ───────────────────────────────────────────────────

  @doc false
  defp expire_old_quests(quest_type) do
    now = DateTime.utc_now()

    {count, _} =
      from(q in Quest,
        where: q.type == ^quest_type and q.is_active == true and q.repeatable == false,
        where: not is_nil(q.starts_at)
      )
      |> Repo.update_all(set: [is_active: false, ends_at: now, updated_at: now])

    Logger.info("QuestRotationWorker: expired #{count} old #{quest_type} quests")
  end

  defp generate_quests(quest_type, templates) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    ends_at =
      case quest_type do
        "daily" -> DateTime.add(now, 24 * 60 * 60, :second)
        "weekly" -> DateTime.add(now, 7 * 24 * 60 * 60, :second)
        "monthly" -> DateTime.add(now, 30 * 24 * 60 * 60, :second)
        _ -> DateTime.add(now, 24 * 60 * 60, :second)
      end

    quests =
      Enum.map(templates, fn template ->
        %{
          slug: template.slug,
          title: template.title,
          description: template.description,
          type: quest_type,
          xp_reward: template.xp_reward,
          coin_reward: template.coin_reward,
          objectives: %{
            "objectives" => [
              %{
                "id" => template.objective_type,
                "description" => template.title,
                "type" => template.objective_type,
                "target" => template.target
              }
            ]
          },
          is_active: true,
          repeatable: false,
          starts_at: now,
          ends_at: ends_at,
          sort_order: 0,
          inserted_at: now,
          updated_at: now
        }
      end)

    # Use insert_all with on_conflict to avoid duplicate slug issues
    Repo.insert_all(Quest, quests,
      on_conflict: {:replace, [:title, :description, :xp_reward, :coin_reward, :objectives, :is_active, :starts_at, :ends_at, :updated_at]},
      conflict_target: :slug
    )

    Logger.info("QuestRotationWorker: generated #{length(quests)} #{quest_type} quests")
  end

  defp broadcast_new_quests(quest_type) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "gamification:lobby",
      {:new_quests_available, %{type: quest_type, timestamp: DateTime.utc_now()}}
    )
  rescue
    error ->
      Logger.warning("QuestRotationWorker: broadcast failed", error: inspect(error))
  end
end
