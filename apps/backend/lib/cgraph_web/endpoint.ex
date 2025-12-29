defmodule CgraphWeb.Endpoint do
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
    same_site: "Lax"
  ]

  # CORS origins based on environment
  @cors_origins (if Mix.env() == :prod do
    [
      "https://cgraph.io",
      "https://www.cgraph.io",
      "https://app.cgraph.io"
    ]
  else
    "*"
  end)

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: false

  socket "/socket", CgraphWeb.UserSocket,
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
    only: CgraphWeb.static_paths()

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
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    length: 50_000_000  # 50MB max upload

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options

  # CORS handling
  plug Corsica,
    origins: @cors_origins,
    allow_headers: ["authorization", "content-type", "x-requested-with"],
    allow_methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_credentials: true,
    max_age: 86_400

  plug CgraphWeb.Router
end
