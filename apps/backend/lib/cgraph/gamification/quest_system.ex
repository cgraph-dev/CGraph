defmodule CGraph.Gamification.QuestSystem do
  @moduledoc """
  Quest listing, acceptance, progress tracking, and reward claiming.
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Gamification.{Quest, UserQuest}
  alias CGraph.Repo

  require Logger

  # Maps XP pipeline action atoms to quest objective type strings.
  # A single XP action can progress multiple quest objective types.
  @action_to_objective_types %{
    message: ["message_sent"],
    forum_thread_created: ["forum_thread"],
    forum_post_created: ["forum_post"],
    forum_upvote_received: ["forum_upvote_received"],
    friend_added: ["friend_added"],
    group_joined: ["group_message_sent"],
    voice_minute: ["voice_joined"],
    reaction_sent: ["reaction_added"],
    profile_updated: [],
    daily_login: ["login_streak"]
  }

  @doc "List available quests, optionally filtered by type."
  @spec list_available_quests(keyword()) :: [Quest.t()]
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
  @spec list_user_quests(String.t(), keyword()) :: [UserQuest.t()]
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
  @spec accept_quest(String.t(), String.t()) :: {:ok, UserQuest.t()} | {:error, :not_found}
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
  @spec update_quest_progress(String.t(), atom() | String.t(), non_neg_integer()) :: :ok
  def update_quest_progress(user_id, objective_type, increment \\ 1) do
    # Normalize objective types: XP action atoms → quest objective strings
    objective_strings = resolve_objective_types(objective_type)

    user_quests =
      from(uq in UserQuest,
        where: uq.user_id == ^user_id and uq.completed == false,
        join: q in Quest, on: uq.quest_id == q.id,
        preload: [quest: q])
      |> Repo.all()

    for uq <- user_quests do
      objectives = get_in(uq.quest.objectives, ["objectives"]) || []
      matching = Enum.filter(objectives, fn obj ->
        obj["id"] in objective_strings or obj["type"] in objective_strings
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

        {:ok, updated} = uq |> Ecto.Changeset.change(changes) |> Repo.update()

        # Broadcast quest completion for notification
        if all_complete and not uq.completed do
          broadcast_quest_completed(user_id, updated)
        end
      end
    end

    :ok
  end

  @doc "Claim rewards for a completed quest."
  @spec claim_quest_rewards(String.t(), String.t()) :: {:ok, map()} | {:error, atom()}
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
          # get! safe: user_id from authenticated session inside transaction
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

          # Trigger quest-related achievement checks
          Task.start(fn ->
            CGraph.Gamification.AchievementTriggers.check_all(user_id, :quest_completed)
          end)

          # Broadcast quest claimed event
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "gamification:#{user_id}",
            {:quest_claimed, %{quest_id: quest.id, xp: quest.xp_reward, coins: quest.coin_reward}}
          )

          %{xp: quest.xp_reward, coins: quest.coin_reward}
        end)
    end
  end

  # Private helpers

  # Resolves an XP action type atom/string to the quest objective type strings it maps to.
  defp resolve_objective_types(objective_type) when is_atom(objective_type) do
    case Map.get(@action_to_objective_types, objective_type) do
      nil ->
        # Fall back to stringified atom
        [Atom.to_string(objective_type)]

      types ->
        # Include direct string conversion as fallback
        types ++ [Atom.to_string(objective_type)]
    end
    |> Enum.uniq()
  end

  defp resolve_objective_types(objective_type) when is_binary(objective_type) do
    [objective_type]
  end

  defp broadcast_quest_completed(user_id, user_quest) do
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "gamification:#{user_id}",
      {:quest_completed, %{
        user_quest_id: user_quest.id,
        quest_id: user_quest.quest_id,
        quest_title: user_quest.quest.title,
        xp_reward: user_quest.quest.xp_reward,
        coin_reward: user_quest.quest.coin_reward
      }}
    )
  rescue
    error ->
      Logger.warning("QuestSystem: broadcast failed", error: inspect(error))
  end

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
