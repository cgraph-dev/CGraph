defmodule CGraph.Accounts.AuditLog do
  @moduledoc """
  Audit logging for administrative and security-sensitive actions.

  Provides a centralized way to log actions for:
  - Security auditing
  - Compliance requirements
  - Debugging and troubleshooting

  All audit logs are persisted to the database and also output to Logger
  for real-time monitoring.

  ## Schema

  - `action` - The action performed (e.g., :user_created, :login_success)
  - `actor_id` - User who performed the action (nil for system actions)
  - `resource_type` - Type of resource affected (e.g., "user", "conversation")
  - `resource_id` - ID of the affected resource
  - `metadata` - Additional context as a map
  - `ip_address` - Client IP address
  - `user_agent` - Client user agent string

  ## Examples

      AuditLog.log(:user_created, admin_id, %{user_id: new_user.id})
      AuditLog.log(:login_success, user_id, %{ip_address: "1.2.3.4"})
      AuditLog.log(:permission_changed, admin_id, %{
        user_id: user.id,
        old_role: "user",
        new_role: "admin"
      })
  """

  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Repo

  require Logger

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "audit_logs" do
    field :action, :string
    field :actor_id, :binary_id
    field :resource_type, :string
    field :resource_id, :binary_id
    field :metadata, :map, default: %{}
    field :ip_address, :string
    field :user_agent, :string

    timestamps(updated_at: false)
  end

  @doc """
  Creates a changeset for an audit log entry.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(audit_log, attrs) do
    audit_log
    |> cast(attrs, [:action, :actor_id, :resource_type, :resource_id, :metadata, :ip_address, :user_agent])
    |> validate_required([:action])
    |> validate_length(:action, max: 100)
    |> validate_length(:resource_type, max: 100)
    |> validate_length(:ip_address, max: 45)  # IPv6 max length
    |> validate_length(:user_agent, max: 500)
  end

  @doc """
  Log an action for audit purposes.

  Persists to database and outputs to Logger for monitoring.

  ## Parameters
  - action: Atom or string representing the action (e.g., :user_created)
  - actor_id: ID of the user performing the action (can be nil for system actions)
  - metadata: Map of additional context about the action

  ## Returns
  - `{:ok, %AuditLog{}}` on success
  - `{:error, changeset}` on validation failure

  ## Examples

      iex> AuditLog.log(:user_created, admin_id, %{user_id: new_user.id})
      {:ok, %AuditLog{action: "user_created", ...}}

      iex> AuditLog.log(:login_success, user_id, ip_address: "1.2.3.4")
      {:ok, %AuditLog{action: "login_success", ...}}
  """
  @doc "Records an account audit log entry."
  @spec log(atom() | String.t(), String.t() | nil, map() | keyword()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def log(action, actor_id, metadata \\ %{}) when is_atom(action) or is_binary(action) do
    log_entry_attrs = %{
      action: to_string(action),
      actor_id: actor_id,
      resource_type: get_in_metadata(metadata, :resource_type),
      resource_id: get_in_metadata(metadata, :resource_id),
      metadata: sanitize_metadata(metadata),
      ip_address: get_in_metadata(metadata, :ip_address),
      user_agent: get_in_metadata(metadata, :user_agent)
    }

    # Always log to Logger for real-time monitoring
    Logger.info("audit_log_entry", action: action, actor_id: actor_id || "system", metadata: inspect(sanitize_for_log(metadata)))

    # Persist to database
    case Repo.insert(changeset(%__MODULE__{}, log_entry_attrs)) do
      {:ok, log_entry} ->
        {:ok, log_entry}

      {:error, changeset} ->
        Logger.error("auditlog_failed_to_persist_audit_log", changeset_errors: inspect(changeset.errors))
        # Return error but don't crash - audit logging shouldn't break the main flow
        {:error, changeset}
    end
  rescue
    # Handle case where audit_logs table doesn't exist yet
    error in Ecto.QueryError ->
      Logger.warning("auditlog_database_table_not_available", error: inspect(error))
      {:ok, %{action: to_string(action), actor_id: actor_id, metadata: metadata}}

    error in DBConnection.ConnectionError ->
      Logger.warning("auditlog_database_connection_error", error: inspect(error))
      {:ok, %{action: to_string(action), actor_id: actor_id, metadata: metadata}}
  end

  @doc """
  Query audit logs with filtering and pagination.

  ## Options
  - `:actor_id` - Filter by actor
  - `:action` - Filter by action type
  - `:resource_type` - Filter by resource type
  - `:from` - Start datetime
  - `:to` - End datetime
  - `:limit` - Max results (default 100)
  - `:offset` - Pagination offset (default 0)

  ## Examples

      AuditLog.list(actor_id: user_id, limit: 50)
      AuditLog.list(action: "login_success", from: ~U[2026-01-01 00:00:00Z])
  """
  @doc "Lists audit log entries."
  @spec list(keyword()) :: {:ok, [struct()], map()}
  def list(opts \\ []) do
    query =
      from(a in __MODULE__)
      |> maybe_filter_by(:actor_id, Keyword.get(opts, :actor_id))
      |> maybe_filter_by(:action, Keyword.get(opts, :action))
      |> maybe_filter_by(:resource_type, Keyword.get(opts, :resource_type))
      |> maybe_filter_from(Keyword.get(opts, :from))
      |> maybe_filter_to(Keyword.get(opts, :to))

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 100
    )

    {results, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    {:ok, results, page_info}
  rescue
    _ -> {:ok, [], %{}}
  end

  @doc """
  Get audit logs for a specific actor.
  """
  @spec get_by_actor(String.t(), keyword()) :: {:ok, [struct()], map()}
  def get_by_actor(actor_id, opts \\ []) do
    opts
    |> Keyword.put(:actor_id, actor_id)
    |> list()
  end

  @doc """
  Get audit logs for a specific action type.
  """
  @spec get_by_action(atom() | String.t(), keyword()) :: {:ok, [struct()], map()}
  def get_by_action(action, opts \\ []) do
    opts
    |> Keyword.put(:action, to_string(action))
    |> list()
  end

  # Private helpers

  defp get_in_metadata(metadata, key) when is_map(metadata) do
    Map.get(metadata, key) || Map.get(metadata, to_string(key))
  end
  defp get_in_metadata(metadata, key) when is_list(metadata) do
    Keyword.get(metadata, key)
  end
  defp get_in_metadata(_, _), do: nil

  defp sanitize_metadata(metadata) when is_map(metadata) do
    metadata
    |> Map.drop([:ip_address, :user_agent, :resource_type, :resource_id])
    |> sanitize_for_log()
  end
  defp sanitize_metadata(metadata) when is_list(metadata) do
    metadata
    |> Keyword.drop([:ip_address, :user_agent, :resource_type, :resource_id])
    |> Map.new()
    |> sanitize_for_log()
  end
  defp sanitize_metadata(_), do: %{}

  defp sanitize_for_log(data) when is_map(data) do
    data
    |> Map.drop([:password, :token, :secret, :api_key])
    |> Enum.map(fn
      {k, v} when is_binary(v) and byte_size(v) > 500 ->
        {k, String.slice(v, 0, 500) <> "...[truncated]"}
      pair -> pair
    end)
    |> Map.new()
  end
  defp sanitize_for_log(data) when is_list(data) do
    data
    |> Map.new()
    |> sanitize_for_log()
  end
  defp sanitize_for_log(data), do: data

  defp maybe_filter_by(query, _field, nil), do: query
  defp maybe_filter_by(query, :actor_id, value) do
    from(a in query, where: a.actor_id == ^value)
  end
  defp maybe_filter_by(query, :action, value) do
    from(a in query, where: a.action == ^value)
  end
  defp maybe_filter_by(query, :resource_type, value) do
    from(a in query, where: a.resource_type == ^value)
  end

  defp maybe_filter_from(query, nil), do: query
  defp maybe_filter_from(query, datetime) do
    from(a in query, where: a.inserted_at >= ^datetime)
  end

  defp maybe_filter_to(query, nil), do: query
  defp maybe_filter_to(query, datetime) do
    from(a in query, where: a.inserted_at <= ^datetime)
  end
end
