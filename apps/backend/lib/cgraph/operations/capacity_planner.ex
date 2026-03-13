defmodule CGraph.Operations.CapacityPlanner do
  @moduledoc """
  Capacity planning and growth forecasting.

  Analyzes historical metrics to predict future resource needs and
  provides actionable scaling recommendations.

  ## Features

  - **Growth forecasting** — Linear regression on 30-day metric windows
  - **Scaling recommendations** — Threshold-based checks for CPU, memory, DB connections
  - **Capacity reports** — Comprehensive overview of current vs projected usage

  ## Usage

      # Forecast growth for a specific metric
      {:ok, forecast} = CapacityPlanner.forecast_growth(:daily_active_users)
      # => %{current: 5200, predicted_30d: 7800, growth_rate: 0.015, confidence: :medium}

      # Get scaling recommendations
      recommendations = CapacityPlanner.recommend_scaling(%{
        cpu_percent: 72,
        memory_percent: 68,
        db_connections_percent: 45,
        disk_percent: 55
      })
      # => [%{resource: :cpu, action: :scale_up, urgency: :warning, ...}]

      # Generate full capacity report
      report = CapacityPlanner.generate_report()
  """

  require Logger

  @dialyzer {:nowarn_function, collect_forecasts: 0}

  @type metric_name :: atom()
  @type data_point :: %{timestamp: DateTime.t(), value: number()}
  @type forecast :: %{
          metric: metric_name(),
          current: number(),
          predicted_30d: number(),
          predicted_90d: number(),
          growth_rate_daily: float(),
          trend: :growing | :stable | :declining,
          confidence: :high | :medium | :low
        }

  @type recommendation :: %{
          resource: atom(),
          action: :scale_up | :scale_down | :monitor | :no_action,
          urgency: :critical | :warning | :info,
          current_value: number(),
          threshold: number(),
          suggestion: String.t()
        }

  @thresholds %{
    cpu_percent: %{critical: 90, warning: 70, low: 30},
    memory_percent: %{critical: 95, warning: 80, low: 40},
    db_connections_percent: %{critical: 90, warning: 75, low: 20},
    disk_percent: %{critical: 85, warning: 70, low: 30},
    error_rate_percent: %{critical: 5.0, warning: 1.0, low: 0.0},
    p99_latency_ms: %{critical: 2000, warning: 1000, low: 0}
  }

  # ── Forecasting ─────────────────────────────────────────────

  @doc """
  Forecast growth for a metric using linear regression on historical data.

  Accepts either a metric name (fetches from metrics system) or raw
  data points.

  ## Options

    * `:window_days` — Number of historical days to analyze (default: 30)
    * `:data` — List of `%{timestamp: DateTime.t(), value: number()}` to use
      instead of fetching from metrics system

  ## Returns

      {:ok, %{
        metric: :daily_active_users,
        current: 5200,
        predicted_30d: 7800,
        predicted_90d: 12500,
        growth_rate_daily: 0.015,
        trend: :growing,
        confidence: :medium
      }}
  """
  @spec forecast_growth(metric_name(), keyword()) :: {:ok, forecast()} | {:error, term()}
  def forecast_growth(metric, opts \\ []) do
    window_days = Keyword.get(opts, :window_days, 30)

    data_points =
      case Keyword.get(opts, :data) do
        nil -> fetch_metric_history(metric, window_days)
        data when is_list(data) -> data
      end

    case data_points do
      [] ->
        {:error, :no_data}

      points when length(points) < 3 ->
        {:error, :insufficient_data}

      points ->
        perform_forecast(metric, points)
    end
  end

  defp perform_forecast(metric, points) do
    # Convert timestamps to numeric x values (days since first point)
    {xs, ys} = points_to_xy(points)
    n = length(xs)

    # Linear regression: y = mx + b
    {slope, intercept} = linear_regression(xs, ys)

    current = List.last(ys)
    last_x = List.last(xs)

    predicted_30d = slope * (last_x + 30) + intercept
    predicted_90d = slope * (last_x + 90) + intercept

    # Calculate R² for confidence
    y_mean = Enum.sum(ys) / n
    ss_res = Enum.zip(xs, ys) |> Enum.map(fn {x, y} -> :math.pow(y - (slope * x + intercept), 2) end) |> Enum.sum()
    ss_tot = Enum.map(ys, fn y -> :math.pow(y - y_mean, 2) end) |> Enum.sum()
    r_squared = if ss_tot > 0, do: 1.0 - ss_res / ss_tot, else: 0.0

    confidence =
      cond do
        r_squared > 0.8 and n >= 14 -> :high
        r_squared > 0.5 and n >= 7 -> :medium
        true -> :low
      end

    trend =
      cond do
        slope > 0.01 * abs(intercept + 1) -> :growing
        slope < -0.01 * abs(intercept + 1) -> :declining
        true -> :stable
      end

    daily_growth_rate = if current > 0, do: slope / current, else: 0.0

    forecast = %{
      metric: metric,
      current: current,
      predicted_30d: max(0, Float.round(predicted_30d, 1)),
      predicted_90d: max(0, Float.round(predicted_90d, 1)),
      growth_rate_daily: Float.round(daily_growth_rate, 6),
      trend: trend,
      confidence: confidence,
      r_squared: Float.round(r_squared, 4),
      data_points: length(ys)
    }

    {:ok, forecast}
  end

  @doc """
  Perform linear regression on x,y pairs.

  Returns `{slope, intercept}` for the best-fit line y = slope*x + intercept.
  """
  @spec linear_regression([number()], [number()]) :: {float(), float()}
  def linear_regression(xs, ys) do
    n = length(xs)
    sum_x = Enum.sum(xs)
    sum_y = Enum.sum(ys)
    sum_xy = Enum.zip(xs, ys) |> Enum.map(fn {x, y} -> x * y end) |> Enum.sum()
    sum_x2 = Enum.map(xs, fn x -> x * x end) |> Enum.sum()

    denominator = n * sum_x2 - sum_x * sum_x

    if abs(denominator) < 1.0e-10 do
      # All x values are the same — flat line
      {0.0, sum_y / max(n, 1)}
    else
      slope = (n * sum_xy - sum_x * sum_y) / denominator
      intercept = (sum_y - slope * sum_x) / n
      {slope, intercept}
    end
  end

  defp points_to_xy(points) do
    sorted = Enum.sort_by(points, & &1.timestamp, DateTime)
    first_ts = hd(sorted).timestamp

    Enum.reduce(sorted, {[], []}, fn point, {xs, ys} ->
      days = DateTime.diff(point.timestamp, first_ts, :second) / 86_400
      {xs ++ [days], ys ++ [point.value]}
    end)
  end

  # ── Scaling Recommendations ─────────────────────────────────

  @doc """
  Recommend scaling actions based on current resource utilization.

  Accepts a map of resource names to current values and returns
  a list of recommendations with urgency levels.

  ## Input

      %{
        cpu_percent: 72.5,
        memory_percent: 68.0,
        db_connections_percent: 45.0,
        disk_percent: 55.0,
        error_rate_percent: 0.3,
        p99_latency_ms: 450
      }

  ## Returns

      [%{resource: :cpu, action: :scale_up, urgency: :warning, ...}, ...]
  """
  @spec recommend_scaling(map()) :: [recommendation()]
  def recommend_scaling(metrics) when is_map(metrics) do
    metrics
    |> Enum.flat_map(fn {resource, value} ->
      case Map.get(@thresholds, resource) do
        nil ->
          []

        thresholds ->
          [evaluate_resource(resource, value, thresholds)]
      end
    end)
    |> Enum.sort_by(fn rec ->
      urgency_order = %{critical: 0, warning: 1, info: 2}
      Map.get(urgency_order, rec.urgency, 3)
    end)
  end

  defp evaluate_resource(resource, value, %{critical: crit, warning: warn, low: low}) do
    {action, urgency, suggestion} =
      cond do
        value >= crit ->
          {:scale_up, :critical,
           "#{resource} at #{value}% — exceeds critical threshold (#{crit}%). Immediate scaling required."}

        value >= warn ->
          {:scale_up, :warning,
           "#{resource} at #{value}% — approaching critical (#{crit}%). Plan scaling."}

        value <= low ->
          {:scale_down, :info,
           "#{resource} at #{value}% — below low threshold (#{low}%). Consider scaling down to save costs."}

        true ->
          {:no_action, :info,
           "#{resource} at #{value}% — within normal range."}
      end

    %{
      resource: resource,
      action: action,
      urgency: urgency,
      current_value: value,
      threshold: %{critical: crit, warning: warn, low: low},
      suggestion: suggestion
    }
  end

  # ── Capacity Report ─────────────────────────────────────────

  @doc """
  Generate a comprehensive capacity planning report.

  Combines current metrics, growth forecasts, and scaling
  recommendations into a single report.
  """
  @spec generate_report() :: map()
  def generate_report do
    current_metrics = collect_current_metrics()
    recommendations = recommend_scaling(current_metrics)

    forecasts = collect_forecasts()

    %{
      generated_at: DateTime.utc_now(),
      current_metrics: current_metrics,
      recommendations: recommendations,
      forecasts: forecasts,
      summary: generate_summary(recommendations),
      infrastructure: infrastructure_info()
    }
  end

  defp collect_current_metrics do
    memory = :erlang.memory()
    total_mem_mb = div(memory[:total], 1_048_576)
    # Assume 512MB allocation (configurable via env)
    max_mem_mb = String.to_integer(System.get_env("MAX_MEMORY_MB", "512"))
    mem_percent = total_mem_mb / max_mem_mb * 100

    process_count = :erlang.system_info(:process_count)
    process_limit = :erlang.system_info(:process_limit)

    schedulers = :erlang.system_info(:schedulers_online)

    %{
      memory_percent: Float.round(mem_percent, 1),
      memory_used_mb: total_mem_mb,
      memory_limit_mb: max_mem_mb,
      process_count: process_count,
      process_limit: process_limit,
      process_percent: Float.round(process_count / process_limit * 100, 1),
      schedulers_online: schedulers
    }
  end

  defp collect_forecasts do
    forecast_metrics = [:daily_active_users, :messages_per_day, :api_requests_per_hour]

    Enum.reduce(forecast_metrics, %{}, fn metric, acc ->
      case forecast_growth(metric) do
        {:ok, forecast} -> Map.put(acc, metric, forecast)
        {:error, _reason} -> acc
      end
    end)
  end

  defp generate_summary(recommendations) do
    critical_count = Enum.count(recommendations, &(&1.urgency == :critical))
    warning_count = Enum.count(recommendations, &(&1.urgency == :warning))

    overall_status =
      cond do
        critical_count > 0 -> :critical
        warning_count > 0 -> :warning
        true -> :healthy
      end

    %{
      status: overall_status,
      critical_issues: critical_count,
      warnings: warning_count,
      action_required: critical_count > 0 or warning_count > 0
    }
  end

  defp infrastructure_info do
    %{
      platform: "Fly.io",
      region: System.get_env("FLY_REGION", "unknown"),
      app_name: System.get_env("FLY_APP_NAME", "cgraph-backend"),
      vm_id: System.get_env("FLY_ALLOC_ID", "local"),
      otp_release: :erlang.system_info(:otp_release) |> to_string(),
      elixir_version: System.version()
    }
  end

  defp fetch_metric_history(metric, window_days) do
    # In production, this would query MetricsCollector/Prometheus for
    # historical data. For now, return empty list to indicate no data.
    Logger.debug(
      "[CapacityPlanner] Would fetch #{window_days} days of #{metric} history"
    )

    []
  end
end
