defmodule CGraphWeb.API.V1.RoleController do
  @moduledoc """
  Handles role management within groups.
  Roles control permissions and appear in member lists with colors.
  """
  use CGraphWeb, :controller

  alias CGraph.Groups

  action_fallback CGraphWeb.FallbackController

  @doc """
  List all roles in a group.
  GET /api/v1/groups/:group_id/roles
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view) do
      roles = Groups.list_roles(group)
      render(conn, :index, roles: roles)
    end
  end

  @doc """
  Get a specific role.
  GET /api/v1/groups/:group_id/roles/:id
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"group_id" => group_id, "id" => role_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view),
         {:ok, role} <- Groups.get_role(group, role_id) do
      render(conn, :show, role: role)
    end
  end

  @doc """
  Create a new role.
  POST /api/v1/groups/:group_id/roles

  Params:
  - name: Role name (required)
  - color: Hex color code (optional)
  - permissions: Permission bitfield (optional)
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user
    # Accept params either nested under "role" key or directly
    role_params = Map.get(params, "role") || extract_role_params(params)

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_roles),
         {:ok, role} <- Groups.create_role(group, role_params) do
      Groups.log_audit_event(group, user, :role_created, %{
        role_id: role.id,
        name: role.name
      })

      conn
      |> put_status(:created)
      |> render(:show, role: role)
    end
  end

  @doc """
  Update a role.
  PUT /api/v1/groups/:group_id/roles/:id
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"group_id" => group_id, "id" => role_id} = params) do
    user = conn.assigns.current_user
    # Support both nested {"role" => attrs} and flat {name, color, ...} params
    role_params = extract_role_params(params)

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_roles),
         {:ok, role} <- Groups.get_role(group, role_id),
         :ok <- validate_not_default_role(role),
         {:ok, updated_role} <- Groups.update_role(role, role_params) do
      Groups.log_audit_event(group, user, :role_updated, %{
        role_id: role.id,
        changes: role_params
      })

      render(conn, :show, role: updated_role)
    end
  end

  # Extract role params from request - supports nested or flat params
  defp extract_role_params(%{"role" => role_params}) when is_map(role_params), do: role_params
  defp extract_role_params(params) do
    params
    |> Map.drop(["group_id", "id", "action", "controller"])
    |> Map.take(["name", "color", "permissions", "position", "is_mentionable", "is_hoisted", "icon"])
  end

  @doc """
  Delete a role.
  DELETE /api/v1/groups/:group_id/roles/:id
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"group_id" => group_id, "id" => role_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_roles),
         {:ok, role} <- Groups.get_role(group, role_id),
         :ok <- validate_not_default_role(role),
         {:ok, _} <- Groups.delete_role(role) do
      Groups.log_audit_event(group, user, :role_deleted, %{
        role_id: role.id,
        name: role.name
      })

      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Reorder roles (update positions).
  PUT /api/v1/groups/:group_id/roles/reorder
  """
  @spec reorder(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reorder(conn, %{"group_id" => group_id, "role_ids" => role_ids}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :manage_roles),
         {:ok, roles} <- Groups.reorder_roles(group, role_ids) do
      Groups.log_audit_event(group, user, :roles_reordered, %{
        role_ids: role_ids
      })

      render(conn, :index, roles: roles)
    end
  end

  # Private helpers

  defp validate_not_default_role(role) do
    if role.is_default do
      {:error, :cannot_modify_default_role}
    else
      :ok
    end
  end

  @doc """
  Get effective permissions for a member in a channel.
  GET /api/v1/groups/:group_id/channels/:channel_id/permissions/:member_id
  """
  @spec effective_permissions(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def effective_permissions(conn, %{"group_id" => group_id, "channel_id" => channel_id, "member_id" => member_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {:ok, member} <- Groups.get_member(group, member_id) do
      # Preload roles on member if not already loaded
      member = CGraph.Repo.preload(member, :roles)
      effective = Groups.calculate_effective_permissions(member, group, channel)
      permissions_map = CGraph.Groups.Role.permissions_map()

      result =
        Enum.into(permissions_map, %{}, fn {perm_name, bit} ->
          {Atom.to_string(perm_name), Bitwise.band(effective, bit) != 0}
        end)

      json(conn, %{data: result})
    end
  end
end
