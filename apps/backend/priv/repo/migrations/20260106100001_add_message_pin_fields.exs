defmodule Cgraph.Repo.Migrations.AddMessagePinFields do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :is_pinned, :boolean, default: false
      add :pinned_at, :utc_datetime
      add :pinned_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:messages, [:conversation_id, :is_pinned], where: "is_pinned = true")
    create index(:messages, [:channel_id, :is_pinned], where: "is_pinned = true")
  end
end
