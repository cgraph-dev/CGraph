defmodule CGraph.Repo.Migrations.CreateIdentityCards do
  use Ecto.Migration

  def change do
    create table(:identity_cards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :display_name, :string, null: false
      add :avatar_frame_id, :binary_id
      add :badge_ids, {:array, :binary_id}, default: []
      add :title_id, :binary_id
      add :bio_snippet, :string, size: 140
      add :reputation_score, :integer, default: 0
      add :custom_css, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    create unique_index(:identity_cards, [:user_id])
  end
end
