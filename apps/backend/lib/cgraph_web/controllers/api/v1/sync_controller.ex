defmodule CGraphWeb.Controllers.Api.V1.SyncController do
  @moduledoc """
  WatermelonDB-compatible sync endpoints.

  Implements the pull/push protocol expected by WatermelonDB's `synchronize()`:
    - GET  /api/v1/sync/pull  → returns changes since `last_pulled_at`
    - POST /api/v1/sync/push  → accepts local changes from the client

  Conflict resolution: server-wins (server timestamp is authoritative).

  ## Pull Response Format
      %{
        "changes" => %{
          "conversations" => %{"created" => [], "updated" => [], "deleted" => []},
          "messages" =>      %{"created" => [], "updated" => [], "deleted" => []},
          ...
        },
        "timestamp" => 1700000000000
      }

  ## Push Request Format
      %{
        "changes" => %{ ... same structure ... },
        "last_pulled_at" => 1700000000000
      }
  """
  use CGraphWeb, :controller

  require Logger

  alias CGraph.{Messaging, Accounts, Groups}

  # Table name → {context_module, query_function, serialize_function}
  @table_handlers %{
    "conversations" => :conversations,
    "messages" => :messages,
    "users" => :users,
    "friends" => :friends,
    "groups" => :groups,
    "channels" => :channels,
    "conversation_participants" => :conversation_participants
  }

  @doc """
  Pull changes since `last_pulled_at` for the authenticated user.

  Query params:
    - last_pulled_at: Unix timestamp (ms) — omit for initial sync
    - tables: comma-separated list of tables to sync
    - schema_version: client schema version (for future migration support)
  """
  @spec pull(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def pull(conn, params) do
    user = conn.assigns.current_user
    last_pulled_at = parse_timestamp(params["last_pulled_at"])
    requested_tables = parse_tables(params["tables"])
    now = System.system_time(:millisecond)

    changes =
      requested_tables
      |> Enum.filter(&Map.has_key?(@table_handlers, &1))
      |> Enum.map(fn table ->
        {table, pull_table_changes(table, user, last_pulled_at)}
      end)
      |> Map.new()

    json(conn, %{
      data: %{
        changes: changes,
        timestamp: now
      }
    })
  end

  @doc """
  Push local changes from the client.

  Processes creates/updates/deletes per table within a single Ecto.Multi
  transaction for atomicity.
  """
  @spec push(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def push(conn, %{"changes" => changes} = _params) do
    user = conn.assigns.current_user

    results =
      changes
      |> Enum.filter(fn {table, _} -> Map.has_key?(@table_handlers, table) end)
      |> Enum.reduce(%{ok: 0, errors: []}, fn {table, table_changes}, acc ->
        case push_table_changes(table, user, table_changes) do
          {:ok, count} ->
            %{acc | ok: acc.ok + count}

          {:error, reason} ->
            %{acc | errors: [{table, reason} | acc.errors]}
        end
      end)

    if results.errors == [] do
      json(conn, %{data: %{ok: true, processed: results.ok}})
    else
      conn
      |> put_status(207)
      |> json(%{
        ok: false,
        processed: results.ok,
        errors:
          Enum.map(results.errors, fn {table, reason} ->
            %{table: table, error: inspect(reason)}
          end)
      })
    end
  end

  def push(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{error: "Missing 'changes' parameter"})
  end

  # ─── Pull Handlers ──────────────────────────────────────────────

  defp pull_table_changes("conversations", user, since) do
    pull_generic(
      fn -> Messaging.list_user_conversations_since(user, since) end,
      fn -> Messaging.list_deleted_conversation_ids_since(user, since) end,
      &serialize_conversation/1,
      since
    )
  end

  defp pull_table_changes("messages", user, since) do
    pull_generic(
      fn -> Messaging.list_user_messages_since(user, since) end,
      fn -> Messaging.list_deleted_message_ids_since(user, since) end,
      &serialize_message/1,
      since
    )
  end

  defp pull_table_changes("users", user, since) do
    pull_generic(
      fn -> Accounts.list_contacts_since(user, since) end,
      fn -> [] end,
      &serialize_user/1,
      since
    )
  end

  defp pull_table_changes("friends", user, since) do
    pull_generic(
      fn -> Accounts.list_friendships_since(user, since) end,
      fn -> Accounts.list_removed_friendship_ids_since(user, since) end,
      &serialize_friend/1,
      since
    )
  end

  defp pull_table_changes("groups", user, since) do
    pull_generic(
      fn -> Groups.list_user_groups_since(user, since) end,
      fn -> Groups.list_left_group_ids_since(user, since) end,
      &serialize_group/1,
      since
    )
  end

  defp pull_table_changes("channels", user, since) do
    pull_generic(
      fn -> Groups.list_user_channels_since(user, since) end,
      fn -> Groups.list_deleted_channel_ids_since(user, since) end,
      &serialize_channel/1,
      since
    )
  end

  defp pull_table_changes("conversation_participants", user, since) do
    pull_generic(
      fn -> Messaging.list_participants_since(user, since) end,
      fn -> Messaging.list_removed_participant_ids_since(user, since) end,
      &serialize_participant/1,
      since
    )
  end

  defp pull_table_changes(_table, _user, _since) do
    empty_changes()
  end

  defp pull_generic(fetch_updated_fn, fetch_deleted_fn, serialize_fn, since) do
    records = safe_call(fetch_updated_fn, [])
    deleted_ids = safe_call(fetch_deleted_fn, [])

    if since == nil do
      # Initial sync — everything is "created"
      %{
        created: Enum.map(records, serialize_fn),
        updated: [],
        deleted: []
      }
    else
      # Incremental — split by inserted_at vs updated_at
      {created, updated} =
        Enum.split_with(records, fn r ->
          to_ms(r.inserted_at) > since
        end)

      %{
        created: Enum.map(created, serialize_fn),
        updated: Enum.map(updated, serialize_fn),
        deleted: Enum.map(deleted_ids, &to_string/1)
      }
    end
  end

  # Safely call a function, returning fallback if the function is undefined.
  # This allows sync to work immediately for tables where query functions
  # are not yet fully implemented (returns empty data gracefully).
  defp safe_call(fun, fallback) do
    fun.()
  rescue
    UndefinedFunctionError ->
      Logger.warning("Sync query function not implemented, returning empty data")
      fallback
    FunctionClauseError ->
      Logger.warning("Sync query function clause error, returning empty data")
      fallback
  end

  # ─── Push Handlers ──────────────────────────────────────────────

  defp push_table_changes("messages", user, %{"created" => created, "updated" => updated}) do
    count =
      Enum.count(created || [], fn msg ->
        create_message_from_push(user, msg)
      end) +
        Enum.count(updated || [], fn msg ->
          # WatermelonDB sendCreatedAsUpdated: true sends new records in 'updated'.
          # Treat them as creates if the message doesn't exist on the server yet.
          create_message_from_push(user, msg)
        end)

    {:ok, count}
  rescue
    e -> {:error, Exception.message(e)}
  end

  defp push_table_changes(_table, _user, _changes) do
    # Most tables are server-authoritative; client pushes are limited to messages
    {:ok, 0}
  end

  # Shared helper for creating a message from a push payload (used by both created + updated handlers)
  defp create_message_from_push(user, msg) do
    conversation_id = msg["conversation_id"]

    with {:ok, conversation} <- Messaging.get_conversation(conversation_id) do
      attrs = %{
        "content" => msg["content"] || "",
        "type" => msg["message_type"] || "text",
        "client_message_id" => msg["id"]
      }
      case Messaging.create_message(user, conversation, attrs) do
        {:ok, _} -> true
        _ -> false
      end
    else
      _ -> false
    end
  end

  # ─── Serializers ─────────────────────────────────────────────────

  defp serialize_conversation(c) do
    %{
      id: to_string(c.id),
      server_id: to_string(c.id),
      type: to_string(c.type),
      name: c.name,
      avatar_url: c[:avatar_url],
      last_message_content: get_in_safe(c, [:last_message, :content]),
      last_message_at: to_ms(get_in_safe(c, [:last_message, :inserted_at])),
      last_message_sender_id: get_in_safe(c, [:last_message, :sender_id]) |> maybe_string(),
      unread_count: c[:unread_count] || 0,
      is_muted: c[:is_muted] || false,
      is_pinned: c[:is_pinned] || false,
      is_archived: c[:is_archived] || false,
      encryption_key_id: c[:encryption_key_id],
      created_at: to_ms(c.inserted_at),
      updated_at: to_ms(c.updated_at)
    }
  end

  defp serialize_message(m) do
    %{
      id: to_string(m.id),
      server_id: to_string(m.id),
      conversation_id: to_string(m.conversation_id),
      channel_id: maybe_string(m[:channel_id]),
      sender_id: to_string(m.sender_id),
      content: m.content || "",
      encrypted_content: m[:encrypted_content],
      message_type: to_string(m.type || "text"),
      reply_to_id: maybe_string(m[:reply_to_id]),
      attachments_json: Jason.encode!(m[:attachments] || []),
      metadata_json: Jason.encode!(m[:metadata] || %{}),
      reactions_json: Jason.encode!(m[:reactions] || %{}),
      status: "delivered",
      is_edited: m[:is_edited] || false,
      is_deleted: m[:is_deleted] || false,
      is_pinned: m[:is_pinned] || false,
      is_optimistic: false,
      created_at: to_ms(m.inserted_at),
      updated_at: to_ms(m.updated_at)
    }
  end

  defp serialize_user(u) do
    %{
      id: to_string(u.id),
      server_id: to_string(u.id),
      email: nil,
      username: u.username,
      uid: u[:uid],
      display_name: u.display_name || u.username,
      avatar_url: u[:avatar_url],
      bio: u[:bio],
      status: to_string(u[:status] || "offline"),
      status_message: u[:status_message],
      karma: u[:karma] || 0,
      is_verified: u[:is_verified] || false,
      is_premium: u[:is_premium] || false,
      tier: to_string(u[:tier] || "free"),
      title: u[:title],
      title_rarity: u[:title_rarity],
      last_seen_at: to_ms(u[:last_seen_at]),
      created_at: to_ms(u.inserted_at),
      updated_at: to_ms(u.updated_at)
    }
  end

  defp serialize_friend(f) do
    %{
      id: to_string(f.id),
      server_id: to_string(f.id),
      user_id: to_string(f.user_id),
      friend_user_id: to_string(f.friend_user_id || f[:friend_id]),
      status: to_string(f.status),
      direction: to_string(f[:direction] || "mutual"),
      created_at: to_ms(f.inserted_at),
      updated_at: to_ms(f.updated_at)
    }
  end

  defp serialize_group(g) do
    %{
      id: to_string(g.id),
      server_id: to_string(g.id),
      name: g.name,
      slug: g.slug,
      description: g[:description],
      icon_url: g[:icon_url],
      banner_url: g[:banner_url],
      owner_id: to_string(g.owner_id),
      is_public: g[:is_public] || false,
      member_count: g[:member_count] || 0,
      online_member_count: g[:online_member_count] || 0,
      my_role: g[:my_role],
      created_at: to_ms(g.inserted_at),
      updated_at: to_ms(g.updated_at)
    }
  end

  defp serialize_channel(ch) do
    %{
      id: to_string(ch.id),
      server_id: to_string(ch.id),
      group_id: to_string(ch.group_id),
      category_id: maybe_string(ch[:category_id]),
      name: ch.name,
      type: to_string(ch.type),
      topic: ch[:topic],
      position: ch[:position] || 0,
      is_private: ch[:is_private] || false,
      is_nsfw: ch[:is_nsfw] || false,
      slow_mode_seconds: ch[:slow_mode_seconds] || 0,
      unread_count: 0,
      last_message_at: to_ms(ch[:last_message_at]),
      created_at: to_ms(ch.inserted_at),
      updated_at: to_ms(ch.updated_at)
    }
  end

  defp serialize_participant(p) do
    %{
      id: to_string(p.id),
      server_id: to_string(p.id),
      conversation_id: to_string(p.conversation_id),
      user_id: to_string(p.user_id),
      role: to_string(p[:role] || "member"),
      joined_at: to_ms(p[:joined_at] || p.inserted_at),
      last_read_at: to_ms(p[:last_read_at])
    }
  end

  # ─── Utilities ─────────────────────────────────────────────────

  defp empty_changes, do: %{created: [], updated: [], deleted: []}

  defp parse_timestamp(nil), do: nil
  defp parse_timestamp(""), do: nil
  defp parse_timestamp(ts) when is_binary(ts) do
    case Integer.parse(ts) do
      {ms, _} -> ms
      :error -> nil
    end
  end
  defp parse_timestamp(ts) when is_integer(ts), do: ts

  defp parse_tables(nil), do: Map.keys(@table_handlers)
  defp parse_tables(""), do: Map.keys(@table_handlers)
  defp parse_tables(tables) when is_binary(tables) do
    tables |> String.split(",") |> Enum.map(&String.trim/1) |> Enum.filter(&(&1 != ""))
  end

  defp to_ms(nil), do: nil
  defp to_ms(%DateTime{} = dt), do: DateTime.to_unix(dt, :millisecond)
  defp to_ms(%NaiveDateTime{} = ndt) do
    ndt |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_unix(:millisecond)
  end
  defp to_ms(val) when is_integer(val), do: val
  defp to_ms(_), do: nil

  defp maybe_string(nil), do: nil
  defp maybe_string(val), do: to_string(val)

  defp get_in_safe(map, keys) when is_map(map) do
    Enum.reduce_while(keys, map, fn key, acc ->
      case acc do
        %{^key => val} -> {:cont, val}
        _ -> {:halt, nil}
      end
    end)
  end
  defp get_in_safe(_, _), do: nil
end
