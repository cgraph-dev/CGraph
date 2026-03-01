defmodule CGraph.Repo.Migrations.AddRssEnabledToBoards do
  use Ecto.Migration

  def change do
    alter table(:boards) do
      add :rss_enabled, :boolean, default: true, null: false
    end
  end
end
