defmodule CGraphWeb.Plugs.AuthPipeline do
  @moduledoc """
  Guardian pipeline for authenticating API requests.
  """
  use Guardian.Plug.Pipeline,
    otp_app: :cgraph,
    module: CGraph.Guardian,
    error_handler: CGraphWeb.Plugs.AuthErrorHandler

  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.EnsureAuthenticated
  plug Guardian.Plug.LoadResource
end
