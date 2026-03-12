defmodule CGraph.Enterprise.AuditEntry do
  @moduledoc """
  Enterprise audit log entry schema.

  Provides enterprise-grade audit logging with before/after change tracking,
  IP address recording, and user agent capture. Distinct from existing
  CGraph.Audit (GenServer), CGraph.Accounts.AuditLog, CGraph.Groups.AuditLog,
  and CGraph.Moderation.AuditLog modules.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder,
           only: [
             :id, :action, :resource_type, :resource_id,
             :changes_before, :changes_after, :ip_address,
             :user_agent, :inserted_at
           ]}

  schema "enterprise_audit_entries" do
    field :action, :string
    field :resource_type, :string
    field :resource_id, :string
    field :changes_before, :map, default: %{}
    field :changes_after, :map, default: %{}
    field :ip_address, :string
    field :user_agent, :string

    belongs_to :admin, CGraph.Enterprise.AdminUser

    timestamps(updated_at: false)
  end

  @doc "Create a new audit entry."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [
      :action, :resource_type, :resource_id, :admin_id,
      :changes_before, :changes_after, :ip_address, :user_agent
    ])
    |> validate_required([:action, :resource_type, :admin_id])
    |> validate_length(:action, max: 100)
    |> validate_length(:resource_type, max: 100)
    |> validate_length(:ip_address, max: 45)
    |> foreign_key_constraint(:admin_id)
  end
end
