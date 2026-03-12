defmodule CGraphWeb.Router.BoostRoutes do
  @moduledoc """
  Content boost routes.

  Provides endpoints for creating, listing, and cancelling
  content boosts paid with nodes.
  """

  defmacro boost_routes do
    quote do
      scope "/api/v1/boosts", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/", BoostController, :create
        get "/", BoostController, :active
        delete "/:id", BoostController, :cancel
      end
    end
  end
end
