defmodule CGraph.Repo.Migrations.CreateEnterpriseTables do
  use Ecto.Migration

  def change do
    # =========================================================================
    # Admin Roles
    # =========================================================================
    create table(:enterprise_admin_roles, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :string
      add :permissions, :map, default: %{}

      timestamps(type: :utc_datetime)
    end

    create unique_index(:enterprise_admin_roles, [:name])

    # =========================================================================
    # Admin Users
    # =========================================================================
    create table(:enterprise_admin_users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false
      add :password_hash, :string
      add :last_login_at, :utc_datetime_usec
      add :mfa_enabled, :boolean, default: false, null: false
      add :mfa_secret, :string
      add :permissions, :map, default: %{}

      add :role_id, references(:enterprise_admin_roles, type: :binary_id, on_delete: :restrict),
        null: false

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:enterprise_admin_users, [:email])
    create unique_index(:enterprise_admin_users, [:user_id])
    create index(:enterprise_admin_users, [:role_id])

    # =========================================================================
    # Audit Entries (enterprise-grade activity logs)
    # =========================================================================
    create table(:enterprise_audit_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :action, :string, null: false
      add :resource_type, :string, null: false
      add :resource_id, :string
      add :changes_before, :map, default: %{}
      add :changes_after, :map, default: %{}
      add :ip_address, :string, size: 45
      add :user_agent, :string

      add :admin_id, references(:enterprise_admin_users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:enterprise_audit_entries, [:admin_id])
    create index(:enterprise_audit_entries, [:action])
    create index(:enterprise_audit_entries, [:resource_type, :resource_id])
    create index(:enterprise_audit_entries, [:inserted_at])

    # =========================================================================
    # Organizations
    # =========================================================================
    execute "CREATE EXTENSION IF NOT EXISTS citext", "SELECT 1"

    create table(:enterprise_organizations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :slug, :citext, null: false
      add :subscription_tier, :string, default: "free", null: false
      add :logo_url, :string
      add :max_members, :integer, default: 50, null: false
      add :deleted_at, :utc_datetime

      add :owner_id, references(:users, type: :binary_id, on_delete: :restrict), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:enterprise_organizations, [:slug])
    create index(:enterprise_organizations, [:owner_id])
    create index(:enterprise_organizations, [:subscription_tier])

    # =========================================================================
    # Organization Settings
    # =========================================================================
    create table(:enterprise_org_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sso_enabled, :boolean, default: false, null: false
      add :allowed_domains, {:array, :string}, default: []
      add :default_role, :string, default: "member"
      add :max_groups, :integer, default: 10
      add :features, :map, default: %{}
      add :branding, :map, default: %{}
      add :data_region, :string, default: "us"

      add :org_id,
          references(:enterprise_organizations, type: :binary_id, on_delete: :delete_all),
          null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:enterprise_org_settings, [:org_id])

    # =========================================================================
    # Organization Memberships (join table)
    # =========================================================================
    create table(:enterprise_org_memberships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :role, :string, default: "member", null: false
      add :joined_at, :utc_datetime_usec

      add :org_id,
          references(:enterprise_organizations, type: :binary_id, on_delete: :delete_all),
          null: false

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:enterprise_org_memberships, [:org_id, :user_id])
    create index(:enterprise_org_memberships, [:user_id])
    create index(:enterprise_org_memberships, [:role])

    # =========================================================================
    # SSO Providers
    # =========================================================================
    create table(:enterprise_sso_providers, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :type, :string, null: false
      add :config, :map, default: %{}, null: false
      add :enabled, :boolean, default: false, null: false

      add :org_id,
          references(:enterprise_organizations, type: :binary_id, on_delete: :delete_all),
          null: false

      timestamps(type: :utc_datetime)
    end

    create index(:enterprise_sso_providers, [:org_id])
    create index(:enterprise_sso_providers, [:type])

    # =========================================================================
    # Add optional org_id FK to existing groups table
    # =========================================================================
    alter table(:groups) do
      add :org_id,
          references(:enterprise_organizations, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:groups, [:org_id])
  end
end
