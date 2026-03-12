# Seed: 103 profile frames matching COSMETICS_MANIFEST.json rarity distribution
# free: 8, common: 20, uncommon: 20, rare: 20, epic: 15, legendary: 12, mythic: 8
#
# Idempotent — uses Repo.insert_all with on_conflict: :nothing (conflict on slug).
#
# Usage:
#   mix run priv/repo/seeds/profile_frame_seeds.exs

alias Cgraph.Repo

now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

frames =
  [
    # ─── FREE (5) ───
    %{slug: "default-circle", name: "Default Circle", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "default-rounded", name: "Default Rounded", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "default-square", name: "Default Square", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "thin-border", name: "Thin Border", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "dotted-ring", name: "Dotted Ring", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},

    # ─── COMMON (10) ───
    %{slug: "ocean-ring", name: "Ocean Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "forest-ring", name: "Forest Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "sunset-ring", name: "Sunset Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "sky-frame", name: "Sky Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "pastel-ring", name: "Pastel Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "copper-ring", name: "Copper Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 75}, animated: false},
    %{slug: "silver-frame", name: "Silver Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 75}, animated: false},
    %{slug: "wooden-frame", name: "Wooden Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "stone-frame", name: "Stone Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "simple-glow", name: "Simple Glow", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 40}, animated: false},

    # ─── UNCOMMON (10) ───
    %{slug: "neon-ring", name: "Neon Ring", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "cyber-frame", name: "Cyber Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "pixel-border", name: "Pixel Border", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 125}, animated: false},
    %{slug: "retro-tv", name: "Retro TV", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 140}, animated: false},
    %{slug: "aurora-ring", name: "Aurora Ring", rarity: "uncommon", unlock_type: "achievement", unlock_condition: %{"description" => "14-day streak"}, animated: true},
    %{slug: "crystal-frame", name: "Crystal Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 175}, animated: false},
    %{slug: "flower-wreath", name: "Flower Wreath", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 130}, animated: false},
    %{slug: "lightning-frame", name: "Lightning Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 160}, animated: true},
    %{slug: "gear-frame", name: "Gear Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "vine-wrap", name: "Vine Wrap", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 125}, animated: false},

    # ─── RARE (10) ───
    %{slug: "dragon-frame", name: "Dragon Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},
    %{slug: "phoenix-ring", name: "Phoenix Ring", rarity: "rare", unlock_type: "achievement", unlock_condition: %{"description" => "30-day streak"}, animated: true},
    %{slug: "holographic-frame", name: "Holographic Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 400}, animated: true},
    %{slug: "animated-pulse", name: "Animated Pulse", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 375}, animated: true},
    %{slug: "sakura-frame", name: "Sakura Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 325}, animated: true},
    %{slug: "cosmic-ring", name: "Cosmic Ring", rarity: "rare", unlock_type: "achievement", unlock_condition: %{"description" => "50 forum posts"}, animated: true},
    %{slug: "royal-frame", name: "Royal Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 450}, animated: false},
    %{slug: "steampunk-frame", name: "Steampunk Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 375}, animated: true},
    %{slug: "enchanted-ring", name: "Enchanted Ring", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 400}, animated: true},
    %{slug: "lava-frame", name: "Lava Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},

    # ─── EPIC (8) ───
    %{slug: "diamond-frame", name: "Diamond Frame", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 800}, animated: true},
    %{slug: "enchanted-glow", name: "Enchanted Glow", rarity: "epic", unlock_type: "achievement", unlock_condition: %{"description" => "90-day streak"}, animated: true},
    %{slug: "quantum-ring", name: "Quantum Ring", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 850}, animated: true},
    %{slug: "volcanic-frame", name: "Volcanic Frame", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 800}, animated: true},
    %{slug: "celestial-frame", name: "Celestial Frame", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 900}, animated: true},
    %{slug: "prismatic-ring", name: "Prismatic Ring", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 950}, animated: true},
    %{slug: "ancient-rune", name: "Ancient Rune", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 850}, animated: true},
    %{slug: "nebula-frame", name: "Nebula Frame", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 900}, animated: true},

    # ─── LEGENDARY (7) ───
    %{slug: "prismatic-frame", name: "Prismatic Frame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "180-day streak"}, animated: true},
    %{slug: "eternal-flame-frame", name: "Eternal Flame Frame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "All fire achievements"}, animated: true},
    %{slug: "void-ring", name: "Void Ring", rarity: "legendary", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 2500}, animated: true},
    %{slug: "divine-frame", name: "Divine Frame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "Top 1% reputation"}, animated: true},
    %{slug: "aurora-crown", name: "Aurora Crown", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "All legendary cosmetics"}, animated: true},
    %{slug: "dragon-throne", name: "Dragon Throne", rarity: "legendary", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 3000}, animated: true},
    %{slug: "cosmic-halo", name: "Cosmic Halo", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "All space items"}, animated: true},

    # ─── MYTHIC (5) ───
    %{slug: "infinity-frame", name: "Infinity Frame", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Complete all collections"}, animated: true},
    %{slug: "genesis-ring", name: "Genesis Ring", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Founding member"}, animated: true},
    %{slug: "transcendent-frame", name: "Transcendent Frame", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Max prestige"}, animated: true},
    %{slug: "celestial-throne", name: "Celestial Throne", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "All mythic items"}, animated: true},
    %{slug: "omega-frame", name: "Omega Frame", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Complete everything"}, animated: true},

    # ═══════════════════════════════════════════════════════════════════
    # PHASE-40 EXPANSION: +48 frames (themes: celestial, nature,
    # cyberpunk, steampunk, elemental, mythological, holiday, achievement)
    # ═══════════════════════════════════════════════════════════════════

    # ─── FREE +3 (geometric shapes) ───
    %{slug: "hexagon-frame", name: "Hexagon Frame", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "triangle-frame", name: "Triangle Frame", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},
    %{slug: "oval-frame", name: "Oval Frame", rarity: "free", unlock_type: "default", unlock_condition: %{"description" => "Account created"}, animated: false},

    # ─── COMMON +10 ───
    %{slug: "star-frame", name: "Star Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 50}, animated: false},
    %{slug: "crescent-frame", name: "Crescent Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 55}, animated: false},
    %{slug: "ivy-frame", name: "Ivy Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "blossom-ring", name: "Blossom Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 65}, animated: false},
    %{slug: "coral-frame", name: "Coral Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 60}, animated: false},
    %{slug: "glitch-frame", name: "Glitch Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 70}, animated: false},
    %{slug: "matrix-ring", name: "Matrix Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 75}, animated: false},
    %{slug: "brass-frame", name: "Brass Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 55}, animated: false},
    %{slug: "clockwork-ring", name: "Clockwork Ring", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 65}, animated: false},
    %{slug: "snowflake-frame", name: "Snowflake Frame", rarity: "common", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 40}, animated: false},

    # ─── UNCOMMON +10 ───
    %{slug: "constellation-ring", name: "Constellation Ring", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "mountain-frame", name: "Mountain Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 125}, animated: false},
    %{slug: "leaf-crown", name: "Leaf Crown", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 130}, animated: false},
    %{slug: "hologram-frame", name: "Hologram Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 175}, animated: true},
    %{slug: "circuit-frame", name: "Circuit Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 140}, animated: false},
    %{slug: "cogwheel-frame", name: "Cogwheel Frame", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 160}, animated: true},
    %{slug: "steam-ring", name: "Steam Ring", rarity: "uncommon", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 150}, animated: true},
    %{slug: "ice-frame", name: "Ice Frame", rarity: "uncommon", unlock_type: "achievement", unlock_condition: %{"description" => "Win 10 ice-themed challenges"}, animated: false},
    %{slug: "earth-frame", name: "Earth Frame", rarity: "uncommon", unlock_type: "achievement", unlock_condition: %{"description" => "Plant 5 community seeds"}, animated: false},
    %{slug: "water-frame", name: "Water Frame", rarity: "uncommon", unlock_type: "reputation", unlock_condition: %{"description" => "Reach 500 reputation"}, animated: true},

    # ─── RARE +10 ───
    %{slug: "solar-flare-frame", name: "Solar Flare Frame", rarity: "rare", unlock_type: "achievement", unlock_condition: %{"description" => "Complete solar event"}, animated: true},
    %{slug: "comet-trail-frame", name: "Comet Trail Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},
    %{slug: "data-stream-frame", name: "Data Stream Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 400}, animated: true},
    %{slug: "cog-frame", name: "Cog Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 375}, animated: true},
    %{slug: "flame-frame-ii", name: "Flame Frame II", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 325}, animated: true},
    %{slug: "lightning-bolt-frame", name: "Lightning Bolt Frame", rarity: "rare", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 350}, animated: true},
    %{slug: "griffin-frame", name: "Griffin Frame", rarity: "rare", unlock_type: "achievement", unlock_condition: %{"description" => "Defeat the Griffin boss"}, animated: true},
    %{slug: "unicorn-frame", name: "Unicorn Frame", rarity: "rare", unlock_type: "reputation", unlock_condition: %{"description" => "Reach 1000 reputation"}, animated: true},
    %{slug: "heartstring-frame", name: "Heartstring Frame", rarity: "rare", unlock_type: "seasonal", unlock_condition: %{"description" => "Valentine's event 2026"}, animated: true},
    %{slug: "firework-frame", name: "Firework Frame", rarity: "rare", unlock_type: "seasonal", unlock_condition: %{"description" => "New Year event 2026"}, animated: true},

    # ─── EPIC +7 ───
    %{slug: "dragon-scale-frame", name: "Dragon Scale Frame", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 800}, animated: true},
    %{slug: "phoenix-frame", name: "Phoenix Frame", rarity: "epic", unlock_type: "achievement", unlock_condition: %{"description" => "Rise from zero reputation"}, animated: true},
    %{slug: "kraken-ring", name: "Kraken Ring", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 900}, animated: true},
    %{slug: "jack-o-lantern", name: "Jack-O-Lantern", rarity: "epic", unlock_type: "seasonal", unlock_condition: %{"description" => "Halloween event 2026"}, animated: true},
    %{slug: "streak-30-frame", name: "Streak 30 Frame", rarity: "epic", unlock_type: "achievement", unlock_condition: %{"description" => "30-day login streak"}, animated: true},
    %{slug: "streak-90-frame", name: "Streak 90 Frame", rarity: "epic", unlock_type: "purchase", unlock_condition: %{"description" => "Buy from shop", "nodes_cost" => 950}, animated: true},
    %{slug: "veteran-frame", name: "Veteran Frame", rarity: "epic", unlock_type: "reputation", unlock_condition: %{"description" => "Reach 5000 reputation"}, animated: true},

    # ─── LEGENDARY +5 ───
    %{slug: "centurion-frame", name: "Centurion Frame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "100-day login streak"}, animated: true},
    %{slug: "northern-lights-frame", name: "Northern Lights Frame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "All celestial items collected"}, animated: true},
    %{slug: "wyrm-frame", name: "Wyrm Frame", rarity: "legendary", unlock_type: "achievement", unlock_condition: %{"description" => "Defeat all mythological bosses"}, animated: true},
    %{slug: "galaxy-frame", name: "Galaxy Frame", rarity: "legendary", unlock_type: "reputation", unlock_condition: %{"description" => "Reach 10000 reputation"}, animated: true},
    %{slug: "titan-frame", name: "Titan Frame", rarity: "legendary", unlock_type: "reputation", unlock_condition: %{"description" => "Top 5% reputation"}, animated: true},

    # ─── MYTHIC +3 ───
    %{slug: "eternity-frame", name: "Eternity Frame", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "365-day login streak"}, animated: true},
    %{slug: "primordial-ring", name: "Primordial Ring", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "All seasonal events completed"}, animated: true},
    %{slug: "singularity-frame", name: "Singularity Frame", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Unlock every cosmetic type"}, animated: true}
  ]
  |> Enum.with_index(1)
  |> Enum.map(fn {frame, idx} ->
    Map.merge(frame, %{
      id: Ecto.UUID.generate(),
      frame_url: "/images/frames/#{frame.slug}.png",
      sort_order: idx,
      is_active: true,
      inserted_at: now,
      updated_at: now
    })
  end)

{count, _} = Repo.insert_all("profile_frames", frames, on_conflict: :nothing, conflict_target: :slug)
IO.puts("✓ Seeded #{count}/#{length(frames)} profile frames (on_conflict: :nothing)")
