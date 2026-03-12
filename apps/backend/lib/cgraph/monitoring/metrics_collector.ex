defmodule CGraph.Monitoring.MetricsCollector do
  @moduledoc """
  Complementary metrics collector for custom business metrics.

  Works alongside the existing `CGraph.Metrics` GenServer and
  `CGraphWeb.Telemetry.Metrics` to provide:

  - **Business metric presets** for common CGraph domain events
  - **Batch metric recording** for efficient bulk updates
  - **Metric snapshots** for point-in-time comparison
  - **SLO tracking** with target/actual comparisons

  This module does NOT replace `CGraph.Metrics`. It extends it by
  providing higher-level convenience functions that delegate to the
  existing metrics system.

  ## Usage

      # Initialize business metrics (call once at app startup)
      MetricsCollector.setup_business_metrics()

      # Record business events
      MetricsCollector.record_message_sent(:direct)
      MetricsCollector.record_user_action(:login, %{method: "password"})
      MetricsCollector.record_api_call("/api/v1/users", "GET", 200, 45.2)

      # Take a snapshot for comparison
      {:ok, snap} = MetricsCollector.snapshot()

      # Export Prometheus-compatible output
      output = MetricsCollector.prometheus_export()
  """

  require Logger

  alias CGraph.Metrics

  # ---------------------------------------------------------------------------
  # Business Metric Definitions
  # ---------------------------------------------------------------------------

  @business_metrics [
    # Messaging metrics
    {:messages_sent_total, :counter,
     [help: "Total messages sent", labels: [:channel_type]]},
    {:messages_delivered_total, :counter,
     [help: "Total messages delivered", labels: [:channel_type]]},
    {:message_delivery_latency_ms, :histogram,
     [help: "Message delivery latency in ms", labels: [:channel_type]]},

    # User metrics
    {:user_registrations_total, :counter,
     [help: "Total user registrations", labels: [:method]]},
    {:user_logins_total, :counter,
     [help: "Total user logins", labels: [:method]]},
    {:user_login_failures_total, :counter,
     [help: "Total failed login attempts", labels: [:method, :reason]]},
    {:active_users_gauge, :gauge,
     [help: "Currently active users"]},

    # API metrics
    {:api_requests_total, :counter,
     [help: "Total API requests", labels: [:path, :method, :status]]},
    {:api_request_duration_ms, :histogram,
     [help: "API request duration in ms", labels: [:path, :method]]},
    {:api_errors_total, :counter,
     [help: "Total API errors", labels: [:path, :method, :status]]},

    # WebSocket metrics
    {:ws_connections_active, :gauge,
     [help: "Active WebSocket connections"]},
    {:ws_messages_in_total, :counter,
     [help: "Total WebSocket messages received"]},
    {:ws_messages_out_total, :counter,
     [help: "Total WebSocket messages sent"]},

    # CDN metrics
    {:cdn_uploads_total, :counter,
     [help: "Total CDN uploads", labels: [:content_type]]},
    {:cdn_upload_duration_ms, :histogram,
     [help: "CDN upload duration in ms"]},
    {:cdn_purges_total, :counter,
     [help: "Total CDN cache purges"]},

    # Group/channel metrics
    {:groups_created_total, :counter,
     [help: "Total groups created"]},
    {:group_members_gauge, :gauge,
     [help: "Total group members across all groups"]},

    # Background job metrics
    {:oban_jobs_completed_total, :counter,
     [help: "Total Oban jobs completed", labels: [:worker, :state]]},
    {:oban_jobs_failed_total, :counter,
     [help: "Total Oban jobs failed", labels: [:worker]]},
    {:oban_job_duration_ms, :histogram,
     [help: "Oban job duration in ms", labels: [:worker]]},

    # SLO tracking
    {:slo_availability_ratio, :gauge,
     [help: "Service availability ratio (0-1)"]},
    {:slo_latency_p99_ms, :gauge,
     [help: "P99 latency in ms"]}
  ]

  # ---------------------------------------------------------------------------
  # Setup
  # ---------------------------------------------------------------------------

  @doc """
  Define all business metrics in the `CGraph.Metrics` system.

  Call this once during application startup (e.g., in Application.start/2).
  Safe to call multiple times — existing definitions are overwritten.
  """
  @spec setup_business_metrics() :: :ok
  def setup_business_metrics do
    Enum.each(@business_metrics, fn {name, type, opts} ->
      Metrics.define(name, type, opts)
    end)

    Logger.info("business_metrics_initialized", count: length(@business_metrics))
    :ok
  end

  # ---------------------------------------------------------------------------
  # Convenience Recorders
  # ---------------------------------------------------------------------------

  @doc """
  Record a message sent event.
  """
  @spec record_message_sent(atom()) :: :ok
  def record_message_sent(channel_type) do
    Metrics.increment(:messages_sent_total, %{channel_type: channel_type})
  end

  @doc """
  Record a message delivered event with optional latency.
  """
  @spec record_message_delivered(atom(), number() | nil) :: :ok
  def record_message_delivered(channel_type, latency_ms \\ nil) do
    Metrics.increment(:messages_delivered_total, %{channel_type: channel_type})

    if latency_ms do
      Metrics.observe(:message_delivery_latency_ms, latency_ms, %{channel_type: channel_type})
    end

    :ok
  end

  @doc """
  Record a user action (login, registration, etc.).
  """
  @spec record_user_action(atom(), map()) :: :ok
  def record_user_action(:login, labels) do
    Metrics.increment(:user_logins_total, labels)
  end

  def record_user_action(:login_failure, labels) do
    Metrics.increment(:user_login_failures_total, labels)
  end

  def record_user_action(:registration, labels) do
    Metrics.increment(:user_registrations_total, labels)
  end

  def record_user_action(action, labels) do
    Logger.debug("user_action_recorded", action: action, labels: labels)
    :ok
  end

  @doc """
  Record an API call with path, method, status code, and duration.
  """
  @spec record_api_call(String.t(), String.t(), pos_integer(), number()) :: :ok
  def record_api_call(path, method, status, duration_ms) do
    labels = %{path: path, method: method, status: status}
    Metrics.increment(:api_requests_total, labels)
    Metrics.observe(:api_request_duration_ms, duration_ms, %{path: path, method: method})

    if status >= 400 do
      Metrics.increment(:api_errors_total, labels)
    end

    :ok
  end

  @doc """
  Record a CDN upload event.
  """
  @spec record_cdn_upload(String.t(), number()) :: :ok
  def record_cdn_upload(content_type, duration_ms) do
    Metrics.increment(:cdn_uploads_total, %{content_type: content_type})
    Metrics.observe(:cdn_upload_duration_ms, duration_ms)
  end

  @doc """
  Update gauge for active WebSocket connections.
  """
  @spec set_ws_connections(non_neg_integer()) :: :ok
  def set_ws_connections(count) do
    Metrics.set(:ws_connections_active, count)
  end

  @doc """
  Update gauge for active users.
  """
  @spec set_active_users(non_neg_integer()) :: :ok
  def set_active_users(count) do
    Metrics.set(:active_users_gauge, count)
  end

  # ---------------------------------------------------------------------------
  # Batch Operations
  # ---------------------------------------------------------------------------

  @doc """
  Record multiple metric updates in a batch.

  Accepts a list of `{operation, name, value, labels}` tuples where
  operation is `:increment`, `:set`, `:observe`, or `:add`.
  """
  @spec record_batch([{atom(), atom(), number(), map()}]) :: :ok
  def record_batch(updates) when is_list(updates) do
    Enum.each(updates, fn
      {:increment, name, amount, labels} -> Metrics.increment(name, labels, amount)
      {:set, name, value, labels} -> Metrics.set(name, value, labels)
      {:observe, name, value, labels} -> Metrics.observe(name, value, labels)
      {:add, name, value, labels} -> Metrics.add(name, value, labels)
    end)

    :ok
  end

  # ---------------------------------------------------------------------------
  # Snapshots & Export
  # ---------------------------------------------------------------------------

  @doc """
  Take a point-in-time snapshot of all business metrics.

  Returns a map of metric names to their current values. Useful for
  periodic comparison and SLO evaluation.
  """
  @spec snapshot() :: {:ok, map()}
  def snapshot do
    values =
      @business_metrics
      |> Enum.map(fn {name, _type, _opts} ->
        value =
          case Metrics.get(name) do
            {:ok, v} -> v
            _ -> nil
          end

        {name, value}
      end)
      |> Map.new()

    {:ok, %{
      timestamp: DateTime.utc_now(),
      metrics: values
    }}
  end

  @doc """
  Export all metrics in Prometheus text exposition format.

  Delegates to `CGraph.Metrics.export(:prometheus)`.
  """
  @spec prometheus_export() :: String.t()
  def prometheus_export do
    Metrics.export(:prometheus)
  end

  # ---------------------------------------------------------------------------
  # SLO Tracking
  # ---------------------------------------------------------------------------

  @doc """
  Update SLO metrics based on current system state.

  Calculates availability ratio and P99 latency, then updates
  the corresponding gauge metrics.

  ## Parameters

    * `total_requests` — total requests in the window
    * `successful_requests` — successful requests
    * `p99_latency_ms` — measured P99 latency
  """
  @spec update_slo(non_neg_integer(), non_neg_integer(), number()) :: :ok
  def update_slo(total_requests, successful_requests, p99_latency_ms) do
    availability =
      if total_requests > 0,
        do: successful_requests / total_requests,
        else: 1.0

    Metrics.set(:slo_availability_ratio, Float.round(availability, 6))
    Metrics.set(:slo_latency_p99_ms, p99_latency_ms)

    Logger.debug("slo_updated",
      availability: Float.round(availability * 100, 2),
      p99_ms: p99_latency_ms
    )

    :ok
  end

  @doc """
  Check if SLOs are being met against targets.

  ## Parameters

    * `targets` — map with `:availability` (0-1) and `:latency_p99_ms` targets

  Returns `{:ok, %{availability_met: bool, latency_met: bool, ...}}`.
  """
  @spec check_slo(map()) :: {:ok, map()}
  def check_slo(targets) do
    avail_target = Map.get(targets, :availability, 0.999)
    latency_target = Map.get(targets, :latency_p99_ms, 500)

    current_avail =
      case Metrics.get(:slo_availability_ratio) do
        {:ok, v} when is_number(v) -> v
        _ -> 1.0
      end

    current_p99 =
      case Metrics.get(:slo_latency_p99_ms) do
        {:ok, v} when is_number(v) -> v
        _ -> 0.0
      end

    {:ok, %{
      availability_met: current_avail >= avail_target,
      availability_current: current_avail,
      availability_target: avail_target,
      latency_met: current_p99 <= latency_target,
      latency_current: current_p99,
      latency_target: latency_target,
      timestamp: DateTime.utc_now()
    }}
  end
end
