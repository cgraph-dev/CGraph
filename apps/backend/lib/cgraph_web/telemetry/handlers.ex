defmodule CGraphWeb.Telemetry.Handlers do
  @moduledoc """
  Telemetry event handler callbacks for CGraphWeb.

  Contains handlers for Phoenix, Ecto, Oban, business, WebSocket, and security
  telemetry events. These functions are attached via `:telemetry.attach_many/4`
  in `CGraphWeb.Telemetry.attach_handlers/0`.
  """

  require Logger

  # ---------------------------------------------------------------------------
  # Phoenix Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
  @spec handle_phoenix_event(list(), map(), map(), term()) :: :ok
  def handle_phoenix_event([:phoenix, :endpoint, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration],
      :native,
      :millisecond
    )

    # Extract conn safely - Plug.Conn doesn't implement Access protocol
    conn = Map.get(metadata, :conn)

    status = if conn, do: Map.get(conn, :status, 0), else: 0
    method = if conn, do: Map.get(conn, :method, "UNKNOWN"), else: "UNKNOWN"
    path = if conn, do: Map.get(conn, :request_path, "/"), else: "/"

    # Only log slow requests or errors in production
    if duration_ms > 100 or status >= 400 do
      Logger.info("http_request",
        method: method,
        path: path,
        status: status,
        duration_ms: duration_ms,
        slow: duration_ms > 100
      )
    end
  end

  def handle_phoenix_event([:phoenix, :router_dispatch, :exception], _measurements, metadata, _config) do
    conn = Map.get(metadata, :conn)
    path = if conn, do: Map.get(conn, :request_path, "/"), else: "/"

    Logger.error("Phoenix router exception",
      kind: metadata[:kind],
      reason: inspect(metadata[:reason]),
      path: path
    )
  end

  def handle_phoenix_event(_event, _measurements, _metadata, _config), do: :ok

  # ---------------------------------------------------------------------------
  # Ecto Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
  @spec handle_ecto_event(list(), map(), map(), term()) :: :ok
  def handle_ecto_event([:cgraph, :repo, :query], measurements, metadata, _config) do
    total_time_ms = System.convert_time_unit(
      measurements[:total_time] || 0,
      :native,
      :millisecond
    )

    # Log slow queries (> 100ms)
    if total_time_ms > 100 do
      Logger.warning("Slow database query",
        query: String.slice(metadata[:query] || "", 0, 200),
        total_time_ms: total_time_ms,
        source: metadata[:source]
      )
    end
  end

  # ---------------------------------------------------------------------------
  # Oban Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
  @spec handle_oban_event(list(), map(), map(), term()) :: :ok
  def handle_oban_event([:oban, :job, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration],
      :native,
      :millisecond
    )

    Logger.info("Oban job completed",
      worker: metadata[:worker],
      queue: metadata[:queue],
      duration_ms: duration_ms,
      state: metadata[:state]
    )
  end

  def handle_oban_event([:oban, :job, :exception], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration],
      :native,
      :millisecond
    )

    Logger.error("Oban job failed",
      worker: metadata[:worker],
      queue: metadata[:queue],
      duration_ms: duration_ms,
      error: inspect(metadata[:reason])
    )
  end

  def handle_oban_event(_event, _measurements, _metadata, _config), do: :ok

  # ---------------------------------------------------------------------------
  # Business Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
  @spec handle_business_event(list(), map(), map(), term()) :: :ok
  def handle_business_event([:cgraph, :messaging, :message, :sent], measurements, metadata, _config) do
    Logger.debug("Message sent",
      channel_id: metadata[:channel_id],
      user_id: metadata[:user_id],
      latency_ms: measurements[:latency_ms]
    )
  end

  def handle_business_event([:cgraph, :auth, :login, :success], _measurements, metadata, _config) do
    Logger.info("User login success", user_id: metadata[:user_id])
  end

  def handle_business_event([:cgraph, :auth, :login, :failure], _measurements, metadata, _config) do
    Logger.warning("User login failure",
      reason: metadata[:reason],
      email: String.slice(metadata[:email] || "", 0, 3) <> "***"
    )
  end

  def handle_business_event([:cgraph, :rate_limiter, :exceeded], _measurements, metadata, _config) do
    Logger.warning("Rate limit exceeded",
      tier: metadata[:tier],
      path: metadata[:path]
    )
  end

  def handle_business_event(_event, _measurements, _metadata, _config), do: :ok

  # ---------------------------------------------------------------------------
  # WebSocket Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
  @spec handle_websocket_event(list(), map(), map(), term()) :: :ok
  def handle_websocket_event([:cgraph, :websocket, :connect], _measurements, _metadata, _config) do
    Logger.debug("WebSocket connected")
  end

  def handle_websocket_event([:cgraph, :websocket, :disconnect], _measurements, metadata, _config) do
    Logger.debug("WebSocket disconnected", reason: metadata[:reason] || "normal")
  end

  def handle_websocket_event([:cgraph, :channel, :join], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration] || 0,
      :native,
      :millisecond
    )

    if duration_ms > 100 do
      Logger.info("Slow channel join",
        channel: metadata[:channel],
        duration_ms: duration_ms
      )
    end
  end

  def handle_websocket_event(_event, _measurements, _metadata, _config), do: :ok

  # ---------------------------------------------------------------------------
  # Security Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
  @spec handle_security_event(list(), map(), map(), term()) :: :ok
  def handle_security_event([:cgraph, :auth, :account, :locked], _measurements, metadata, _config) do
    Logger.warning("Account locked",
      reason: metadata[:reason] || "too_many_attempts"
    )
  end

  def handle_security_event([:cgraph, :auth, :account, :unlocked], _measurements, metadata, _config) do
    Logger.info("Account unlocked", method: metadata[:method] || "timeout")
  end

  def handle_security_event([:cgraph, :auth, :token, :revoked], _measurements, metadata, _config) do
    Logger.info("Token revoked", reason: metadata[:reason] || "user_initiated")
  end

  def handle_security_event(_event, _measurements, _metadata, _config), do: :ok
end
