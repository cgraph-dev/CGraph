defmodule CGraph.Repo.Migrations.CreateAuditLogs do
  @moduledoc """
  Creates the audit_logs table for security and compliance auditing.

  This table stores all administrative and security-sensitive actions
  for compliance requirements and debugging purposes.
  """
  use Ecto.Migration

  def change do
    # audit_logs was already created in 20241201000004_create_groups.
    # Add the additional columns needed for the general auditing system.
    alter table(:audit_logs) do
      add_if_not_exists :action, :string, size: 100
      add_if_not_exists :actor_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add_if_not_exists :resource_type, :string, size: 100
      add_if_not_exists :resource_id, :binary_id
      add_if_not_exists :metadata, :map, default: %{}
      add_if_not_exists :ip_address, :string, size: 45
      add_if_not_exists :user_agent, :string, size: 500
    end

    # Indexes for common query patterns (if_not_exists for idempotency)
    create_if_not_exists index(:audit_logs, [:actor_id])
    create_if_not_exists index(:audit_logs, [:action])
    create_if_not_exists index(:audit_logs, [:resource_type, :resource_id])
    create_if_not_exists index(:audit_logs, [:inserted_at])
    create_if_not_exists index(:audit_logs, [:actor_id, :inserted_at])
  end
end
