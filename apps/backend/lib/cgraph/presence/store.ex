defmodule CGraph.Presence.Store do
  @moduledoc """
  Redis-backed presence storage and REST API presence operations.

  Handles:
  - Redis sync for global presence (sorted sets, sets, hashes)
  - Last-seen tracking via Cachex
  - Paginated online user listing
  - Presence statistics
  - Location and visibility helpers
  """

  require Logger

  alias CGraph.Presence.Queries

  @last_seen_ttl_ms 604_800_000

  # Redis keys for scalable global presence
  @online_set_key "presence:online_set"
  @online_zset_key "presence:online_zset"

  # ---------------------------------------------------------------------------
  # Last Seen Tracking
  # ---------------------------------------------------------------------------

  @doc """
  Get when user was last seen.
  """
  @spec last_seen(String.t()) :: DateTime.t() | nil
  def last_seen(user_id) do
    case Cachex.get(:cgraph_cache, last_seen_key(user_id)) do
      {:ok, nil} -> nil
      {:ok, timestamp} -> timestamp
      _ -> nil
    end
  end

  @doc """
  Record user's last seen timestamp.
  """
  @spec record_last_seen(String.t()) :: DateTime.t()
  def record_last_seen(user_id) do
    now = DateTime.utc_now()
    Cachex.put(:cgraph_cache, last_seen_key(user_id), now, ttl: @last_seen_ttl_ms)
    now
  end

  @doc """
  Get last seen for multiple users.
  """
  @spec bulk_last_seen([String.t()]) :: %{String.t() => DateTime.t() | nil}
  def bulk_last_seen(user_ids) when is_list(user_ids) do
    Map.new(user_ids, fn user_id ->
      {user_id, last_seen(user_id)}
    end)
  end

  # ---------------------------------------------------------------------------
  # Paginated Online Users (REST API)
  # ---------------------------------------------------------------------------

  @doc """
  List online users with real server-side pagination via Redis sorted set.

  Uses ZREVRANGE for O(log N + M) where M is the page size,
  instead of loading all users into memory.
  """
  @spec list_online_users(keyword()) :: {[map()], map()}
  def list_online_users(opts) when is_list(opts) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    offset = (page - 1) * per_page

    # Get total count — O(1) via ZCARD
    total_count =
      case CGraph.Redis.command(["ZCARD", @online_zset_key]) do
        {:ok, count} when is_integer(count) -> count
        _ -> 0
      end

    # Get page of user IDs from sorted set (newest joins first) — O(log N + M)
    user_ids =
      case CGraph.Redis.command([
             "ZREVRANGE",
             @online_zset_key,
             to_string(offset),
             to_string(offset + per_page - 1)
           ]) do
        {:ok, ids} when is_list(ids) -> ids
        _ -> []
      end

    # Fetch metadata for each user in the page via pipeline — O(M)
    users =
      if user_ids != [] do
        commands = Enum.map(user_ids, fn id -> ["HGETALL", presence_meta_key(id)] end)

        case CGraph.Redis.pipeline(commands) do
          {:ok, results} ->
            Enum.zip(user_ids, results)
            |> Enum.map(fn {user_id, fields} ->
              meta =
                if is_list(fields) and fields != [],
                  do: redis_hash_to_presence(fields),
                  else: %{status: "online"}

              Map.merge(%{id: user_id}, meta)
            end)

          _ ->
            Enum.map(user_ids, fn id -> %{id: id, status: "online"} end)
        end
      else
        []
      end

    total_pages = if total_count > 0, do: ceil(total_count / per_page), else: 0

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: total_pages
    }

    {users, pagination}
  rescue
    _ ->
      # Fallback to Phoenix.Presence if Redis is completely unavailable
      fallback_list_online_users(opts)
  end

  # Fallback when Redis is unavailable (uses full CRDT load — only for resilience)
  defp fallback_list_online_users(opts) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)

    all_users =
      Queries.list_online_users()
      |> Map.to_list()
      |> Enum.map(fn {user_id, presence} ->
        Map.merge(%{id: user_id}, presence)
      end)

    total_count = length(all_users)
    offset = (page - 1) * per_page

    users =
      all_users
      |> Enum.drop(offset)
      |> Enum.take(per_page)

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: if(total_count > 0, do: ceil(total_count / per_page), else: 0)
    }

    {users, pagination}
  end

  # ---------------------------------------------------------------------------
  # Extended Presence Functions for REST API
  # ---------------------------------------------------------------------------

  @doc """
  Count guests (users not logged in).
  This is an estimate based on connected sockets without user tracking.
  """
  @spec count_guests() :: non_neg_integer()
  def count_guests do
    # For now, return 0 - would need WebSocket tracking of anonymous connections
    0
  end

  @doc """
  Update user presence from REST API heartbeat.
  """
  @spec update_presence(String.t(), term()) :: {:ok, :updated}
  def update_presence(user_id, location) do
    # Update last seen
    record_last_seen(user_id)

    # Store location in cache
    Cachex.put(:cgraph_cache, "presence:location:#{user_id}", location, ttl: 300_000)

    {:ok, :updated}
  end

  @doc """
  Get presence statistics. O(1) via Redis SCARD instead of loading all users.
  """
  @spec get_stats() :: map()
  def get_stats do
    users_online =
      case CGraph.Redis.command(["SCARD", @online_set_key]) do
        {:ok, count} when is_integer(count) -> count
        _ -> 0
      end

    %{
      users_online: users_online,
      guests_online: count_guests(),
      invisible_users: 0,
      total_online: users_online + count_guests(),
      most_online: get_most_online_record(),
      most_online_date: get_most_online_date(),
      users_today: get_users_today_count(),
      bots_online: 0
    }
  rescue
    _ ->
      %{
        users_online: 0,
        guests_online: 0,
        invisible_users: 0,
        total_online: 0,
        most_online: 0,
        most_online_date: nil,
        users_today: 0,
        bots_online: 0
      }
  end

  @doc """
  Get users at a specific location.
  """
  @spec get_users_at_location(term()) :: [map()]
  def get_users_at_location(_location) do
    # Would need to be implemented with location tracking
    []
  end

  @doc """
  Get user status for a specific user (for viewing by another user).
  """
  @spec get_user_status(String.t(), term()) :: {:ok, map()}
  def get_user_status(user_id, _viewer) do
    status = Queries.get_user_status(user_id)
    last_online = last_seen(user_id)

    location =
      case Cachex.get(:cgraph_cache, "presence:location:#{user_id}") do
        {:ok, loc} -> loc
        _ -> nil
      end

    {:ok,
     %{
       user_id: user_id,
       is_online: status != "offline",
       is_invisible: status == "invisible",
       last_online_at: last_online,
       current_location: location,
       status_text: nil
     }}
  end

  @doc """
  Update visibility (online vs invisible).
  """
  @spec update_visibility(String.t(), boolean()) :: {:ok, :updated}
  def update_visibility(_user_id, _visible) do
    # Would need socket access to update presence
    {:ok, :updated}
  end

  # ---------------------------------------------------------------------------
  # Redis Presence Sync
  # ---------------------------------------------------------------------------

  @doc """
  Sync a user join to Redis backing store.
  """
  @spec sync_presence_join(String.t(), map()) :: :ok
  def sync_presence_join(user_id, meta) do
    user_key = to_string(user_id)
    timestamp = System.system_time(:second)
    status = to_string(meta[:status] || "online")
    device = to_string(meta[:device] || "web")

    online_at =
      case meta[:online_at] do
        %DateTime{} = dt -> DateTime.to_iso8601(dt)
        _ -> DateTime.to_iso8601(DateTime.utc_now())
      end

    meta_key = presence_meta_key(user_key)

    CGraph.Redis.pipeline([
      ["SADD", @online_set_key, user_key],
      ["ZADD", @online_zset_key, "NX", to_string(timestamp), user_key],
      ["HSET", meta_key, "status", status, "device", device, "online_at", online_at],
      # Auto-expire metadata after 24h as safety net (heartbeats refresh it)
      ["EXPIRE", meta_key, "86400"]
    ])

    # Update most-online record
    update_most_online_record()

    :ok
  rescue
    _ -> :ok
  end

  @doc """
  Sync a user leave to Redis backing store.
  """
  @spec sync_presence_leave(String.t()) :: :ok
  def sync_presence_leave(user_id) do
    user_key = to_string(user_id)
    meta_key = presence_meta_key(user_key)

    CGraph.Redis.pipeline([
      ["SREM", @online_set_key, user_key],
      ["ZREM", @online_zset_key, user_key],
      ["DEL", meta_key]
    ])

    :ok
  rescue
    _ -> :ok
  end

  @doc """
  Build the Redis hash key for a user's presence metadata.
  """
  @spec presence_meta_key(String.t()) :: String.t()
  def presence_meta_key(user_id), do: "presence:meta:#{user_id}"

  @doc """
  Convert a flat Redis HGETALL result list into a presence map.
  """
  @spec redis_hash_to_presence(list() | term()) :: map()
  def redis_hash_to_presence(fields) when is_list(fields) do
    fields
    |> Enum.chunk_every(2)
    |> Enum.reduce(%{}, fn
      [key, value], acc -> Map.put(acc, String.to_existing_atom(key), value)
      _, acc -> acc
    end)
  end

  def redis_hash_to_presence(_), do: %{}

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp last_seen_key(user_id), do: "presence:last_seen:#{user_id}"

  defp get_most_online_record do
    case Cachex.get(:cgraph_cache, "presence:most_online") do
      {:ok, nil} -> 0
      {:ok, count} -> count
      _ -> 0
    end
  end

  defp get_most_online_date do
    case Cachex.get(:cgraph_cache, "presence:most_online_date") do
      {:ok, nil} -> nil
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp get_users_today_count do
    # Use Redis SCARD for O(1) count instead of loading all users
    case CGraph.Redis.command(["SCARD", @online_set_key]) do
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end
  rescue
    _ -> 0
  end

  defp update_most_online_record do
    case CGraph.Redis.command(["SCARD", @online_set_key]) do
      {:ok, current_count} when is_integer(current_count) ->
        current_record = get_most_online_record()

        if current_count > current_record do
          today = Date.to_iso8601(Date.utc_today())
          Cachex.put(:cgraph_cache, "presence:most_online", current_count)
          Cachex.put(:cgraph_cache, "presence:most_online_date", today)
        end

      _ ->
        :ok
    end
  rescue
    _ -> :ok
  end
end
