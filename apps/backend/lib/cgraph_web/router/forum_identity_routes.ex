defmodule CGraphWeb.Router.ForumIdentityRoutes do
  @moduledoc """
  Forum identity card routes.

  Provides endpoints for viewing and updating user identity cards
  used in forum posts and profiles.
  """

  defmacro forum_identity_routes do
    quote do
      scope "/api/v1/identity-cards", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        get "/:user_id", IdentityCardController, :show
        put "/", IdentityCardController, :update
      end
    end
  end
end
