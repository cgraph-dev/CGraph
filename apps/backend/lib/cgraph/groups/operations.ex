defmodule CGraph.Groups.Operations do
  @moduledoc """
  Orchestrating operations for CGraph Groups.

  Contains operations that span multiple sub-modules (e.g. creating a group
  with default roles, channels, and membership) as well as audit-logging
  and channel-message sending with idempotency support.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{AuditLog, Channels, Group, Members, Roles}
  alias CGraph.Messaging.Message
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Group Creation
  # ---------------------------------------------------------------------------

  @doc """
  Create a new group with default roles, an admin membership, and a general channel.
  """
  @spec create_group(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_group(user, attrs) do
    attrs = stringify_keys(attrs) |> Map.put("owner_id", user.id)

    case %Group{} |> Group.changeset(attrs) |> Repo.insert() do
      {:error, changeset} ->
        {:error, changeset}

      {:ok, group} ->
        Repo.transaction(fn ->
          {:ok, admin_role} = Roles.create_role(group, %{
            "name" => "Admin",
            "color" => "#FF0000",
            "position" => 1,
            "is_admin" => true
          })

          {:ok, _member_role} = Roles.create_role(group, %{
            "name" => "Member",
            "color" => "#808080",
            "position" => 0,
            "is_default" => true
          })

          {:ok, _member} = Members.add_member(group, user, [admin_role.id])

          {:ok, _channel} = Channels.create_channel(group, %{
            "name" => "general",
            "type" => "text"
          })

          {:ok, loaded_group} = CGraph.Groups.get_group(group.id)
          loaded_group
        end)
    end
  end

  # ---------------------------------------------------------------------------
  # Channel Messaging
  # ---------------------------------------------------------------------------

  @doc """
  Send a message to a channel with idempotency support.
  """
  @spec send_channel_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, any()}
  def send_channel_message(channel, user, attrs) do
    message_attrs = attrs
      |> Map.put("user_id", user.id)
      |> Map.put("channel_id", channel.id)

    %Message{}
    |> Message.changeset(message_attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} ->
        {:ok, Repo.preload(message, [[sender: :customization], :reactions])}

      {:error, %Ecto.Changeset{} = changeset} ->
        if idempotency_conflict?(changeset) do
          client_message_id = Ecto.Changeset.get_field(changeset, :client_message_id)

          case get_channel_message_by_client_id(channel.id, client_message_id) do
            nil -> {:error, changeset}
            message -> {:ok, Repo.preload(message, [[sender: :customization], :reactions])}
          end
        else
          {:error, changeset}
        end

      error ->
        error
    end
  end

  # ---------------------------------------------------------------------------
  # Ownership Transfer
  # ---------------------------------------------------------------------------

  @doc """
  Transfer group ownership to another user.
  """
  @spec transfer_ownership(struct(), binary()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def transfer_ownership(group, new_owner_id) do
    group
    |> Ecto.Changeset.change(owner_id: new_owner_id)
    |> Repo.update()
  end

  # ---------------------------------------------------------------------------
  # Audit Log
  # ---------------------------------------------------------------------------

  @doc """
  Log an audit event.
  """
  @spec log_audit_event(struct(), struct(), atom() | binary(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def log_audit_event(group, user, action, data \\ %{}) do
    %AuditLog{}
    |> AuditLog.changeset(%{
      group_id: group.id,
      user_id: user.id,
      action_type: to_string(action),
      changes: data
    })
    |> Repo.insert()
  end

  @doc """
  Get audit log entries with optional action and user filters.
  """
  @spec get_audit_log(struct(), keyword()) :: {list(), map()}
  def get_audit_log(group, opts \\ []) do
    action_filter = Keyword.get(opts, :action)
    user_filter = Keyword.get(opts, :user_id)

    query = from a in AuditLog,
      where: a.group_id == ^group.id,
      preload: [:user]

    query = if action_filter do
      from a in query, where: a.action == ^action_filter
    else
      query
    end

    query = if user_filter do
      from a in query, where: a.user_id == ^user_filter
    else
      query
    end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 50
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Alias for `get_audit_log/2` for controller compatibility.
  """
  @spec list_audit_log(struct(), keyword()) :: {list(), map()}
  def list_audit_log(group, opts \\ []), do: get_audit_log(group, opts)

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  defp idempotency_conflict?(changeset) do
    Enum.any?(changeset.errors, fn {field, {_, _}} ->
      field == :client_message_id
    end)
  end

  defp get_channel_message_by_client_id(channel_id, client_message_id)
       when is_binary(client_message_id) do
    from(m in Message,
      where: m.channel_id == ^channel_id,
      where: m.client_message_id == ^client_message_id,
      preload: [[sender: :customization], reactions: :user]
    )
    |> Repo.one()
  end

  defp get_channel_message_by_client_id(_, _), do: nil
end
