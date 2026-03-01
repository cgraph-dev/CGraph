defmodule CGraph.Repo.Migrations.AddForumWarnings do
  use Ecto.Migration

  def change do
    # forum_warnings table already exists from 20251230030000_create_forum_hosting_platform.
    # Add missing columns from Phase 15 warning schema.
    alter table(:forum_warnings) do
      add_if_not_exists :acknowledged, :boolean, default: false
      add_if_not_exists :revoked, :boolean, default: false
      add_if_not_exists :revoked_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
    end

    create_if_not_exists index(:forum_warnings, [:forum_id, :user_id, :revoked])

    # Add automod_rules column to forums table
    alter table(:forums) do
      add_if_not_exists :automod_rules, :map, default: %{}
    end
  end
end
