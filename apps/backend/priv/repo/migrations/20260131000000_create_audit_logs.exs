defmodule CGraph.Repo.Migrations.CreateAuditLogs do
  @moduledoc """
  Creates the audit_logs table for security and compliance auditing.

  This table stores all administrative and security-sensitive actions
  for compliance requirements and debugging purposes.
  """
  use Ecto.Migration

  def change do
    create table(:audit_logs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :action, :string, null: false, size: 100
      add :actor_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :resource_type, :string, size: 100
      add :resource_id, :binary_id
      add :metadata, :map, default: %{}
      add :ip_address, :string, size: 45  # IPv6 max length
      add :user_agent, :string, size: 500

      timestamps(updated_at: false)
    end

    # Indexes for common query patterns
    create index(:audit_logs, [:actor_id])
    create index(:audit_logs, [:action])
    create index(:audit_logs, [:resource_type, :resource_id])
    create index(:audit_logs, [:inserted_at])

    # Composite index for actor + time range queries
    create index(:audit_logs, [:actor_id, :inserted_at])
  end
end
