defmodule CGraphWeb.CallChannelTest do
  @moduledoc """
  Tests for the call channel signaling enhancements.

  These tests validate the CallChannel handlers (quality_report, connection_state,
  screen sharing) without requiring the full WebRTC GenServer. We test the handler
  logic directly via the Calls context and CallQuality modules.
  """
  use CGraph.DataCase, async: true
  import CGraph.Factory

  alias CGraph.WebRTC.{Calls, CallQuality}

  setup do
    caller = insert(:user)
    callee = insert(:user)
    %{caller: caller, callee: callee}
  end

  describe "quality_report flow" do
    test "quality metrics are stored and retrievable", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)

      # Simulates what happens when client sends "quality_report"
      :ok = CallQuality.report_metrics(call.id, caller.id, %{
        "jitter_ms" => 12.5,
        "packet_loss_pct" => 0.3,
        "bitrate_kbps" => 3000,
        "round_trip_ms" => 35,
        "codec" => "opus",
        "resolution" => "1280x720"
      })

      latest = CallQuality.get_latest(call.id, caller.id)
      assert latest.jitter_ms == 12.5
      assert latest.codec == "opus"
    end

    test "multiple reports are aggregated in summary", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)

      for i <- 1..5 do
        CallQuality.report_metrics(call.id, caller.id, %{
          "jitter_ms" => i * 2.0,
          "packet_loss_pct" => 0.1 * i,
          "bitrate_kbps" => 2000,
          "round_trip_ms" => 40
        })
      end

      summary = CallQuality.build_summary(call.id)
      assert summary["samples"] == 5
      assert summary["avg_jitter_ms"] == 6.0
      assert summary["quality_score"] > 0
    end
  end

  describe "connection_state flow" do
    test "quality metrics survive through full call flow", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.accept_call(call.id, callee.id)

      CallQuality.report_metrics(call.id, caller.id, %{
        "jitter_ms" => 10.0,
        "packet_loss_pct" => 0.5,
        "bitrate_kbps" => 2500,
        "round_trip_ms" => 30
      })

      # End call flushes quality and cleans up ETS
      {:ok, ended} = Calls.end_call(call.id, caller.id)
      assert ended.quality_summary["samples"] == 1

      # ETS should be cleaned
      assert CallQuality.get_latest(call.id, caller.id) == nil
    end
  end

  describe "media controls flow" do
    test "call can be initiated and ended with audio type", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id, type: "audio")
      {:ok, _} = Calls.accept_call(call.id, callee.id)
      {:ok, ended} = Calls.end_call(call.id, caller.id)

      assert ended.type == "audio"
      assert ended.state == "ended"
    end

    test "call can be initiated with video type", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id, type: "video")
      assert call.type == "video"
    end
  end

  describe "screen share signaling" do
    test "screen share type calls are valid", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id, type: "screen_share")
      assert call.type == "screen_share"
    end
  end
end
