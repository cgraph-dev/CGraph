defmodule CgraphWeb.API.V1.PluginController do
  @moduledoc """
  Controller for forum plugin management.
  
  Handles plugin marketplace browsing, installation, configuration,
  and management for MyBB-style forum hosting.
  """
  use CgraphWeb, :controller

  alias Cgraph.Forums

  action_fallback CgraphWeb.FallbackController

  @doc """
  List available plugins from the marketplace.
  GET /api/v1/plugins/marketplace
  """
  def marketplace(conn, params) do
    plugins = Forums.list_available_plugins()
    
    # Optional filtering by category
    plugins = case params["category"] do
      nil -> plugins
      category -> Enum.filter(plugins, &(&1.category == category))
    end
    
    # Optional filtering by is_official
    plugins = case params["official"] do
      "true" -> Enum.filter(plugins, &(&1.is_official == true))
      "false" -> Enum.filter(plugins, &(&1.is_official == false))
      _ -> plugins
    end
    
    # Optional search
    plugins = case params["search"] do
      nil -> plugins
      search ->
        search = String.downcase(search)
        Enum.filter(plugins, fn p ->
          String.contains?(String.downcase(p.name), search) or
          String.contains?(String.downcase(p.description), search)
        end)
    end
    
    render(conn, :marketplace, plugins: plugins)
  end

  @doc """
  Get a specific plugin from marketplace.
  GET /api/v1/plugins/marketplace/:plugin_id
  """
  def marketplace_show(conn, %{"plugin_id" => plugin_id}) do
    with {:ok, plugin} <- Forums.get_available_plugin(plugin_id) do
      render(conn, :marketplace_plugin, plugin: plugin)
    end
  end

  @doc """
  List installed plugins for a forum.
  GET /api/v1/forums/:forum_id/plugins
  """
  def index(conn, %{"forum_id" => forum_id}) do
    with {:ok, forum} <- Forums.get_forum(forum_id) do
      plugins = Forums.list_forum_plugins(forum.id)
      render(conn, :index, plugins: plugins)
    end
  end

  @doc """
  Get a specific installed plugin.
  GET /api/v1/forums/:forum_id/plugins/:id
  """
  def show(conn, %{"forum_id" => forum_id, "id" => id}) do
    with {:ok, _forum} <- Forums.get_forum(forum_id),
         {:ok, plugin} <- Forums.get_plugin(id) do
      render(conn, :show, plugin: plugin)
    end
  end

  @doc """
  Install a plugin from marketplace.
  POST /api/v1/forums/:forum_id/plugins
  """
  def create(conn, %{"forum_id" => forum_id} = params) do
    user = conn.assigns.current_user
    plugin_data = Map.get(params, "plugin") || extract_plugin_params(params)
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, marketplace_plugin} <- Forums.get_available_plugin(plugin_data["plugin_id"]),
         {:ok, plugin} <- install_from_marketplace(forum.id, user.id, marketplace_plugin, plugin_data) do
      conn
      |> put_status(:created)
      |> render(:show, plugin: plugin)
    end
  end

  @doc """
  Toggle a plugin's active status.
  POST /api/v1/forums/:forum_id/plugins/:id/toggle
  """
  def toggle(conn, %{"forum_id" => forum_id, "id" => id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, plugin} <- Forums.get_plugin(id),
         {:ok, updated_plugin} <- Forums.toggle_plugin(plugin) do
      render(conn, :show, plugin: updated_plugin)
    end
  end

  @doc """
  Update plugin settings.
  PUT /api/v1/forums/:forum_id/plugins/:id
  """
  def update(conn, %{"forum_id" => forum_id, "id" => id} = params) do
    user = conn.assigns.current_user
    settings = params["settings"] || %{}
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, plugin} <- Forums.get_plugin(id),
         {:ok, updated_plugin} <- Forums.update_plugin_settings(plugin, settings) do
      render(conn, :show, plugin: updated_plugin)
    end
  end

  @doc """
  Uninstall a plugin.
  DELETE /api/v1/forums/:forum_id/plugins/:id
  """
  def delete(conn, %{"forum_id" => forum_id, "id" => id}) do
    user = conn.assigns.current_user
    
    with {:ok, forum} <- Forums.get_forum(forum_id),
         :ok <- Forums.authorize_action(user, forum, :manage),
         {:ok, plugin} <- Forums.get_plugin(id),
         {:ok, _deleted} <- Forums.uninstall_plugin(plugin) do
      send_resp(conn, :no_content, "")
    end
  end

  # Private helpers

  defp extract_plugin_params(params) do
    params
    |> Map.take(["plugin_id", "settings"])
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  defp install_from_marketplace(forum_id, user_id, marketplace_plugin, user_settings) do
    attrs = %{
      "plugin_id" => marketplace_plugin.plugin_id,
      "name" => marketplace_plugin.name,
      "description" => marketplace_plugin.description,
      "version" => marketplace_plugin.version,
      "author" => marketplace_plugin.author,
      "author_url" => marketplace_plugin[:author_url],
      "is_active" => true,
      "settings" => user_settings["settings"] || %{}
    }
    
    Forums.install_plugin(forum_id, user_id, attrs)
  end
end
