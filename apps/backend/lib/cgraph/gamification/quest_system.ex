defmodule CGraph.Gamification.QuestSystem do
  @moduledoc """
  Quest listing, acceptance, progress tracking, and reward claiming.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Gamification.{Quest, UserQuest}
  alias CGraph.Repo

  @doc "List available quests, optionally filtered by type."
  def list_available_quests(opts \\ []) do
    quest_type = Keyword.get(opts, :type)
    now = DateTime.utc_now()

    query = from q in Quest,
      where: q.is_active == true,
      order_by: [q.type, q.sort_order]

    query = if quest_type, do: where(query, [q], q.type == ^quest_type), else: query

    query
    |> where([q], is_nil(q.starts_at) or q.starts_at <= ^now)
    |> where([q], is_nil(q.ends_at) or q.ends_at > ^now)
    |> Repo.all()
  end

  @doc "Get a user's active quests with progress."
  def list_user_quests(user_id, opts \\ []) do
    include_completed = Keyword.get(opts, :include_completed, false)

    query = from uq in UserQuest,
      where: uq.user_id == ^user_id,
      join: q in Quest, on: uq.quest_id == q.id,
      preload: [quest: q],
      order_by: [asc: uq.completed, asc: q.sort_order]

    query = if include_completed, do: query, else: where(query, [uq], uq.claimed == false)
    Repo.all(query)
  end

  @doc "Accept a quest for a user."
  def accept_quest(user_id, quest_id) do
    case Repo.get(Quest, quest_id) do
      nil ->
        {:error, :not_found}
      quest ->
        case Repo.get_by(UserQuest, user_id: user_id, quest_id: quest_id) do
          nil ->
            expires_at = calculate_quest_expiry(quest)
            %UserQuest{}
            |> UserQuest.changeset(%{user_id: user_id, quest_id: quest_id, expires_at: expires_at})
            |> Repo.insert()
          existing ->
            {:ok, existing}
        end
    end
  end

  @doc "Update quest progress for a user based on objective type."
  def update_quest_progress(user_id, objective_type, increment \\ 1) do
    user_quests =
      from(uq in UserQuest,
        where: uq.user_id == ^user_id and uq.completed == false,
        join: q in Quest, on: uq.quest_id == q.id,
        preload: [quest: q])
      |> Repo.all()

    for uq <- user_quests do
      objectives = get_in(uq.quest.objectives, ["objectives"]) || []
      matching = Enum.filter(objectives, fn obj ->
        obj["id"] == objective_type or obj["type"] == objective_type
      end)

      for obj <- matching do
        obj_id = obj["id"]
        current = Map.get(uq.progress, obj_id, 0)
        target = obj["target"] || 1
        new_value = min(current + increment, target)
        new_progress = Map.put(uq.progress, obj_id, new_value)

        all_complete = Enum.all?(objectives, fn o ->
          Map.get(new_progress, o["id"], 0) >= (o["target"] || 1)
        end)

        changes = if all_complete do
          %{progress: new_progress, completed: true, completed_at: DateTime.utc_now()}
        else
          %{progress: new_progress}
        end

        uq |> Ecto.Changeset.change(changes) |> Repo.update()
      end
    end

    :ok
  end

  @doc "Claim rewards for a completed quest."
  def claim_quest_rewards(user_id, user_quest_id) do
    user_quest =
      UserQuest
      |> where([uq], uq.id == ^user_quest_id and uq.user_id == ^user_id)
      |> preload(:quest)
      |> Repo.one()

    cond do
      is_nil(user_quest) -> {:error, :not_found}
      not user_quest.completed -> {:error, :not_completed}
      user_quest.claimed -> {:error, :already_claimed}
      true ->
        Repo.transaction(fn ->
          {:ok, _} = user_quest |> UserQuest.claim_changeset() |> Repo.update()
          user = Repo.get!(User, user_id)
          quest = user_quest.quest

          if quest.xp_reward > 0 do
            CGraph.Gamification.award_xp(user, quest.xp_reward, "quest",
              description: "Completed: #{quest.title}", reference_type: "quest", reference_id: quest.id)
          end
          if quest.coin_reward > 0 do
            CGraph.Gamification.award_coins(user, quest.coin_reward, "quest",
              description: "Completed: #{quest.title}", reference_type: "quest", reference_id: quest.id)
          end

          %{xp: quest.xp_reward, coins: quest.coin_reward}
        end)
    end
  end

  # Private helpers

  defp calculate_quest_expiry(quest) do
    now = DateTime.utc_now()
    case quest.type do
      "daily" -> DateTime.add(now, 24 * 60 * 60, :second)
      "weekly" -> DateTime.add(now, 7 * 24 * 60 * 60, :second)
      "monthly" -> DateTime.add(now, 30 * 24 * 60 * 60, :second)
      _ -> quest.ends_at
    end
  end
end
