defmodule CGraph.Monitoring.Alerting do
  @moduledoc """
  Threshold-based alerting with Slack webhook and PagerDuty integration.

  Defines alerts with configurable thresholds, evaluates them against
  current system metrics, and dispatches notifications.

  ## Configuration

      config :cgraph, CGraph.Monitoring.Alerting,
        slack_webhook_url: "https://hooks.slack.com/services/...",
        pagerduty_routing_key: "...",
        check_interval_ms: 60_000,
        enabled: true

  ## Usage

      # Define an alert
      Alerting.define_alert(:high_error_rate, :counter, %{
        metric: :http_errors_total,
        threshold: 100,
        comparison: :gt,
        window_seconds: 300,
        severity: :critical,
        channels: [:slack, :pagerduty],
        description: "HTTP error rate exceeds 100 in 5 min"
      })

      # Check all thresholds
      results = Alerting.check_thresholds()

      # Send a manual alert
      Alerting.send_alert(:slack, %{title: "Deploy complete", message: "v1.2.3 deployed"})
  """

  use GenServer
  require Logger

  @type severity :: :info | :warning | :critical
  @type channel :: :slack | :pagerduty
  @type comparison :: :gt | :gte | :lt | :lte | :eq

  @type alert_definition :: %{
          name: atom(),
          metric_type: :counter | :gauge | :histogram,
          metric: atom(),
          threshold: number(),
          comparison: comparison(),
          window_seconds: pos_integer(),
          severity: severity(),
          channels: [channel()],
          description: String.t(),
          cooldown_seconds: pos_integer(),
          enabled: boolean()
        }

  @type alert_result :: %{
          alert: atom(),
          triggered: boolean(),
          current_value: number() | nil,
          threshold: number(),
          severity: severity(),
          timestamp: DateTime.t()
        }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start the alerting GenServer.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Define a new alert rule.

  ## Parameters

    * `name` — unique alert name (atom)
    * `metric_type` — `:counter`, `:gauge`, or `:histogram`
    * `config` — alert configuration map

  ## Config keys

    * `:metric` — the metric name to monitor
    * `:threshold` — numeric threshold value
    * `:comparison` — `:gt`, `:gte`, `:lt`, `:lte`, `:eq`
    * `:window_seconds` — evaluation window (default: 300)
    * `:severity` — `:info`, `:warning`, `:critical` (default: `:warning`)
    * `:channels` — list of notification channels (default: `[:slack]`)
    * `:description` — human-readable description
    * `:cooldown_seconds` — min seconds between repeated alerts (default: 300)
    * `:enabled` — whether alert is active (default: `true`)
  """
  @spec define_alert(atom(), atom(), map()) :: :ok
  def define_alert(name, metric_type, config) do
    GenServer.call(__MODULE__, {:define_alert, name, metric_type, config})
  end

  @doc """
  Evaluate all defined alerts against current metric values.

  Returns a list of `alert_result()` maps indicating which alerts
  triggered and their current values.
  """
  @spec check_thresholds() :: [alert_result()]
  def check_thresholds do
    GenServer.call(__MODULE__, :check_thresholds, 30_000)
  end

  @doc """
  Send an alert notification to the specified channel.

  ## Parameters

    * `channel` — `:slack` or `:pagerduty`
    * `payload` — map with `:title`, `:message`, `:severity` (optional), `:details` (optional)
  """
  @spec send_alert(channel(), map()) :: :ok | {:error, term()}
  def send_alert(channel, payload) do
    do_send_alert(channel, payload)
  end

  @doc """
  List all defined alerts.
  """
  @spec list_alerts() :: [alert_definition()]
  def list_alerts do
    GenServer.call(__MODULE__, :list_alerts)
  end

  @doc """
  Remove an alert definition.
  """
  @spec remove_alert(atom()) :: :ok
  def remove_alert(name) do
    GenServer.call(__MODULE__, {:remove_alert, name})
  end

  @doc """
  Enable or disable an alert.
  """
  @spec toggle_alert(atom(), boolean()) :: :ok | {:error, :not_found}
  def toggle_alert(name, enabled) do
    GenServer.call(__MODULE__, {:toggle_alert, name, enabled})
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @impl true
  def init(_opts) do
    state = %{
      alerts: %{},
      last_fired: %{},
      check_interval: alerting_config(:check_interval_ms, 60_000)
    }

    if alerting_config(:enabled, true) do
      schedule_check(state.check_interval)
    end

    {:ok, state}
  end

  @impl true
  def handle_call({:define_alert, name, metric_type, config}, _from, state) do
    alert = %{
      name: name,
      metric_type: metric_type,
      metric: Map.fetch!(config, :metric),
      threshold: Map.fetch!(config, :threshold),
      comparison: Map.get(config, :comparison, :gt),
      window_seconds: Map.get(config, :window_seconds, 300),
      severity: Map.get(config, :severity, :warning),
      channels: Map.get(config, :channels, [:slack]),
      description: Map.get(config, :description, "Alert: #{name}"),
      cooldown_seconds: Map.get(config, :cooldown_seconds, 300),
      enabled: Map.get(config, :enabled, true)
    }

    state = put_in(state, [:alerts, name], alert)
    Logger.info("alert_defined", name: name, metric: alert.metric, threshold: alert.threshold)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call(:check_thresholds, _from, state) do
    {results, new_state} = evaluate_all_alerts(state)
    {:reply, results, new_state}
  end

  @impl true
  def handle_call(:list_alerts, _from, state) do
    {:reply, Map.values(state.alerts), state}
  end

  @impl true
  def handle_call({:remove_alert, name}, _from, state) do
    state = update_in(state, [:alerts], &Map.delete(&1, name))
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:toggle_alert, name, enabled}, _from, state) do
    case Map.get(state.alerts, name) do
      nil ->
        {:reply, {:error, :not_found}, state}

      alert ->
        state = put_in(state, [:alerts, name], %{alert | enabled: enabled})
        {:reply, :ok, state}
    end
  end

  @impl true
  def handle_info(:check_thresholds, state) do
    {_results, new_state} = evaluate_all_alerts(state)
    schedule_check(state.check_interval)
    {:noreply, new_state}
  end

  # ---------------------------------------------------------------------------
  # Private — Alert evaluation
  # ---------------------------------------------------------------------------

  defp evaluate_all_alerts(state) do
    now = DateTime.utc_now()

    {results, new_state} =
      state.alerts
      |> Map.values()
      |> Enum.filter(& &1.enabled)
      |> Enum.map_reduce(state, fn alert, acc ->
        current_value = fetch_metric_value(alert.metric, alert.metric_type)

        triggered = compare_value(current_value, alert.threshold, alert.comparison)

        result = %{
          alert: alert.name,
          triggered: triggered,
          current_value: current_value,
          threshold: alert.threshold,
          severity: alert.severity,
          timestamp: now
        }

        acc =
          if triggered and not in_cooldown?(acc, alert.name, alert.cooldown_seconds, now) do
            dispatch_alert(alert, current_value)
            put_in(acc, [:last_fired, alert.name], now)
          else
            acc
          end

        {result, acc}
      end)

    {results, new_state}
  end

  defp fetch_metric_value(metric, _type) do
    case CGraph.Metrics.get(metric) do
      {:ok, value} when is_number(value) -> value
      {:ok, %{count: count}} -> count
      _ -> 0
    end
  end

  defp compare_value(nil, _threshold, _comparison), do: false
  defp compare_value(value, threshold, :gt), do: value > threshold
  defp compare_value(value, threshold, :gte), do: value >= threshold
  defp compare_value(value, threshold, :lt), do: value < threshold
  defp compare_value(value, threshold, :lte), do: value <= threshold
  defp compare_value(value, threshold, :eq), do: value == threshold

  defp in_cooldown?(state, name, cooldown_seconds, now) do
    case Map.get(state.last_fired, name) do
      nil ->
        false

      last_fired ->
        DateTime.diff(now, last_fired, :second) < cooldown_seconds
    end
  end

  defp dispatch_alert(alert, current_value) do
    payload = %{
      title: "[#{String.upcase(to_string(alert.severity))}] #{alert.description}",
      message:
        "Alert `#{alert.name}` triggered: current value #{current_value} #{alert.comparison} threshold #{alert.threshold}",
      severity: alert.severity,
      details: %{
        alert_name: alert.name,
        metric: alert.metric,
        current_value: current_value,
        threshold: alert.threshold,
        comparison: alert.comparison,
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }
    }

    Enum.each(alert.channels, fn channel ->
      case do_send_alert(channel, payload) do
        :ok ->
          Logger.info("alert_sent", channel: channel, alert: alert.name)

        {:error, reason} ->
          Logger.error("alert_send_failed",
            channel: channel,
            alert: alert.name,
            reason: inspect(reason)
          )
      end
    end)
  end

  # ---------------------------------------------------------------------------
  # Private — Channel dispatch
  # ---------------------------------------------------------------------------

  defp do_send_alert(:slack, payload) do
    url = alerting_config(:slack_webhook_url, "")

    if url == "" do
      Logger.warning("slack_webhook_not_configured")
      {:error, :not_configured}
    else
      body =
        Jason.encode!(%{
          text: payload.title,
          blocks: [
            %{
              type: "header",
              text: %{type: "plain_text", text: payload.title}
            },
            %{
              type: "section",
              text: %{type: "mrkdwn", text: payload.message}
            },
            %{
              type: "context",
              elements: [
                %{
                  type: "mrkdwn",
                  text:
                    "*Severity:* #{payload[:severity] || :info} | *Time:* #{DateTime.utc_now() |> DateTime.to_iso8601()}"
                }
              ]
            }
          ]
        })

      headers = [{~c"Content-Type", ~c"application/json"}]

      case :httpc.request(
             :post,
             {String.to_charlist(url), headers, ~c"application/json", body},
             [{:timeout, 10_000}],
             []
           ) do
        {:ok, {{_, status, _}, _, _}} when status in 200..299 ->
          :ok

        {:ok, {{_, status, _}, _, resp}} ->
          {:error, {:http_error, status, to_string(resp)}}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp do_send_alert(:pagerduty, payload) do
    routing_key = alerting_config(:pagerduty_routing_key, "")

    if routing_key == "" do
      Logger.warning("pagerduty_routing_key_not_configured")
      {:error, :not_configured}
    else
      severity_map = %{info: "info", warning: "warning", critical: "critical"}
      pd_severity = Map.get(severity_map, payload[:severity] || :warning, "warning")

      body =
        Jason.encode!(%{
          routing_key: routing_key,
          event_action: "trigger",
          payload: %{
            summary: payload.title,
            source: "cgraph-backend-#{node()}",
            severity: pd_severity,
            custom_details: payload[:details] || %{}
          }
        })

      url = "https://events.pagerduty.com/v2/enqueue"
      headers = [{~c"Content-Type", ~c"application/json"}]

      case :httpc.request(
             :post,
             {String.to_charlist(url), headers, ~c"application/json", body},
             [{:timeout, 10_000}],
             []
           ) do
        {:ok, {{_, status, _}, _, _}} when status in 200..299 ->
          :ok

        {:ok, {{_, status, _}, _, resp}} ->
          {:error, {:http_error, status, to_string(resp)}}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp do_send_alert(channel, _payload) do
    {:error, {:unknown_channel, channel}}
  end

  # ---------------------------------------------------------------------------
  # Private — Config & scheduling
  # ---------------------------------------------------------------------------

  defp alerting_config(key, default) do
    config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(config, key, default)
  end

  defp schedule_check(interval) do
    Process.send_after(self(), :check_thresholds, interval)
  end
end
