defmodule Cgraph.Gamification.UserQuest do
  @moduledoc """
  Schema for tracking user progress on quests.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_quests" do
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :quest, Cgraph.Gamification.Quest
    
    field :progress, :map, default: %{}
    field :completed, :boolean, default: false
    field :completed_at, :utc_datetime
    field :claimed, :boolean, default: false
    field :claimed_at, :utc_datetime
    field :expires_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user_quest, attrs) do
    user_quest
    |> cast(attrs, [:user_id, :quest_id, :progress, :completed, :completed_at, :claimed, :claimed_at, :expires_at])
    |> validate_required([:user_id, :quest_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:quest_id)
  end

  @doc """
  Changeset for updating quest progress.
  """
  def progress_changeset(user_quest, objective_id, increment \\ 1) do
    current_progress = user_quest.progress || %{}
    current_value = Map.get(current_progress, objective_id, 0)
    new_progress = Map.put(current_progress, objective_id, current_value + increment)
    
    user_quest
    |> cast(%{progress: new_progress}, [:progress])
  end

  @doc """
  Changeset for marking a quest as completed.
  """
  def complete_changeset(user_quest) do
    user_quest
    |> cast(%{completed: true, completed_at: DateTime.utc_now()}, [:completed, :completed_at])
  end

  @doc """
  Changeset for claiming quest rewards.
  """
  def claim_changeset(user_quest) do
    user_quest
    |> cast(%{claimed: true, claimed_at: DateTime.utc_now()}, [:claimed, :claimed_at])
  end
end
