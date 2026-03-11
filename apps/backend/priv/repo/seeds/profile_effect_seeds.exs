# Seed: 18 profile effects (NEW cosmetic type, not in manifest)
# free: 2, common: 4, uncommon: 4, rare: 3, epic: 2, legendary: 2, mythic: 1
#
# Profile effects are visual enhancements (particle, aura, trail) applied
# to user profiles. Types: particle, aura, trail.
#
# Idempotent — uses Repo.insert_all with on_conflict: :nothing (conflict on slug).
#
# Usage:
#   mix run priv/repo/seeds/profile_effect_seeds.exs

alias Cgraph.Repo

now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

effects =
  [
    # ─── FREE (2) ───
    %{slug: "subtle-glow", name: "Subtle Glow", type: "aura", rarity: "free",
      config: %{"color" => "#ffffff", "intensity" => 0.3, "radius" => 10},
      preview_url: "/images/effects/subtle-glow.webp"},
    %{slug: "basic-sparkle", name: "Basic Sparkle", type: "particle", rarity: "free",
      config: %{"color" => "#ffe4b5", "count" => 5, "speed" => 0.5, "size" => 3},
      preview_url: "/images/effects/basic-sparkle.webp"},

    # ─── COMMON (4) ───
    %{slug: "floating-dust", name: "Floating Dust", type: "particle", rarity: "common",
      config: %{"color" => "#d4a574", "count" => 8, "speed" => 0.3, "size" => 2, "drift" => true},
      preview_url: "/images/effects/floating-dust.webp"},
    %{slug: "soft-aura", name: "Soft Aura", type: "aura", rarity: "common",
      config: %{"color" => "#87ceeb", "intensity" => 0.4, "radius" => 15, "pulse" => true},
      preview_url: "/images/effects/soft-aura.webp"},
    %{slug: "light-trail", name: "Light Trail", type: "trail", rarity: "common",
      config: %{"color" => "#98fb98", "length" => 20, "fade" => 0.8, "width" => 2},
      preview_url: "/images/effects/light-trail.webp"},
    %{slug: "gentle-bubbles", name: "Gentle Bubbles", type: "particle", rarity: "common",
      config: %{"color" => "#add8e6", "count" => 6, "speed" => 0.4, "size" => 4, "opacity" => 0.6},
      preview_url: "/images/effects/gentle-bubbles.webp"},

    # ─── UNCOMMON (4) ───
    %{slug: "ember-particles", name: "Ember Particles", type: "particle", rarity: "uncommon",
      config: %{"color" => "#ff4500", "count" => 12, "speed" => 0.6, "size" => 3, "glow" => true},
      preview_url: "/images/effects/ember-particles.webp"},
    %{slug: "electric-aura", name: "Electric Aura", type: "aura", rarity: "uncommon",
      config: %{"color" => "#00f5ff", "intensity" => 0.6, "radius" => 20, "flicker" => true},
      preview_url: "/images/effects/electric-aura.webp"},
    %{slug: "neon-trail", name: "Neon Trail", type: "trail", rarity: "uncommon",
      config: %{"color" => "#ff00ff", "length" => 30, "fade" => 0.7, "width" => 3, "glow" => true},
      preview_url: "/images/effects/neon-trail.webp"},
    %{slug: "snow-flurry", name: "Snow Flurry", type: "particle", rarity: "uncommon",
      config: %{"color" => "#f0f8ff", "count" => 15, "speed" => 0.3, "size" => 4, "drift" => true, "rotation" => true},
      preview_url: "/images/effects/snow-flurry.webp"},

    # ─── RARE (3) ───
    %{slug: "flame-aura", name: "Flame Aura", type: "aura", rarity: "rare",
      config: %{"color" => "#ff6600", "secondary_color" => "#ffcc00", "intensity" => 0.7, "radius" => 25, "animated" => true},
      preview_url: "/images/effects/flame-aura.webp"},
    %{slug: "star-burst", name: "Star Burst", type: "particle", rarity: "rare",
      config: %{"color" => "#ffd700", "count" => 20, "speed" => 0.8, "size" => 5, "burst" => true, "glow" => true},
      preview_url: "/images/effects/star-burst.webp"},
    %{slug: "rainbow-trail", name: "Rainbow Trail", type: "trail", rarity: "rare",
      config: %{"colors" => ["#ff0000", "#ff7700", "#ffff00", "#00ff00", "#0000ff", "#8b00ff"], "length" => 40, "fade" => 0.6, "width" => 4},
      preview_url: "/images/effects/rainbow-trail.webp"},

    # ─── EPIC (2) ───
    %{slug: "cosmic-dust", name: "Cosmic Dust", type: "particle", rarity: "epic",
      config: %{"color" => "#4b0082", "secondary_color" => "#9370db", "count" => 30, "speed" => 0.5, "size" => 3, "glow" => true, "twinkle" => true},
      preview_url: "/images/effects/cosmic-dust.webp"},
    %{slug: "plasma-aura", name: "Plasma Aura", type: "aura", rarity: "epic",
      config: %{"color" => "#00ff88", "secondary_color" => "#ff00ff", "intensity" => 0.8, "radius" => 30, "animated" => true, "morph" => true},
      preview_url: "/images/effects/plasma-aura.webp"},

    # ─── LEGENDARY (2) ───
    %{slug: "phoenix-flame", name: "Phoenix Flame", type: "aura", rarity: "legendary",
      config: %{"color" => "#ff4500", "secondary_color" => "#ffd700", "intensity" => 0.9, "radius" => 35, "animated" => true, "particles" => true, "particle_count" => 16},
      preview_url: "/images/effects/phoenix-flame.webp"},
    %{slug: "void-particles", name: "Void Particles", type: "particle", rarity: "legendary",
      config: %{"color" => "#0d0d2b", "secondary_color" => "#4b0082", "count" => 40, "speed" => 0.4, "size" => 4, "glow" => true, "distortion" => true},
      preview_url: "/images/effects/void-particles.webp"},

    # ─── MYTHIC (1) ───
    %{slug: "reality-warp", name: "Reality Warp", type: "aura", rarity: "mythic",
      config: %{"color" => "#e6cc80", "secondary_color" => "#ff00ff", "tertiary_color" => "#00f5ff", "intensity" => 1.0, "radius" => 40, "animated" => true, "particles" => true, "particle_count" => 24, "distortion" => true, "bloom" => true},
      preview_url: "/images/effects/reality-warp.webp"}
  ]
  |> Enum.with_index(1)
  |> Enum.map(fn {effect, idx} ->
    Map.merge(effect, %{
      id: Ecto.UUID.generate(),
      sort_order: idx,
      is_active: true,
      inserted_at: now,
      updated_at: now
    })
  end)

{count, _} = Repo.insert_all("profile_effects", effects, on_conflict: :nothing, conflict_target: :slug)
IO.puts("✓ Seeded #{count}/#{length(effects)} profile effects (on_conflict: :nothing)")
