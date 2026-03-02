defmodule CGraph.Repo.Migrations.AddForwardedFromToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      # Cannot add FK reference to partitioned messages table — use plain column
      add :forwarded_from_id, :binary_id
      add :forwarded_from_user_id, references(:users, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:messages, [:forwarded_from_id])
  end
end
