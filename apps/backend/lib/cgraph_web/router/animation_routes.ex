defmodule CGraphWeb.Router.AnimationRoutes do
  @moduledoc """
  Animation and Lottie emoji routes.

  Provides public endpoints for browsing the animated emoji catalog,
  searching by name/keyword, and retrieving CDN URLs for Lottie JSON,
  WebP, and GIF formats.

  All animation endpoints are public (no auth required) — animation
  metadata is not sensitive content.
  """

  defmacro animation_routes do
    quote do
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through :api_relaxed

        scope "/animations" do
          get "/emojis", LottieController, :index
          get "/emojis/search", LottieController, :search
          get "/emojis/:codepoint", LottieController, :show
          get "/categories", LottieController, :categories
          get "/borders", LottieController, :borders
          get "/effects", LottieController, :effects
        end
      end
    end
  end
end
