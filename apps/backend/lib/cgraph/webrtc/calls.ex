defmodule CGraph.WebRTC.Calls do
  @moduledoc """
  Call history persistence and queries for WebRTC calls.

  Manages the lifecycle of call records from active rooms to persisted
  historical data in the database, supporting pagination and lookup.
  """

  require Logger
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.WebRTC.{CallHistory, Room}

  @doc """
  List call history for a user, most recent first, with cursor-based pagination.
  """
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

  @doc """
  Get a single call history record by ID.
  """
  def get_call(call_id) do
    case Repo.get(CallHistory, call_id) do
      nil -> {:error, :not_found}
      call -> {:ok, call}
    end
  end

  @doc """
  Persist a completed call to the database.
  """
  def persist_call_history(%Room{} = final, original_room) do
    participant_ids =
      original_room.participants
      |> Map.keys()
      |> Enum.uniq()

    duration =
      if final.started_at && final.ended_at do
        DateTime.diff(final.ended_at, final.started_at, :second)
      end

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
      duration_seconds: duration
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
