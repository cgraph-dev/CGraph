defmodule CGraphWeb.Router.PulseRoutes do
  @moduledoc "Pulse reputation routes."

  defmacro pulse_routes do
    quote do
      scope "/api/v1/pulse", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        get "/me", PulseController, :my_pulse
        get "/community/:id", PulseController, :community_pulse
        post "/vote", PulseController, :vote
        get "/top/:community_id", PulseController, :top
      end
    end
  end
end
