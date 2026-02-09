defmodule CGraph.Repo.Migrations.AddPronounsToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :pronouns, :string, size: 50
    end
  end
end
