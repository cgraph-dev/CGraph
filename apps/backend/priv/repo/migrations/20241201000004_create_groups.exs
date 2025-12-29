defmodule Cgraph.Repo.Migrations.CreateGroups do
  use Ecto.Migration

  def up do
    # Groups
    create table(:groups, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :slug, :string, null: false
      add :description, :text
      add :icon_url, :string
      add :banner_url, :string

      add :is_public, :boolean, default: true
      add :is_discoverable, :boolean, default: true
      add :require_approval, :boolean, default: false

      add :member_count, :integer, default: 1
      add :channel_count, :integer, default: 0
      add :slow_mode_seconds, :integer, default: 0
      add :default_role_id, :binary_id

      add :owner_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :deleted_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:groups, [:slug])
    create index(:groups, [:owner_id])
    create index(:groups, [:deleted_at])
    execute "CREATE INDEX groups_name_trgm_idx ON groups USING gin (name gin_trgm_ops)"

    # Roles
    create table(:roles, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :color, :string, default: "#99AAB5"
      add :position, :integer, default: 0
      add :permissions, :bigint, default: 0
      add :is_default, :boolean, default: false
      add :is_mentionable, :boolean, default: false
      add :is_hoisted, :boolean, default: false

      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:roles, [:group_id, :position])

    # Channel categories
    create table(:channel_categories, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :position, :integer, default: 0
      add :is_collapsed, :boolean, default: false

      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:channel_categories, [:group_id, :position])

    # Channels
    create table(:channels, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :name, :string, null: false
      add :topic, :text
      add :channel_type, :string, default: "text"
      add :position, :integer, default: 0
      add :is_nsfw, :boolean, default: false
      add :slow_mode_seconds, :integer, default: 0
      add :rate_limit_per_user, :integer

      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :category_id, references(:channel_categories, type: :binary_id, on_delete: :nilify_all)
      add :deleted_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:channels, [:group_id, :position])
    create index(:channels, [:category_id])

    # Add channel_id to messages
    alter table(:messages) do
      add :channel_id, references(:channels, type: :binary_id, on_delete: :delete_all)
    end

    create index(:messages, [:channel_id, :inserted_at])

    # Group members
    create table(:group_members, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :nickname, :string
      add :joined_at, :utc_datetime, null: false

      add :is_muted, :boolean, default: false
      add :muted_until, :utc_datetime
      add :mute_reason, :string

      add :is_banned, :boolean, default: false
      add :banned_until, :utc_datetime
      add :ban_reason, :string

      add :notifications, :string, default: "all"
      add :suppress_everyone, :boolean, default: false

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:group_members, [:user_id, :group_id])
    create index(:group_members, [:group_id])

    # Member roles (many-to-many)
    create table(:member_roles, primary_key: false) do
      add :member_id, references(:group_members, type: :binary_id, on_delete: :delete_all), null: false
      add :role_id, references(:roles, type: :binary_id, on_delete: :delete_all), null: false
    end

    create unique_index(:member_roles, [:member_id, :role_id])
    create index(:member_roles, [:role_id])

    # Invites
    create table(:invites, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :code, :string, null: false
      add :max_uses, :integer
      add :uses, :integer, default: 0
      add :expires_at, :utc_datetime
      add :is_temporary, :boolean, default: false
      add :is_revoked, :boolean, default: false

      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :channel_id, references(:channels, type: :binary_id, on_delete: :nilify_all)
      add :created_by_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:invites, [:code])
    create index(:invites, [:group_id])

    # Audit logs
    create table(:audit_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :action_type, :string, null: false
      add :reason, :string
      add :changes, :map

      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :target_user_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:audit_logs, [:group_id, :inserted_at])

    # Permission overwrites (per-channel permission customization)
    create table(:permission_overwrites, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :allow, :bigint, default: 0
      add :deny, :bigint, default: 0
      add :target_type, :string, null: false  # "role" or "member"

      add :channel_id, references(:channels, type: :binary_id, on_delete: :delete_all), null: false
      add :role_id, references(:roles, type: :binary_id, on_delete: :delete_all)
      add :member_id, references(:group_members, type: :binary_id, on_delete: :delete_all)

      timestamps(type: :utc_datetime)
    end

    create index(:permission_overwrites, [:channel_id])

    # Pinned messages
    create table(:pinned_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :channel_id, references(:channels, type: :binary_id, on_delete: :delete_all), null: false
      add :message_id, references(:messages, type: :binary_id, on_delete: :delete_all), null: false
      add :pinned_by_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:pinned_messages, [:channel_id, :message_id])
  end

  def down do
    drop table(:pinned_messages)
    drop table(:permission_overwrites)
    drop table(:audit_logs)
    drop table(:invites)
    drop table(:member_roles)
    drop table(:group_members)
    
    alter table(:messages) do
      remove :channel_id
    end
    
    drop table(:channels)
    drop table(:channel_categories)
    drop table(:roles)
    drop table(:groups)
  end
end
