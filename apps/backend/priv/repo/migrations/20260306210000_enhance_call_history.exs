defmodule CGraph.Repo.Migrations.EnhanceCallHistory do
  use Ecto.Migration

  def change do
    alter table(:call_history) do
      add :quality_summary, :map, default: %{}
      add :end_reason, :string
      add :missed_seen, :boolean, default: false
      add :conversation_id, references(:conversations, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:call_history, [:conversation_id])
    create index(:call_history, [:state, :missed_seen])
  end
end
