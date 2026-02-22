defmodule CGraphWeb.Telemetry.Metrics do
  @moduledoc """
  Telemetry metric definitions for CGraphWeb.

  Defines all `Telemetry.Metrics` specifications used by exporters such as
  `TelemetryMetricsPrometheus.Core` and Phoenix LiveDashboard.

  ## Metric Categories

  | Category     | Description                           |
  |--------------|---------------------------------------|
  | HTTP         | Request latency, throughput, errors    |
  | Database     | Query time, connection pool            |
  | Oban         | Background job duration and failures   |
  | Business     | Messages, rate limiting                |
  | VM           | Memory, process count, run queues      |
  | WebSocket    | Connections, messages, channel joins   |
  | Rate Limiter | Check counts and latency               |
  | Security     | Auth attempts, tokens, account locks   |
  """

  # Standard histogram buckets for Prometheus Distribution metrics (in ms).
  # Matches Google SRE recommended latency buckets for web services.
  @default_buckets [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000]

  @doc """
  Define all metrics for export to monitoring systems.

  Returns a list of `Telemetry.Metrics` definitions consumed by
  `TelemetryMetricsPrometheus.Core` and Phoenix LiveDashboard.
  """
  @spec metrics() :: [Telemetry.Metrics.t()]
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
end
