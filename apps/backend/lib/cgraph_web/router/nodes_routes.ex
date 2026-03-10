defmodule CGraphWeb.Router.NodesRoutes do
  @moduledoc """
  Nodes virtual currency routes.

  Wallet management, bundle purchases, tipping, content unlock,
  and withdrawal requests.
  """

  defmacro nodes_routes do
    quote do
      scope "/api/v1/nodes", CGraphWeb do
        pipe_through [:api, :api_auth]

        get "/wallet", NodesController, :wallet
        get "/transactions", NodesController, :transactions
        get "/bundles", NodesController, :bundles
        post "/checkout", NodesController, :checkout
        post "/tip", NodesController, :tip
        post "/unlock", NodesController, :unlock
        post "/withdraw", NodesController, :withdraw
      end
    end
  end
end
