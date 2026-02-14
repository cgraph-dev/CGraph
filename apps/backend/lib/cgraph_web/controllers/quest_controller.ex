defmodule CGraphWeb.QuestController do
  @moduledoc """
  Controller for quest-related endpoints.
  """
  use CGraphWeb, :controller

  alias CGraph.Gamification
  alias CGraph.Repo

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/quests
  List all available quests.
  """
  def index(conn, params) do
    quest_type = params["type"]
    quests = Gamification.list_available_quests(type: quest_type)

    conn
    |> put_status(:ok)
    |> render(:index, quests: quests)
  end

  @doc """
  GET /api/v1/quests/active
  Get user's active quests with progress.
  """
  def active(conn, params) do
    user = conn.assigns.current_user
    include_completed = params["include_completed"] == "true"

    user_quests = Gamification.list_user_quests(user.id, include_completed: include_completed)

    conn
    |> put_status(:ok)
    |> render(:user_quests, user_quests: user_quests)
  end

  @doc """
  GET /api/v1/quests/:id
  Get a specific quest.
  """
  def show(conn, %{"id" => quest_id}) do
    user = conn.assigns.current_user

    case Repo.get(Gamification.Quest, quest_id) do
      nil ->
        {:error, :not_found}

      quest ->
        # Get user's progress if they've accepted this quest
        user_quest = Repo.get_by(Gamification.UserQuest, user_id: user.id, quest_id: quest_id)

        conn
        |> put_status(:ok)
        |> render(:show, quest: quest, user_quest: user_quest)
    end
  end

  @doc """
  POST /api/v1/quests/:id/accept
  Accept a quest.
  """
  def accept(conn, %{"id" => quest_id}) do
    user = conn.assigns.current_user

    case Gamification.accept_quest(user.id, quest_id) do
      {:ok, user_quest} ->
        user_quest = Repo.preload(user_quest, :quest)

        conn
        |> put_status(:created)
        |> render(:user_quest, user_quest: user_quest)

      {:error, :not_found} ->
        {:error, :not_found}

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> put_view(CGraphWeb.ChangesetJSON)
        |> render(:error, changeset: changeset)
    end
  end

  @doc """
  POST /api/v1/quests/:id/claim
  Claim rewards for a completed quest.
  """
  def claim(conn, %{"id" => user_quest_id}) do
    user = conn.assigns.current_user

    case Gamification.claim_quest_rewards(user.id, user_quest_id) do
      {:ok, rewards} ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          rewards: rewards
        })

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_found", message: "Quest not found"})

      {:error, :not_completed} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "not_completed", message: "Quest is not yet completed"})

      {:error, :already_claimed} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "already_claimed", message: "Rewards have already been claimed"})
    end
  end

  @doc """
  GET /api/v1/quests/daily
  Get today's daily quests.
  """
  def daily(conn, _params) do
    user = conn.assigns.current_user
    daily_quests = Gamification.list_available_quests(type: "daily")
    user_quests = Gamification.list_user_quests(user.id)

    # Map user progress to daily quests
    user_quest_map =
      user_quests
      |> Enum.map(fn uq -> {uq.quest_id, uq} end)
      |> Map.new()

    quests_with_progress = Enum.map(daily_quests, fn quest ->
      user_quest = Map.get(user_quest_map, quest.id)
      %{
        quest: quest,
        accepted: user_quest != nil,
        progress: user_quest && user_quest.progress || %{},
        completed: user_quest && user_quest.completed || false,
        claimed: user_quest && user_quest.claimed || false
      }
    end)

    conn
    |> put_status(:ok)
    |> render(:daily, quests: quests_with_progress)
  end

  @doc """
  GET /api/v1/quests/weekly
  Get this week's weekly quests.
  """
  def weekly(conn, _params) do
    user = conn.assigns.current_user
    weekly_quests = Gamification.list_available_quests(type: "weekly")
    user_quests = Gamification.list_user_quests(user.id)

    user_quest_map =
      user_quests
      |> Enum.map(fn uq -> {uq.quest_id, uq} end)
      |> Map.new()

    quests_with_progress = Enum.map(weekly_quests, fn quest ->
      user_quest = Map.get(user_quest_map, quest.id)
      %{
        quest: quest,
        accepted: user_quest != nil,
        progress: user_quest && user_quest.progress || %{},
        completed: user_quest && user_quest.completed || false,
        claimed: user_quest && user_quest.claimed || false
      }
    end)

    conn
    |> put_status(:ok)
    |> render(:weekly, quests: quests_with_progress)
  end
end
