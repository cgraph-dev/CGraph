defmodule CGraph.Repo.Migrations.AddThreadIsArchived do
  use Ecto.Migration

  def change do
    alter table(:threads) do
      add :is_archived, :boolean, default: false
    end
  end
end
