defmodule CGraph.Repo.Migrations.CreateBadgesTable do
  @moduledoc """
  Creates the badges table for the cosmetics unlock engine.

  Badges represent user accomplishments across categories and tracks,
  using the unified 7-tier rarity system with JSONB unlock conditions.
  """
  use Ecto.Migration

  def change do
    create_if_not_exists table(:badges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :description, :text
      add :icon_url, :string, size: 500
      add :rarity, :string, size: 20, null: false
      add :category, :string, size: 50, null: false
      add :track, :string, size: 50
      add :unlock_type, :string, size: 30, null: false
      add :unlock_condition, :map, default: %{}
      add :nodes_cost, :integer, default: 0, null: false
      add :stackable, :boolean, default: false, null: false
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create_if_not_exists unique_index(:badges, [:slug])
    create_if_not_exists index(:badges, [:rarity, :category])
    create_if_not_exists index(:badges, [:category])
    create_if_not_exists index(:badges, [:rarity])
  end
end
