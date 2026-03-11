# Seed: 45 nameplates matching COSMETICS_MANIFEST.json rarity distribution
# free: 5, common: 10, uncommon: 10, rare: 8, epic: 5, legendary: 4, mythic: 3
#
# Idempotent — uses Repo.insert_all with on_conflict: :nothing (conflict on slug).
#
# Usage:
#   mix run priv/repo/seeds/nameplate_seeds.exs

alias Cgraph.Repo

now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

# Background/text color palettes per rarity tier
styles = %{
  "free" => %{text_color: "#e0e0e0", border_style: "solid", bg_prefix: "basic"},
  "common" => %{text_color: "#ffffff", border_style: "solid", bg_prefix: "common"},
  "uncommon" => %{text_color: "#1eff00", border_style: "double", bg_prefix: "uncommon"},
  "rare" => %{text_color: "#0070dd", border_style: "groove", bg_prefix: "rare"},
  "epic" => %{text_color: "#a335ee", border_style: "ridge", bg_prefix: "epic"},
  "legendary" => %{text_color: "#ff8000", border_style: "outset", bg_prefix: "legendary"},
  "mythic" => %{text_color: "#e6cc80", border_style: "double", bg_prefix: "mythic"}
}

nameplates =
  [
    # ─── FREE (5) ───
    %{slug: "default-plate", name: "Default Plate", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "simple-gradient", name: "Simple Gradient", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "clean-border", name: "Clean Border", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "minimal-dark", name: "Minimal Dark", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "minimal-light", name: "Minimal Light", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},

    # ─── COMMON (10) ───
    %{slug: "ocean-wave", name: "Ocean Wave", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "sunset-glow", name: "Sunset Glow", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "forest-green", name: "Forest Green", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "sky-blue", name: "Sky Blue", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "rose-gold", name: "Rose Gold", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 75}, animated: false},
    %{slug: "silver-shine", name: "Silver Shine", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 75}, animated: false},
    %{slug: "copper-tone", name: "Copper Tone", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 75}, animated: false},
    %{slug: "pastel-dream", name: "Pastel Dream", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "warm-earth", name: "Warm Earth", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "cool-mint", name: "Cool Mint", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},

    # ─── UNCOMMON (10) ───
    %{slug: "neon-pulse", name: "Neon Pulse", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "cyber-grid", name: "Cyber Grid", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "retro-pixel", name: "Retro Pixel", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 125}, animated: false},
    %{slug: "vaporwave", name: "Vaporwave", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 125}, animated: true},
    %{slug: "aurora-borealis", name: "Aurora Borealis", rarity: "uncommon", unlock_type: "achievement", unlock_condition: %{"description" => "14-day streak"}, animated: true},
    %{slug: "galaxy-swirl", name: "Galaxy Swirl", rarity: "uncommon", unlock_type: "achievement", unlock_condition: %{"description" => "Send 1000 messages"}, animated: true},
    %{slug: "crystal-ice", name: "Crystal Ice", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: false},
    %{slug: "flame-border", name: "Flame Border", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "lightning-strike", name: "Lightning Strike", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "bamboo-zen", name: "Bamboo Zen", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 125}, animated: false},

    # ─── RARE (8) ───
    %{slug: "dragon-scale", name: "Dragon Scale", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 300}, animated: true},
    %{slug: "phoenix-feather", name: "Phoenix Feather", rarity: "rare", unlock_type: "achievement", unlock_condition: %{"description" => "30-day streak"}, animated: true},
    %{slug: "holographic", name: "Holographic", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},
    %{slug: "animated-matrix", name: "Animated Matrix", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},
    %{slug: "sakura-bloom", name: "Sakura Bloom", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 300}, animated: true},
    %{slug: "cosmic-nebula", name: "Cosmic Nebula", rarity: "rare", unlock_type: "achievement", unlock_condition: %{"description" => "50 forum posts"}, animated: true},
    %{slug: "royal-crest", name: "Royal Crest", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 400}, animated: false},
    %{slug: "steampunk-gears", name: "Steampunk Gears", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},

    # ─── EPIC (5) ───
    %{slug: "diamond-shimmer", name: "Diamond Shimmer", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 750}, animated: true},
    %{slug: "enchanted-forest", name: "Enchanted Forest", rarity: "epic", unlock_type: "achievement", unlock_condition: %{"description" => "90-day streak"}, animated: true},
    %{slug: "quantum-flux", name: "Quantum Flux", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 800}, animated: true},
    %{slug: "volcanic-eruption", name: "Volcanic Eruption", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 750}, animated: true},
    %{slug: "celestial-gold", name: "Celestial Gold", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 800}, animated: true},

    # ─── LEGENDARY (4) ───
    %{slug: "prismatic-cascade", name: "Prismatic Cascade", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "180-day streak"}, animated: true},
    %{slug: "eternal-flame", name: "Eternal Flame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "All fire badges"}, animated: true},
    %{slug: "void-walker", name: "Void Walker", rarity: "legendary", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 2000}, animated: true},
    %{slug: "divine-aura", name: "Divine Aura", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "Top 1% reputation"}, animated: true},

    # ─── MYTHIC (3) ───
    %{slug: "infinity-loop", name: "Infinity Loop", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Complete all collections"}, animated: true},
    %{slug: "genesis-plate", name: "Genesis Plate", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Founding member"}, animated: true},
    %{slug: "transcendence", name: "Transcendence", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Max prestige"}, animated: true}
  ]
  |> Enum.with_index(1)
  |> Enum.map(fn {np, idx} ->
    style = Map.get(styles, np.rarity)

    Map.merge(np, %{
      id: Ecto.UUID.generate(),
      background_url: "/images/nameplates/#{np.slug}.png",
      text_color: style.text_color,
      border_style: style.border_style,
      sort_order: idx,
      is_active: true,
      inserted_at: now,
      updated_at: now
    })
  end)

{count, _} = Repo.insert_all("nameplates", nameplates, on_conflict: :nothing, conflict_target: :slug)
IO.puts("✓ Seeded #{count}/#{length(nameplates)} nameplates (on_conflict: :nothing)")
