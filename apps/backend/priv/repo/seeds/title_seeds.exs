# Seed: 70 titles matching COSMETICS_MANIFEST.json rarity distribution
# free: 5, common: 15, uncommon: 15, rare: 15, epic: 10, legendary: 6, mythic: 4
#
# Idempotent — uses Repo.insert_all with on_conflict: :nothing (conflict on slug).
#
# Usage:
#   mix run priv/repo/seeds/title_seeds.exs

alias Cgraph.Repo

now = DateTime.utc_now() |> DateTime.truncate(:second)

# Color palette by rarity
rarity_colors = %{
  "free" => "#b0b0b0",
  "common" => "#ffffff",
  "uncommon" => "#1eff00",
  "rare" => "#0070dd",
  "epic" => "#a335ee",
  "legendary" => "#ff8000",
  "mythic" => "#e6cc80"
}

titles =
  [
    # ─── FREE (5) ───
    %{slug: "new-user", name: "New User", description: "The starting title for all new accounts.", rarity: "free", unlock_type: "achievement", unlock_requirement: "Account created", coin_cost: 0},
    %{slug: "member", name: "Member", description: "Active for 7 days.", rarity: "free", unlock_type: "achievement", unlock_requirement: "7 days active", coin_cost: 0},
    %{slug: "chatter", name: "Chatter", description: "Sent your first 10 messages.", rarity: "free", unlock_type: "achievement", unlock_requirement: "Send 10 messages", coin_cost: 0},
    %{slug: "forum-reader", name: "Forum Reader", description: "Read 10 forum threads.", rarity: "free", unlock_type: "achievement", unlock_requirement: "Read 10 threads", coin_cost: 0},
    %{slug: "friendly", name: "Friendly", description: "Added 3 friends.", rarity: "free", unlock_type: "achievement", unlock_requirement: "Add 3 friends", coin_cost: 0},

    # ─── COMMON (15) ───
    %{slug: "messenger", name: "Messenger", description: "Sent 200 messages.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Send 200 messages", coin_cost: 0},
    %{slug: "socialite", name: "Socialite", description: "Added 15 friends.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Add 15 friends", coin_cost: 0},
    %{slug: "forum-poster", name: "Forum Poster", description: "Posted 10 forum messages.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Post 10 forum messages", coin_cost: 0},
    %{slug: "group-member", name: "Group Member", description: "Joined 5 groups.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Join 5 groups", coin_cost: 0},
    %{slug: "voice-user", name: "Voice User", description: "Spent 5 hours in voice calls.", rarity: "common", unlock_type: "achievement", unlock_requirement: "5 hours voice calls", coin_cost: 0},
    %{slug: "night-chatter", name: "Night Chatter", description: "Active after midnight 20 times.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Active after midnight 20 times", coin_cost: 0},
    %{slug: "reaction-king", name: "Reaction King", description: "Added 100 reactions.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Add 100 reactions", coin_cost: 0},
    %{slug: "emoji-expert", name: "Emoji Expert", description: "Used 200 unique emojis.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Use 200 unique emojis", coin_cost: 0},
    %{slug: "file-master", name: "File Master", description: "Shared 50 files.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Share 50 files", coin_cost: 0},
    %{slug: "subscriber", name: "Subscriber", description: "Subscribed to 10 boards.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Subscribe to 10 boards", coin_cost: 0},
    %{slug: "streak-runner", name: "Streak Runner", description: "Maintained a 5-day streak.", rarity: "common", unlock_type: "achievement", unlock_requirement: "5-day streak", coin_cost: 0},
    %{slug: "event-goer", name: "Event Goer", description: "Attended your first event.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Attend first event", coin_cost: 0},
    %{slug: "theme-changer", name: "Theme Changer", description: "Changed theme 3 times.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Change theme 3 times", coin_cost: 0},
    %{slug: "verified", name: "Verified", description: "Verified email and phone.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Verify email and phone", coin_cost: 0},
    %{slug: "helper", name: "Helper", description: "Helped 5 new users.", rarity: "common", unlock_type: "achievement", unlock_requirement: "Help 5 new users", coin_cost: 0},

    # ─── UNCOMMON (15) ───
    %{slug: "correspondent", name: "Correspondent", description: "Sent 1000 messages.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Send 1000 messages", coin_cost: 0},
    %{slug: "networker", name: "Networker", description: "Added 50 friends.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Add 50 friends", coin_cost: 0},
    %{slug: "forum-contributor", name: "Forum Contributor", description: "Posted 50 forum messages.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Post 50 forum messages", coin_cost: 0},
    %{slug: "group-admin", name: "Group Admin", description: "Became a group administrator.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Administer a group", coin_cost: 0},
    %{slug: "voice-enthusiast", name: "Voice Enthusiast", description: "Spent 25 hours in voice calls.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "25 hours voice calls", coin_cost: 0},
    %{slug: "streak-warrior", name: "Streak Warrior", description: "Maintained a 14-day streak.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "14-day streak", coin_cost: 0},
    %{slug: "event-regular", name: "Event Regular", description: "Attended 10 events.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Attend 10 events", coin_cost: 0},
    %{slug: "bug-hunter", name: "Bug Hunter", description: "Reported 5 valid bugs.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Report 5 valid bugs", coin_cost: 0},
    %{slug: "content-star", name: "Content Star", description: "Received 25 upvoted posts.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "25 upvoted posts", coin_cost: 0},
    %{slug: "crypto-user", name: "Crypto User", description: "Enabled end-to-end encryption.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Enable E2EE", coin_cost: 0},
    %{slug: "media-star", name: "Media Star", description: "Shared 100 media items.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Share 100 media items", coin_cost: 0},
    %{slug: "calendar-pro", name: "Calendar Pro", description: "Managed 25 events.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Manage 25 events", coin_cost: 0},
    %{slug: "wiki-contributor", name: "Wiki Contributor", description: "Edited 10 wiki entries.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Edit 10 wiki entries", coin_cost: 0},
    %{slug: "poll-master", name: "Poll Master", description: "Created 10 popular polls.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Create 10 popular polls", coin_cost: 0},
    %{slug: "sticker-pro", name: "Sticker Pro", description: "Collected 50 stickers.", rarity: "uncommon", unlock_type: "achievement", unlock_requirement: "Collect 50 stickers", coin_cost: 0},

    # ─── RARE (15) ───
    %{slug: "diplomat", name: "Diplomat", description: "Sent 5000 messages.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Send 5000 messages", coin_cost: 0},
    %{slug: "popular", name: "Popular", description: "Amassed 100 friends.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "100 friends", coin_cost: 0},
    %{slug: "forum-veteran", name: "Forum Veteran", description: "Posted 200 forum messages.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Post 200 forum messages", coin_cost: 0},
    %{slug: "community-organizer", name: "Community Organizer", description: "Grew a group to 100 members.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Grow group to 100 members", coin_cost: 0},
    %{slug: "voice-commander", name: "Voice Commander", description: "Spent 100 hours in voice.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "100 hours voice", coin_cost: 0},
    %{slug: "streak-champion", name: "Streak Champion", description: "Maintained a 60-day streak.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "60-day streak", coin_cost: 0},
    %{slug: "event-champion", name: "Event Champion", description: "Organized 10 events.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Organize 10 events", coin_cost: 0},
    %{slug: "security-conscious", name: "Security Conscious", description: "All security features enabled.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "All security features enabled", coin_cost: 0},
    %{slug: "trendsetter", name: "Trendsetter", description: "Created 5 trending posts.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "5 trending posts", coin_cost: 0},
    %{slug: "moderator", name: "Moderator", description: "Became a community moderator.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Become moderator", coin_cost: 0},
    %{slug: "collector", name: "Collector", description: "Collected 50 cosmetic items.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Collect 50 cosmetic items", coin_cost: 0},
    %{slug: "archivist", name: "Archivist", description: "Created 50 wiki entries.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Create 50 wiki entries", coin_cost: 0},
    %{slug: "connector-pro", name: "Connector Pro", description: "Introduced 25 users.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Introduce 25 users", coin_cost: 0},
    %{slug: "mentor-pro", name: "Mentor Pro", description: "Mentored 25 new users.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Mentor 25 new users", coin_cost: 0},
    %{slug: "referee", name: "Referee", description: "Resolved 20 disputes.", rarity: "rare", unlock_type: "achievement", unlock_requirement: "Resolve 20 disputes", coin_cost: 0},

    # ─── EPIC (10) ───
    %{slug: "legend", name: "Legend", description: "250 friends and top reputation.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "250 friends and top reputation", coin_cost: 0},
    %{slug: "forum-master", name: "Forum Master", description: "Posted 500 forum messages.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "Post 500 forum messages", coin_cost: 0},
    %{slug: "streak-hero", name: "Streak Hero", description: "Maintained a 180-day streak.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "180-day streak", coin_cost: 0},
    %{slug: "voice-legend", name: "Voice Legend", description: "Spent 500 hours in voice.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "500 hours voice", coin_cost: 0},
    %{slug: "grand-organizer", name: "Grand Organizer", description: "Organized 50 events.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "Organize 50 events", coin_cost: 0},
    %{slug: "senior-moderator", name: "Senior Moderator", description: "Moderated for 6 months.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "Moderate for 6 months", coin_cost: 0},
    %{slug: "platinum-member", name: "Platinum Member", description: "6 months active on the platform.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "6 months active", coin_cost: 0},
    %{slug: "master-collector", name: "Master Collector", description: "Collected 200 cosmetics.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "Collect 200 cosmetics", coin_cost: 0},
    %{slug: "community-hero", name: "Community Hero", description: "Outstanding community contributions.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "Outstanding community contributions", coin_cost: 0},
    %{slug: "crypto-master", name: "Crypto Master", description: "Advanced E2EE usage.", rarity: "epic", unlock_type: "achievement", unlock_requirement: "Advanced E2EE usage", coin_cost: 0},

    # ─── LEGENDARY (6) ───
    %{slug: "immortal", name: "Immortal", description: "Reached maximum prestige level.", rarity: "legendary", unlock_type: "achievement", unlock_requirement: "Maximum prestige level", coin_cost: 0},
    %{slug: "forum-oracle", name: "Forum Oracle", description: "2000 forum posts with high reputation.", rarity: "legendary", unlock_type: "achievement", unlock_requirement: "2000 forum posts with high reputation", coin_cost: 0},
    %{slug: "eternal-flame", name: "Eternal Flame", description: "Maintained a 365-day login streak.", rarity: "legendary", unlock_type: "achievement", unlock_requirement: "365-day streak", coin_cost: 0},
    %{slug: "community-icon", name: "Community Icon", description: "Top 1% reputation in the community.", rarity: "legendary", unlock_type: "achievement", unlock_requirement: "Top 1% reputation", coin_cost: 0},
    %{slug: "grand-master", name: "Grand Master", description: "Served as head moderator.", rarity: "legendary", unlock_type: "achievement", unlock_requirement: "Head moderator", coin_cost: 0},
    %{slug: "diamond-member", name: "Diamond Member", description: "1 year active member.", rarity: "legendary", unlock_type: "achievement", unlock_requirement: "1 year active member", coin_cost: 0},

    # ─── MYTHIC (4) ───
    %{slug: "ascendant", name: "Ascendant", description: "Transcended all prestige levels.", rarity: "mythic", unlock_type: "achievement", unlock_requirement: "Transcend all prestige levels", coin_cost: 0},
    %{slug: "architect", name: "Architect", description: "Shaped the platform itself.", rarity: "mythic", unlock_type: "achievement", unlock_requirement: "Shape the platform", coin_cost: 0},
    %{slug: "eternal", name: "Eternal", description: "Completed every achievement.", rarity: "mythic", unlock_type: "achievement", unlock_requirement: "Complete all achievements", coin_cost: 0},
    %{slug: "genesis", name: "Genesis", description: "Founding member with all milestones achieved.", rarity: "mythic", unlock_type: "achievement", unlock_requirement: "Founding member, all milestones", coin_cost: 0}
  ]
  |> Enum.with_index(1)
  |> Enum.map(fn {title, idx} ->
    color = Map.get(rarity_colors, title.rarity, "#ffffff")

    Map.merge(title, %{
      id: Ecto.UUID.generate(),
      color: color,
      is_purchasable: title.coin_cost > 0,
      sort_order: idx,
      inserted_at: now,
      updated_at: now
    })
  end)

{count, _} = Repo.insert_all("titles", titles, on_conflict: :nothing, conflict_target: :slug)
IO.puts("✓ Seeded #{count}/#{length(titles)} titles (on_conflict: :nothing)")
