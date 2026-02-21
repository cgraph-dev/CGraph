defmodule CGraphWeb.Telemetry do
  @moduledoc """
  Telemetry supervisor for CGraphWeb.

  ## Overview

  This module is started by the application supervisor and is responsible for:

  1. **Attaching telemetry handlers** - Sets up event listeners for Phoenix, Ecto, Oban
  2. **Defining metrics** - Configures metrics for dashboards and monitoring
  3. **Managing lifecycle** - Ensures handlers are properly attached/detached

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Telemetry Pipeline                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
  │  │ Phoenix     │───▶│ :telemetry   │───▶│ Metrics Handler  │   │
  │  │ Endpoint    │    │ events       │    │ (this module)    │   │
  │  └─────────────┘    └──────────────┘    └──────────────────┘   │
  │                            │                      │             │
  │  ┌─────────────┐           │             ┌───────┴───────┐     │
  │  │ Ecto.Repo   │───────────┤             │               │     │
  │  └─────────────┘           │      ┌──────┴────┐  ┌───────┴───┐ │
  │                            │      │ Console   │  │ Prometheus│ │
  │  ┌─────────────┐           │      │ Reporter  │  │ /StatsD   │ │
  │  │ Oban Jobs   │───────────┘      └───────────┘  └───────────┘ │
  │  └─────────────┘                                                │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Metrics Categories

  | Category    | Description                           | Example Metric                |
  |-------------|---------------------------------------|-------------------------------|
  | HTTP        | Request latency, throughput, errors   | `phoenix.endpoint.duration`   |
  | Database    | Query time, connection pool           | `cgraph.repo.query.duration`  |
  | Cache       | Hit rate, evictions, memory           | `cgraph.cache.hit_rate`       |
  | Business    | Messages, users, groups               | `cgraph.messaging.sent.count` |
  | System      | Memory, process count, uptime         | `vm.memory.total`             |

  ## Metric Types

  - **Counter**: Cumulative values (total requests)
  - **Distribution**: Histograms for latency/timing
  - **Summary**: Statistical aggregations
  - **LastValue**: Current value (connections active)
  """
  use Supervisor

  require Logger

  # Standard histogram buckets for Prometheus Distribution metrics (in ms).
  # Matches Google SRE recommended latency buckets for web services.
  @default_buckets [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000]

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    # Attach telemetry handlers on init
    attach_handlers()

    children = [
      # Prometheus metrics exporter — serves metrics via TelemetryMetricsPrometheus.Core
      # These supplement the custom CGraph.Metrics module with Telemetry.Metrics definitions
      {TelemetryMetricsPrometheus.Core, metrics: metrics(), name: :cgraph_prometheus_metrics}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  @doc """
  Attach all telemetry event handlers.

  This function is called during application startup and sets up listeners
  for all relevant telemetry events from Phoenix, Ecto, Oban, and custom events.
  """
  def attach_handlers do
    # Attach Phoenix events
    :telemetry.attach_many(
      "cgraph-phoenix-handlers",
      [
        [:phoenix, :endpoint, :start],
        [:phoenix, :endpoint, :stop],
        [:phoenix, :router_dispatch, :start],
        [:phoenix, :router_dispatch, :stop],
        [:phoenix, :router_dispatch, :exception],
        [:phoenix, :live_view, :mount, :start],
        [:phoenix, :live_view, :mount, :stop]
      ],
      &__MODULE__.handle_phoenix_event/4,
      nil
    )

    # Attach Ecto events
    :telemetry.attach_many(
      "cgraph-ecto-handlers",
      [
        [:cgraph, :repo, :query]
      ],
      &__MODULE__.handle_ecto_event/4,
      nil
    )

    # Attach Oban events
    :telemetry.attach_many(
      "cgraph-oban-handlers",
      [
        [:oban, :job, :start],
        [:oban, :job, :stop],
        [:oban, :job, :exception]
      ],
      &__MODULE__.handle_oban_event/4,
      nil
    )

    # Attach custom business events
    :telemetry.attach_many(
      "cgraph-business-handlers",
      [
        [:cgraph, :messaging, :message, :sent],
        [:cgraph, :auth, :login, :success],
        [:cgraph, :auth, :login, :failure],
        [:cgraph, :rate_limiter, :check],
        [:cgraph, :rate_limiter, :exceeded]
      ],
      &__MODULE__.handle_business_event/4,
      nil
    )

    # Attach WebSocket/Channel events
    :telemetry.attach_many(
      "cgraph-websocket-handlers",
      [
        [:cgraph, :websocket, :connect],
        [:cgraph, :websocket, :disconnect],
        [:cgraph, :websocket, :message, :in],
        [:cgraph, :websocket, :message, :out],
        [:cgraph, :channel, :join]
      ],
      &__MODULE__.handle_websocket_event/4,
      nil
    )

    # Attach security events
    :telemetry.attach_many(
      "cgraph-security-handlers",
      [
        [:cgraph, :auth, :token, :created],
        [:cgraph, :auth, :token, :refreshed],
        [:cgraph, :auth, :token, :revoked],
        [:cgraph, :auth, :account, :locked],
        [:cgraph, :auth, :account, :unlocked]
      ],
      &__MODULE__.handle_security_event/4,
      nil
    )

    Logger.info("CGraphWeb.Telemetry handlers attached")
    :ok
  end

  @doc """
  Define metrics for export to monitoring systems.

  Returns a list of Telemetry.Metrics definitions that can be used by
  metric exporters like Prometheus or StatsD.
  """
  def metrics do
    [
      # Phoenix Metrics
      Telemetry.Metrics.counter("phoenix.endpoint.stop.duration",
        unit: {:native, :millisecond},
        description: "Total HTTP requests processed"
      ),
      Telemetry.Metrics.distribution("phoenix.endpoint.stop.duration",
        unit: {:native, :millisecond},
        description: "HTTP request latency distribution",
        reporter_options: [buckets: @default_buckets]
      ),
      Telemetry.Metrics.summary("phoenix.router_dispatch.stop.duration",
        unit: {:native, :millisecond},
        tags: [:route],
        description: "Router dispatch latency by route"
      ),

      # Database Metrics
      Telemetry.Metrics.distribution("cgraph.repo.query.decode_time",
        unit: {:native, :millisecond},
        description: "Time to decode query results",
        reporter_options: [buckets: @default_buckets]
      ),
      Telemetry.Metrics.distribution("cgraph.repo.query.query_time",
        unit: {:native, :millisecond},
        description: "Time to execute query",
        reporter_options: [buckets: @default_buckets]
      ),
      Telemetry.Metrics.distribution("cgraph.repo.query.queue_time",
        unit: {:native, :millisecond},
        description: "Time waiting for database connection",
        reporter_options: [buckets: @default_buckets]
      ),
      Telemetry.Metrics.distribution("cgraph.repo.query.total_time",
        unit: {:native, :millisecond},
        description: "Total query time including queue and decode",
        reporter_options: [buckets: @default_buckets]
      ),

      # Oban Metrics
      Telemetry.Metrics.counter("oban.job.stop.duration",
        tags: [:worker, :state],
        description: "Total background jobs processed"
      ),
      Telemetry.Metrics.distribution("oban.job.stop.duration",
        tags: [:worker],
        unit: {:native, :millisecond},
        description: "Background job duration",
        reporter_options: [buckets: @default_buckets]
      ),
      Telemetry.Metrics.counter("oban.job.exception.duration",
        tags: [:worker],
        description: "Failed background jobs"
      ),

      # Business Metrics
      Telemetry.Metrics.counter("cgraph.messaging.message.sent.count",
        tags: [:channel_type],
        description: "Messages sent"
      ),
      # NOTE: auth login success/failure counters are in the Security Metrics section
      # below with richer tags (method, reason). Do not duplicate here.
      Telemetry.Metrics.counter("cgraph.rate_limiter.exceeded.count",
        tags: [:tier, :path],
        description: "Rate limit exceeded events"
      ),

      # VM Metrics
      Telemetry.Metrics.last_value("vm.memory.total",
        unit: :byte,
        description: "Total memory used by the VM"
      ),
      Telemetry.Metrics.last_value("vm.memory.processes",
        unit: :byte,
        description: "Memory used by BEAM processes"
      ),
      Telemetry.Metrics.last_value("vm.memory.ets",
        unit: :byte,
        description: "Memory used by ETS tables"
      ),
      Telemetry.Metrics.last_value("vm.total_run_queue_lengths.total",
        description: "Total run queue length"
      ),
      Telemetry.Metrics.last_value("vm.total_run_queue_lengths.cpu",
        description: "CPU run queue length"
      ),
      Telemetry.Metrics.last_value("vm.total_run_queue_lengths.io",
        description: "IO run queue length"
      ),
      Telemetry.Metrics.last_value("vm.system_counts.process_count",
        description: "Number of BEAM processes"
      ),

      # -------------------------------------------------------------------
      # WebSocket / Channel Metrics
      # -------------------------------------------------------------------
      Telemetry.Metrics.last_value("cgraph.websocket.connections.active",
        description: "Active WebSocket connections"
      ),
      Telemetry.Metrics.counter("cgraph.websocket.connect.total",
        description: "Total WebSocket connections established"
      ),
      Telemetry.Metrics.counter("cgraph.websocket.disconnect.total",
        tags: [:reason],
        description: "Total WebSocket disconnections"
      ),
      Telemetry.Metrics.counter("cgraph.websocket.message.in.total",
        tags: [:event_type],
        description: "WebSocket messages received"
      ),
      Telemetry.Metrics.counter("cgraph.websocket.message.out.total",
        tags: [:event_type],
        description: "WebSocket messages sent"
      ),
      Telemetry.Metrics.distribution("cgraph.channel.join.duration",
        unit: {:native, :millisecond},
        tags: [:channel],
        description: "Channel join latency",
        reporter_options: [buckets: [5, 10, 25, 50, 100, 250, 500]]
      ),

      # -------------------------------------------------------------------
      # Rate Limiter Metrics
      # -------------------------------------------------------------------
      Telemetry.Metrics.counter("cgraph.rate_limiter.check.total",
        tags: [:tier, :result],
        description: "Rate limit checks (allowed vs denied)"
      ),
      Telemetry.Metrics.distribution("cgraph.rate_limiter.check.duration",
        unit: {:native, :millisecond},
        tags: [:tier],
        description: "Rate limit check latency",
        reporter_options: [buckets: [0.1, 0.5, 1, 2, 5, 10, 25]]
      ),

      # -------------------------------------------------------------------
      # Security Metrics
      # -------------------------------------------------------------------
      Telemetry.Metrics.counter("cgraph.auth.login.success.total",
        tags: [:method],
        description: "Successful auth attempts by method"
      ),
      Telemetry.Metrics.counter("cgraph.auth.login.failure.total",
        tags: [:method, :reason],
        description: "Failed auth attempts by method and reason"
      ),
      Telemetry.Metrics.counter("cgraph.auth.token.created.total",
        tags: [:type],
        description: "Tokens created"
      ),
      Telemetry.Metrics.counter("cgraph.auth.token.refreshed.total",
        description: "Tokens refreshed"
      ),
      Telemetry.Metrics.counter("cgraph.auth.token.revoked.total",
        tags: [:reason],
        description: "Tokens revoked"
      ),
      Telemetry.Metrics.counter("cgraph.auth.account.locked.total",
        tags: [:reason],
        description: "Account lockout events"
      ),
      Telemetry.Metrics.counter("cgraph.auth.account.unlocked.total",
        tags: [:method],
        description: "Account unlock events"
      )
    ]
  end

  # ---------------------------------------------------------------------------
  # Event Handlers
  # ---------------------------------------------------------------------------

  @doc false
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

  @doc false
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

  @doc false
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

  @doc false
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

  # ---------------------------------------------------------------------------
  # Utility Functions
  # ---------------------------------------------------------------------------

  @doc """
  Emit a custom business event.

  Convenience function for emitting telemetry events with standard metadata.

  ## Examples

      CGraphWeb.Telemetry.emit(:messaging, :message, :sent, %{latency_ms: 45}, %{channel_id: 1})
  """
  def emit(domain, resource, action, measurements, metadata \\ %{}) do
    :telemetry.execute(
      [:cgraph, domain, resource, action],
      Map.merge(%{timestamp: System.system_time()}, measurements),
      Map.merge(%{node: node()}, metadata)
    )
  end

  @doc """
  Get current telemetry statistics.

  Returns aggregated metrics for monitoring dashboards.
  """
  def stats do
    %{
      vm: %{
        memory: :erlang.memory(),
        process_count: :erlang.system_info(:process_count),
        uptime_seconds: :erlang.statistics(:wall_clock) |> elem(0) |> div(1000)
      },
      schedulers: %{
        online: :erlang.system_info(:schedulers_online),
        total: :erlang.system_info(:schedulers)
      }
    }
  end
end
