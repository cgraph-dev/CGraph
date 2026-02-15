defmodule CGraph.Repo.Migrations.AddDeactivatedAtToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :deactivated_at, :utc_datetime
    end

    create index(:users, [:deactivated_at], where: "deactivated_at IS NOT NULL")
  end
end
