defmodule CGraph.Repo.Migrations.AddForumWarnings do
  use Ecto.Migration

  def change do
    create table(:forum_warnings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :reason, :text, null: false
      add :points, :integer, null: false, default: 1
      add :expires_at, :utc_datetime_usec
      add :acknowledged, :boolean, default: false
      add :revoked, :boolean, default: false

      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :issued_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :revoked_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec)
    end

    create index(:forum_warnings, [:forum_id, :user_id])
    create index(:forum_warnings, [:forum_id, :user_id, :revoked])
    create index(:forum_warnings, [:user_id])

    # Add automod_rules column to forums table
    alter table(:forums) do
      add_if_not_exists :automod_rules, :map, default: %{}
    end
  end
end
