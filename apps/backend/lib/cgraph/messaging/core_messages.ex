defmodule CGraph.Messaging.CoreMessages do
  @moduledoc """
  Core message operations: listing, creation, threading, participation,
  typing indicators, and ephemeral (TTL) message support.

  Handles cursor-based pagination, idempotent message creation via
  `client_message_id`, thread replies, and disappearing messages.

  Extracted from `CGraph.Messaging` for maintainability.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Messaging.{Conversation, ConversationParticipant, DeliveryTracking, Message}
  alias CGraph.Repo
  alias CGraph.Search.Indexer

  # ---------------------------------------------------------------------------
  # Message Listing
  # ---------------------------------------------------------------------------

  @doc "List messages in a conversation using cursor-based pagination."
  @spec list_messages(struct(), keyword()) :: {[struct()], map()}
  def list_messages(conversation, opts \\ []) do
    alias CGraph.Pagination

    cursor = Keyword.get(opts, :cursor)
    limit = Keyword.get(opts, :limit, Keyword.get(opts, :per_page, 50))
    before_id = Keyword.get(opts, :before)
    after_id = Keyword.get(opts, :after)
    include_total = Keyword.get(opts, :include_total, false)

    base_query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      preload: [[sender: :customization], [reactions: :user], [reply_to: [sender: :customization]]]

    base_query = if before_id, do: from(m in base_query, where: m.id < ^before_id), else: base_query
    base_query = if after_id, do: from(m in base_query, where: m.id > ^after_id), else: base_query

    pagination_opts = %{
      cursor: cursor, after_cursor: nil, before_cursor: nil,
      limit: min(limit, 100), sort_field: :inserted_at,
      sort_direction: :desc, include_total: include_total
    }

    {messages, page_info} = Pagination.paginate(base_query, pagination_opts)
    messages = Enum.reverse(messages)

    meta = %{
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor,
      has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    meta = if include_total, do: Map.put(meta, :total, page_info[:total_count]), else: meta
    {messages, meta}
  end

  @doc "Get a message by conversation + message_id."
  @spec get_message(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_message(conversation, message_id) do
    query = from m in Message,
      where: m.id == ^message_id,
      where: m.conversation_id == ^conversation.id,
      preload: [[sender: :customization], [reactions: :user], [reply_to: [sender: :customization]]]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  @doc "List thread replies for a parent message."
  @spec list_thread_replies(binary(), keyword()) :: {[struct()], map()}
  def list_thread_replies(parent_message_id, opts \\ []) do
    alias CGraph.Pagination
    limit = min(Keyword.get(opts, :limit, 50), 100)
    cursor = Keyword.get(opts, :cursor)

    base_query =
      from m in Message,
        where: m.reply_to_id == ^parent_message_id,
        preload: [[sender: :customization], [reactions: :user], [reply_to: [sender: :customization]]]

    pagination_opts = %{
      cursor: cursor, after_cursor: nil, before_cursor: nil,
      limit: limit, sort_field: :inserted_at,
      sort_direction: :asc, include_total: false
    }

    {messages, page_info} = Pagination.paginate(base_query, pagination_opts)

    meta = %{
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor,
      has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    {messages, meta}
  end

  @doc "Count replies per parent message ID. Returns `%{message_id => count}`."
  @spec count_thread_replies([binary()]) :: %{binary() => non_neg_integer()}
  def count_thread_replies(parent_message_ids) when is_list(parent_message_ids) do
    Message
    |> exclude_deleted()
    |> where([m], m.reply_to_id in ^parent_message_ids)
    |> group_by([m], m.reply_to_id)
    |> select([m], {m.reply_to_id, count(m.id)})
    |> Repo.all()
    |> Map.new()
  end

  # ---------------------------------------------------------------------------
  # Message Creation
  # ---------------------------------------------------------------------------

  @doc "Create a message in a conversation (with idempotency via client_message_id)."
  @spec create_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_message(user, conversation, attrs) do
    message_attrs = attrs
      |> stringify_keys()
      |> Map.put("sender_id", user.id)
      |> Map.put("conversation_id", conversation.id)

    case check_idempotency(conversation.id, message_attrs) do
      {:ok, existing_message} -> {:ok, existing_message}
      :not_found -> do_create_message(conversation, message_attrs)
    end
  end

  @doc "Send a message (alias for create_message with conversation first)."
  @spec send_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def send_message(conversation, user, attrs), do: create_message(user, conversation, attrs)

  # ---------------------------------------------------------------------------
  # Participation & Typing
  # ---------------------------------------------------------------------------

  @doc "Check if a user is a participant in a conversation."
  @spec user_in_conversation?(binary(), binary()) :: boolean()
  def user_in_conversation?(conversation_id, user_id) do
    query = from cp in ConversationParticipant,
      where: cp.conversation_id == ^conversation_id,
      where: cp.user_id == ^user_id,
      where: is_nil(cp.left_at)

    Repo.exists?(query)
  end

  @doc "Broadcast typing indicator."
  @spec broadcast_typing(struct(), struct()) :: :ok
  def broadcast_typing(conversation, user) do
    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "typing",
      %{user_id: user.id, username: user.username}
    )
    :ok
  end

  # ---------------------------------------------------------------------------
  # Ephemeral / Disappearing Messages
  # ---------------------------------------------------------------------------

  @doc "Update the message TTL for a conversation."
  @spec update_conversation_ttl(struct(), integer() | nil) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_conversation_ttl(%Conversation{} = conversation, ttl) when is_nil(ttl) or is_integer(ttl) do
    conversation |> Ecto.Changeset.change(message_ttl: ttl) |> Repo.update()
  end

  @doc "Get the message TTL for a conversation."
  @spec get_conversation_ttl(binary()) :: {:ok, integer() | nil} | {:error, :not_found}
  def get_conversation_ttl(conversation_id) when is_binary(conversation_id) do
    case Repo.get(Conversation, conversation_id) do
      nil -> {:error, :not_found}
      conv -> {:ok, conv.message_ttl}
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp check_idempotency(conversation_id, attrs) do
    client_id = Map.get(attrs, "client_message_id") || Map.get(attrs, :client_message_id)

    if client_id do
      case Repo.get_by(Message, conversation_id: conversation_id, client_message_id: client_id) do
        nil -> :not_found
        message -> {:ok, Repo.preload(message, [[sender: :customization], :reactions, [reply_to: [sender: :customization]]])}
      end
    else
      :not_found
    end
  end

  defp do_create_message(conversation, message_attrs) do
    message_attrs = maybe_set_expires_at(conversation, message_attrs)

    result = %Message{}
      |> Message.changeset(message_attrs)
      |> Repo.insert()

    case result do
      {:ok, message} ->
        now = DateTime.truncate(DateTime.utc_now(), :second)
        conversation
        |> Ecto.Changeset.change(last_message_at: now)
        |> Repo.update()

        track_delivery_for_participants(message, conversation)

        try do
          Indexer.index_async(:messages, message)
        rescue
          _ -> :ok
        end

        {:ok, Repo.preload(message, [[sender: :customization], :reactions, [reply_to: [sender: :customization]]])}

      error -> error
    end
  end

  defp track_delivery_for_participants(message, conversation) do
    recipient_ids =
      from(cp in ConversationParticipant,
        where: cp.conversation_id == ^conversation.id,
        where: cp.user_id != ^message.sender_id,
        select: cp.user_id
      )
      |> Repo.all()

    if recipient_ids != [], do: DeliveryTracking.track_sent(message, recipient_ids)
  rescue
    _ -> :ok
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  defp maybe_set_expires_at(%Conversation{message_ttl: nil}, attrs), do: attrs
  defp maybe_set_expires_at(%Conversation{message_ttl: ttl}, attrs) when is_integer(ttl) and ttl > 0 do
    Map.put(attrs, "expires_at", DateTime.utc_now() |> DateTime.add(ttl, :second))
  end
  defp maybe_set_expires_at(_conversation, attrs), do: attrs
end
