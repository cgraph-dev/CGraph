defmodule CgraphWeb.API.V1.InviteController do
  @moduledoc """
  Handles group invite links.
  Users can create invites, list active invites, and join groups via invite codes.
  """
  use CgraphWeb, :controller

  alias Cgraph.Groups

  action_fallback CgraphWeb.FallbackController

  @doc """
  List all invites for a group.
  GET /api/v1/groups/:group_id/invites
  """
  def index(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view_invites) do
      invites = Groups.list_invites(group)
      render(conn, :index, invites: invites)
    end
  end

  @doc """
  Get a specific invite by code.
  GET /api/v1/invites/:code
  """
  def show(conn, %{"code" => code}) do
    # Public endpoint - anyone can view invite details
    with {:ok, invite} <- Groups.get_invite_by_code(code) do
      render(conn, :show, invite: invite)
    end
  end

  @doc """
  Create a new invite.
  POST /api/v1/groups/:group_id/invites
  """
  def create(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user
    # Support both nested {"invite" => attrs} and flat params
    invite_params = extract_invite_params(params)
    
    # Default options
    max_uses = Map.get(invite_params, "max_uses")
    expires_in = Map.get(invite_params, "expires_in", 86400) # Default 24 hours
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :create_invites),
         {:ok, invite} <- Groups.create_invite(group, user, 
           max_uses: max_uses,
           expires_in: expires_in
         ) do
      Groups.log_audit_event(group, user, :invite_created, %{
        invite_id: invite.id,
        code: invite.code
      })
      
      conn
      |> put_status(:created)
      |> render(:show, invite: invite)
    end
  end

  # Extract invite params from request - supports nested or flat params
  defp extract_invite_params(%{"invite" => invite_params}) when is_map(invite_params), do: invite_params
  defp extract_invite_params(params) do
    params
    |> Map.drop(["group_id", "action", "controller"])
    |> Map.take(["max_uses", "expires_in", "expires_at", "channel_id"])
  end

  @doc """
  Delete/revoke an invite.
  DELETE /api/v1/groups/:group_id/invites/:id
  """
  def delete(conn, %{"group_id" => group_id, "id" => invite_id}) do
    user = conn.assigns.current_user
    
    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_invites),
         {:ok, invite} <- Groups.get_invite(group, invite_id),
         {:ok, _} <- Groups.delete_invite(invite) do
      Groups.log_audit_event(group, user, :invite_deleted, %{
        invite_id: invite.id,
        code: invite.code
      })
      
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Join a group using an invite code.
  POST /api/v1/invites/:code/join
  """
  def join(conn, %{"code" => code}) do
    user = conn.assigns.current_user
    
    with {:ok, invite} <- Groups.get_invite_by_code(code),
         :ok <- validate_invite_usable(invite),
         :ok <- validate_not_member(user, invite.group),
         :ok <- validate_not_banned(user, invite.group),
         {:ok, member} <- Groups.join_via_invite(user, invite) do
      Groups.log_audit_event(invite.group, user, :member_joined_via_invite, %{
        invite_id: invite.id,
        code: invite.code
      })
      
      conn
      |> put_status(:created)
      |> render(:joined, member: member, group: invite.group)
    end
  end

  # Private helpers

  defp validate_invite_usable(invite) do
    cond do
      invite.is_revoked ->
        {:error, :invite_revoked}
      
      invite.expires_at && DateTime.compare(invite.expires_at, DateTime.utc_now()) == :lt ->
        {:error, :invite_expired}
      
      invite.max_uses && invite.uses >= invite.max_uses ->
        {:error, :invite_max_uses_reached}
      
      true ->
        :ok
    end
  end

  defp validate_not_member(user, group) do
    case Groups.get_member_by_user(group, user.id) do
      nil -> :ok
      _member -> {:error, :already_member}
    end
  end

  defp validate_not_banned(user, group) do
    case Groups.get_ban(group, user.id) do
      nil -> :ok
      _ban -> {:error, :user_banned}
    end
  end
end
