defmodule CGraphWeb.Router.SyncRoutes do
  @moduledoc """
  WatermelonDB-compatible sync routes.

  Provides pull/push endpoints for offline-first mobile sync.
  """
  defmacro sync_routes do
    quote do
      scope "/api/v1/sync", CGraphWeb.Controllers.Api.V1 do
        pipe_through([:api, :api_auth])

        get("/pull", SyncController, :pull)
        post("/push", SyncController, :push)
      end
    end
  end
end
