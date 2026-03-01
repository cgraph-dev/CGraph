defmodule CGraphWeb.API.V1.CallController do
  @moduledoc """
  REST controller for call history endpoints.

  Provides cursor-paginated call history for authenticated users
  and individual call record lookup.
  """
  use CGraphWeb, :controller

  alias CGraph.WebRTC.Calls

  action_fallback CGraphWeb.FallbackController

  @doc """
  List call history for the authenticated user.

  GET /api/v1/calls

  Query params:
  - `cursor` (optional) — pagination cursor from previous response
  - `limit` (optional, default 50, max 100) — page size

  Returns:
  ```json
  {
    "data": [...],
    "meta": { "cursor": "...", "has_more": true }
  }
  ```
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user

    opts =
      []
      |> maybe_put(:cursor, params["cursor"])
      |> maybe_put(:limit, parse_limit(params["limit"]))

    case Calls.list_call_history(user.id, opts) do
      {:ok, calls, page_info} ->
        conn
        |> put_status(:ok)
        |> json(%{
          data: Enum.map(calls, &serialize_call/1),
          meta: %{
            cursor: page_info[:end_cursor] || page_info[:cursor],
            has_more: page_info[:has_next_page] || page_info[:has_more] || false
          }
        })

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: inspect(reason)})
    end
  end

  @doc """
  Show a single call history record.

  GET /api/v1/calls/:id
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => call_id}) do
    case Calls.get_call(call_id) do
      {:ok, call} ->
        conn
        |> put_status(:ok)
        |> json(%{data: serialize_call(call)})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Call not found"})
    end
  end

  # ── Private helpers ──────────────────────────────────────────────────

  defp serialize_call(call) do
    %{
      id: call.id,
      room_id: call.room_id,
      type: call.type,
      creator_id: call.creator_id,
      group_id: call.group_id,
      state: call.state,
      participant_ids: call.participant_ids || [],
      max_participants: call.max_participants || 0,
      started_at: call.started_at,
      ended_at: call.ended_at,
      duration_seconds: call.duration_seconds,
      inserted_at: call.inserted_at
    }
  end

  defp parse_limit(nil), do: 50
  defp parse_limit(val) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} -> min(max(n, 1), 100)
      :error -> 50
    end
  end
  defp parse_limit(val) when is_integer(val), do: min(max(val, 1), 100)
  defp parse_limit(_), do: 50

  defp maybe_put(opts, _key, nil), do: opts
  defp maybe_put(opts, key, value), do: Keyword.put(opts, key, value)
end
