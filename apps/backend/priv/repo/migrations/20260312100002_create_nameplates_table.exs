defmodule CGraph.Repo.Migrations.CreateNameplatesTable do
  @moduledoc """
  Creates the nameplates table for the cosmetics unlock engine.

  Nameplates provide profile background/text customization with optional
  animation, using the unified 7-tier rarity system.
  """
  use Ecto.Migration

  def change do
    create_if_not_exists table(:nameplates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, size: 100, null: false
      add :name, :string, size: 200, null: false
      add :background_url, :string, size: 500
      add :text_color, :string, size: 20
      add :border_style, :string, size: 50
      add :rarity, :string, size: 20, null: false
      add :unlock_type, :string, size: 30, null: false
      add :unlock_condition, :map, default: %{}
      add :animated, :boolean, default: false, null: false
      add :sort_order, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create_if_not_exists unique_index(:nameplates, [:slug])
    create_if_not_exists index(:nameplates, [:rarity])
  end
end
