defmodule CGraphWeb.API.V1.PermissionOverwriteController do
  @moduledoc """
  Controller for channel permission overwrites.
  """
  use CGraphWeb, :controller

  alias CGraph.Groups

  action_fallback CGraphWeb.FallbackController

  @doc """
  List permission overwrites for a channel.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"group_id" => group_id, "channel_id" => channel_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         {:ok, channel} <- Groups.get_channel(group, channel_id) do
      overwrites = Groups.list_permission_overwrites(channel)
      render(conn, :index, overwrites: overwrites)
    end
  end

  @doc """
  Create a permission overwrite.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"group_id" => group_id, "channel_id" => channel_id} = params) do
    user = conn.assigns.current_user

    overwrite_params = %{
      type: Map.get(params, "type"),
      role_id: Map.get(params, "role_id"),
      member_id: Map.get(params, "member_id"),
      allow: Map.get(params, "allow", 0),
      deny: Map.get(params, "deny", 0)
    }

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {:ok, overwrite} <- Groups.create_permission_overwrite(channel, overwrite_params) do
      conn
      |> put_status(:created)
      |> render(:show, overwrite: overwrite)
    end
  end

  @doc """
  Update a permission overwrite.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"group_id" => group_id, "channel_id" => channel_id, "id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, _channel} <- Groups.get_channel(group, channel_id),
         {:ok, overwrite} <- Groups.get_permission_overwrite(channel_id, id),
         {:ok, updated} <- Groups.update_permission_overwrite(overwrite, params) do
      render(conn, :show, overwrite: updated)
    end
  end

  @doc """
  Delete a permission overwrite.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"group_id" => group_id, "channel_id" => channel_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, _channel} <- Groups.get_channel(group, channel_id),
         {:ok, overwrite} <- Groups.get_permission_overwrite(channel_id, id),
         {:ok, _} <- Groups.delete_permission_overwrite(overwrite) do
      send_resp(conn, :no_content, "")
    end
  end
end
