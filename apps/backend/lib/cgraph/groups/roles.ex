defmodule CGraph.Groups.Roles do
  @moduledoc """
  Role and permission operations for groups.

  Handles role CRUD, reordering, and permission calculation/checking.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{Group, Member, Role}
  alias CGraph.Repo

  # ============================================================================
  # Role CRUD
  # ============================================================================

  @doc "List roles for a group ordered by position."
  @spec list_roles(struct()) :: list()
  def list_roles(group) do
    from(r in Role,
      where: r.group_id == ^group.id,
      order_by: [desc: r.position]
    )
    |> Repo.all()
  end

  @doc "Get a specific role by group and role ID."
  @spec get_role(struct(), binary()) :: Role.t() | nil
  def get_role(group, role_id) do
    case from(r in Role,
      where: r.id == ^role_id,
      where: r.group_id == ^group.id
    )
    |> Repo.one() do
      nil -> {:error, :not_found}
      role -> {:ok, role}
    end
  end

  @doc "Create a role in a group."
  @spec create_role(struct(), map()) :: {:ok, Role.t()} | {:error, Ecto.Changeset.t()}
  def create_role(group, attrs) do
    attrs = attrs |> stringify_keys() |> Map.put("group_id", group.id)

    %Role{}
    |> Role.changeset(attrs)
    |> Repo.insert()
  end

  @doc "Update a role."
  @spec update_role(Role.t(), map()) :: {:ok, Role.t()} | {:error, Ecto.Changeset.t()}
  def update_role(role, attrs) do
    role
    |> Role.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete a role. Hard delete intentional: role schema lacks deleted_at; members should be reassigned before calling."
  @spec delete_role(Role.t()) :: {:ok, Role.t()}
  def delete_role(role) do
    Repo.delete!(role)
    {:ok, role}
  end

  @doc "Reorder roles by providing a list of role IDs in desired order."
  @spec reorder_roles(struct(), list()) :: :ok
  def reorder_roles(group, role_ids) do
    role_ids
    |> Enum.with_index()
    |> Enum.each(fn {role_id, index} ->
      from(r in Role,
        where: r.id == ^role_id,
        where: r.group_id == ^group.id
      )
      |> Repo.update_all(set: [position: index])
    end)

    :ok
  end

  # ============================================================================
  # Permission Calculation
  # ============================================================================

  @doc """
  Calculate the effective permissions for a member based on their roles.

  Returns a list of permission strings the member has.
  """
  @spec calculate_permissions(Member.t(), Group.t()) :: list(binary())
  def calculate_permissions(%Member{} = member, %Group{} = group) do
    roles = member.roles || []

    if group.owner_id == member.user_id do
      all_permissions()
    else
      roles
      |> Enum.flat_map(&role_permissions/1)
      |> Enum.uniq()
    end
  end

  @doc "Check if a member has a specific permission via their roles."
  @spec has_permission?(Member.t(), atom()) :: boolean()
  def has_permission?(member, action) do
    Enum.any?(member.roles, fn role ->
      role.is_admin || check_role_permission(role, action)
    end)
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  @permission_fields [
    {:can_send_messages, "send_messages", true},
    {:can_manage_messages, "manage_messages", false},
    {:can_manage_channels, "manage_channels", false},
    {:can_manage_roles, "manage_roles", false},
    {:can_manage_members, "manage_members", false},
    {:can_kick_members, "kick_members", false},
    {:can_ban_members, "ban_members", false},
    {:can_mute_members, "mute_members", false},
    {:can_view_audit_log, "view_audit_log", false},
    {:can_create_invites, "create_invites", true},
    {:can_manage_invites, "manage_invites", false},
    {:can_add_reactions, "add_reactions", true}
  ]

  @role_permissions %{
    view: {:always, true},
    view_members: {:always, true},
    send_messages: {:can_send_messages, true},
    manage_messages: {:can_manage_messages, false},
    manage_channels: {:can_manage_channels, false},
    manage_roles: {:can_manage_roles, false},
    manage_members: {:can_manage_members, false},
    kick_members: {:can_kick_members, false},
    ban_members: {:can_ban_members, false},
    mute_members: {:can_mute_members, false},
    view_audit_log: {:can_view_audit_log, false},
    create_invites: {:can_create_invites, true},
    view_invites: {:can_create_invites, true},
    manage_invites: {:can_manage_invites, false},
    add_reactions: {:can_add_reactions, true}
  }

  defp all_permissions do
    [
      "view", "view_members", "send_messages", "manage_messages",
      "manage_channels", "manage_roles", "manage_members",
      "kick_members", "ban_members", "mute_members", "view_audit_log",
      "create_invites", "manage_invites", "add_reactions", "administrator"
    ]
  end

  defp role_permissions(%{is_admin: true}), do: all_permissions()
  defp role_permissions(role) do
    base_permissions = ["view", "view_members"]

    Enum.reduce(@permission_fields, base_permissions, fn {field, perm, default}, acc ->
      if Map.get(role, field, default), do: [perm | acc], else: acc
    end)
  end

  defp check_role_permission(role, action) do
    case Map.get(@role_permissions, action) do
      {:always, value} -> value
      {field, default} -> Map.get(role, field, default)
      nil -> false
    end
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
