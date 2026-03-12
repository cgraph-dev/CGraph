defmodule CGraph.Enterprise.AdminConsole.Auditing do
  @moduledoc """
  Enterprise audit logging operations.

  Provides structured audit trail for all enterprise admin actions
  with before/after change tracking and export capability.
  """

  import Ecto.Query, warn: false

  alias CGraph.Enterprise.{AdminUser, AuditEntry}
  alias CGraph.Repo

  require Logger

  @doc "Log an admin action with optional before/after changes."
  @spec log_action(AdminUser.t(), String.t(), String.t(), map()) ::
          {:ok, AuditEntry.t()} | {:error, Ecto.Changeset.t()}
  def log_action(%AdminUser{} = admin, action, resource_type, attrs \\ %{}) do
    audit_attrs =
      Map.merge(attrs, %{
        admin_id: admin.id,
        action: action,
        resource_type: resource_type
      })

    %AuditEntry{}
    |> AuditEntry.changeset(audit_attrs)
    |> Repo.insert()
  end

  @doc "List audit entries with filtering and pagination."
  @spec list_audit_entries(keyword()) :: {list(), map()}
  def list_audit_entries(opts \\ []) do
    action_filter = Keyword.get(opts, :action)
    resource_type_filter = Keyword.get(opts, :resource_type)
    admin_id_filter = Keyword.get(opts, :admin_id)

    query =
      from(e in AuditEntry,
        preload: [:admin],
        order_by: [desc: e.inserted_at]
      )

    query =
      if action_filter do
        from(e in query, where: e.action == ^action_filter)
      else
        query
      end

    query =
      if resource_type_filter do
        from(e in query, where: e.resource_type == ^resource_type_filter)
      else
        query
      end

    query =
      if admin_id_filter do
        from(e in query, where: e.admin_id == ^admin_id_filter)
      else
        query
      end

    pagination_opts =
      CGraph.Pagination.parse_params(
        Enum.into(opts, %{}),
        sort_field: :inserted_at,
        sort_direction: :desc,
        default_limit: 50
      )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Get a single audit entry."
  @spec get_audit_entry(binary()) :: {:ok, AuditEntry.t()} | {:error, :not_found}
  def get_audit_entry(id) do
    case Repo.get(AuditEntry, id) |> Repo.preload(:admin) do
      nil -> {:error, :not_found}
      entry -> {:ok, entry}
    end
  end

  @doc "Export audit entries as a list of maps for CSV/JSON export."
  @spec export_audit_entries(keyword()) :: list(map())
  def export_audit_entries(opts) do
    {entries, _meta} = list_audit_entries(Keyword.put(opts, :limit, 10_000))

    Enum.map(entries, fn entry ->
      %{
        id: entry.id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        admin_email: if(entry.admin, do: entry.admin.email, else: "system"),
        ip_address: entry.ip_address,
        timestamp: entry.inserted_at
      }
    end)
  end
end
