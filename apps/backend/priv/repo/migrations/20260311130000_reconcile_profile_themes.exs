defmodule CGraph.Repo.Migrations.ReconcileProfileThemes do
  @moduledoc """
  Reconciles profile themes from the legacy 22-set to the canonical 25-set.

  Maps old backend slugs to unified slugs shared with the frontend.
  Adds new themes (default, midnight, sakura, gold, arctic) that were
  previously frontend-only.

  Reversible: down/0 restores original slug values.
  """
  use Ecto.Migration

  # Old slug → New canonical slug
  @slug_mapping %{
    "gradient-aurora" => "aurora",
    "cyberpunk-neon" => "cyber",
    "fantasy-castle" => "gold",
    "ocean-deep" => "ocean",
    "forest-mystic" => "forest",
    "kawaii-pastel" => "kawaii",
    "dark-gothic" => "gothic",
    "sunset-warm" => "sunset",
    "arctic-frost" => "arctic",
    "volcanic-fire" => "volcanic",
    "galaxy-dream" => "galaxy",
    "steampunk-brass" => "steampunk"
  }

  # Reverse mapping for rollback
  @reverse_mapping Map.new(@slug_mapping, fn {old, new} -> {new, old} end)

  def up do
    # Rename existing theme slugs to canonical versions
    Enum.each(@slug_mapping, fn {old_slug, new_slug} ->
      execute("""
      UPDATE profile_themes
      SET slug = '#{new_slug}',
          preset = '#{new_slug}',
          updated_at = NOW()
      WHERE slug = '#{old_slug}'
      """)
    end)

    # Also update any user_profile_themes referencing old presets via preference column
    Enum.each(@slug_mapping, fn {old_slug, new_slug} ->
      execute("""
      UPDATE user_profile_themes
      SET updated_at = NOW()
      WHERE theme_id IN (
        SELECT id FROM profile_themes WHERE slug = '#{new_slug}'
      )
      """)
    end)

    # Insert new canonical themes that didn't exist in legacy set
    now = "NOW()"

    execute("""
    INSERT INTO profile_themes (id, slug, name, preset, rarity, unlock_type, sort_order, is_active, inserted_at, updated_at)
    VALUES
      (gen_random_uuid(), 'default', 'Default', 'default', 'common', 'default', 0, true, #{now}, #{now}),
      (gen_random_uuid(), 'midnight', 'Midnight', 'midnight', 'common', 'default', 1, true, #{now}, #{now}),
      (gen_random_uuid(), 'sakura', 'Sakura', 'sakura', 'common', 'default', 2, true, #{now}, #{now})
    ON CONFLICT (slug) DO NOTHING
    """)
  end

  def down do
    # Reverse the slug renames
    Enum.each(@reverse_mapping, fn {new_slug, old_slug} ->
      execute("""
      UPDATE profile_themes
      SET slug = '#{old_slug}',
          preset = '#{old_slug}',
          updated_at = NOW()
      WHERE slug = '#{new_slug}'
      """)
    end)

    # Remove themes that didn't exist in the legacy set
    execute("""
    DELETE FROM profile_themes
    WHERE slug IN ('default', 'midnight', 'sakura')
    """)
  end
end
