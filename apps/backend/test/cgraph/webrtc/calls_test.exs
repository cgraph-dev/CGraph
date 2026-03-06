defmodule CGraph.WebRTC.CallsTest do
  @moduledoc "Tests for call lifecycle management."
  use CGraph.DataCase, async: true
  import CGraph.Factory

  alias CGraph.WebRTC.{Calls, CallHistory, CallQuality}

  setup do
    caller = insert(:user)
    callee = insert(:user)
    %{caller: caller, callee: callee}
  end

  # ── Call Initiation ──────────────────────────────────────────────────

  describe "initiate_call/3" do
    test "creates a ringing call record", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id, type: "audio")

      assert call.state == "ringing"
      assert call.type == "audio"
      assert call.creator_id == caller.id
      assert caller.id in call.participant_ids
      assert callee.id in call.participant_ids
      assert call.started_at
    end

    test "creates a video call", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id, type: "video")
      assert call.type == "video"
    end

    test "attaches conversation_id when provided", %{caller: caller, callee: callee} do
      conv = insert(:conversation)
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id, conversation_id: conv.id)
      assert call.conversation_id == conv.id
    end
  end

  # ── Call Acceptance ──────────────────────────────────────────────────

  describe "accept_call/2" do
    test "transitions ringing to active", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, updated} = Calls.accept_call(call.id, callee.id)
      assert updated.state == "active"
    end

    test "rejects non-participant", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      other = insert(:user)
      assert {:error, :not_authorized} = Calls.accept_call(call.id, other.id)
    end

    test "returns not_found for missing call" do
      assert {:error, :not_found} = Calls.accept_call(Ecto.UUID.generate(), Ecto.UUID.generate())
    end
  end

  # ── Call Rejection ───────────────────────────────────────────────────

  describe "reject_call/3" do
    test "ends a ringing call with reason", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, rejected} = Calls.reject_call(call.id, callee.id, "busy")

      assert rejected.state == "ended"
      assert rejected.end_reason == "busy"
      assert rejected.ended_at
    end

    test "cannot reject an already ended call", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.reject_call(call.id, callee.id, "rejected")
      assert {:error, :invalid_state} = Calls.reject_call(call.id, callee.id, "rejected")
    end
  end

  # ── Call Ending ──────────────────────────────────────────────────────

  describe "end_call/2" do
    test "ends an active call with duration", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.accept_call(call.id, callee.id)
      {:ok, ended} = Calls.end_call(call.id, caller.id)

      assert ended.state == "ended"
      assert ended.end_reason == "completed"
      assert ended.ended_at
      assert is_integer(ended.duration_seconds)
    end

    test "ending a ringing call marks as missed", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, ended} = Calls.end_call(call.id, caller.id)

      assert ended.state == "ended"
      assert ended.end_reason == "missed"
    end

    test "cannot end an already ended call", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.end_call(call.id, caller.id)
      assert {:error, :already_ended} = Calls.end_call(call.id, caller.id)
    end
  end

  # ── Missed Calls ─────────────────────────────────────────────────────

  describe "missed call tracking" do
    test "counts unseen missed calls for callee", %{caller: caller, callee: callee} do
      {:ok, call1, _} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.reject_call(call1.id, callee.id, "missed")

      {:ok, call2, _} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.reject_call(call2.id, callee.id, "missed")

      assert Calls.get_missed_call_count(callee.id) == 2
      # Caller should not see them as missed
      assert Calls.get_missed_call_count(caller.id) == 0
    end

    test "mark_missed_calls_seen clears count", %{caller: caller, callee: callee} do
      {:ok, call, _} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.reject_call(call.id, callee.id, "missed")

      assert Calls.get_missed_call_count(callee.id) == 1
      Calls.mark_missed_calls_seen(callee.id)
      assert Calls.get_missed_call_count(callee.id) == 0
    end
  end

  # ── Call Quality ─────────────────────────────────────────────────────

  describe "quality metrics integration" do
    test "end_call flushes quality summary", %{caller: caller, callee: callee} do
      {:ok, call, _ref} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.accept_call(call.id, callee.id)

      # Report some metrics
      CallQuality.report_metrics(call.id, caller.id, %{
        jitter_ms: 5.0,
        packet_loss_pct: 0.5,
        bitrate_kbps: 2000,
        round_trip_ms: 50
      })

      {:ok, ended} = Calls.end_call(call.id, caller.id)

      assert is_map(ended.quality_summary)
      assert ended.quality_summary["samples"] == 1
      assert ended.quality_summary["avg_jitter_ms"] == 5.0
    end
  end

  # ── Call History ─────────────────────────────────────────────────────

  describe "list_call_history/2" do
    test "returns user's call history", %{caller: caller, callee: callee} do
      {:ok, call, _} = Calls.initiate_call(caller.id, callee.id)
      {:ok, _} = Calls.accept_call(call.id, callee.id)
      {:ok, _} = Calls.end_call(call.id, caller.id)

      {:ok, calls, _page_info} = Calls.list_call_history(caller.id)
      assert length(calls) >= 1
    end

    test "returns empty list for user with no calls" do
      user = insert(:user)
      {:ok, calls, _} = Calls.list_call_history(user.id)
      assert calls == []
    end
  end

  describe "get_call/1" do
    test "returns a call by id", %{caller: caller, callee: callee} do
      {:ok, call, _} = Calls.initiate_call(caller.id, callee.id)
      {:ok, fetched} = Calls.get_call(call.id)
      assert fetched.id == call.id
    end

    test "returns not_found for missing id" do
      assert {:error, :not_found} = Calls.get_call(Ecto.UUID.generate())
    end
  end
end
