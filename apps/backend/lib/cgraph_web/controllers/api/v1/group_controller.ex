defmodule CGraphWeb.API.V1.GroupController do
  @moduledoc """
  Controller for group (server) management.
  """
  use CGraphWeb, :controller
  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Groups
  alias CGraph.Groups.Group

  action_fallback CGraphWeb.FallbackController

  @max_per_page 100

  @doc """
  List all groups the user is a member of.
  """
  def index(conn, params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: @max_per_page)

    {groups, total} = Groups.list_user_groups(user,
      page: page,
      per_page: per_page
    )

    render(conn, :index,
      groups: groups,
      meta: %{page: page, per_page: per_page, total: total}
    )
  end

  @doc """
  Get a specific group.
  """
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, id) do
      render(conn, :show, group: group, current_user: user)
    end
  end

  @doc """
  Create a new group.
  """
  def create(conn, params) do
    user = conn.assigns.current_user

    group_params = %{
      name: Map.get(params, "name"),
      description: Map.get(params, "description"),
      icon_url: Map.get(params, "icon_url"),
      visibility: Map.get(params, "visibility", "public")
    }

    with {:ok, %Group{} = group} <- Groups.create_group(user, group_params) do
      conn
      |> put_status(:created)
      |> render(:show, group: group, current_user: user)
    end
  end

  @doc """
  Update a group.
  """
  def update(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, id),
         :ok <- Groups.authorize(user, group, :manage_group),
         {:ok, updated} <- Groups.update_group(group, params) do
      render(conn, :show, group: updated, current_user: user)
    end
  end

  @doc """
  Delete a group.
  """
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, id),
         :ok <- Groups.authorize(user, group, :owner),
         {:ok, _group} <- Groups.delete_group(group) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Get the audit log for a group.
  """
  def audit_log(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 50, min: 1, max: @max_per_page)

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :view_audit_log),
         {entries, total} <- Groups.list_audit_log(group, page: page, per_page: per_page) do
      render(conn, :audit_log, entries: entries, meta: %{page: page, per_page: per_page, total: total})
    end
  end
end
