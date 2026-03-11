defmodule CGraphWeb.Router.CosmeticsRoutes do
  @moduledoc """
  Cosmetics-specific routes for inventory, badges, nameplates,
  profile effects, profile frames, and name styles.

  Does NOT duplicate border/theme/effect routes already handled
  by GamificationRoutes.
  """

  defmacro cosmetics_routes do
    quote do
      # Cosmetics API routes (authenticated)
      scope "/api/v1", CGraphWeb do
        pipe_through [:api, :api_auth]

        # Unified inventory
        get "/cosmetics/inventory", CosmeticsController, :inventory
        put "/cosmetics/equip", CosmeticsController, :equip
        delete "/cosmetics/unequip", CosmeticsController, :unequip

        # Badges
        scope "/badges" do
          get "/", API.V1.BadgeController, :index
          get "/:id", API.V1.BadgeController, :show
        end

        # User badges (nested under users)
        get "/users/:id/badges", API.V1.BadgeController, :user_badges

        # Nameplates
        scope "/nameplates" do
          get "/", API.V1.NameplateController, :index
          get "/:id", API.V1.NameplateController, :show
          put "/settings", API.V1.NameplateController, :update_settings
        end

        # User nameplates (nested under users)
        get "/users/:id/nameplates", API.V1.NameplateController, :user_nameplates
      end
    end
  end
end
