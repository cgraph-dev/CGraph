defmodule Cgraph.Messaging.Search do
  @moduledoc """
  Sub-context for Message Search operations.

  Handles searching messages across conversations with full-text support.
  Extracted from the main Messaging context for better maintainability.

  @since v0.7.29
  """

  import Ecto.Query, warn: false

  alias Cgraph.Messaging.{ConversationParticipant, Message}
  alias Cgraph.Repo

  @doc """
  Search messages accessible to a user.

  ## Options
    - `:page` - Page number (default: 1)
    - `:per_page` - Results per page (default: 20)
    - `:conversation_id` - Limit search to specific conversation
    - `:sender_id` - Filter by sender
    - `:type` - Filter by message type
    - `:date_from` - Messages from this date
    - `:date_to` - Messages until this date

  ## Returns
    `{messages, metadata}` tuple
  """
  @spec search_messages(map(), String.t(), keyword()) :: {list(Message.t()), map()}
  def search_messages(user, query, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    conversation_id = Keyword.get(opts, :conversation_id)
    sender_id = Keyword.get(opts, :sender_id)
    message_type = Keyword.get(opts, :type)
    date_from = Keyword.get(opts, :date_from)
    date_to = Keyword.get(opts, :date_to)

    search_term = "%#{sanitize_query(query)}%"

    # Get conversation IDs user is part of
    user_conversation_ids = get_user_conversation_ids(user)

    db_query = from m in Message,
      where: m.conversation_id in ^user_conversation_ids,
      where: ilike(m.content, ^search_term),
      order_by: [desc: m.inserted_at],
      preload: [:sender, :conversation]

    # Apply optional filters
    db_query = apply_conversation_filter(db_query, conversation_id)
    db_query = apply_sender_filter(db_query, sender_id)
    db_query = apply_type_filter(db_query, message_type)
    db_query = apply_date_filters(db_query, date_from, date_to)

    total = Repo.aggregate(db_query, :count, :id)

    messages = db_query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {messages, meta}
  end

  @doc """
  Search for messages containing attachments.
  """
  @spec search_attachments(map(), keyword()) :: {list(Message.t()), map()}
  def search_attachments(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    conversation_id = Keyword.get(opts, :conversation_id)
    attachment_type = Keyword.get(opts, :type) # 'image', 'video', 'file', 'audio'

    user_conversation_ids = get_user_conversation_ids(user)

    db_query = from m in Message,
      where: m.conversation_id in ^user_conversation_ids,
      where: m.type in ["image", "video", "file", "audio"],
      order_by: [desc: m.inserted_at],
      preload: [:sender]

    db_query = apply_conversation_filter(db_query, conversation_id)

    db_query = if attachment_type do
      from m in db_query, where: m.type == ^attachment_type
    else
      db_query
    end

    total = Repo.aggregate(db_query, :count, :id)

    messages = db_query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {messages, meta}
  end

  @doc """
  Get message context (messages around a specific message).
  Useful for search results to show surrounding messages.
  """
  @spec get_message_context(Message.t(), keyword()) :: list(Message.t())
  def get_message_context(message, opts \\ []) do
    before_count = Keyword.get(opts, :before, 3)
    after_count = Keyword.get(opts, :after, 3)

    before_messages = from(m in Message,
      where: m.conversation_id == ^message.conversation_id,
      where: m.inserted_at < ^message.inserted_at,
      order_by: [desc: m.inserted_at],
      limit: ^before_count,
      preload: [:sender]
    )
    |> Repo.all()
    |> Enum.reverse()

    after_messages = from(m in Message,
      where: m.conversation_id == ^message.conversation_id,
      where: m.inserted_at > ^message.inserted_at,
      order_by: [asc: m.inserted_at],
      limit: ^after_count,
      preload: [:sender]
    )
    |> Repo.all()

    before_messages ++ [message] ++ after_messages
  end

  # Private helpers

  defp get_user_conversation_ids(user) do
    from(cp in ConversationParticipant,
      where: cp.user_id == ^user.id,
      where: is_nil(cp.left_at),
      select: cp.conversation_id
    )
    |> Repo.all()
  end

  defp sanitize_query(query) do
    query
    |> String.replace(~r/[%_\\]/, fn
      "\\" -> "\\\\"
      "%" -> "\\%"
      "_" -> "\\_"
    end)
  end

  defp apply_conversation_filter(query, nil), do: query
  defp apply_conversation_filter(query, conversation_id) do
    from m in query, where: m.conversation_id == ^conversation_id
  end

  defp apply_sender_filter(query, nil), do: query
  defp apply_sender_filter(query, sender_id) do
    from m in query, where: m.sender_id == ^sender_id
  end

  defp apply_type_filter(query, nil), do: query
  defp apply_type_filter(query, type) do
    from m in query, where: m.type == ^type
  end

  defp apply_date_filters(query, nil, nil), do: query
  defp apply_date_filters(query, date_from, nil) do
    from m in query, where: m.inserted_at >= ^date_from
  end
  defp apply_date_filters(query, nil, date_to) do
    from m in query, where: m.inserted_at <= ^date_to
  end
  defp apply_date_filters(query, date_from, date_to) do
    from m in query,
      where: m.inserted_at >= ^date_from,
      where: m.inserted_at <= ^date_to
  end
end
