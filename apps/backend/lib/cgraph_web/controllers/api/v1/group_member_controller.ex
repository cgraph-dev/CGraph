defmodule CgraphWeb.API.V1.GroupMemberController do
  @moduledoc """
  Handles group member management actions.
  Includes listing members, updating roles, kicking, banning, muting.
  """
  use CgraphWeb, :controller

  alias Cgraph.Groups
  alias Cgraph.Groups.Member

  action_fallback CgraphWeb.FallbackController

  @doc """
  List all members of a group.
  GET /api/v1/groups/:group_id/members
  """
  def index(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view_members) do
      page = Map.get(params, "page", "1") |> String.to_integer()
      per_page = Map.get(params, "per_page", "50") |> String.to_integer() |> min(100)
      role_filter = Map.get(params, "role")
      
      {members, meta} = Groups.list_group_members(group, 
        page: page, 
        per_page: per_page,
        role: role_filter
      )
      
      render(conn, :index, members: members, meta: meta)
    end
  end

  @doc """
  Get a specific member.
  GET /api/v1/groups/:group_id/members/:id
  """
  def show(conn, %{"group_id" => group_id, "id" => member_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view_members),
         {:ok, member} <- Groups.get_member(group, member_id) do
      render(conn, :show, member: member)
    end
  end

  @doc """
  Update a member's roles or nickname.
  PUT /api/v1/groups/:group_id/members/:id
  """
  def update(conn, %{"group_id" => group_id, "id" => member_id} = params) do
    user = conn.assigns.current_user
    member_params = Map.get(params, "member", %{})
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_members),
         {:ok, member} <- Groups.get_member(group, member_id),
         {:ok, updated_member} <- Groups.update_member(member, member_params) do
      Groups.log_audit_event(group, user, :member_updated, %{
        target_user_id: member.user_id,
        changes: member_params
      })
      
      render(conn, :show, member: updated_member)
    end
  end

  @doc """
  Kick a member from the group.
  DELETE /api/v1/groups/:group_id/members/:id
  """
  def delete(conn, %{"group_id" => group_id, "id" => member_id} = params) do
    user = conn.assigns.current_user
    reason = Map.get(params, "reason", "")
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :kick_members),
         {:ok, member} <- Groups.get_member(group, member_id),
         :ok <- validate_not_self(user, member),
         :ok <- validate_can_moderate(user, member, group),
         {:ok, _} <- Groups.remove_member(member) do
      Groups.log_audit_event(group, user, :member_kicked, %{
        target_user_id: member.user_id,
        reason: reason
      })
      
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Ban a member from the group.
  POST /api/v1/groups/:group_id/members/:id/ban
  """
  def ban(conn, %{"group_id" => group_id, "id" => member_id} = params) do
    user = conn.assigns.current_user
    reason = Map.get(params, "reason", "")
    duration = Map.get(params, "duration") # nil = permanent, or seconds
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :ban_members),
         {:ok, member} <- Groups.get_member(group, member_id),
         :ok <- validate_not_self(user, member),
         :ok <- validate_can_moderate(user, member, group),
         {:ok, ban} <- Groups.ban_member(group, member, reason: reason, duration: duration) do
      Groups.log_audit_event(group, user, :member_banned, %{
        target_user_id: member.user_id,
        reason: reason,
        duration: duration
      })
      
      render(conn, :ban, ban: ban)
    end
  end

  @doc """
  Unban a user from the group.
  DELETE /api/v1/groups/:group_id/bans/:user_id
  """
  def unban(conn, %{"group_id" => group_id, "user_id" => user_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :ban_members),
         {:ok, _} <- Groups.unban_user(group, user_id) do
      Groups.log_audit_event(group, user, :member_unbanned, %{
        target_user_id: user_id
      })
      
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  List banned users.
  GET /api/v1/groups/:group_id/bans
  """
  def list_bans(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view_bans) do
      bans = Groups.list_bans(group)
      render(conn, :bans, bans: bans)
    end
  end

  @doc """
  Mute a member (prevent them from sending messages).
  POST /api/v1/groups/:group_id/members/:id/mute
  """
  def mute(conn, %{"group_id" => group_id, "id" => member_id} = params) do
    user = conn.assigns.current_user
    duration = Map.get(params, "duration", 600) # Default 10 minutes
    reason = Map.get(params, "reason", "")
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :mute_members),
         {:ok, member} <- Groups.get_member(group, member_id),
         :ok <- validate_not_self(user, member),
         :ok <- validate_can_moderate(user, member, group),
         {:ok, updated_member} <- Groups.mute_member(member, duration) do
      Groups.log_audit_event(group, user, :member_muted, %{
        target_user_id: member.user_id,
        duration: duration,
        reason: reason
      })
      
      render(conn, :show, member: updated_member)
    end
  end

  @doc """
  Unmute a member.
  DELETE /api/v1/groups/:group_id/members/:id/mute
  """
  def unmute(conn, %{"group_id" => group_id, "id" => member_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :mute_members),
         {:ok, member} <- Groups.get_member(group, member_id),
         {:ok, updated_member} <- Groups.unmute_member(member) do
      Groups.log_audit_event(group, user, :member_unmuted, %{
        target_user_id: member.user_id
      })
      
      render(conn, :show, member: updated_member)
    end
  end

  @doc """
  Assign roles to a member.
  PUT /api/v1/groups/:group_id/members/:id/roles
  """
  def update_roles(conn, %{"group_id" => group_id, "id" => member_id, "role_ids" => role_ids}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_roles),
         {:ok, member} <- Groups.get_member(group, member_id),
         {:ok, updated_member} <- Groups.update_member_roles(member, role_ids) do
      Groups.log_audit_event(group, user, :member_roles_updated, %{
        target_user_id: member.user_id,
        role_ids: role_ids
      })
      
      render(conn, :show, member: updated_member)
    end
  end

  @doc """
  Transfer group ownership.
  POST /api/v1/groups/:group_id/transfer
  """
  def transfer_ownership(conn, %{"group_id" => group_id, "new_owner_id" => new_owner_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- validate_is_owner(user, group),
         {:ok, new_owner_member} <- Groups.get_member(group, new_owner_id),
         {:ok, updated_group} <- Groups.transfer_ownership(group, new_owner_member.user_id) do
      Groups.log_audit_event(updated_group, user, :ownership_transferred, %{
        new_owner_id: new_owner_id
      })
      
      render(conn, :transfer, group: updated_group)
    end
  end

  # Private helpers

  defp validate_not_self(user, %Member{user_id: member_user_id}) do
    if user.id == member_user_id do
      {:error, :cannot_moderate_self}
    else
      :ok
    end
  end

  defp validate_can_moderate(actor, target_member, group) do
    actor_member = Groups.get_member_by_user(group, actor.id)
    
    case Groups.compare_hierarchy(actor_member, target_member) do
      :higher -> :ok
      _ -> {:error, :insufficient_permissions}
    end
  end

  defp validate_is_owner(user, group) do
    if group.owner_id == user.id do
      :ok
    else
      {:error, :not_owner}
    end
  end
end
