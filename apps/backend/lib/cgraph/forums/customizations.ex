defmodule CGraph.Forums.Customizations do
  @moduledoc """
  Forum customization engine — 55 enumerable options across 8 categories.

  Provides a unified configuration surface for MyBB-style forum customization.
  Options are stored as JSONB in the `customization_options` column on `forums`.
  """

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Forums.Forum

  # ===========================================================================
  # CUSTOMIZATION OPTIONS CONSTANT — 55 options, 8 categories
  # ===========================================================================

  @type option :: %{
          key: String.t(),
          label: String.t(),
          type: atom(),
          default: any(),
          description: String.t()
        }

  @customization_options %{
    appearance: [
      %{key: "primary_color", label: "Primary Color", type: :color, default: "#3B82F6", description: "Main brand color used for buttons, links, and accents"},
      %{key: "secondary_color", label: "Secondary Color", type: :color, default: "#1E40AF", description: "Secondary brand color for hover states and borders"},
      %{key: "accent_color", label: "Accent Color", type: :color, default: "#F59E0B", description: "Accent color for highlights and notifications"},
      %{key: "background_color", label: "Background Color", type: :color, default: "#FFFFFF", description: "Page background color"},
      %{key: "text_color", label: "Text Color", type: :color, default: "#1F2937", description: "Primary text color"},
      %{key: "link_color", label: "Link Color", type: :color, default: "#2563EB", description: "Hyperlink color"},
      %{key: "font_family", label: "Font Family", type: :select, default: "Inter, system-ui, sans-serif", description: "Primary font family for body text"},
      %{key: "header_font_family", label: "Header Font", type: :select, default: "Inter, system-ui, sans-serif", description: "Font family for headings"},
      %{key: "font_size_base", label: "Base Font Size", type: :select, default: "16px", description: "Base font size (sm/md/lg)"},
      %{key: "border_radius", label: "Border Radius", type: :select, default: "md", description: "Corner roundness (none/sm/md/lg/full)"},
      %{key: "content_width", label: "Content Width", type: :select, default: "1200px", description: "Maximum content area width"},
      %{key: "dark_mode", label: "Dark Mode Default", type: :boolean, default: false, description: "Enable dark mode as default theme"}
    ],
    layout: [
      %{key: "sidebar_position", label: "Sidebar Position", type: :select, default: "right", description: "Sidebar placement (left/right/none)"},
      %{key: "header_style", label: "Header Style", type: :select, default: "standard", description: "Header layout (standard/compact/banner/minimal)"},
      %{key: "thread_layout", label: "Thread Layout", type: :select, default: "classic", description: "Thread list display (classic/cards/compact)"},
      %{key: "post_layout", label: "Post Layout", type: :select, default: "classic", description: "Post display (classic/modern/minimal)"},
      %{key: "category_layout", label: "Category Layout", type: :select, default: "table", description: "Category display (table/grid/list)"},
      %{key: "board_layout", label: "Board Layout", type: :select, default: "table", description: "Board display (table/grid/list)"},
      %{key: "sticky_header", label: "Sticky Header", type: :boolean, default: true, description: "Keep header visible while scrolling"},
      %{key: "show_breadcrumbs", label: "Show Breadcrumbs", type: :boolean, default: true, description: "Show navigation breadcrumbs"}
    ],
    header_and_branding: [
      %{key: "logo_url", label: "Logo URL", type: :url, default: nil, description: "Forum logo image URL"},
      %{key: "header_background_url", label: "Header Background Image", type: :url, default: nil, description: "Header background image URL"},
      %{key: "header_background_color", label: "Header Background Color", type: :color, default: "#1F2937", description: "Header background color"},
      %{key: "title_font", label: "Title Font", type: :select, default: "Inter, system-ui, sans-serif", description: "Forum title font family"},
      %{key: "subtitle_text", label: "Subtitle", type: :text, default: "", description: "Subtitle displayed below forum name"},
      %{key: "favicon_url", label: "Favicon URL", type: :url, default: nil, description: "Browser tab icon URL"}
    ],
    sidebar_widgets: [
      %{key: "widget_statistics", label: "Statistics Widget", type: :boolean, default: true, description: "Show forum statistics in sidebar"},
      %{key: "widget_recent_threads", label: "Recent Threads Widget", type: :boolean, default: true, description: "Show recent threads in sidebar"},
      %{key: "widget_online_users", label: "Online Users Widget", type: :boolean, default: true, description: "Show online users in sidebar"},
      %{key: "widget_leaderboard", label: "Leaderboard Widget", type: :boolean, default: false, description: "Show top users in sidebar"},
      %{key: "widget_poll", label: "Poll Widget", type: :boolean, default: false, description: "Show active poll in sidebar"},
      %{key: "widget_custom_html", label: "Custom HTML Widget", type: :boolean, default: false, description: "Show custom HTML block in sidebar"},
      %{key: "widget_order", label: "Widget Order", type: :json, default: ["statistics", "recent_threads", "online_users", "leaderboard", "poll", "custom_html"], description: "Order of sidebar widgets"},
      %{key: "widget_visibility", label: "Widget Visibility", type: :json, default: %{"guests" => true, "members" => true, "mods" => true}, description: "Widget visibility per role"}
    ],
    post_and_thread_display: [
      %{key: "post_template", label: "Post Template", type: :select, default: "classic", description: "Post display template (classic/modern/compact)"},
      %{key: "show_rank_images", label: "Show Rank Images", type: :boolean, default: true, description: "Display user rank images next to posts"},
      %{key: "show_badges", label: "Show Badges", type: :boolean, default: true, description: "Display user badges on posts"},
      %{key: "show_signature", label: "Show Signatures", type: :boolean, default: true, description: "Display user signatures below posts"},
      %{key: "max_signature_length", label: "Max Signature Length", type: :number, default: 500, description: "Maximum characters for user signatures"},
      %{key: "bbcode_in_signatures", label: "BBCode in Signatures", type: :boolean, default: true, description: "Allow BBCode formatting in signatures"},
      %{key: "posts_per_page", label: "Posts Per Page", type: :number, default: 20, description: "Number of posts displayed per page"},
      %{key: "thread_preview_length", label: "Thread Preview Length", type: :number, default: 200, description: "Characters shown in thread previews"}
    ],
    custom_fields: [
      %{key: "profile_custom_fields", label: "Profile Custom Fields", type: :boolean, default: false, description: "Enable custom fields on user profiles"},
      %{key: "thread_custom_fields", label: "Thread Custom Fields", type: :boolean, default: false, description: "Enable custom fields on threads"},
      %{key: "post_custom_fields", label: "Post Custom Fields", type: :boolean, default: false, description: "Enable custom fields on posts"}
    ],
    reputation_and_ranks: [
      %{key: "karma_name", label: "Karma Name", type: :text, default: "Karma", description: "Display name for reputation points"},
      %{key: "upvote_label", label: "Upvote Label", type: :text, default: "Upvote", description: "Label for upvote action"},
      %{key: "downvote_label", label: "Downvote Label", type: :text, default: "Downvote", description: "Label for downvote action"},
      %{key: "rank_thresholds", label: "Rank Thresholds", type: :json, default: [%{"name" => "Newcomer", "min_karma" => 0}, %{"name" => "Member", "min_karma" => 10}, %{"name" => "Regular", "min_karma" => 50}, %{"name" => "Veteran", "min_karma" => 200}, %{"name" => "Elite", "min_karma" => 500}], description: "Karma thresholds for user ranks"},
      %{key: "rank_images", label: "Rank Images", type: :json, default: %{}, description: "Image URLs mapped to rank names"},
      %{key: "show_reputation", label: "Show Reputation", type: :boolean, default: true, description: "Display reputation scores on profiles and posts"}
    ],
    custom_css_and_advanced: [
      %{key: "custom_css", label: "Custom CSS", type: :css, default: "", description: "Custom CSS injected into forum pages"},
      %{key: "custom_header_html", label: "Custom Header HTML", type: :html, default: "", description: "Custom HTML injected into the header area"},
      %{key: "custom_footer_html", label: "Custom Footer HTML", type: :html, default: "", description: "Custom HTML injected into the footer area"},
      %{key: "custom_js_enabled", label: "Custom JS Enabled", type: :boolean, default: false, description: "Enable custom JavaScript (requires admin approval)"}
    ]
  }

  @categories Map.keys(@customization_options)

  # ===========================================================================
  # PUBLIC API
  # ===========================================================================

  @doc """
  Returns all 55 customization options grouped by 8 categories.
  """
  @spec list_options() :: map()
  def list_options do
    @customization_options
  end

  @doc """
  Returns the total count of customization options.
  """
  @spec option_count() :: non_neg_integer()
  def option_count do
    @customization_options
    |> Map.values()
    |> List.flatten()
    |> length()
  end

  @doc """
  Returns the list of category names.
  """
  @spec categories() :: [atom()]
  def categories, do: @categories

  @doc """
  Returns customization options for a specific forum, merged with defaults.
  """
  @spec get_options(Ecto.UUID.t()) :: {:ok, map()} | {:error, :not_found}
  def get_options(forum_id) do
    case Repo.get(Forum, forum_id) do
      nil ->
        {:error, :not_found}

      forum ->
        stored = forum.customization_options || %{}
        merged = merge_with_defaults(stored)
        {:ok, merged}
    end
  end

  @doc """
  Returns customization options for a specific category of a forum.
  """
  @spec get_category_options(Ecto.UUID.t(), atom() | String.t()) ::
          {:ok, map()} | {:error, :not_found | :invalid_category}
  def get_category_options(forum_id, category) when is_binary(category) do
    get_category_options(forum_id, String.to_existing_atom(category))
  rescue
    ArgumentError -> {:error, :invalid_category}
  end

  def get_category_options(forum_id, category) when is_atom(category) do
    if category in @categories do
      case get_options(forum_id) do
        {:ok, options} -> {:ok, Map.get(options, category, %{})}
        error -> error
      end
    else
      {:error, :invalid_category}
    end
  end

  @doc """
  Updates customization options for a specific category.
  Only forum admins/owners should call this (authorization in controller).
  """
  @spec update_options(Ecto.UUID.t(), atom() | String.t(), map()) ::
          {:ok, Forum.t()} | {:error, Ecto.Changeset.t() | :not_found | :invalid_category}
  def update_options(forum_id, category, changes) when is_binary(category) do
    update_options(forum_id, String.to_existing_atom(category), changes)
  rescue
    ArgumentError -> {:error, :invalid_category}
  end

  def update_options(forum_id, category, changes) when is_atom(category) do
    if category in @categories do
      case Repo.get(Forum, forum_id) do
        nil ->
          {:error, :not_found}

        forum ->
          current = forum.customization_options || %{}
          category_key = Atom.to_string(category)

          # Validate and filter changes against defined options
          valid_keys = get_valid_keys(category)
          filtered = Map.take(changes, valid_keys ++ Enum.map(valid_keys, &String.to_atom/1))
          string_filtered = for {k, v} <- filtered, into: %{}, do: {to_string(k), v}

          updated = Map.put(current, category_key, Map.merge(current[category_key] || %{}, string_filtered))

          forum
          |> Ecto.Changeset.change(customization_options: updated)
          |> Repo.update()
      end
    else
      {:error, :invalid_category}
    end
  end

  @doc """
  Resets a category to defaults.
  """
  @spec reset_category(Ecto.UUID.t(), atom() | String.t()) ::
          {:ok, Forum.t()} | {:error, :not_found | :invalid_category}
  def reset_category(forum_id, category) when is_binary(category) do
    reset_category(forum_id, String.to_existing_atom(category))
  rescue
    ArgumentError -> {:error, :invalid_category}
  end

  def reset_category(forum_id, category) when is_atom(category) do
    if category in @categories do
      case Repo.get(Forum, forum_id) do
        nil ->
          {:error, :not_found}

        forum ->
          current = forum.customization_options || %{}
          updated = Map.delete(current, Atom.to_string(category))

          forum
          |> Ecto.Changeset.change(customization_options: updated)
          |> Repo.update()
      end
    else
      {:error, :invalid_category}
    end
  end

  # ===========================================================================
  # PRIVATE HELPERS
  # ===========================================================================

  defp merge_with_defaults(stored) do
    for {category, options} <- @customization_options, into: %{} do
      category_key = Atom.to_string(category)
      stored_category = stored[category_key] || %{}

      merged =
        for opt <- options, into: %{} do
          {opt.key, Map.get(stored_category, opt.key, opt.default)}
        end

      {category, merged}
    end
  end

  defp get_valid_keys(category) do
    @customization_options
    |> Map.get(category, [])
    |> Enum.map(& &1.key)
  end
end
