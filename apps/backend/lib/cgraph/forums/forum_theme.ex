defmodule Cgraph.Forums.ForumTheme do
  @moduledoc """
  Forum theme schema - custom themes for MyBB-style forums.
  Supports CSS customization, color schemes, and template overrides.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_themes" do
    field :name, :string
    field :slug, :string
    field :description, :string
    field :is_default, :boolean, default: false
    field :is_active, :boolean, default: true
    
    # Color scheme
    field :primary_color, :string, default: "#3B82F6"
    field :secondary_color, :string, default: "#1E40AF"
    field :accent_color, :string, default: "#F59E0B"
    field :background_color, :string, default: "#FFFFFF"
    field :text_color, :string, default: "#1F2937"
    field :link_color, :string, default: "#2563EB"
    
    # Custom CSS
    field :custom_css, :string
    
    # Header customization
    field :header_logo_url, :string
    field :header_background_url, :string
    field :header_height, :integer, default: 80
    
    # Template overrides (JSON map of template_name -> custom_html)
    field :template_overrides, :map, default: %{}
    
    # Font settings
    field :font_family, :string, default: "Inter, system-ui, sans-serif"
    field :font_size_base, :string, default: "16px"
    
    # Layout settings
    field :sidebar_position, :string, default: "right"  # left, right, none
    field :content_width, :string, default: "1200px"
    field :show_breadcrumbs, :boolean, default: true
    field :show_forum_stats, :boolean, default: true
    
    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :created_by, Cgraph.Accounts.User

    timestamps()
  end

  def changeset(theme, attrs) do
    theme
    |> cast(attrs, [
      :name, :slug, :description, :is_default, :is_active,
      :primary_color, :secondary_color, :accent_color,
      :background_color, :text_color, :link_color,
      :custom_css, :header_logo_url, :header_background_url, :header_height,
      :template_overrides, :font_family, :font_size_base,
      :sidebar_position, :content_width, :show_breadcrumbs, :show_forum_stats,
      :forum_id, :created_by_id
    ])
    |> validate_required([:name, :forum_id])
    |> generate_slug()
    |> validate_format(:primary_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_format(:secondary_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_format(:accent_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_format(:background_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_format(:text_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_format(:link_color, ~r/^#[0-9A-Fa-f]{6}$/)
    |> validate_inclusion(:sidebar_position, ["left", "right", "none"])
    |> validate_length(:custom_css, max: 100_000)
    |> unique_constraint([:forum_id, :slug])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:created_by_id)
  end

  defp generate_slug(changeset) do
    case get_change(changeset, :name) do
      nil -> changeset
      name ->
        slug = name
        |> String.downcase()
        |> String.replace(~r/[^a-z0-9\s-]/, "")
        |> String.replace(~r/\s+/, "-")
        |> String.trim("-")
        
        put_change(changeset, :slug, slug)
    end
  end
end
