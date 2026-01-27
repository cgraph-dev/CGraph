defmodule CGraph.Repo.Migrations.ExpandChatCustomizations do
  @moduledoc """
  Expands user_customizations table to store all 20 chat customization fields.

  Previously only stored 3 fields (bubble_style, message_effect, reaction_style).
  Now stores complete customization state including:
  - Visual styling (colors, opacity, radius, shadows)
  - Typography (font, size, weight)
  - Animations (entrance, hover, particle effects)
  - Audio (sound effects)
  - Accessibility (haptic feedback, animation intensity)

  Performance: All fields have sensible defaults, minimizing NULL checks.
  Scale: Indexed on user_id for O(1) lookups. JSONB fields for extensibility.
  """
  use Ecto.Migration

  def change do
    alter table(:user_customizations) do
      # === Bubble Appearance (4 NEW fields) ===
      add :bubble_color, :string
      add :bubble_opacity, :integer, default: 100
      add :bubble_radius, :integer, default: 16
      add :bubble_shadow, :string, default: "medium"

      # === Typography (4 NEW fields) ===
      add :text_color, :string
      add :text_size, :integer, default: 14
      add :text_weight, :string, default: "400"
      add :font_family, :string, default: "Inter"

      # === Animations (3 NEW fields) ===
      add :entrance_animation, :string, default: "fade"
      add :hover_effect, :string, default: "lift"
      add :animation_intensity, :string, default: "medium"

      # === Advanced Effects (4 NEW fields) ===
      # Note: particle_effect already exists in original migration
      add :glass_effect, :string, default: "default"
      add :border_style, :string, default: "none"
      add :sound_effect, :string
      add :voice_visualizer_theme, :string, default: "cyber_blue"

      # === Accessibility (1 NEW field) ===
      add :haptic_feedback, :boolean, default: true

      # === Extensibility (2 NEW fields) ===
      # JSONB for future customization features without schema changes
      # Examples: custom_css, theme_presets, seasonal_effects
      add :custom_config, :map, default: %{}

      # === Analytics (2 NEW fields) ===
      add :last_updated_at, :utc_datetime
      add :preset_name, :string
    end

    # Performance: Composite index for user lookups
    create index(:user_customizations, [:user_id, :last_updated_at])

    # Analytics: Index for popular presets
    create index(:user_customizations, [:preset_name],
      where: "preset_name IS NOT NULL",
      name: :user_customizations_preset_idx
    )
  end
end
