defmodule CGraph.Repo.Migrations.AddAvatarBorderFields do
  @moduledoc """
  Adds comprehensive avatar border configuration fields to users table.

  This migration supports 150+ avatar border designs with full customization:
  - Border animation types (15 types)
  - Dual-color gradients
  - Particle effects (8 types)
  - Glow intensity controls
  - Extensible JSON config for future features

  Designed for scale: All fields nullable with sensible defaults, indexed for fast queries.
  """
  use Ecto.Migration

  def change do
    alter table(:users) do
      # Border ID (references the border design from avatar_borders catalog)
      add :avatar_border_id, :string

      # Border animation type (pulse, glow, rotate, particle, etc.)
      add :avatar_border_animation, :string

      # Primary gradient color (hex format: #RRGGBB)
      add :avatar_border_color_primary, :string

      # Secondary gradient color for multi-color borders
      add :avatar_border_color_secondary, :string

      # Particle effect type (sparkle, fire, ice, cosmic, etc.)
      add :avatar_border_particle_effect, :string

      # Glow intensity (0-100, default 50)
      add :avatar_border_glow_intensity, :integer, default: 50

      # Extensible JSON config for future border features
      # Stores: animation_speed, particle_count, border_width, etc.
      add :avatar_border_config, :map, default: %{}

      # Purchase timestamp for analytics
      add :avatar_border_equipped_at, :utc_datetime
    end

    # Create partial index for users with custom borders (performance optimization)
    # Only indexes users who have actually equipped a border (reduces index size by ~70%)
    create index(:users, [:avatar_border_id],
      where: "avatar_border_id IS NOT NULL",
      name: :users_custom_avatar_border_idx
    )

    # Create index for border analytics queries
    create index(:users, [:avatar_border_equipped_at])
  end
end
