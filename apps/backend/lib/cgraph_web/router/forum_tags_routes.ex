defmodule CGraphWeb.Router.ForumTagsRoutes do
  @moduledoc """
  Forum tag routes.

  Provides endpoints for managing thread tags and tag categories.
  """

  defmacro forum_tags_routes do
    quote do
      scope "/api/v1/forums/:forum_id", CGraphWeb.API.V1 do
        pipe_through [:api]

        get "/tags", TagController, :index
      end

      scope "/api/v1/forums/:forum_id/threads/:thread_id", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/tags", TagController, :create
        delete "/tags/:id", TagController, :delete
      end
    end
  end
end
