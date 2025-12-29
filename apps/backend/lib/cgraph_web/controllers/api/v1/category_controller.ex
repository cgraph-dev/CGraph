defmodule CgraphWeb.API.V1.CategoryController do
  @moduledoc """
  Handles forum categories.
  Categories organize posts within forums.
  """
  use CgraphWeb, :controller

  alias Cgraph.Forums

  action_fallback CgraphWeb.FallbackController

  @doc """
  List all categories in a forum.
  GET /api/v1/forums/:forum_id/categories
  """
  def index(conn, %{"forum_id" => forum_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view) do
      categories = Forums.list_categories(forum)
      render(conn, :index, categories: categories)
    end
  end

  @doc """
  Get a specific category.
  GET /api/v1/forums/:forum_id/categories/:id
  """
  def show(conn, %{"forum_id" => forum_id, "id" => category_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :view),
         {:ok, category} <- Forums.get_category(forum, category_id) do
      render(conn, :show, category: category)
    end
  end

  @doc """
  Create a new category.
  POST /api/v1/forums/:forum_id/categories
  """
  def create(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user
    category_params = Map.get(params, "category", %{})
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, category} <- Forums.create_category(forum, category_params) do
      conn
      |> put_status(:created)
      |> render(:show, category: category)
    end
  end

  @doc """
  Update a category.
  PUT /api/v1/forums/:forum_id/categories/:id
  """
  def update(conn, %{"forum_id" => forum_id, "id" => category_id} = params) do
    user = conn.assigns.current_user
    category_params = Map.get(params, "category", %{})
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, category} <- Forums.get_category(forum, category_id),
         {:ok, updated_category} <- Forums.update_category(category, category_params) do
      render(conn, :show, category: updated_category)
    end
  end

  @doc """
  Delete a category.
  DELETE /api/v1/forums/:forum_id/categories/:id
  """
  def delete(conn, %{"forum_id" => forum_id, "id" => category_id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, category} <- Forums.get_category(forum, category_id),
         {:ok, _} <- Forums.delete_category(category) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Reorder categories.
  PUT /api/v1/forums/:forum_id/categories/reorder
  """
  def reorder(conn, %{"forum_id" => forum_id, "category_ids" => category_ids}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, categories} <- Forums.reorder_categories(forum, category_ids) do
      render(conn, :index, categories: categories)
    end
  end
end
