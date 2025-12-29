defmodule CgraphWeb.API.V1.RoleJSON do
  @moduledoc """
  JSON rendering for role responses.
  """

  def index(%{roles: roles}) do
    %{data: Enum.map(roles, &role_data/1)}
  end

  def show(%{role: role}) do
    %{data: role_data(role)}
  end

  @doc """
  Render role data with permissions.
  Role schema uses permissions bitfield and boolean flags.
  """
  def role_data(role) do
    %{
      id: role.id,
      name: role.name,
      color: role.color,
      position: role.position,
      is_default: role.is_default,
      # Role schema doesn't have is_admin; derive from position or permissions
      is_admin: Map.get(role, :is_admin, role.position == 0),
      permissions: render_permissions(role),
      mentionable: Map.get(role, :is_mentionable, false),
      hoist: Map.get(role, :is_hoisted, false),
      icon: Map.get(role, :icon),
      member_count: Map.get(role, :member_count),
      created_at: role.inserted_at,
      updated_at: role.updated_at
    }
  end

  defp render_permissions(role) do
    # Discord-style permissions bitfield or structured permissions
    %{
      manage_channels: Map.get(role, :can_manage_channels, false),
      manage_roles: Map.get(role, :can_manage_roles, false),
      manage_members: Map.get(role, :can_manage_members, false),
      kick_members: Map.get(role, :can_kick_members, false),
      ban_members: Map.get(role, :can_ban_members, false),
      mute_members: Map.get(role, :can_mute_members, false),
      send_messages: Map.get(role, :can_send_messages, true),
      embed_links: Map.get(role, :can_embed_links, true),
      attach_files: Map.get(role, :can_attach_files, true),
      add_reactions: Map.get(role, :can_add_reactions, true),
      mention_everyone: Map.get(role, :can_mention_everyone, false),
      manage_messages: Map.get(role, :can_manage_messages, false),
      view_audit_log: Map.get(role, :can_view_audit_log, false),
      create_invites: Map.get(role, :can_create_invites, true)
    }
  end
end
