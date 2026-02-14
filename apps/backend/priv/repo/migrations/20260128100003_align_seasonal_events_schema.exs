defmodule CGraph.Repo.Migrations.AlignSeasonalEventsSchema do
  @moduledoc """
  Adds missing columns to seasonal_events to match the Ecto schema.
  """
  use Ecto.Migration

  def change do
    alter table(:seasonal_events) do
      add_if_not_exists :status, :string, default: "upcoming"
      add_if_not_exists :colors, :map, default: %{}
      add_if_not_exists :theme, :map, default: %{}
      add_if_not_exists :grace_period_ends_at, :utc_datetime
      add_if_not_exists :rewards, {:array, :map}, default: []
      add_if_not_exists :participation_rewards, {:array, :map}, default: []
      add_if_not_exists :event_currency, :string
      add_if_not_exists :multipliers, :map, default: %{}
      add_if_not_exists :quests, {:array, :binary_id}, default: []
      add_if_not_exists :daily_challenges, {:array, :map}, default: []
      add_if_not_exists :battle_pass_cost, :integer, default: 0
      add_if_not_exists :sort_order, :integer, default: 0
    end
  end
end
