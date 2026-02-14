defmodule CGraphWeb.Plugs.OptionalAuthPipeline do
  @moduledoc """
  Guardian pipeline for optionally authenticating API requests.
  Sets current_user if a valid token is present, but allows unauthenticated requests through.
  """
  use Guardian.Plug.Pipeline,
    otp_app: :cgraph,
    module: CGraph.Guardian,
    error_handler: CGraphWeb.Plugs.AuthErrorHandler

  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.LoadResource, allow_blank: true
end
