defmodule CGraphWeb.Router.ForumAdminRoutes do
  @moduledoc """
  Forum admin routes for custom forum management and moderation logs.

  Provides endpoints for:
  - Creating and updating custom forums
  - Managing forum members (add/remove/change role)
  - Viewing moderation audit logs with cursor pagination
  """

  defmacro forum_admin_routes do
    quote do
      scope "/api/v1/forum-admin", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/forums", ForumAdminController, :create_forum
        put "/forums/:id", ForumAdminController, :update_settings
        post "/forums/:id/members", ForumAdminController, :manage_members
        get "/forums/:id/moderation-log", ForumAdminController, :moderation_log
      end
    end
  end
end
