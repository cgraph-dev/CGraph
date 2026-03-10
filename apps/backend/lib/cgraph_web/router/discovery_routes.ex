defmodule CGraphWeb.Router.DiscoveryRoutes do
  @moduledoc "Discovery feed and topic routes."

  defmacro discovery_routes do
    quote do
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        get "/feed", FeedController, :index
        get "/topics", TopicController, :index
        get "/frequencies", TopicController, :get_frequencies
        put "/frequencies", TopicController, :update_frequencies
      end
    end
  end
end
