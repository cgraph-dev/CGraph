defmodule CgraphWeb.API.V1.GroupJSON do
  @moduledoc """
  JSON rendering for group responses.
  
  ## Visibility Mapping
  
  The API returns a `visibility` field derived from `is_public` and `is_discoverable`:
  
  | is_public | is_discoverable | visibility  |
  |-----------|-----------------|-------------|
  | true      | true            | "public"    |
  | true      | false           | "unlisted"  |
  | false     | false           | "private"   |
  """
  alias Cgraph.Groups.{Group, Channel, Member, Role, AuditLog}
  alias Cgraph.Accounts.User

  def index(%{groups: groups, meta: meta}) do
    %{
      data: Enum.map(groups, &group_summary/1),
      meta: meta
    }
  end

  def show(%{group: group, current_user: current_user}) do
    %{data: group_data(group, current_user)}
  end

  def audit_log(%{entries: entries, meta: meta}) do
    %{
      data: Enum.map(entries, &audit_entry/1),
      meta: meta
    }
  end

  # Helper to derive visibility from is_public/is_discoverable
  defp group_visibility(%Group{is_public: true, is_discoverable: true}), do: "public"
  defp group_visibility(%Group{is_public: true, is_discoverable: false}), do: "unlisted"
  defp group_visibility(%Group{is_public: true}), do: "public"
  defp group_visibility(%Group{is_public: false}), do: "private"
  defp group_visibility(_), do: "private"

  defp group_summary(%Group{} = group) do
    %{
      id: group.id,
      name: group.name,
      description: group.description,
      icon_url: group.icon_url,
      member_count: group.member_count || 0,
      visibility: group_visibility(group),
      created_at: group.inserted_at
    }
  end

  @doc """
  Full group data for a single group without user context.
  """
  def group_data(%Group{} = group) do
    %{
      id: group.id,
      name: group.name,
      description: group.description,
      icon_url: group.icon_url,
      banner_url: group.banner_url,
      member_count: Map.get(group, :member_count) || 0,
      visibility: group_visibility(group),
      owner: owner_data(Map.get(group, :owner)),
      channels: safe_map(group.channels, &channel_data/1),
      roles: safe_map(group.roles, &role_data/1),
      created_at: group.inserted_at
    }
  end

  @doc """
  Full group data with current user context.
  """
  def group_data(%Group{} = group, current_user) do
    member = find_member(group.members, current_user)
    
    %{
      id: group.id,
      name: group.name,
      description: group.description,
      icon_url: group.icon_url,
      banner_url: group.banner_url,
      member_count: Map.get(group, :member_count) || 0,
      visibility: group_visibility(group),
      owner: owner_data(Map.get(group, :owner)),
      channels: safe_map(group.channels, &channel_data/1),
      roles: safe_map(group.roles, &role_data/1),
      my_roles: member_roles(member),
      my_permissions: member_permissions(member, group),
      created_at: group.inserted_at
    }
  end

  # Safely map over associations that may not be loaded
  defp safe_map(%Ecto.Association.NotLoaded{}, _fun), do: []
  defp safe_map(nil, _fun), do: []
  defp safe_map(list, fun), do: Enum.map(list, fun)

  defp find_member(nil, _), do: nil
  defp find_member(%Ecto.Association.NotLoaded{}, _), do: nil
  defp find_member(members, user) do
    Enum.find(members, fn m -> m.user_id == user.id end)
  end

  defp member_roles(nil), do: []
  defp member_roles(%Member{} = member) do
    member_role_list = case member.roles do
      %Ecto.Association.NotLoaded{} -> []
      nil -> []
      roles -> roles
    end
    Enum.map(member_role_list, & &1.name)
  end

  defp member_permissions(nil, _), do: []
  defp member_permissions(%Member{} = member, group) do
    # Calculate effective permissions from roles
    Cgraph.Groups.calculate_permissions(member, group)
  end

  defp owner_data(nil), do: nil
  defp owner_data(%Ecto.Association.NotLoaded{}), do: nil
  defp owner_data(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    }
  end

  defp channel_data(%Channel{} = channel) do
    %{
      id: channel.id,
      name: channel.name,
      type: channel.channel_type,
      topic: channel.topic,
      position: channel.position,
      category_id: channel.category_id,
      nsfw: channel.is_nsfw || false,
      slowmode_seconds: channel.slow_mode_seconds
    }
  end

  defp role_data(%Role{} = role) do
    %{
      id: role.id,
      name: role.name,
      color: role.color,
      position: role.position,
      permissions: role.permissions,
      mentionable: role.is_mentionable,
      hoist: role.is_hoisted
    }
  end

  defp audit_entry(%AuditLog{} = entry) do
    %{
      id: entry.id,
      action: entry.action_type,
      actor_id: entry.user_id,
      target_user_id: entry.target_user_id,
      changes: entry.changes,
      reason: entry.reason,
      created_at: entry.inserted_at
    }
  end
end
