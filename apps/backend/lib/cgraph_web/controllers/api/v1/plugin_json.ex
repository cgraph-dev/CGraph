defmodule CGraphWeb.API.V1.PluginJSON do
  @moduledoc """
  JSON views for plugin endpoints.
  """

  @spec marketplace(map()) :: map()
  def marketplace(%{plugins: plugins}) do
    %{
      data: Enum.map(plugins, &marketplace_plugin_data/1),
      meta: %{
        categories: ["content", "engagement", "moderation", "integration", "gamification", "customization", "organization", "migration"]
      }
    }
  end

  @spec marketplace_plugin(map()) :: map()
  def marketplace_plugin(%{plugin: plugin}) do
    %{plugin: marketplace_plugin_data(plugin)}
  end

  @spec index(map()) :: map()
  def index(%{plugins: plugins}) do
    %{data: Enum.map(plugins, &plugin_data/1)}
  end

  @spec show(map()) :: map()
  def show(%{plugin: plugin}) do
    %{plugin: plugin_data(plugin)}
  end

  defp marketplace_plugin_data(plugin) do
    %{
      plugin_id: plugin.plugin_id,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      author_url: plugin[:author_url],
      category: plugin.category,
      icon: plugin.icon,
      download_count: plugin.download_count,
      rating: plugin.rating,
      is_official: plugin.is_official
    }
  end

  defp plugin_data(plugin) do
    %{
      id: plugin.id,
      plugin_id: plugin.plugin_id,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      author_url: plugin.author_url,
      is_active: plugin.is_active,
      is_core: plugin.is_core,
      settings: plugin.settings,
      hooks: plugin.hooks,
      css_files: plugin.css_files,
      js_files: plugin.js_files,
      position: plugin.position,
      installed_at: plugin.inserted_at,
      forum_id: plugin.forum_id
    }
  end
end
