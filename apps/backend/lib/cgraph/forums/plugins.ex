defmodule CGraph.Forums.Plugins do
  @moduledoc """
  Plugin management for forums.

  Handles installation, configuration, and lifecycle
  of forum plugins from the marketplace.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.ForumPlugin
  alias CGraph.Repo

  @doc """
  List all plugins for a forum.
  """
  @spec list_forum_plugins(String.t()) :: list(ForumPlugin.t())
  def list_forum_plugins(forum_id) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id,
      order_by: [asc: p.position, asc: p.name]
    )
    |> Repo.all()
  end

  @doc """
  List active plugins for a forum.
  """
  @spec list_active_plugins(String.t()) :: list(ForumPlugin.t())
  def list_active_plugins(forum_id) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id and p.is_active == true,
      order_by: [asc: p.position]
    )
    |> Repo.all()
  end

  @doc """
  Get a plugin by ID.
  """
  @spec get_plugin(String.t()) :: {:ok, ForumPlugin.t()} | {:error, :not_found}
  def get_plugin(id) do
    case Repo.get(ForumPlugin, id) do
      nil -> {:error, :not_found}
      plugin -> {:ok, plugin}
    end
  end

  @doc """
  Get a plugin by forum_id and plugin_id.
  """
  @spec get_plugin_by_plugin_id(String.t(), String.t()) :: {:ok, ForumPlugin.t()} | {:error, :not_found}
  def get_plugin_by_plugin_id(forum_id, plugin_id) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id and p.plugin_id == ^plugin_id
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      plugin -> {:ok, plugin}
    end
  end

  @doc """
  Install a plugin from the marketplace.
  """
  @spec install_plugin(String.t(), String.t(), map()) :: {:ok, ForumPlugin.t()} | {:error, Ecto.Changeset.t()}
  def install_plugin(forum_id, user_id, plugin_attrs) do
    attrs = plugin_attrs
      |> Map.put("forum_id", forum_id)
      |> Map.put("installed_by_id", user_id)
      |> Map.put("installed_at", DateTime.utc_now())

    %ForumPlugin{}
    |> ForumPlugin.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Uninstall a plugin.
  """
  @spec uninstall_plugin(ForumPlugin.t()) :: {:ok, ForumPlugin.t()} | {:error, :cannot_uninstall_core_plugin} | {:error, Ecto.Changeset.t()}
  def uninstall_plugin(%ForumPlugin{is_core: true}), do: {:error, :cannot_uninstall_core_plugin}
  def uninstall_plugin(%ForumPlugin{} = plugin), do: Repo.delete(plugin)

  @doc """
  Toggle plugin active status.
  """
  @spec toggle_plugin(ForumPlugin.t()) :: {:ok, ForumPlugin.t()} | {:error, Ecto.Changeset.t()}
  def toggle_plugin(%ForumPlugin{} = plugin) do
    plugin
    |> ForumPlugin.toggle_changeset(%{is_active: !plugin.is_active})
    |> Repo.update()
  end

  @doc """
  Update plugin settings.
  """
  @spec update_plugin_settings(ForumPlugin.t(), map()) :: {:ok, ForumPlugin.t()} | {:error, Ecto.Changeset.t()}
  def update_plugin_settings(%ForumPlugin{} = plugin, settings) do
    plugin
    |> ForumPlugin.settings_changeset(%{settings: settings})
    |> Repo.update()
  end

  @doc """
  Get plugins for a specific hook.
  """
  @spec get_plugins_for_hook(String.t(), String.t()) :: list(ForumPlugin.t())
  def get_plugins_for_hook(forum_id, hook) do
    from(p in ForumPlugin,
      where: p.forum_id == ^forum_id and p.is_active == true and ^hook in p.hooks
    )
    |> Repo.all()
  end

  @doc """
  List available plugins from the marketplace.
  """
  @spec list_available_plugins() :: list(map())
  def list_available_plugins do
    [
      %{
        plugin_id: "syntax_highlighter",
        name: "Syntax Highlighter",
        description: "Add syntax highlighting to code blocks in posts. Supports 100+ languages.",
        version: "2.1.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "content",
        icon: "code",
        download_count: 15_420,
        rating: 4.8,
        is_official: true
      },
      %{
        plugin_id: "poll_enhanced",
        name: "Enhanced Polls",
        description: "Create advanced polls with multiple choice, ratings, and image options.",
        version: "1.5.2",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "engagement",
        icon: "chart-bar",
        download_count: 12_350,
        rating: 4.7,
        is_official: true
      },
      %{
        plugin_id: "spoiler_tags",
        name: "Spoiler Tags",
        description: "Allow users to hide spoiler content behind clickable tags.",
        version: "1.2.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "content",
        icon: "eye-slash",
        download_count: 8920,
        rating: 4.9,
        is_official: true
      },
      %{
        plugin_id: "reputation_badges",
        name: "Reputation Badges",
        description: "Award badges to users based on their reputation and achievements.",
        version: "2.0.1",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "gamification",
        icon: "trophy",
        download_count: 10_230,
        rating: 4.6,
        is_official: true
      },
      %{
        plugin_id: "auto_moderation",
        name: "Auto Moderation",
        description: "Automatically detect and handle spam, toxicity, and rule violations.",
        version: "3.1.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "moderation",
        icon: "shield-check",
        download_count: 18_750,
        rating: 4.5,
        is_official: true
      },
      %{
        plugin_id: "discord_integration",
        name: "Webhook Integration",
        description: "Sync forum activity with external services. Post notifications, role sync, and more.",
        version: "1.8.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "integration",
        icon: "chat-bubble",
        download_count: 22_100,
        rating: 4.7,
        is_official: true
      },
      %{
        plugin_id: "media_embedder",
        name: "Media Embedder",
        description: "Automatically embed YouTube, Twitter, Spotify, and 50+ other media sources.",
        version: "2.3.1",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "content",
        icon: "play",
        download_count: 16_890,
        rating: 4.8,
        is_official: true
      },
      %{
        plugin_id: "user_titles",
        name: "Custom User Titles",
        description: "Allow users to create custom titles based on post count or reputation.",
        version: "1.4.0",
        author: "Community",
        author_url: nil,
        category: "customization",
        icon: "tag",
        download_count: 5430,
        rating: 4.4,
        is_official: false
      },
      %{
        plugin_id: "thread_prefixes",
        name: "Thread Prefixes",
        description: "Add colorful prefixes to threads like [Solved], [Help], [Discussion].",
        version: "1.1.0",
        author: "Community",
        author_url: nil,
        category: "organization",
        icon: "bookmark",
        download_count: 7820,
        rating: 4.6,
        is_official: false
      },
      %{
        plugin_id: "mybb_importer",
        name: "MyBB Importer",
        description: "Import your existing MyBB forum data including users, threads, and posts.",
        version: "1.0.0",
        author: "CGraph Team",
        author_url: "https://cgraph.io",
        category: "migration",
        icon: "download",
        download_count: 3210,
        rating: 4.3,
        is_official: true
      }
    ]
  end

  @doc """
  Get available plugin by plugin_id from marketplace.
  """
  @spec get_available_plugin(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_available_plugin(plugin_id) do
    list_available_plugins()
    |> Enum.find(&(&1.plugin_id == plugin_id))
    |> case do
      nil -> {:error, :not_found}
      plugin -> {:ok, plugin}
    end
  end
end
