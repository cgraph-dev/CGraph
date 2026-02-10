defmodule CGraph.Messaging.Repositories.MessageRepository do
  @moduledoc """
  Repository for Message entity data access.
  """

  import Ecto.Query, warn: false, except: [update: 2]

  alias CGraph.Repo
  alias CGraph.Messaging.Message
  alias CGraph.Cache

  @cache_ttl :timer.minutes(5)
  @recent_messages_limit 50

  @doc """
  Get a message by ID.
  """
  @spec get(String.t(), list()) :: Message.t() | nil
  def get(id, preloads \\ []) do
    Message
    |> Repo.get(id)
    |> maybe_preload(preloads)
  end

  @doc """
  Get a message by ID, raising if not found.
  """
  @spec get!(String.t(), list()) :: Message.t()
  def get!(id, preloads \\ []) do
    Message
    |> Repo.get!(id)
    |> maybe_preload(preloads)
  end

  @doc """
  List messages for a conversation with cursor-based pagination.
  """
  @spec list_for_conversation(String.t(), keyword()) :: {list(Message.t()), map()}
  def list_for_conversation(conversation_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, @recent_messages_limit)
    before_cursor = Keyword.get(opts, :before)
    after_cursor = Keyword.get(opts, :after)

    base_query =
      from m in Message,
        where: m.conversation_id == ^conversation_id,
        where: is_nil(m.deleted_at),
        preload: [:sender, :reactions, :attachments]

    query =
      base_query
      |> apply_cursor(:before, before_cursor)
      |> apply_cursor(:after, after_cursor)
      |> order_by([m], desc: m.inserted_at)
      |> limit(^(limit + 1))  # Fetch one extra to check if there are more

    messages = Repo.all(query)

    has_more = length(messages) > limit
    messages = if has_more, do: Enum.take(messages, limit), else: messages

    cursors = %{
      has_more: has_more,
      start_cursor: List.first(messages) && List.first(messages).id,
      end_cursor: List.last(messages) && List.last(messages).id
    }

    {Enum.reverse(messages), cursors}
  end

  @doc """
  Get recent messages for a conversation (from cache if available).
  """
  @spec get_recent(String.t(), integer()) :: list(Message.t())
  def get_recent(conversation_id, limit \\ @recent_messages_limit) do
    cache_key = "conversation:#{conversation_id}:recent_messages"

    Cache.fetch(cache_key, fn ->
      {messages, _} = list_for_conversation(conversation_id, limit: limit)
      messages
    end, ttl: @cache_ttl)
  end

  @doc """
  Create a new message.
  """
  @spec create(map()) :: {:ok, Message.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    result =
      %Message{}
      |> Message.changeset(attrs)
      |> Repo.insert()

    case result do
      {:ok, message} ->
        # Invalidate cache
        Cache.delete("conversation:#{message.conversation_id}:recent_messages")
        {:ok, Repo.preload(message, [:sender, :reactions, :attachments])}
      error ->
        error
    end
  end

  @doc """
  Update a message.
  """
  @spec update(Message.t(), map()) :: {:ok, Message.t()} | {:error, Ecto.Changeset.t()}
  def update(%Message{} = message, attrs) do
    result =
      message
      |> Message.changeset(attrs)
      |> Repo.update()

    case result do
      {:ok, updated} ->
        Cache.delete("conversation:#{updated.conversation_id}:recent_messages")
        {:ok, updated}
      error ->
        error
    end
  end

  @doc """
  Soft delete a message.
  """
  @spec soft_delete(Message.t()) :: {:ok, Message.t()} | {:error, Ecto.Changeset.t()}
  def soft_delete(%Message{} = message) do
    update(message, %{deleted_at: DateTime.utc_now()})
  end

  @doc """
  Search messages in a conversation.
  """
  @spec search(String.t(), String.t(), keyword()) :: list(Message.t())
  def search(conversation_id, query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    search_query = "%#{query}%"

    from(m in Message,
      where: m.conversation_id == ^conversation_id,
      where: is_nil(m.deleted_at),
      where: ilike(m.content, ^search_query),
      order_by: [desc: m.inserted_at],
      limit: ^limit,
      preload: [:sender]
    )
    |> Repo.all()
  end

  @doc """
  Count unread messages for a user in a conversation.
  """
  @spec count_unread(String.t(), String.t(), DateTime.t()) :: integer()
  def count_unread(conversation_id, user_id, last_read_at) do
    from(m in Message,
      where: m.conversation_id == ^conversation_id,
      where: m.sender_id != ^user_id,
      where: m.inserted_at > ^last_read_at,
      where: is_nil(m.deleted_at),
      select: count(m.id)
    )
    |> Repo.one()
  end

  # Private helpers

  defp apply_cursor(query, _, nil), do: query
  defp apply_cursor(query, :before, cursor_id) do
    from m in query,
      join: cursor in Message, on: cursor.id == ^cursor_id,
      where: m.inserted_at < cursor.inserted_at
  end
  defp apply_cursor(query, :after, cursor_id) do
    from m in query,
      join: cursor in Message, on: cursor.id == ^cursor_id,
      where: m.inserted_at > cursor.inserted_at
  end

  defp maybe_preload(nil, _), do: nil
  defp maybe_preload(record, []), do: record
  defp maybe_preload(record, preloads), do: Repo.preload(record, preloads)
end
