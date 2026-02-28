defmodule CGraph.Repo.Migrations.AddStatusExpiresAtToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :status_expires_at, :utc_datetime
    end

    create index(:users, [:status_expires_at],
      where: "status_expires_at IS NOT NULL",
      comment: "Partial index for efficient expired-status cleanup queries"
    )
  end
end
