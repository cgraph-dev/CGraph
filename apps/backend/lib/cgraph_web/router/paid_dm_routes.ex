defmodule CGraphWeb.Router.PaidDmRoutes do
  @moduledoc """
  Paid DM file routes.

  Endpoints for sending, unlocking, and listing paid file
  attachments in direct messages, plus per-user settings.
  """

  defmacro paid_dm_routes do
    quote do
      scope "/api/v1/paid-dm", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/send", PaidDmController, :send
        put "/:id/unlock", PaidDmController, :unlock
        get "/pending", PaidDmController, :pending
        get "/settings", PaidDmController, :get_settings
        put "/settings", PaidDmController, :update_settings
      end
    end
  end
end
