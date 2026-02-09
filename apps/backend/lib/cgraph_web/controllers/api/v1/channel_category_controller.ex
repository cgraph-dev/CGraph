defmodule CGraphWeb.API.V1.ChannelCategoryController do
  @moduledoc """
  Controller for channel categories within groups.
  """
  use CGraphWeb, :controller

  alias CGraph.Groups

  action_fallback CGraphWeb.FallbackController

  @doc """
  List channel categories for a group.
  """
  def index(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id) do
      categories = Groups.list_channel_categories(group)
      render(conn, :index, categories: categories)
    end
  end

  @doc """
  Get a specific channel category.
  """
  def show(conn, %{"group_id" => group_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         {:ok, category} <- Groups.get_channel_category(group, id) do
      render(conn, :show, category: category)
    end
  end

  @doc """
  Create a channel category.
  """
  def create(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user

    category_params = %{
      name: Map.get(params, "name"),
      position: Map.get(params, "position", 0)
    }

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, category} <- Groups.create_channel_category(group, category_params) do
      conn
      |> put_status(:created)
      |> render(:show, category: category)
    end
  end

  @doc """
  Update a channel category.
  """
  def update(conn, %{"group_id" => group_id, "id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, category} <- Groups.get_channel_category(group, id),
         {:ok, updated} <- Groups.update_channel_category(category, params) do
      render(conn, :show, category: updated)
    end
  end

  @doc """
  Delete a channel category.
  """
  def delete(conn, %{"group_id" => group_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, category} <- Groups.get_channel_category(group, id),
         {:ok, _} <- Groups.delete_channel_category(category) do
      send_resp(conn, :no_content, "")
    end
  end
end
