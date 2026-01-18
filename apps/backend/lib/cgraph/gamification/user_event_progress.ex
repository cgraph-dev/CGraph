defmodule CGraph.Gamification.UserEventProgress do
  @moduledoc """
  Schema for tracking user progress in seasonal events.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_event_progress" do
    # Event currency/points
    field :event_points, :integer, default: 0
    field :event_currency_earned, :integer, default: 0
    field :event_currency_spent, :integer, default: 0
    
    # Quest progress
    field :quests_completed, {:array, :binary_id}, default: []
    field :daily_challenges_completed, {:array, :map}, default: []
    
    # Milestones
    field :milestones_claimed, {:array, :string}, default: []
    
    # Battle pass
    field :has_battle_pass, :boolean, default: false
    field :battle_pass_tier, :integer, default: 0
    field :battle_pass_xp, :integer, default: 0
    field :claimed_free_rewards, {:array, :integer}, default: []
    field :claimed_premium_rewards, {:array, :integer}, default: []
    
    # Leaderboard
    field :leaderboard_points, :integer, default: 0
    field :best_rank, :integer
    
    # Participation tracking
    field :first_participated_at, :utc_datetime
    field :last_participated_at, :utc_datetime
    field :total_sessions, :integer, default: 0
    
    # Rewards claimed
    field :rewards_claimed, {:array, :map}, default: []
    
    belongs_to :user, CGraph.Accounts.User
    belongs_to :seasonal_event, CGraph.Gamification.SeasonalEvent

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(progress, attrs) do
    progress
    |> cast(attrs, [
      :user_id, :seasonal_event_id,
      :event_points, :event_currency_earned, :event_currency_spent,
      :quests_completed, :daily_challenges_completed, :milestones_claimed,
      :has_battle_pass, :battle_pass_tier, :battle_pass_xp,
      :claimed_free_rewards, :claimed_premium_rewards,
      :leaderboard_points, :best_rank,
      :first_participated_at, :last_participated_at, :total_sessions,
      :rewards_claimed
    ])
    |> validate_required([:user_id, :seasonal_event_id])
    |> validate_number(:event_points, greater_than_or_equal_to: 0)
    |> validate_number(:event_currency_earned, greater_than_or_equal_to: 0)
    |> validate_number(:event_currency_spent, greater_than_or_equal_to: 0)
    |> validate_number(:battle_pass_tier, greater_than_or_equal_to: 0)
    |> validate_number(:leaderboard_points, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:seasonal_event_id)
    |> unique_constraint([:user_id, :seasonal_event_id])
  end

  def add_points_changeset(progress, points) do
    new_points = (progress.event_points || 0) + points
    new_leaderboard = (progress.leaderboard_points || 0) + points
    
    progress
    |> cast(%{
      event_points: new_points,
      leaderboard_points: new_leaderboard,
      last_participated_at: DateTime.utc_now()
    }, [:event_points, :leaderboard_points, :last_participated_at])
  end

  def add_currency_changeset(progress, amount) do
    new_earned = (progress.event_currency_earned || 0) + amount
    
    progress
    |> cast(%{event_currency_earned: new_earned}, [:event_currency_earned])
  end

  def spend_currency_changeset(progress, amount) do
    new_spent = (progress.event_currency_spent || 0) + amount
    
    progress
    |> cast(%{event_currency_spent: new_spent}, [:event_currency_spent])
    |> validate_has_currency(progress, amount)
  end

  defp validate_has_currency(changeset, progress, amount) do
    available = (progress.event_currency_earned || 0) - (progress.event_currency_spent || 0)
    if available >= amount do
      changeset
    else
      add_error(changeset, :event_currency_spent, "insufficient event currency")
    end
  end

  def purchase_battle_pass_changeset(progress) do
    progress
    |> cast(%{has_battle_pass: true}, [:has_battle_pass])
  end

  def advance_battle_pass_changeset(progress, xp) do
    new_xp = (progress.battle_pass_xp || 0) + xp
    # Assuming 1000 XP per tier
    xp_per_tier = 1000
    new_tier = div(new_xp, xp_per_tier)
    
    progress
    |> cast(%{battle_pass_xp: new_xp, battle_pass_tier: new_tier}, [:battle_pass_xp, :battle_pass_tier])
  end
end
