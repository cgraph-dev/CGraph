defmodule Cgraph.Gamification.UserAchievement do
  @moduledoc """
  Schema for tracking user progress on achievements.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_achievements" do
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :achievement, Cgraph.Gamification.Achievement
    
    field :progress, :integer, default: 0
    field :unlocked, :boolean, default: false
    field :unlocked_at, :utc_datetime
    field :notified, :boolean, default: false

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user_achievement, attrs) do
    user_achievement
    |> cast(attrs, [:user_id, :achievement_id, :progress, :unlocked, :unlocked_at, :notified])
    |> validate_required([:user_id, :achievement_id])
    |> validate_number(:progress, greater_than_or_equal_to: 0)
    |> unique_constraint([:user_id, :achievement_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:achievement_id)
  end

  @doc """
  Changeset for incrementing progress.
  """
  def progress_changeset(user_achievement, increment \\ 1) do
    new_progress = (user_achievement.progress || 0) + increment
    
    user_achievement
    |> cast(%{progress: new_progress}, [:progress])
    |> validate_number(:progress, greater_than_or_equal_to: 0)
  end

  @doc """
  Changeset for unlocking an achievement.
  """
  def unlock_changeset(user_achievement) do
    user_achievement
    |> cast(%{unlocked: true, unlocked_at: DateTime.utc_now()}, [:unlocked, :unlocked_at])
  end
end
