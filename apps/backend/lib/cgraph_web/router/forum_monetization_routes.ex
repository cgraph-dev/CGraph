defmodule CGraphWeb.Router.ForumMonetizationRoutes do
  @moduledoc """
  Forum monetization routes.

  Provides endpoints for managing forum monetization settings
  and subscription tiers.
  """

  defmacro forum_monetization_routes do
    quote do
      scope "/api/v1/forums/:forum_id/monetization", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        get "/", ForumMonetizationController, :show
        put "/", ForumMonetizationController, :update

        post "/tiers", ForumMonetizationController, :create_tier
        put "/tiers/:id", ForumMonetizationController, :update_tier
        delete "/tiers/:id", ForumMonetizationController, :delete_tier
      end
    end
  end
end
