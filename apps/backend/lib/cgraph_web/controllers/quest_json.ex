defmodule CGraphWeb.QuestJSON do
  @moduledoc """
  JSON rendering for quest endpoints.
  """

  def index(%{quests: quests}) do
    %{data: Enum.map(quests, &render_quest/1)}
  end

  def show(%{quest: quest, user_quest: user_quest}) do
    %{
      data: %{
        quest: render_quest(quest),
        user_progress: user_quest && render_user_quest(user_quest)
      }
    }
  end

  def user_quests(%{user_quests: user_quests}) do
    %{data: Enum.map(user_quests, &render_user_quest_with_quest/1)}
  end

  def user_quest(%{user_quest: user_quest}) do
    %{data: render_user_quest_with_quest(user_quest)}
  end

  def daily(%{quests: quests}) do
    %{data: Enum.map(quests, &render_quest_with_progress/1)}
  end

  def weekly(%{quests: quests}) do
    %{data: Enum.map(quests, &render_quest_with_progress/1)}
  end

  # Private helpers

  defp render_quest(quest) do
    %{
      id: quest.id,
      slug: quest.slug,
      title: quest.title,
      description: quest.description,
      type: quest.type,
      xp_reward: quest.xp_reward,
      coin_reward: quest.coin_reward,
      objectives: quest.objectives,
      is_active: quest.is_active,
      starts_at: quest.starts_at,
      ends_at: quest.ends_at,
      repeatable: quest.repeatable
    }
  end

  defp render_user_quest(user_quest) do
    %{
      id: user_quest.id,
      progress: user_quest.progress,
      completed: user_quest.completed,
      completed_at: user_quest.completed_at,
      claimed: user_quest.claimed,
      claimed_at: user_quest.claimed_at,
      expires_at: user_quest.expires_at
    }
  end

  defp render_user_quest_with_quest(user_quest) do
    %{
      id: user_quest.id,
      progress: user_quest.progress,
      completed: user_quest.completed,
      completed_at: user_quest.completed_at,
      claimed: user_quest.claimed,
      claimed_at: user_quest.claimed_at,
      expires_at: user_quest.expires_at,
      quest: render_quest(user_quest.quest)
    }
  end

  defp render_quest_with_progress(item) do
    %{
      quest: render_quest(item.quest),
      accepted: item.accepted,
      progress: item.progress,
      completed: item.completed,
      claimed: item.claimed
    }
  end
end
