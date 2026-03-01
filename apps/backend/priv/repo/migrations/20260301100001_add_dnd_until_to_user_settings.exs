defmodule CGraph.Repo.Migrations.AddDndUntilToUserSettings do
  use Ecto.Migration

  def change do
    alter table(:user_settings) do
      add :dnd_until, :utc_datetime, null: true
    end
  end
end
