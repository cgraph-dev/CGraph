defmodule CGraph.Gamification.SeasonalEvent do
  @moduledoc """
  Schema for seasonal and special events with exclusive rewards.
  
  Features:
  - Time-limited events
  - Exclusive cosmetics and titles
  - Event-specific quests
  - Leaderboards
  - Battle pass integration
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @event_types ~w(seasonal holiday special anniversary collab community)
  @statuses ~w(upcoming active ending ended)

  schema "seasonal_events" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :event_type, :string
    field :status, :string, default: "upcoming"
    
    # Timing
    field :starts_at, :utc_datetime
    field :ends_at, :utc_datetime
    field :grace_period_ends_at, :utc_datetime  # Extra time to claim rewards
    
    # Theme & branding
    field :theme, :map, default: %{}
    field :banner_url, :string
    field :icon_url, :string
    field :colors, :map, default: %{}
    
    # Rewards configuration
    field :rewards, {:array, :map}, default: []
    field :milestone_rewards, {:array, :map}, default: []
    field :participation_rewards, {:array, :map}, default: []
    
    # Event mechanics
    field :event_currency, :string  # Special event-only currency
    field :event_currency_icon, :string
    field :multipliers, :map, default: %{
      "xp" => 1.0,
      "coins" => 1.0,
      "karma" => 1.0
    }
    
    # Quest/challenge configuration
    field :quests, {:array, :binary_id}, default: []
    field :daily_challenges, {:array, :map}, default: []
    
    # Battle pass (if applicable)
    field :has_battle_pass, :boolean, default: false
    field :battle_pass_cost, :integer, default: 0
    field :battle_pass_tiers, {:array, :map}, default: []
    
    # Leaderboard
    field :has_leaderboard, :boolean, default: true
    field :leaderboard_rewards, {:array, :map}, default: []
    
    # Meta
    field :is_active, :boolean, default: true
    field :featured, :boolean, default: false
    field :sort_order, :integer, default: 0

    has_many :user_event_progress, CGraph.Gamification.UserEventProgress

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(event, attrs) do
    event
    |> cast(attrs, [
      :slug, :name, :description, :event_type, :status,
      :starts_at, :ends_at, :grace_period_ends_at,
      :theme, :banner_url, :icon_url, :colors,
      :rewards, :milestone_rewards, :participation_rewards,
      :event_currency, :event_currency_icon, :multipliers,
      :quests, :daily_challenges,
      :has_battle_pass, :battle_pass_cost, :battle_pass_tiers,
      :has_leaderboard, :leaderboard_rewards,
      :is_active, :featured, :sort_order
    ])
    |> validate_required([:slug, :name, :event_type, :starts_at, :ends_at])
    |> validate_inclusion(:event_type, @event_types)
    |> validate_inclusion(:status, @statuses)
    |> validate_dates()
    |> validate_number(:battle_pass_cost, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  defp validate_dates(changeset) do
    starts_at = get_field(changeset, :starts_at)
    ends_at = get_field(changeset, :ends_at)
    grace_period_ends_at = get_field(changeset, :grace_period_ends_at)

    changeset
    |> validate_start_before_end(starts_at, ends_at)
    |> validate_grace_period(ends_at, grace_period_ends_at)
  end

  defp validate_start_before_end(changeset, nil, _), do: changeset
  defp validate_start_before_end(changeset, _, nil), do: changeset
  defp validate_start_before_end(changeset, starts_at, ends_at) do
    if DateTime.compare(starts_at, ends_at) == :lt do
      changeset
    else
      add_error(changeset, :ends_at, "must be after start date")
    end
  end

  defp validate_grace_period(changeset, nil, _), do: changeset
  defp validate_grace_period(changeset, _, nil), do: changeset
  defp validate_grace_period(changeset, ends_at, grace_period_ends_at) do
    if DateTime.compare(ends_at, grace_period_ends_at) == :lt or 
       DateTime.compare(ends_at, grace_period_ends_at) == :eq do
      changeset
    else
      add_error(changeset, :grace_period_ends_at, "must be on or after end date")
    end
  end

  def event_types, do: @event_types
  def statuses, do: @statuses

  @doc """
  Check if event is currently active.
  """
  def is_active?(%__MODULE__{starts_at: starts_at, ends_at: ends_at}) do
    now = DateTime.utc_now()
    DateTime.compare(now, starts_at) in [:gt, :eq] and
    DateTime.compare(now, ends_at) == :lt
  end

  @doc """
  Check if event is in grace period.
  """
  def in_grace_period?(%__MODULE__{ends_at: ends_at, grace_period_ends_at: nil}) do
    DateTime.compare(DateTime.utc_now(), ends_at) == :gt
  end
  def in_grace_period?(%__MODULE__{ends_at: ends_at, grace_period_ends_at: grace_period_ends_at}) do
    now = DateTime.utc_now()
    DateTime.compare(now, ends_at) == :gt and
    DateTime.compare(now, grace_period_ends_at) == :lt
  end
end
