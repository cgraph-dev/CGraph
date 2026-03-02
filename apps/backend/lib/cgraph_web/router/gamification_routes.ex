defmodule CGraphWeb.Router.GamificationRoutes do
  @moduledoc """
  Gamification and monetization routes.

  Includes XP, achievements, quests, streaks, titles, shop,
  coins, premium, cosmetics, prestige, seasonal events, and marketplace.
  """

  defmacro gamification_routes do
    quote do
      # ── Level gate pipelines for progressive disclosure ──────────
      pipeline :level_gate_quests do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :quests
      end

      pipeline :level_gate_shop do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :shop
      end

      pipeline :level_gate_cosmetics do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :cosmetics
      end

      pipeline :level_gate_titles do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :titles
      end

      pipeline :level_gate_marketplace do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :marketplace
      end

      pipeline :level_gate_events do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :events
      end

      pipeline :level_gate_prestige do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :prestige
      end

      # ── Premium tier gate pipelines for monetization ─────────────
      pipeline :premium_gate do
        plug CGraphWeb.Plugs.PremiumGatePlug, min_tier: "premium"
      end

      pipeline :enterprise_gate do
        plug CGraphWeb.Plugs.PremiumGatePlug, min_tier: "enterprise"
      end

      # Gamification API routes (authenticated)
      scope "/api/v1", CGraphWeb do
        pipe_through [:api, :api_auth]

        # ── Ungated routes (always available) ─────────────────────

        # User gamification stats
        get "/gamification/stats", GamificationController, :stats
        get "/gamification/progress", GamificationController, :stats
        get "/gamification/level-info", GamificationController, :level_info
        get "/gamification/xp/history", GamificationController, :xp_history

        # Feature gates status endpoint
        get "/gamification/feature-gates", GamificationController, :feature_gates

        # Achievements
        get "/gamification/achievements", GamificationController, :achievements
        get "/gamification/achievements/:id", GamificationController, :show_achievement
        post "/gamification/achievements/:id/unlock", GamificationController, :unlock_achievement

        # Leaderboards (read-only, always visible)
        get "/gamification/leaderboard/:category", GamificationController, :leaderboard
        get "/gamification/leaderboard/:scope/:scope_id/:category", GamificationController, :scoped_leaderboard

        # Streaks
        get "/gamification/streak", GamificationController, :streak_info
        post "/gamification/streak/claim", GamificationController, :claim_streak
        post "/gamification/streak/checkin", GamificationController, :claim_streak

        # Coins (currency system, always available)
        get "/coins", CoinsController, :balance
        get "/coins/history", CoinsController, :history
        get "/coins/packages", CoinsController, :packages
        get "/coins/earn", CoinsController, :earn_methods

        # Premium subscriptions (paid, not level-gated)
        get "/premium/status", PremiumController, :status
        get "/premium/tiers", PremiumController, :tiers
        get "/premium/features", PremiumController, :features
        post "/premium/subscribe", PremiumController, :subscribe
        post "/premium/cancel", PremiumController, :cancel

        # IAP validation (authenticated — mobile sends receipt after native purchase)
        post "/iap/validate", IAPController, :validate
        post "/iap/restore", IAPController, :restore

        # ── Level-gated: Quests (level 3) ─────────────────────────
        scope "/quests" do
          pipe_through [:level_gate_quests]
          get "/", QuestController, :index
          get "/active", QuestController, :active
          get "/daily", QuestController, :daily
          get "/weekly", QuestController, :weekly
          get "/:id", QuestController, :show
          post "/:id/accept", QuestController, :accept
          post "/:id/claim", QuestController, :claim
        end

        # ── Level-gated: Shop (level 8) ───────────────────────────
        scope "/shop" do
          pipe_through [:level_gate_shop]
          get "/", ShopController, :index
          get "/categories", ShopController, :categories
          get "/purchases", ShopController, :purchases
          get "/:id", ShopController, :show
          post "/:id/purchase", ShopController, :purchase
        end

        # ── Level-gated: Titles (level 12) ────────────────────────
        scope "/titles" do
          pipe_through [:level_gate_titles]
          get "/", TitleController, :index
          get "/owned", TitleController, :owned
          post "/:id/equip", TitleController, :equip
          post "/:id/unequip", TitleController, :unequip
          post "/unequip", TitleController, :unequip
          post "/:id/purchase", TitleController, :purchase
        end

        # ── Level-gated: Cosmetics (level 10) ─────────────────────
        scope "/" do
          pipe_through [:level_gate_cosmetics]

          # Avatar Borders
          get "/avatar-borders", CosmeticsController, :list_borders
          get "/avatar-borders/unlocked", CosmeticsController, :unlocked_borders
          post "/avatar-borders/:id/equip", CosmeticsController, :equip_border
          post "/avatar-borders/:id/purchase", CosmeticsController, :purchase_border
          post "/avatar-borders/:id/unlock", CosmeticsController, :purchase_border
          get "/cosmetics/borders", CosmeticsController, :list_borders
          post "/cosmetics/borders/:id/equip", CosmeticsController, :equip_border
          post "/cosmetics/borders/:id/purchase", CosmeticsController, :purchase_border

          # Profile Themes
          get "/profile-themes", CosmeticsController, :list_profile_themes
          get "/profile-themes/active", CosmeticsController, :active_profile_theme
          post "/profile-themes/:id/activate", CosmeticsController, :activate_profile_theme
          put "/profile-themes/:id/customize", CosmeticsController, :customize_profile_theme

          # Chat Effects
          get "/chat-effects", CosmeticsController, :get_chat_effects
          post "/chat-effects/sync", CosmeticsController, :sync_chat_effects
          post "/chat-effects/:id/activate", CosmeticsController, :activate_chat_effect
        end

        # ── Level-gated: Prestige (level 25) ──────────────────────
        scope "/prestige" do
          pipe_through [:level_gate_prestige]
          get "/", PrestigeController, :show
          post "/activate", PrestigeController, :reset
          post "/reset", PrestigeController, :reset
          get "/rewards", PrestigeController, :rewards
          get "/leaderboard", PrestigeController, :leaderboard
        end

        # ── Level-gated: Seasonal Events (level 20) ───────────────
        scope "/events" do
          pipe_through [:level_gate_events]
          get "/", EventsController, :index
          get "/active", EventsController, :index
          get "/:id", EventsController, :show
          get "/:id/progress", EventsController, :progress
          post "/:id/join", EventsController, :join
          post "/:id/claim-reward", EventsController, :claim_reward
          get "/:id/leaderboard", EventsController, :leaderboard
          post "/:id/battle-pass/purchase", EventsController, :purchase_battle_pass
        end

        # ── Level-gated: Marketplace (level 15) ───────────────────
        scope "/marketplace" do
          pipe_through [:level_gate_marketplace]
          get "/", MarketplaceController, :index
          get "/my-listings", MarketplaceController, :my_listings
          get "/history", MarketplaceController, :history
          get "/listings", MarketplaceController, :index
          post "/listings", MarketplaceController, :create
          post "/listings/:id/purchase", MarketplaceController, :buy
          get "/:id", MarketplaceController, :show
          post "/", MarketplaceController, :create
          put "/:id", MarketplaceController, :update
          delete "/:id", MarketplaceController, :delete
          post "/:id/buy", MarketplaceController, :buy
        end
      end
    end
  end
end
