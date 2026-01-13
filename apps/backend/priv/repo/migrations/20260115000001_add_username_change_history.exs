defmodule CGraph.Repo.Migrations.AddUsernameChangeHistory do
  use Ecto.Migration

  def change do
    create table(:username_changes, primary_key: false) do
      add :id, :uuid, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :old_username, :string, null: false
      add :new_username, :string, null: false
      add :reason, :text
      add :changed_by_admin, :boolean, default: false
      
      timestamps()
    end

    create index(:username_changes, [:user_id])
    create index(:username_changes, [:old_username])
    create index(:username_changes, [:new_username])
    create index(:username_changes, [:inserted_at])

    # Add last username change tracking to users
    alter table(:users) do
      add_if_not_exists :last_username_change_at, :utc_datetime
      add_if_not_exists :username_changes_count, :integer, default: 0
    end
  end
end
