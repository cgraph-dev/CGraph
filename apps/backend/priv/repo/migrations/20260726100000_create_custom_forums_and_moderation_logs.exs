defmodule CGraph.Repo.Migrations.CreateCustomForumsAndModerationLogs do
  use Ecto.Migration

  def change do
    # =========================================================================
    # Custom Forums
    # =========================================================================
    create table(:custom_forums, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :owner_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :slug, :string, null: false
      add :description, :string
      add :theme, :map, default: %{}
      add :rules, :text
      add :icon_url, :string
      add :banner_url, :string
      add :is_private, :boolean, default: false, null: false
      add :invite_only, :boolean, default: false, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:custom_forums, [:slug])
    create index(:custom_forums, [:owner_id])

    # =========================================================================
    # Moderation Logs
    # =========================================================================
    create table(:moderation_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :moderator_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :action, :string, null: false
      add :target_type, :string, null: false
      add :target_id, :binary_id, null: false
      add :reason, :text
      add :metadata, :map, default: %{}

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:moderation_logs, [:moderator_id])
    create index(:moderation_logs, [:target_type, :target_id])
    create index(:moderation_logs, [:inserted_at])

    # =========================================================================
    # Extended permission fields on forum_permissions
    # =========================================================================
    alter table(:forum_permissions) do
      add :can_manage_tags, :string, default: "inherit"
      add :can_manage_templates, :string, default: "inherit"
      add :can_manage_scheduled_posts, :string, default: "inherit"
      add :can_view_analytics, :string, default: "inherit"
      add :can_manage_identity, :string, default: "inherit"
    end
  end
end
