defmodule CGraph.Repo.Migrations.CreateAutomodRules do
  use Ecto.Migration

  def change do
    create table(:automod_rules, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :rule_type, :string, null: false
      add :pattern, :string, null: false
      add :action, :string, null: false
      add :is_enabled, :boolean, default: true
      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false

      timestamps()
    end

    create index(:automod_rules, [:group_id])
    create index(:automod_rules, [:group_id, :is_enabled])
  end
end
