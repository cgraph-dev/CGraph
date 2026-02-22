defmodule CGraph.Search.Messages do
  @moduledoc """
  Message search with Meilisearch primary and PostgreSQL fallback.

  Searches messages within a user's conversations with support for
  conversation, date-range, and sender filters.
  """

  import Ecto.Query, warn: false
  require Logger

  alias CGraph.Messaging.Message
  alias CGraph.Repo
  alias CGraph.Search.Engine, as: SearchEngine

  @doc """
  Search messages within user's conversations.

  Attempts Meilisearch first for fuzzy matching, falls back to PostgreSQL.

  ## Options

  - `:limit` — max results (default 50)
  - `:cursor` — opaque cursor for Meilisearch offset pagination
  - `:conversation_id` — restrict to a single conversation
  - `:before` / `:after` — DateTime range filters
  - `:from` — filter by sender user_id
  """
  @spec search_messages(struct(), binary(), keyword()) :: {list(), map()}
  def search_messages(user, query, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    limit = Keyword.get(opts, :limit, 50)
    cursor = Keyword.get(opts, :cursor)
    conversation_id = Keyword.get(opts, :conversation_id)

    # Decode cursor to Meilisearch offset
    meili_offset = decode_search_cursor(cursor) || 0

    # Build Meilisearch filter for user's conversations
    filters = build_message_filters(user.id, conversation_id, opts)

    case SearchEngine.search(:messages, query, limit: limit, offset: meili_offset, filter: filters) do
      {:ok, %{hits: hits, total: total}} ->
        message_ids = Enum.map(hits, & &1["id"])
        messages = fetch_messages_by_ids(message_ids)
        has_more = meili_offset + limit < total
        next_cursor = if has_more, do: encode_search_cursor(meili_offset + limit), else: nil
        {messages, %{limit: limit, has_more: has_more, next_cursor: next_cursor}}

      {:error, reason} ->
        Logger.debug("meilisearch_unavailable_using_postgresql_fallback", reason: inspect(reason))
        search_messages_postgres(user, query, opts)
    end
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp build_message_filters(user_id, conversation_id, opts) do
    base = "user_id = #{user_id}"
    filters = if conversation_id && valid_uuid?(conversation_id) do
      "#{base} AND conversation_id = #{conversation_id}"
    else
      base
    end

    before_date = Keyword.get(opts, :before)
    after_date = Keyword.get(opts, :after)

    filters = if before_date, do: "#{filters} AND inserted_at < #{DateTime.to_unix(before_date)}", else: filters
    filters = if after_date, do: "#{filters} AND inserted_at > #{DateTime.to_unix(after_date)}", else: filters

    filters
  end

  defp valid_uuid?(id) when is_binary(id), do: Regex.match?(~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, id)
  defp valid_uuid?(_), do: false

  defp fetch_messages_by_ids([]), do: []
  defp fetch_messages_by_ids(message_ids) do
    from(m in Message,
      where: m.id in ^message_ids,
      preload: [:user, :conversation]
    )
    |> Repo.all()
    |> Enum.sort_by(&Enum.find_index(message_ids, fn id -> id == &1.id end))
  end

  defp search_messages_postgres(user, query, opts) do
    limit = Keyword.get(opts, :limit, 50)
    cursor = Keyword.get(opts, :cursor)
    conversation_id = Keyword.get(opts, :conversation_id)
    before_date = Keyword.get(opts, :before)
    after_date = Keyword.get(opts, :after)
    from_user_id = Keyword.get(opts, :from)

    search_term = "%#{sanitize_query(query)}%"

    # Get user's conversations
    user_conversations = from cp in "conversation_participants",
      where: cp.user_id == type(^user.id, Ecto.UUID),
      select: cp.conversation_id

    base_query = from m in Message,
      where: m.conversation_id in subquery(user_conversations),
      where: ilike(m.content, ^search_term),
      preload: [:user, :conversation]

    # Apply filters
    base_query = if conversation_id do
      from m in base_query, where: m.conversation_id == ^conversation_id
    else
      base_query
    end

    base_query = if before_date do
      from m in base_query, where: m.inserted_at < ^before_date
    else
      base_query
    end

    base_query = if after_date do
      from m in base_query, where: m.inserted_at > ^after_date
    else
      base_query
    end

    base_query = if from_user_id do
      from m in base_query, where: m.user_id == ^from_user_id
    else
      base_query
    end

    pagination_opts = %{
      cursor: cursor,
      after_cursor: nil,
      before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :inserted_at,
      sort_direction: :desc,
      include_total: false
    }

    {messages, page_info} = CGraph.Pagination.paginate(base_query, pagination_opts)

    {messages, %{
      limit: limit,
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor
    }}
  end

  # Cursor helpers for Meilisearch offset-based pagination
  defp encode_search_cursor(offset) do
    Base.url_encode64(to_string(offset), padding: false)
  end

  defp decode_search_cursor(nil), do: nil
  defp decode_search_cursor(cursor) do
    with {:ok, decoded} <- Base.url_decode64(cursor, padding: false),
         {offset, _} <- Integer.parse(decoded) do
      offset
    else
      _ -> nil
    end
  end

  defp sanitize_query(query) do
    query
    |> String.trim()
    |> String.replace(~r/[%_\\]/, fn
      "%" -> "\\%"
      "_" -> "\\_"
      "\\" -> "\\\\"
    end)
  end
end
