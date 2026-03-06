defmodule CGraph.WebRTC.Calls do
  @moduledoc """
  Call lifecycle management and history persistence.

  Manages the full call state machine (ringing → connecting → connected → ended),
  ring/connection timeouts, missed call tracking, and quality summary storage.
  """

  require Logger
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.WebRTC.{CallHistory, CallQuality, Room}

  @ring_timeout_ms 30_000
  @connection_timeout_ms 10_000
  @max_call_duration_ms 4 * 60 * 60 * 1000

  # ── Call History Queries ──────────────────────────────────────────────

  @doc "List call history for a user, most recent first, with cursor-based pagination."
  @spec list_call_history(String.t(), keyword()) :: {:ok, [map()], map()}
  def list_call_history(user_id, opts \\ []) do
    query =
      from(c in CallHistory,
        where: ^user_id in c.participant_ids or c.creator_id == ^user_id
      )

    pagination_opts = %{
      cursor: Keyword.get(opts, :cursor),
      after_cursor: nil,
      before_cursor: nil,
      limit: min(Keyword.get(opts, :limit, 50), 100),
      sort_field: :ended_at,
      sort_direction: :desc,
      include_total: Keyword.get(opts, :include_total, false)
    }

    {calls, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    {:ok, calls, page_info}
  end

  @doc "Get a single call history record by ID."
  @spec get_call(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_call(call_id) do
    case Repo.get(CallHistory, call_id) do
      nil -> {:error, :not_found}
      call -> {:ok, call}
    end
  end

  # ── Call Lifecycle ───────────────────────────────────────────────────

  @doc """
  Initiate a call. Creates a call_history record in "ringing" state
  and schedules a ring timeout.

  Returns `{:ok, call_record, timer_ref}`.
  """
  @spec initiate_call(String.t(), String.t(), keyword()) :: {:ok, CallHistory.t(), reference()} | {:error, term()}
  def initiate_call(caller_id, callee_id, opts \\ []) do
    call_type = Keyword.get(opts, :type, "audio")
    conversation_id = Keyword.get(opts, :conversation_id)
    room_id = Keyword.get(opts, :room_id, Ecto.UUID.generate())

    attrs = %{
      room_id: room_id,
      type: call_type,
      creator_id: caller_id,
      state: "ringing",
      participant_ids: [caller_id, callee_id],
      max_participants: 2,
      started_at: DateTime.utc_now(),
      conversation_id: conversation_id
    }

    case Repo.insert(CallHistory.changeset(%CallHistory{}, attrs)) do
      {:ok, call} ->
        # Schedule ring timeout
        timer_ref = Process.send_after(self(), {:ring_timeout, call.id}, @ring_timeout_ms)
        Logger.info("call_initiated", call_id: call.id, caller: caller_id, callee: callee_id)
        {:ok, call, timer_ref}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc "Accept a call — transitions from ringing to active."
  @spec accept_call(String.t(), String.t()) :: {:ok, CallHistory.t()} | {:error, term()}
  def accept_call(call_id, callee_id) do
    case Repo.get(CallHistory, call_id) do
      nil ->
        {:error, :not_found}

      %{state: "ringing"} = call ->
        if callee_id in (call.participant_ids || []) do
          call
          |> CallHistory.changeset(%{state: "active"})
          |> Repo.update()
        else
          {:error, :not_authorized}
        end

      _ ->
        {:error, :invalid_state}
    end
  end

  @doc "Reject a call with a reason (rejected, busy, timeout)."
  @spec reject_call(String.t(), String.t(), String.t()) :: {:ok, CallHistory.t()} | {:error, term()}
  def reject_call(call_id, _user_id, reason \\ "rejected") do
    case Repo.get(CallHistory, call_id) do
      nil ->
        {:error, :not_found}

      %{state: "ringing"} = call ->
        call
        |> CallHistory.changeset(%{
          state: "ended",
          end_reason: reason,
          ended_at: DateTime.utc_now()
        })
        |> Repo.update()

      _ ->
        {:error, :invalid_state}
    end
  end

  @doc "End an active call. Records duration and flushes quality metrics."
  @spec end_call(String.t(), String.t()) :: {:ok, CallHistory.t()} | {:error, term()}
  def end_call(call_id, _user_id) do
    case Repo.get(CallHistory, call_id) do
      nil ->
        {:error, :not_found}

      %{state: state} = call when state in ["active", "ringing"] ->
        now = DateTime.utc_now()

        duration =
          if call.started_at do
            DateTime.diff(now, call.started_at, :second)
          end

        quality_summary = CallQuality.flush(call_id)
        end_reason = if state == "ringing", do: "missed", else: "completed"

        call
        |> CallHistory.changeset(%{
          state: "ended",
          ended_at: now,
          duration_seconds: duration,
          quality_summary: quality_summary,
          end_reason: end_reason
        })
        |> Repo.update()

      _ ->
        {:error, :already_ended}
    end
  end

  @doc "Mark a ringing call as missed (from ring timeout)."
  @spec mark_missed(String.t()) :: {:ok, CallHistory.t()} | {:error, term()}
  def mark_missed(call_id) do
    reject_call(call_id, nil, "missed")
  end

  # ── Missed Call Tracking ─────────────────────────────────────────────

  @doc "Count unacknowledged missed calls for a user."
  @spec get_missed_call_count(String.t()) :: integer()
  def get_missed_call_count(user_id) do
    from(c in CallHistory,
      where: c.state == "ended",
      where: c.end_reason == "missed",
      where: c.missed_seen == false,
      where: ^user_id in c.participant_ids,
      where: c.creator_id != ^user_id
    )
    |> Repo.aggregate(:count)
  end

  @doc "Mark all missed calls as seen for a user."
  @spec mark_missed_calls_seen(String.t()) :: {integer(), nil}
  def mark_missed_calls_seen(user_id) do
    from(c in CallHistory,
      where: c.state == "ended",
      where: c.end_reason == "missed",
      where: c.missed_seen == false,
      where: ^user_id in c.participant_ids,
      where: c.creator_id != ^user_id
    )
    |> Repo.update_all(set: [missed_seen: true])
  end

  # ── Timeouts ─────────────────────────────────────────────────────────

  @doc "Ring timeout in milliseconds."
  def ring_timeout_ms, do: @ring_timeout_ms

  @doc "Connection timeout in milliseconds."
  def connection_timeout_ms, do: @connection_timeout_ms

  @doc "Max call duration in milliseconds."
  def max_call_duration_ms, do: @max_call_duration_ms

  # ── Persistence from Room ────────────────────────────────────────────

  @doc "Persist a completed call from a WebRTC Room to the database."
  @spec persist_call_history(Room.t(), Room.t()) :: :ok
  def persist_call_history(%Room{} = final, original_room) do
    participant_ids =
      original_room.participants
      |> Map.keys()
      |> Enum.uniq()

    duration =
      if final.started_at && final.ended_at do
        DateTime.diff(final.ended_at, final.started_at, :second)
      end

    quality_summary = CallQuality.flush(final.id)

    attrs = %{
      room_id: final.id,
      type: to_string(final.type),
      creator_id: final.creator_id,
      group_id: final.group_id,
      state: "ended",
      participant_ids: participant_ids,
      max_participants: map_size(original_room.participants),
      started_at: final.started_at || final.created_at,
      ended_at: final.ended_at,
      duration_seconds: duration,
      quality_summary: quality_summary,
      end_reason: "completed"
    }

    case Repo.insert(CallHistory.changeset(%CallHistory{}, attrs)) do
      {:ok, record} ->
        Logger.info("webrtc_call_persisted", call_id: record.id, room_id: final.id)

      {:error, reason} ->
        Logger.error("webrtc_call_persist_failed",
          room_id: final.id,
          error: inspect(reason)
        )
    end
  rescue
    e ->
      Logger.error("webrtc_call_persist_error",
        room_id: final.id,
        error: Exception.message(e)
      )
  end
end
