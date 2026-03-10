defmodule CGraph.Repo.Migrations.CreatePulseTables do
  use Ecto.Migration

  def change do
    create table(:pulse_scores, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :score, :integer, default: 0
      add :tier, :string, default: "newcomer"

      timestamps(type: :utc_datetime)
    end

    create unique_index(:pulse_scores, [:user_id, :forum_id])
    create index(:pulse_scores, [:forum_id, :score], name: :pulse_scores_forum_id_score_desc_index)

    create table(:pulse_transactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :to_user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :from_user_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :content_id, :binary_id
      add :content_type, :string
      add :raw_amount, :integer
      add :weighted_amount, :float
      add :transaction_type, :string

      timestamps(type: :utc_datetime)
    end

    create index(:pulse_transactions, [:to_user_id, :inserted_at])
  end
end
