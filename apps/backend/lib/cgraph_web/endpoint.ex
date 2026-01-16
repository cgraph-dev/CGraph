defmodule CGraphWeb.Endpoint do
  @moduledoc """
  Phoenix endpoint for CGraph web application.

  Handles HTTP requests, WebSocket connections, and static assets.
  """
  use Phoenix.Endpoint, otp_app: :cgraph

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  @session_options [
    store: :cookie,
    key: "_cgraph_key",
    signing_salt: "cgraph_auth",
    same_site: "Lax",
    secure: Mix.env() == :prod
  ]

  # CORS origins based on environment. Prefer env; fall back to safe defaults in prod
  # and permissive dev wildcard when unset.
  # Includes Vercel deployment domains for frontend hosting
  @is_prod Mix.env() == :prod
  @cors_origins (case {System.get_env("CORS_ORIGINS"), @is_prod} do
    {nil, true} ->
      [
        # Production domains
        "https://cgraph.org",
        "https://www.cgraph.org",
        "https://app.cgraph.org",
        # Vercel deployment domains
        "https://cgraph.vercel.app",
        "https://cgraph-web.vercel.app",
        "https://c-graph.vercel.app",
        # Allow ALL Vercel preview deployments (*.vercel.app)
        # This covers URLs like c-graph-xyz-team-name.vercel.app
        # Pattern includes dots for multi-segment subdomains (e.g., c-graph-abc123-team.vercel.app)
        ~r/^https:\/\/[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.vercel\.app$/
      ]

    {nil, false} ->
      "*"

    {origins, _} ->
      String.split(origins, ",", trim: true)
  end)

  # Max request body size (bytes). Override with MAX_BODY_BYTES env.
  @max_body_bytes (case System.get_env("MAX_BODY_BYTES") do
    nil -> 10_000_000
    value -> String.to_integer(value)
  end)

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: false

  socket "/socket", CGraphWeb.UserSocket,
    websocket: [
      connect_info: [:peer_data, :uri, :x_headers],
      timeout: 45_000
    ],
    longpoll: false

  # Serve at "/" the static files from "priv/static" directory.
  plug Plug.Static,
    at: "/",
    from: :cgraph,
    gzip: true,
    only: CGraphWeb.static_paths()

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :cgraph
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug CGraphWeb.Plugs.CorrelationId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    length: @max_body_bytes

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options

  # CORS handling
  plug Corsica,
    origins: @cors_origins,
    allow_headers: ["authorization", "content-type", "x-requested-with", "idempotency-key", "x-api-version"],
    allow_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_credentials: true,
    max_age: 86_400

  plug CGraphWeb.Router
end
