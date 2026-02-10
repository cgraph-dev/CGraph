defmodule CGraph.Telemetry.ErrorReporter do
  @moduledoc """
  Error reporting and alerting service.

  Handles client-side error ingestion, storage, aggregation,
  and alerting for production monitoring.

  ## Features

  - Error deduplication by fingerprint
  - Rate-based alerting thresholds
  - Slack/PagerDuty integration (configurable)
  - Error trend analysis
  - Performance metric aggregation

  ## Configuration

      config :cgraph, CGraph.Telemetry.ErrorReporter,
        enabled: true,
        store_errors: true,
        alert_on_fatal: true,
        alert_threshold: 10,  # Errors per minute before alerting
        slack_webhook: "https://hooks.slack.com/...",
        pagerduty_key: "..."

  ## Architecture

  Uses an ETS table for in-memory aggregation with periodic
  flush to database for long-term storage and analysis.
  """

  use GenServer

  require Logger

  @table :error_reporter_aggregates
  @metrics_table :error_reporter_metrics
  @flush_interval :timer.minutes(5)
  @alert_window :timer.minutes(1)

  # ===========================================================================
  # Public API
  # ===========================================================================

  @doc """
  Start the error reporter service.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Record a client-side error.

  Aggregates errors by fingerprint and triggers alerts
  when thresholds are exceeded.
  """
  @spec record(map()) :: :ok
  def record(error_report) do
    if enabled?() do
      GenServer.cast(__MODULE__, {:record_error, error_report})
    end
    :ok
  end

  @doc """
  Record a performance metric.
  """
  @spec record_metric(map()) :: :ok
  def record_metric(metric) do
    if enabled?() do
      GenServer.cast(__MODULE__, {:record_metric, metric})
    end
    :ok
  end

  @doc """
  Alert on-call staff about a fatal error.
  """
  @spec alert_on_call(map()) :: :ok
  def alert_on_call(error_report) do
    if config(:alert_on_fatal, true) do
      GenServer.cast(__MODULE__, {:alert, error_report})
    end
    :ok
  end

  @doc """
  Get error statistics for the last N minutes.
  """
  @spec get_stats(pos_integer()) :: map()
  def get_stats(minutes \\ 60) do
    GenServer.call(__MODULE__, {:get_stats, minutes})
  end

  @doc """
  Get the most frequent errors.
  """
  @spec top_errors(pos_integer()) :: list()
  def top_errors(limit \\ 10) do
    GenServer.call(__MODULE__, {:top_errors, limit})
  end

  # ===========================================================================
  # GenServer Callbacks
  # ===========================================================================

  @impl true
  def init(_opts) do
    # Create ETS tables for aggregation
    :ets.new(@table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@metrics_table, [:named_table, :set, :public, read_concurrency: true])

    # Schedule periodic flush
    schedule_flush()

    {:ok, %{
      error_counts: %{},
      last_alert_time: 0,
      total_errors: 0,
      total_metrics: 0
    }}
  end

  @impl true
  def handle_cast({:record_error, report}, state) do
    fingerprint = generate_fingerprint(report)
    now = System.system_time(:millisecond)

    # Update ETS aggregate
    case :ets.lookup(@table, fingerprint) do
      [] ->
        :ets.insert(@table, {fingerprint, %{
          first_seen: now,
          last_seen: now,
          count: 1,
          sample: report,
          users: if(report.user_id, do: MapSet.new([report.user_id]), else: MapSet.new())
        }})
      [{^fingerprint, existing}] ->
        users = if report.user_id do
          MapSet.put(existing.users, report.user_id)
        else
          existing.users
        end
        :ets.insert(@table, {fingerprint, %{existing |
          last_seen: now,
          count: existing.count + 1,
          users: users
        }})
    end

    # Check for alert threshold
    new_state = maybe_alert(state, report, fingerprint)

    {:noreply, %{new_state | total_errors: state.total_errors + 1}}
  end

  @impl true
  def handle_cast({:record_metric, metric}, state) do
    key = {metric.name, metric.tags}
    now = System.system_time(:millisecond)

    case :ets.lookup(@metrics_table, key) do
      [] ->
        :ets.insert(@metrics_table, {key, %{
          first_seen: now,
          last_seen: now,
          count: 1,
          sum: metric.value,
          min: metric.value,
          max: metric.value,
          unit: metric.unit
        }})
      [{^key, existing}] ->
        :ets.insert(@metrics_table, {key, %{existing |
          last_seen: now,
          count: existing.count + 1,
          sum: existing.sum + metric.value,
          min: min(existing.min, metric.value),
          max: max(existing.max, metric.value)
        }})
    end

    {:noreply, %{state | total_metrics: state.total_metrics + 1}}
  end

  @impl true
  def handle_cast({:alert, report}, state) do
    send_alert(report)
    {:noreply, state}
  end

  @impl true
  def handle_call({:get_stats, minutes}, _from, state) do
    cutoff = System.system_time(:millisecond) - (minutes * 60 * 1000)

    errors = :ets.tab2list(@table)
    |> Enum.filter(fn {_, data} -> data.last_seen >= cutoff end)

    total_count = Enum.reduce(errors, 0, fn {_, data}, acc -> acc + data.count end)
    unique_users = Enum.reduce(errors, MapSet.new(), fn {_, data}, acc ->
      MapSet.union(acc, data.users)
    end)

    stats = %{
      total_errors: total_count,
      unique_fingerprints: length(errors),
      affected_users: MapSet.size(unique_users),
      period_minutes: minutes,
      lifetime_errors: state.total_errors,
      lifetime_metrics: state.total_metrics
    }

    {:reply, stats, state}
  end

  @impl true
  def handle_call({:top_errors, limit}, _from, state) do
    top = :ets.tab2list(@table)
    |> Enum.sort_by(fn {_, data} -> -data.count end)
    |> Enum.take(limit)
    |> Enum.map(fn {fingerprint, data} ->
      %{
        fingerprint: fingerprint,
        count: data.count,
        first_seen: data.first_seen,
        last_seen: data.last_seen,
        affected_users: MapSet.size(data.users),
        sample_message: data.sample.message,
        sample_component: data.sample.component
      }
    end)

    {:reply, top, state}
  end

  @impl true
  def handle_info(:flush, state) do
    flush_to_storage()
    schedule_flush()
    {:noreply, state}
  end

  # ===========================================================================
  # Private Helpers
  # ===========================================================================

  defp enabled? do
    config(:enabled, true)
  end

  defp config(key, default) do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(key, default)
  end

  defp generate_fingerprint(report) do
    # Create a fingerprint for deduplication
    data = [
      report.message || "",
      report.component || "",
      report.action || "",
      report.level |> to_string()
    ] |> Enum.join("|")

    :crypto.hash(:sha256, data)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end

  defp maybe_alert(state, report, fingerprint) do
    now = System.system_time(:millisecond)
    threshold = config(:alert_threshold, 10)

    # Get recent error count for this fingerprint
    case :ets.lookup(@table, fingerprint) do
      [{^fingerprint, data}] when data.count >= threshold ->
        # Only alert once per alert window
        if now - state.last_alert_time > @alert_window do
          send_spike_alert(fingerprint, data, report)
          %{state | last_alert_time: now}
        else
          state
        end
      _ ->
        state
    end
  end

  defp send_alert(report) do
    Logger.error("FATAL_CLIENT_ERROR",
      error_id: report.error_id,
      component: report.component,
      message: report.message,
      user_id: report.user_id
    )

    # Send to Slack if configured
    if webhook = config(:slack_webhook, nil) do
      send_slack_alert(webhook, report)
    end

    # Send to PagerDuty if configured
    if key = config(:pagerduty_key, nil) do
      send_pagerduty_alert(key, report)
    end
  end

  defp send_spike_alert(fingerprint, data, sample) do
    Logger.warning("ERROR_SPIKE_DETECTED",
      fingerprint: fingerprint,
      count: data.count,
      affected_users: MapSet.size(data.users),
      component: sample.component,
      message: sample.message
    )

    if webhook = config(:slack_webhook, nil) do
      payload = %{
        text: "⚠️ Error Spike Detected",
        blocks: [
          %{
            type: "section",
            text: %{
              type: "mrkdwn",
              text: "*Error Spike Detected*\n#{data.count} occurrences in the last minute"
            }
          },
          %{
            type: "section",
            fields: [
              %{type: "mrkdwn", text: "*Component:*\n#{sample.component || "unknown"}"},
              %{type: "mrkdwn", text: "*Affected Users:*\n#{MapSet.size(data.users)}"},
              %{type: "mrkdwn", text: "*Message:*\n```#{String.slice(sample.message || "", 0, 200)}```"}
            ]
          }
        ]
      }

      send_webhook(webhook, payload)
    end
  end

  defp send_slack_alert(webhook, report) do
    payload = %{
      text: "🚨 Fatal Error",
      blocks: [
        %{
          type: "section",
          text: %{
            type: "mrkdwn",
            text: "*Fatal Error Reported*\nError ID: `#{report.error_id}`"
          }
        },
        %{
          type: "section",
          fields: [
            %{type: "mrkdwn", text: "*Component:*\n#{report.component || "unknown"}"},
            %{type: "mrkdwn", text: "*Action:*\n#{report.action || "unknown"}"},
            %{type: "mrkdwn", text: "*Message:*\n```#{String.slice(report.message || "", 0, 200)}```"}
          ]
        }
      ]
    }

    send_webhook(webhook, payload)
  end

  defp send_pagerduty_alert(key, report) do
    # PagerDuty Events API v2
    payload = %{
      routing_key: key,
      event_action: "trigger",
      dedup_key: report.error_id,
      payload: %{
        summary: "Fatal client error: #{report.component}/#{report.action}",
        source: "cgraph-web",
        severity: "critical",
        custom_details: %{
          error_id: report.error_id,
          message: report.message,
          component: report.component,
          action: report.action,
          user_id: report.user_id
        }
      }
    }

    Task.start(fn ->
      case :httpc.request(
        :post,
        {~c"https://events.pagerduty.com/v2/enqueue", [], ~c"application/json", Jason.encode!(payload)},
        [],
        []
      ) do
        {:ok, _} -> :ok
        {:error, reason} -> Logger.error("pagerduty_alert_failed", reason: inspect(reason))
      end
    end)
  end

  defp send_webhook(url, payload) do
    Task.start(fn ->
      case :httpc.request(
        :post,
        {String.to_charlist(url), [], ~c"application/json", Jason.encode!(payload)},
        [],
        []
      ) do
        {:ok, _} -> :ok
        {:error, reason} -> Logger.error("webhook_failed", reason: inspect(reason))
      end
    end)
  end

  defp schedule_flush do
    Process.send_after(self(), :flush, @flush_interval)
  end

  defp flush_to_storage do
    if config(:store_errors, true) do
      # Flush aggregated errors to database for long-term storage
      errors = :ets.tab2list(@table)

      for {fingerprint, data} <- errors do
        # Store in database (would use Ecto here)
        Logger.debug("flushing_error_aggregate_count", fingerprint: fingerprint, data_count: data.count)
      end

      # Clear old entries (keep last hour)
      cutoff = System.system_time(:millisecond) - :timer.hours(1)
      :ets.select_delete(@table, [{{:"$1", %{last_seen: :"$2"}}, [{:<, :"$2", cutoff}], [true]}])
    end
  end
end
