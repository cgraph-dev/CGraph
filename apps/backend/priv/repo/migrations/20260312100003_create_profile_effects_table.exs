defmodule CGraph.Repo.Migrations.CreateProfileEffectsTable do
  @moduledoc """
  Creates the profile_effects table for the cosmetics unlock engine.

  Profile effects are visual enhancements (particle, aura, trail) with
  JSONB config for flexible rendering, using the unified 7-tier rarity system.
  """
  use Ecto.Migration

  def change do
    create_if_not_exists table(:profile_effects, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :type, :string, size: 30, null: false
      add :config, :map, default: %{}
      add :rarity, :string, size: 20, null: false
      add :preview_url, :string, size: 500
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create_if_not_exists unique_index(:profile_effects, [:slug])
    create_if_not_exists index(:profile_effects, [:rarity])
    create_if_not_exists index(:profile_effects, [:type])
  end
end
