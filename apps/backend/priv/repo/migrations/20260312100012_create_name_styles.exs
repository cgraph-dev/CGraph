defmodule CGraph.Repo.Migrations.CreateNameStyles do
  use Ecto.Migration

  def change do
    create table(:name_styles, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :name, :string, null: false
      add :font_family, :string, null: false
      add :color_scheme, :map, default: %{}
      add :animation, :string
      add :rarity, :string, null: false
      add :previewable, :boolean, default: true
      add :sort_order, :integer, default: 0
      add :is_active, :boolean, default: true

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:name_styles, [:slug])
    create index(:name_styles, [:rarity])
    create index(:name_styles, [:is_active])
  end
end
