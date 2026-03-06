defmodule CGraph.WebRTC.CallQuality do
  @moduledoc """
  Call quality metrics collection and aggregation.

  Collects real-time quality metrics (jitter, packet loss, bitrate, RTT)
  during calls via ETS, then flushes a summary to the call_history record
  when the call ends.
  """

  require Logger

  @ets_table :call_quality_metrics

  # ── Public API ──────────────────────────────────────────────────────

  @doc "Initialize the ETS table for quality metrics. Called once at app start."
  @spec init() :: :ok
  def init do
    if :ets.whereis(@ets_table) == :undefined do
      :ets.new(@ets_table, [:named_table, :bag, :public])
    end

    :ok
  end

  @doc """
  Report quality metrics for a call participant.

  Metrics map keys:
  - jitter_ms (float) — inter-packet jitter in milliseconds
  - packet_loss_pct (float) — percentage of lost packets (0.0-100.0)
  - bitrate_kbps (integer) — current bitrate in kbps
  - round_trip_ms (integer) — round-trip time in milliseconds
  - codec (string) — active codec name
  - resolution (string) — video resolution e.g. "1280x720"
  """
  @spec report_metrics(String.t(), String.t(), map()) :: :ok
  def report_metrics(call_id, user_id, metrics) when is_map(metrics) do
    init()

    entry = %{
      user_id: user_id,
      timestamp: System.monotonic_time(:millisecond),
      jitter_ms: metrics["jitter_ms"] || metrics[:jitter_ms] || 0.0,
      packet_loss_pct: metrics["packet_loss_pct"] || metrics[:packet_loss_pct] || 0.0,
      bitrate_kbps: metrics["bitrate_kbps"] || metrics[:bitrate_kbps] || 0,
      round_trip_ms: metrics["round_trip_ms"] || metrics[:round_trip_ms] || 0,
      codec: metrics["codec"] || metrics[:codec],
      resolution: metrics["resolution"] || metrics[:resolution]
    }

    :ets.insert(@ets_table, {call_id, entry})
    :ok
  end

  @doc """
  Build a quality summary for a call from collected ETS metrics.
  Returns a map suitable for storing in call_history.quality_summary.
  """
  @spec build_summary(String.t()) :: map()
  def build_summary(call_id) do
    init()

    entries =
      @ets_table
      |> :ets.lookup(call_id)
      |> Enum.map(fn {_key, entry} -> entry end)

    if entries == [] do
      %{}
    else
      %{
        "samples" => length(entries),
        "avg_jitter_ms" => safe_avg(entries, :jitter_ms),
        "avg_packet_loss_pct" => safe_avg(entries, :packet_loss_pct),
        "avg_bitrate_kbps" => safe_avg(entries, :bitrate_kbps) |> round(),
        "avg_round_trip_ms" => safe_avg(entries, :round_trip_ms) |> round(),
        "max_jitter_ms" => entries |> Enum.map(& &1.jitter_ms) |> Enum.max(),
        "max_packet_loss_pct" => entries |> Enum.map(& &1.packet_loss_pct) |> Enum.max(),
        "quality_score" => compute_quality_score(entries)
      }
    end
  end

  @doc """
  Flush metrics for a call: build summary and delete ETS entries.
  Returns the quality summary map.
  """
  @spec flush(String.t()) :: map()
  def flush(call_id) do
    summary = build_summary(call_id)
    cleanup(call_id)
    summary
  end

  @doc "Remove all metric entries for a call."
  @spec cleanup(String.t()) :: :ok
  def cleanup(call_id) do
    init()
    :ets.delete(@ets_table, call_id)
    :ok
  end

  @doc """
  Get the latest quality snapshot for a specific user in a call.
  """
  @spec get_latest(String.t(), String.t()) :: map() | nil
  def get_latest(call_id, user_id) do
    init()

    @ets_table
    |> :ets.lookup(call_id)
    |> Enum.map(fn {_key, entry} -> entry end)
    |> Enum.filter(&(&1.user_id == user_id))
    |> Enum.max_by(& &1.timestamp, fn -> nil end)
  end

  # ── Private ─────────────────────────────────────────────────────────

  defp safe_avg([], _field), do: 0.0

  defp safe_avg(entries, field) do
    values = Enum.map(entries, &Map.get(&1, field, 0))
    Enum.sum(values) / length(values)
  end

  # Quality score: 0-100 based on jitter, packet loss, and RTT.
  # Weighted: packet_loss (50%), jitter (25%), RTT (25%).
  defp compute_quality_score(entries) do
    avg_loss = safe_avg(entries, :packet_loss_pct)
    avg_jitter = safe_avg(entries, :jitter_ms)
    avg_rtt = safe_avg(entries, :round_trip_ms)

    loss_score = max(0, 100 - avg_loss * 10)
    jitter_score = max(0, 100 - avg_jitter)
    rtt_score = max(0, 100 - avg_rtt / 5)

    score = loss_score * 0.5 + jitter_score * 0.25 + rtt_score * 0.25
    round(min(100, max(0, score)))
  end
end
