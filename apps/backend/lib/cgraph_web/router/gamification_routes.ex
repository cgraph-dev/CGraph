defmodule CGraphWeb.Router.GamificationRoutes do
  @moduledoc """
  Gamification and monetization routes.

  Includes XP, achievements, quests, streaks, titles, shop,
  coins, premium, cosmetics, prestige, seasonal events, and marketplace.
  """

  defmacro gamification_routes do
    quote do
      # Gamification API routes (authenticated)
      scope "/api/v1", CGraphWeb do
        pipe_through [:api, :api_auth]

        # User gamification stats
        get "/gamification/stats", GamificationController, :stats
        get "/gamification/progress", GamificationController, :stats
        get "/gamification/level-info", GamificationController, :level_info
        get "/gamification/xp/history", GamificationController, :xp_history

        # Achievements
        get "/gamification/achievements", GamificationController, :achievements
        get "/gamification/achievements/:id", GamificationController, :show_achievement
        post "/gamification/achievements/:id/unlock", GamificationController, :unlock_achievement

        # Leaderboards
        get "/gamification/leaderboard/:category", GamificationController, :leaderboard
        get "/gamification/leaderboard/:scope/:scope_id/:category", GamificationController, :scoped_leaderboard

        # Streaks
        get "/gamification/streak", GamificationController, :streak_info
        post "/gamification/streak/claim", GamificationController, :claim_streak
        post "/gamification/streak/checkin", GamificationController, :claim_streak

        # Quests
        get "/quests", QuestController, :index
        get "/quests/active", QuestController, :active
        get "/quests/daily", QuestController, :daily
        get "/quests/weekly", QuestController, :weekly
        get "/quests/:id", QuestController, :show
        post "/quests/:id/accept", QuestController, :accept
        post "/quests/:id/claim", QuestController, :claim

        # Titles
        get "/titles", TitleController, :index
        get "/titles/owned", TitleController, :owned
        post "/titles/:id/equip", TitleController, :equip
        post "/titles/:id/unequip", TitleController, :unequip
        post "/titles/unequip", TitleController, :unequip
        post "/titles/:id/purchase", TitleController, :purchase

        # Shop
        get "/shop", ShopController, :index
        get "/shop/categories", ShopController, :categories
        get "/shop/purchases", ShopController, :purchases
        get "/shop/:id", ShopController, :show
        post "/shop/:id/purchase", ShopController, :purchase

        # Coins
        get "/coins", CoinsController, :balance
        get "/coins/history", CoinsController, :history
        get "/coins/packages", CoinsController, :packages
        get "/coins/earn", CoinsController, :earn_methods

        # Premium subscriptions
        get "/premium/status", PremiumController, :status
        get "/premium/tiers", PremiumController, :tiers
        get "/premium/features", PremiumController, :features
        post "/premium/subscribe", PremiumController, :subscribe
        post "/premium/cancel", PremiumController, :cancel

        # Cosmetics: Avatar Borders
        get "/avatar-borders", CosmeticsController, :list_borders
        get "/avatar-borders/unlocked", CosmeticsController, :unlocked_borders
        post "/avatar-borders/:id/equip", CosmeticsController, :equip_border
        post "/avatar-borders/:id/purchase", CosmeticsController, :purchase_border
        post "/avatar-borders/:id/unlock", CosmeticsController, :purchase_border
        get "/cosmetics/borders", CosmeticsController, :list_borders
        post "/cosmetics/borders/:id/equip", CosmeticsController, :equip_border
        post "/cosmetics/borders/:id/purchase", CosmeticsController, :purchase_border

        # Cosmetics: Profile Themes
        get "/profile-themes", CosmeticsController, :list_profile_themes
        get "/profile-themes/active", CosmeticsController, :active_profile_theme
        post "/profile-themes/:id/activate", CosmeticsController, :activate_profile_theme
        put "/profile-themes/:id/customize", CosmeticsController, :customize_profile_theme

        # Cosmetics: Chat Effects
        get "/chat-effects", CosmeticsController, :get_chat_effects
        post "/chat-effects/sync", CosmeticsController, :sync_chat_effects
        post "/chat-effects/:id/activate", CosmeticsController, :activate_chat_effect

        # Prestige System
        get "/prestige", PrestigeController, :show
        post "/prestige/activate", PrestigeController, :reset
        post "/prestige/reset", PrestigeController, :reset
        get "/prestige/rewards", PrestigeController, :rewards
        get "/prestige/leaderboard", PrestigeController, :leaderboard

        # Seasonal Events
        get "/events", EventsController, :index
        get "/events/active", EventsController, :index
        get "/events/:id", EventsController, :show
        get "/events/:id/progress", EventsController, :progress
        post "/events/:id/join", EventsController, :join
        post "/events/:id/claim-reward", EventsController, :claim_reward
        get "/events/:id/leaderboard", EventsController, :leaderboard
        post "/events/:id/battle-pass/purchase", EventsController, :purchase_battle_pass

        # Marketplace
        get "/marketplace", MarketplaceController, :index
        get "/marketplace/my-listings", MarketplaceController, :my_listings
        get "/marketplace/history", MarketplaceController, :history
        get "/marketplace/listings", MarketplaceController, :index
        post "/marketplace/listings", MarketplaceController, :create
        post "/marketplace/listings/:id/purchase", MarketplaceController, :buy
        get "/marketplace/:id", MarketplaceController, :show
        post "/marketplace", MarketplaceController, :create
        put "/marketplace/:id", MarketplaceController, :update
        delete "/marketplace/:id", MarketplaceController, :delete
        post "/marketplace/:id/buy", MarketplaceController, :buy
      end
    end
  end
end
