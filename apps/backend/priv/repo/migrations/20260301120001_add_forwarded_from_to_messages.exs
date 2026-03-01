defmodule CGraph.Repo.Migrations.AddForwardedFromToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :forwarded_from_id, references(:messages, type: :binary_id, on_delete: :nilify_all)
      add :forwarded_from_user_id, references(:users, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:messages, [:forwarded_from_id])
  end
end
