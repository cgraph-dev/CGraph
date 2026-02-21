defmodule CGraph.Presence.Queries do
  @moduledoc """
  Presence query functions.

  Provides read-only lookups for user presence, online status, typing
  indicators, and bulk status checks. Uses Redis for O(1) global queries
  and falls back to CRDT state for room-scoped queries.
  """

  alias CGraph.Presence
  alias CGraph.Presence.Sampled

  @typing_timeout_ms 5_000

  # Redis keys for scalable global presence
  @online_set_key "presence:online_set"

  # ---------------------------------------------------------------------------
  # Room Queries
  # ---------------------------------------------------------------------------

  @doc """
  Get all online users in a room.

  For channels with >100 users, delegates to Sampled presence for efficiency.
  Returns map of user_id => presence metadata.
  """
  def list_room_users(room_id) do
    # Try sampled presence first for large channels
    case Sampled.get_summary(room_id) do
      {:ok, %{online: online}} when online > 100 ->
        case Sampled.list_online(room_id) do
          {:ok, users} -> users
          _error -> Presence.list(Presence.room_topic(room_id)) |> transform_presence_list()
        end

      _small_or_error ->
        Presence.list(Presence.room_topic(room_id)) |> transform_presence_list()
    end
  end

  @doc """
  Get online user IDs in a room.
  """
  def list_room_user_ids(room_id) do
    Presence.list(Presence.room_topic(room_id))
    |> Map.keys()
  end

  @doc """
  Count online users in a room.

  Uses Sampled presence HyperLogLog for O(1) approximate counts in large channels.
  Falls back to CRDT list for small channels.
  """
  def count_room_users(room_id) do
    case Sampled.approximate_count(room_id) do
      {:ok, count} when count > 0 -> count
      _fallback -> Presence.list(Presence.room_topic(room_id)) |> map_size()
    end
  end

  @doc """
  Get users currently typing in a room.
  """
  def list_typing_users(room_id) do
    now = DateTime.utc_now()

    Presence.list(Presence.room_topic(room_id))
    |> Enum.filter(fn {_user_id, %{metas: metas}} ->
      Enum.any?(metas, fn meta ->
        meta.typing && typing_still_valid?(meta.typing_at, now)
      end)
    end)
    |> Enum.map(fn {user_id, _} -> user_id end)
  end

  # ---------------------------------------------------------------------------
  # Global User Queries
  # ---------------------------------------------------------------------------

  @doc """
  Check if a specific user is online.

  Uses Redis SET membership check — O(1) instead of loading all users.
  """
  def user_online?(user_id) do
    user_key = to_string(user_id)

    case CGraph.Redis.command(["SISMEMBER", @online_set_key, user_key]) do
      {:ok, 1} -> true
      {:ok, 0} -> false
      _ -> false
    end
  rescue
    _ -> false
  end

  @doc """
  Check if user is online in a specific room.
  """
  def user_online_in_room?(user_id, room_id) do
    presences = Presence.list(Presence.room_topic(room_id))
    Map.has_key?(presences, to_string(user_id))
  end

  @doc """
  List all currently online users globally.

  WARNING: This still loads the full CRDT state. Prefer `list_online_users/1`
  (paginated) or specific lookups like `user_online?/1`, `bulk_status/1`.
  Kept for backward compatibility but should be avoided at scale.
  """
  def list_online_users do
    Presence.list("users:online")
    |> transform_presence_list()
  end

  @doc """
  Get online user IDs globally.

  Uses Redis SET for O(N) scan instead of materializing full CRDT with metadata.
  For large sets, prefer paginated endpoints.
  """
  def list_online_user_ids do
    case CGraph.Redis.command(["SMEMBERS", @online_set_key]) do
      {:ok, ids} when is_list(ids) -> ids
      _ -> Presence.list("users:online") |> Map.keys()
    end
  rescue
    _ -> Presence.list("users:online") |> Map.keys()
  end

  @doc """
  Get a user's current status. O(1) via Redis hash lookup.
  """
  def get_user_status(user_id) do
    user_key = to_string(user_id)

    case CGraph.Redis.command(["HGET", Presence.Store.presence_meta_key(user_key), "status"]) do
      {:ok, nil} -> "offline"
      {:ok, status} when is_binary(status) -> status
      _ -> "offline"
    end
  rescue
    _ -> "offline"
  end

  @doc """
  Get detailed user presence info. O(1) via Redis hash lookup.
  """
  def get_user_presence(user_id) do
    user_key = to_string(user_id)

    case CGraph.Redis.command(["HGETALL", Presence.Store.presence_meta_key(user_key)]) do
      {:ok, fields} when is_list(fields) and fields != [] ->
        Presence.Store.redis_hash_to_presence(fields)

      _ ->
        nil
    end
  rescue
    _ -> nil
  end

  @doc """
  Get status of multiple users at once. O(N) via pipelined Redis lookups.

  Returns map of user_id => status.
  """
  def bulk_status(user_ids) when is_list(user_ids) do
    if user_ids == [] do
      %{}
    else
      commands =
        Enum.map(user_ids, fn user_id ->
          ["HGET", Presence.Store.presence_meta_key(to_string(user_id)), "status"]
        end)

      case CGraph.Redis.pipeline(commands) do
        {:ok, results} ->
          user_ids
          |> Enum.zip(results)
          |> Map.new(fn {user_id, status} ->
            {user_id, if(is_binary(status), do: status, else: "offline")}
          end)

        _ ->
          Map.new(user_ids, fn user_id -> {user_id, "offline"} end)
      end
    end
  rescue
    _ -> Map.new(user_ids, fn user_id -> {user_id, "offline"} end)
  end

  # ---------------------------------------------------------------------------
  # Multi-Device Presence Merging
  # ---------------------------------------------------------------------------

  @doc """
  Merge presence metadata across multiple devices into a single unified view.
  """
  def merge_multi_device_presence(metas) when is_list(metas) do
    base = %{
      devices: [],
      status: "offline",
      online_at: nil,
      last_active: nil,
      typing: false
    }

    Enum.reduce(metas, base, fn meta, acc ->
      %{
        acc
        | devices: [meta[:device] | acc.devices] |> Enum.uniq() |> Enum.reject(&is_nil/1),
          status: best_status([acc.status, meta[:status] || "online"]),
          online_at: earliest_time(acc.online_at, meta[:online_at]),
          last_active: latest_time(acc.last_active, meta[:last_active]),
          typing: acc.typing || meta[:typing] || false
      }
    end)
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp typing_still_valid?(nil, _now), do: false

  defp typing_still_valid?(typing_at, now) do
    diff = DateTime.diff(now, typing_at, :millisecond)
    diff < @typing_timeout_ms
  end

  @doc false
  def transform_presence_list(presences) do
    Map.new(presences, fn {user_id, %{metas: metas}} ->
      {user_id, merge_multi_device_presence(metas)}
    end)
  end

  defp best_status(statuses) do
    cond do
      "online" in statuses -> "online"
      "busy" in statuses -> "busy"
      "away" in statuses -> "away"
      "invisible" in statuses -> "invisible"
      true -> "offline"
    end
  end

  defp earliest_time(nil, b), do: b
  defp earliest_time(a, nil), do: a

  defp earliest_time(a, b) do
    if DateTime.compare(a, b) == :lt, do: a, else: b
  end

  defp latest_time(nil, b), do: b
  defp latest_time(a, nil), do: a

  defp latest_time(a, b) do
    if DateTime.compare(a, b) == :gt, do: a, else: b
  end
end
