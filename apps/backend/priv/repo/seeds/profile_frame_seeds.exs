# Seed: 55 profile frames matching COSMETICS_MANIFEST.json rarity distribution
# free: 5, common: 10, uncommon: 10, rare: 10, epic: 8, legendary: 7, mythic: 5
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
    %{slug: "omega-frame", name: "Omega Frame", rarity: "mythic", unlock_type: "achievement", unlock_condition: %{"description" => "Complete everything"}, animated: true}
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
