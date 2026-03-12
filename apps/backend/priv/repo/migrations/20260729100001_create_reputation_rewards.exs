defmodule CGraph.Repo.Migrations.CreateReputationRewards do
  use Ecto.Migration

  def change do
    create table(:reputation_rewards, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all),
        null: false

      add :milestone_key, :string, null: false
      add :nodes_granted, :integer, null: false
      add :granted_at, :utc_datetime, null: false
    end

    create unique_index(:reputation_rewards, [:user_id, :milestone_key])
    create index(:reputation_rewards, [:user_id])
  end
end
