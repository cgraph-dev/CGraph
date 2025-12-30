defmodule Cgraph.Forums.ForumPlugin do
  @moduledoc """
  Forum plugin schema - installed plugins for MyBB-style forums.
  Supports plugin configuration, version tracking, and hooks.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_plugins" do
    field :plugin_id, :string  # unique identifier, e.g., "syntax_highlighter"
    field :name, :string
    field :description, :string
    field :version, :string
    field :author, :string
    field :author_url, :string
    field :is_active, :boolean, default: true
    field :is_core, :boolean, default: false  # core plugins can't be uninstalled
    
    # Plugin configuration (JSON)
    field :settings, :map, default: %{}
    
    # Plugin hooks - which events this plugin listens to
    field :hooks, {:array, :string}, default: []
    
    # Plugin assets (CSS/JS files to load)
    field :css_files, {:array, :string}, default: []
    field :js_files, {:array, :string}, default: []
    
    # Permissions - which user groups can use this plugin
    field :allowed_groups, {:array, :string}, default: []  # empty = all groups
    
    # Display order in plugin list
    field :position, :integer, default: 0
    
    # Installation metadata
    field :installed_at, :utc_datetime_usec
    field :updated_at_version, :string  # version when last updated
    
    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :installed_by, Cgraph.Accounts.User

    timestamps()
  end

  @available_hooks [
    "post_created", "post_updated", "post_deleted",
    "thread_created", "thread_updated", "thread_deleted",
    "user_registered", "user_login", "user_logout",
    "reputation_changed", "poll_voted",
    "before_post_display", "after_post_display",
    "before_thread_display", "after_thread_display",
    "forum_header", "forum_footer", "sidebar"
  ]

  def changeset(plugin, attrs) do
    plugin
    |> cast(attrs, [
      :plugin_id, :name, :description, :version, :author, :author_url,
      :is_active, :is_core, :settings, :hooks, :css_files, :js_files,
      :allowed_groups, :position, :installed_at, :updated_at_version,
      :forum_id, :installed_by_id
    ])
    |> validate_required([:plugin_id, :name, :version, :forum_id])
    |> validate_hooks()
    |> unique_constraint([:forum_id, :plugin_id])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:installed_by_id)
  end

  def toggle_changeset(plugin, attrs) do
    plugin
    |> cast(attrs, [:is_active])
  end

  def settings_changeset(plugin, attrs) do
    plugin
    |> cast(attrs, [:settings])
    |> validate_required([:settings])
  end

  defp validate_hooks(changeset) do
    case get_change(changeset, :hooks) do
      nil -> changeset
      hooks ->
        invalid_hooks = Enum.reject(hooks, &(&1 in @available_hooks))
        if Enum.empty?(invalid_hooks) do
          changeset
        else
          add_error(changeset, :hooks, "contains invalid hooks: #{Enum.join(invalid_hooks, ", ")}")
        end
    end
  end

  def available_hooks, do: @available_hooks
end
