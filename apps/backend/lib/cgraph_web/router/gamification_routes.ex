defmodule CGraphWeb.Router.GamificationRoutes do
  @moduledoc """
  Achievement and cosmetics routes.

  Includes achievements, cosmetics (borders, themes, effects), titles, shop,
  coins, premium, and IAP validation.
  """

  defmacro gamification_routes do
    quote do
      # Achievement & cosmetics API routes (authenticated)
      scope "/api/v1", CGraphWeb do
        pipe_through [:api, :api_auth]

        # Achievements
        get "/gamification/achievements", GamificationController, :achievements
        get "/gamification/achievements/:id", GamificationController, :show_achievement
        post "/gamification/achievements/:id/unlock", GamificationController, :unlock_achievement

        # Coins (currency system)
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

        # IAP validation
        post "/iap/validate", IAPController, :validate
        post "/iap/restore", IAPController, :restore

        # Shop
        scope "/shop" do
          get "/", ShopController, :index
          get "/categories", ShopController, :categories
          get "/purchases", ShopController, :purchases
          get "/bundles", CoinShopController, :bundles
          post "/purchase-coins", CoinShopController, :checkout
          get "/:id", ShopController, :show
          post "/:id/purchase", ShopController, :purchase
        end

        # Titles
        scope "/titles" do
          get "/", TitleController, :index
          get "/owned", TitleController, :owned
          post "/:id/equip", TitleController, :equip
          post "/:id/unequip", TitleController, :unequip
          post "/unequip", TitleController, :unequip
          post "/:id/purchase", TitleController, :purchase
        end

        # Cosmetics (Avatar Borders, Profile Themes, Chat Effects)
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
    end
  end
end
