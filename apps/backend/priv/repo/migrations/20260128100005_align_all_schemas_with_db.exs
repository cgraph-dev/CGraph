defmodule CGraph.Repo.Migrations.AlignAllSchemasWithDb do
  @moduledoc """
  Adds missing columns across multiple tables to align Ecto schemas with the database.
  """
  use Ecto.Migration

  def change do
    # Avatar Borders: schema has colors, animation_speed, animation_intensity, preview_url
    # that the cosmetics_system migration doesn't include
    alter table(:avatar_borders) do
      add_if_not_exists :colors, {:array, :string}, default: []
      add_if_not_exists :animation_speed, :float, default: 1.0
      add_if_not_exists :animation_intensity, :float, default: 1.0
      add_if_not_exists :preview_url, :string
    end

    # User Event Progress: schema uses seasonal_event_id, event_currency_earned, event_currency_spent
    # but migration uses event_id, event_currency, total_earned_currency
    alter table(:user_event_progress) do
      add_if_not_exists :seasonal_event_id, references(:seasonal_events, type: :binary_id, on_delete: :delete_all)
      add_if_not_exists :event_currency_earned, :integer, default: 0
      add_if_not_exists :event_currency_spent, :integer, default: 0
      add_if_not_exists :quests_completed, {:array, :binary_id}, default: []
      add_if_not_exists :daily_challenges_completed, {:array, :map}, default: []
    end

    # Profile Themes: schema has preset field
    alter table(:profile_themes) do
      add_if_not_exists :preset, :string
    end
  end
end
