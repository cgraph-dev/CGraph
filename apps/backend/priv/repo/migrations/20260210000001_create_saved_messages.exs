defmodule CGraph.Repo.Migrations.CreateSavedMessages do
  use Ecto.Migration

  def change do
    create table(:saved_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all),
        null: false

      add :message_id, references(:messages, type: :binary_id, on_delete: :delete_all),
        null: false

      add :note, :text
      add :saved_at, :utc_datetime_usec, null: false, default: fragment("now()")

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:saved_messages, [:user_id, :message_id])
    create index(:saved_messages, [:user_id, :saved_at])
  end
end
