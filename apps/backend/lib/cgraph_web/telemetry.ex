defmodule CgraphWeb.Telemetry do
  @moduledoc """
  Telemetry supervisor for CgraphWeb.
  
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

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    # Attach telemetry handlers on init
    attach_handlers()
    
    children = [
      # Add metric reporters here if using Prometheus/StatsD
      # {TelemetryMetricsPrometheus, metrics: metrics()}
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
      &handle_phoenix_event/4,
      nil
    )

    # Attach Ecto events
    :telemetry.attach_many(
      "cgraph-ecto-handlers",
      [
        [:cgraph, :repo, :query]
      ],
      &handle_ecto_event/4,
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
      &handle_oban_event/4,
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
      &handle_business_event/4,
      nil
    )

    Logger.info("CgraphWeb.Telemetry handlers attached")
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
        description: "HTTP request latency distribution"
      ),
      Telemetry.Metrics.summary("phoenix.router_dispatch.stop.duration",
        unit: {:native, :millisecond},
        tags: [:route],
        description: "Router dispatch latency by route"
      ),

      # Database Metrics
      Telemetry.Metrics.distribution("cgraph.repo.query.decode_time",
        unit: {:native, :millisecond},
        description: "Time to decode query results"
      ),
      Telemetry.Metrics.distribution("cgraph.repo.query.query_time",
        unit: {:native, :millisecond},
        description: "Time to execute query"
      ),
      Telemetry.Metrics.distribution("cgraph.repo.query.queue_time",
        unit: {:native, :millisecond},
        description: "Time waiting for database connection"
      ),
      Telemetry.Metrics.distribution("cgraph.repo.query.total_time",
        unit: {:native, :millisecond},
        description: "Total query time including queue and decode"
      ),

      # Oban Metrics
      Telemetry.Metrics.counter("oban.job.stop.duration",
        tags: [:worker, :state],
        description: "Total background jobs processed"
      ),
      Telemetry.Metrics.distribution("oban.job.stop.duration",
        tags: [:worker],
        unit: {:native, :millisecond},
        description: "Background job duration"
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
      Telemetry.Metrics.counter("cgraph.auth.login.success.count",
        description: "Successful logins"
      ),
      Telemetry.Metrics.counter("cgraph.auth.login.failure.count",
        tags: [:reason],
        description: "Failed login attempts"
      ),
      Telemetry.Metrics.counter("cgraph.rate_limiter.exceeded.count",
        tags: [:tier, :path],
        description: "Rate limit exceeded events"
      ),

      # VM Metrics
      Telemetry.Metrics.last_value("vm.memory.total",
        unit: :byte,
        description: "Total memory used by the VM"
      ),
      Telemetry.Metrics.last_value("vm.total_run_queue_lengths.total",
        description: "Total run queue length"
      ),
      Telemetry.Metrics.last_value("vm.total_run_queue_lengths.cpu",
        description: "CPU run queue length"
      ),
      Telemetry.Metrics.last_value("vm.total_run_queue_lengths.io",
        description: "IO run queue length"
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
      Logger.info("HTTP #{method} #{path}",
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
  # Utility Functions
  # ---------------------------------------------------------------------------

  @doc """
  Emit a custom business event.
  
  Convenience function for emitting telemetry events with standard metadata.
  
  ## Examples
  
      CgraphWeb.Telemetry.emit(:messaging, :message, :sent, %{latency_ms: 45}, %{channel_id: 1})
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
