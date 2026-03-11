# Seed: 50 name styles matching COSMETICS_MANIFEST.json rarity distribution
# free: 5, common: 10, uncommon: 10, rare: 10, epic: 7, legendary: 5, mythic: 3
#
# Idempotent — uses Repo.insert_all with on_conflict: :nothing (conflict on slug).
#
# Usage:
#   mix run priv/repo/seeds/name_style_seeds.exs

alias Cgraph.Repo

now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

name_styles =
  [
    # ─── FREE (5) ───
    %{slug: "default-font", name: "Default Font", font_family: "Inter", rarity: "free",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "sans-serif", name: "Sans Serif", font_family: "Helvetica", rarity: "free",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "serif-classic", name: "Serif Classic", font_family: "Georgia", rarity: "free",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "white-text", name: "White Text", font_family: "Inter", rarity: "free",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "gray-text", name: "Gray Text", font_family: "Inter", rarity: "free",
      color_scheme: %{"primary" => "#b0b0b0"}, animation: nil},

    # ─── COMMON (10) ───
    %{slug: "monospace", name: "Monospace", font_family: "JetBrains Mono", rarity: "common",
      color_scheme: %{"primary" => "#00ff41"}, animation: nil},
    %{slug: "cursive", name: "Cursive", font_family: "Dancing Script", rarity: "common",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "bold-impact", name: "Bold Impact", font_family: "Impact", rarity: "common",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "handwritten", name: "Handwritten", font_family: "Caveat", rarity: "common",
      color_scheme: %{"primary" => "#ffffff"}, animation: nil},
    %{slug: "pixel-font", name: "Pixel Font", font_family: "Press Start 2P", rarity: "common",
      color_scheme: %{"primary" => "#00ff41"}, animation: nil},
    %{slug: "green-glow", name: "Green Glow", font_family: "Inter", rarity: "common",
      color_scheme: %{"primary" => "#00ff41", "glow" => "#00ff41"}, animation: nil},
    %{slug: "blue-tint", name: "Blue Tint", font_family: "Inter", rarity: "common",
      color_scheme: %{"primary" => "#4da6ff"}, animation: nil},
    %{slug: "red-accent", name: "Red Accent", font_family: "Inter", rarity: "common",
      color_scheme: %{"primary" => "#ff4444"}, animation: nil},
    %{slug: "gold-text", name: "Gold Text", font_family: "Inter", rarity: "common",
      color_scheme: %{"primary" => "#ffd700"}, animation: nil},
    %{slug: "purple-haze", name: "Purple Haze", font_family: "Inter", rarity: "common",
      color_scheme: %{"primary" => "#a335ee"}, animation: nil},

    # ─── UNCOMMON (10) ───
    %{slug: "shimmer", name: "Shimmer", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"primary" => "#c0c0c0", "secondary" => "#ffffff", "effect" => "shimmer"}, animation: "shimmer"},
    %{slug: "glow-pulse", name: "Glow Pulse", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"primary" => "#00f5ff", "glow" => "#00f5ff", "effect" => "pulse"}, animation: "pulse"},
    %{slug: "rainbow-shift", name: "Rainbow Shift", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"gradient" => ["#ff0000", "#ff7700", "#ffff00", "#00ff00", "#0000ff", "#8b00ff"], "effect" => "shift"}, animation: "color-shift"},
    %{slug: "neon-outline", name: "Neon Outline", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"primary" => "#ff00ff", "outline" => "#ff00ff", "glow" => "#ff00ff"}, animation: "glow"},
    %{slug: "gradient-flow", name: "Gradient Flow", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"gradient" => ["#ff6b6b", "#feca57", "#48dbfb"], "effect" => "flow"}, animation: "flow"},
    %{slug: "typewriter-effect", name: "Typewriter Effect", font_family: "Courier New", rarity: "uncommon",
      color_scheme: %{"primary" => "#00ff41"}, animation: "typewriter"},
    %{slug: "ocean-blue", name: "Ocean Blue", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"gradient" => ["#006994", "#00b4d8", "#90e0ef"]}, animation: nil},
    %{slug: "sunset-orange", name: "Sunset Orange", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"gradient" => ["#ff4500", "#ff8c00", "#ffd700"]}, animation: nil},
    %{slug: "cherry-pink", name: "Cherry Pink", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"gradient" => ["#ff6b9d", "#ff9ecd", "#ffc8dd"]}, animation: nil},
    %{slug: "emerald-shine", name: "Emerald Shine", font_family: "Inter", rarity: "uncommon",
      color_scheme: %{"gradient" => ["#00c853", "#69f0ae", "#b9f6ca"], "effect" => "shine"}, animation: "shine"},

    # ─── RARE (10) ───
    %{slug: "fire-text", name: "Fire Text", font_family: "Inter", rarity: "rare",
      color_scheme: %{"gradient" => ["#ff4500", "#ff8c00", "#ffd700"], "effect" => "fire"}, animation: "fire"},
    %{slug: "ice-crystal", name: "Ice Crystal", font_family: "Inter", rarity: "rare",
      color_scheme: %{"gradient" => ["#a8d8ea", "#e0f7ff", "#ffffff"], "effect" => "frost"}, animation: "frost"},
    %{slug: "lightning-bolt", name: "Lightning Bolt", font_family: "Inter", rarity: "rare",
      color_scheme: %{"primary" => "#ffff00", "secondary" => "#ffffff", "effect" => "spark"}, animation: "spark"},
    %{slug: "shadow-depth", name: "Shadow Depth", font_family: "Inter", rarity: "rare",
      color_scheme: %{"primary" => "#333333", "shadow" => "#000000", "effect" => "depth"}, animation: "shadow"},
    %{slug: "holographic-text", name: "Holographic Text", font_family: "Inter", rarity: "rare",
      color_scheme: %{"gradient" => ["#ff00ff", "#00ffff", "#ffff00", "#ff00ff"], "effect" => "holographic"}, animation: "holographic"},
    %{slug: "diamond-sparkle", name: "Diamond Sparkle", font_family: "Inter", rarity: "rare",
      color_scheme: %{"gradient" => ["#b9f2ff", "#e0f7ff", "#ffffff"], "effect" => "sparkle"}, animation: "sparkle"},
    %{slug: "midnight-glow", name: "Midnight Glow", font_family: "Inter", rarity: "rare",
      color_scheme: %{"gradient" => ["#0d0d2b", "#1a1a4e", "#4b0082"], "glow" => "#6b21a8"}, animation: "glow"},
    %{slug: "star-prefix", name: "Star Prefix", font_family: "Inter", rarity: "rare",
      color_scheme: %{"primary" => "#ffd700", "prefix" => "★"}, animation: nil},
    %{slug: "crown-prefix", name: "Crown Prefix", font_family: "Inter", rarity: "rare",
      color_scheme: %{"primary" => "#ffd700", "prefix" => "👑"}, animation: nil},
    %{slug: "shield-prefix", name: "Shield Prefix", font_family: "Inter", rarity: "rare",
      color_scheme: %{"primary" => "#4da6ff", "prefix" => "🛡️"}, animation: nil},

    # ─── EPIC (7) ───
    %{slug: "plasma-wave", name: "Plasma Wave", font_family: "Inter", rarity: "epic",
      color_scheme: %{"gradient" => ["#00ff88", "#ff00ff", "#00f5ff"], "effect" => "plasma"}, animation: "plasma"},
    %{slug: "cosmic-dust-text", name: "Cosmic Dust", font_family: "Inter", rarity: "epic",
      color_scheme: %{"gradient" => ["#4b0082", "#9370db", "#e6e6fa"], "effect" => "particles"}, animation: "particles"},
    %{slug: "dragon-prefix", name: "Dragon Prefix", font_family: "Inter", rarity: "epic",
      color_scheme: %{"gradient" => ["#ff4500", "#ff8c00"], "prefix" => "🐉"}, animation: "fire"},
    %{slug: "phoenix-prefix", name: "Phoenix Prefix", font_family: "Inter", rarity: "epic",
      color_scheme: %{"gradient" => ["#ff4500", "#ffd700", "#ff6600"], "prefix" => "🔥"}, animation: "fire"},
    %{slug: "diamond-prefix", name: "Diamond Prefix", font_family: "Inter", rarity: "epic",
      color_scheme: %{"gradient" => ["#b9f2ff", "#e0f7ff"], "prefix" => "💎"}, animation: "sparkle"},
    %{slug: "sparkle-suffix", name: "Sparkle Suffix", font_family: "Inter", rarity: "epic",
      color_scheme: %{"gradient" => ["#ffd700", "#ffec8b"], "suffix" => "✨"}, animation: "sparkle"},
    %{slug: "verified-suffix", name: "Verified Suffix", font_family: "Inter", rarity: "epic",
      color_scheme: %{"primary" => "#4da6ff", "suffix" => "✓"}, animation: nil},

    # ─── LEGENDARY (5) ───
    %{slug: "void-text", name: "Void Text", font_family: "Inter", rarity: "legendary",
      color_scheme: %{"gradient" => ["#0d0d2b", "#4b0082", "#9370db"], "effect" => "void", "glow" => "#4b0082"}, animation: "void"},
    %{slug: "aurora-text", name: "Aurora Text", font_family: "Inter", rarity: "legendary",
      color_scheme: %{"gradient" => ["#00ff88", "#00f5ff", "#ff00ff", "#ffd700"], "effect" => "aurora"}, animation: "aurora"},
    %{slug: "eternal-prefix", name: "Eternal Prefix", font_family: "Inter", rarity: "legendary",
      color_scheme: %{"gradient" => ["#ff8000", "#ffd700"], "prefix" => "∞"}, animation: "pulse"},
    %{slug: "crown-jewel-suffix", name: "Crown Jewel Suffix", font_family: "Inter", rarity: "legendary",
      color_scheme: %{"gradient" => ["#ffd700", "#ff8000"], "suffix" => "👑"}, animation: "sparkle"},
    %{slug: "legendary-glow", name: "Legendary Glow", font_family: "Inter", rarity: "legendary",
      color_scheme: %{"gradient" => ["#ff8000", "#ffd700", "#ffffff"], "glow" => "#ff8000", "effect" => "radiant"}, animation: "radiant"},

    # ─── MYTHIC (3) ───
    %{slug: "genesis-text", name: "Genesis Text", font_family: "Inter", rarity: "mythic",
      color_scheme: %{"gradient" => ["#e6cc80", "#ffd700", "#ffffff", "#e6cc80"], "effect" => "genesis", "glow" => "#e6cc80", "particles" => true}, animation: "genesis"},
    %{slug: "transcendent-text", name: "Transcendent Text", font_family: "Inter", rarity: "mythic",
      color_scheme: %{"gradient" => ["#ff00ff", "#00f5ff", "#ffd700", "#ff00ff"], "effect" => "transcendent", "glow" => "#ffffff", "distortion" => true}, animation: "transcendent"},
    %{slug: "mythic-crown-prefix", name: "Mythic Crown Prefix", font_family: "Inter", rarity: "mythic",
      color_scheme: %{"gradient" => ["#e6cc80", "#ff00ff", "#00f5ff"], "prefix" => "👑", "glow" => "#e6cc80", "particles" => true}, animation: "mythic"}
  ]
  |> Enum.with_index(1)
  |> Enum.map(fn {style, idx} ->
    Map.merge(style, %{
      id: Ecto.UUID.generate(),
      previewable: true,
      sort_order: idx,
      is_active: true,
      inserted_at: now,
      updated_at: now
    })
  end)

{count, _} = Repo.insert_all("name_styles", name_styles, on_conflict: :nothing, conflict_target: :slug)
IO.puts("✓ Seeded #{count}/#{length(name_styles)} name styles (on_conflict: :nothing)")
