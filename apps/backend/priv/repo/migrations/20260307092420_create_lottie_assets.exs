defmodule CGraph.Repo.Migrations.CreateLottieAssets do
  use Ecto.Migration

  def change do
    create table(:lottie_assets, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :codepoint, :string, null: false
      add :emoji, :string
      add :name, :string, null: false
      add :category, :string
      add :subcategory, :string
      add :keywords, {:array, :string}, default: []
      add :lottie_url, :string
      add :webp_url, :string
      add :gif_url, :string
      add :file_size, :integer
      add :duration_ms, :integer
      add :asset_type, :string, null: false, default: "emoji"
      add :source, :string, null: false, default: "noto"
      add :is_active, :boolean, default: true

      timestamps(type: :utc_datetime)
    end

    create unique_index(:lottie_assets, [:codepoint, :asset_type])
    create index(:lottie_assets, [:category])
    create index(:lottie_assets, [:asset_type])
    create index(:lottie_assets, [:source])
  end
end
