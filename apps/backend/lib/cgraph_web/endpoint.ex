defmodule CGraphWeb.Endpoint do
  @moduledoc """
  Phoenix endpoint for CGraph web application.

  Handles HTTP requests, WebSocket connections, and static assets.
  """
  use Phoenix.Endpoint, otp_app: :cgraph

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  # NOTE: The signing_salt is a key derivation namespace, NOT a secret.
  # Actual cookie signing security comes from secret_key_base (set at runtime in runtime.exs).
  # This is the standard Phoenix pattern — signing_salt can safely be compiled in.
  @session_options [
    store: :cookie,
    key: "_cgraph_key",
    signing_salt: Application.compile_env(:cgraph, :session_signing_salt, "cgraph_session_v1"),
    same_site: "Lax"
  ]

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
  plug CGraphWeb.Plugs.TraceContext
  plug CGraphWeb.Plugs.GeoRouter
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  # Cache raw body for webhook signature verification (must be before Plug.Parsers)
  plug CGraphWeb.Plugs.RawBodyPlug

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    length: @max_body_bytes

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options

  # CORS handling with runtime configuration
  # Uses custom plug to read CORS_ORIGINS at runtime (not compile time)
  plug CGraphWeb.Plugs.Cors

  plug CGraphWeb.Router
end
