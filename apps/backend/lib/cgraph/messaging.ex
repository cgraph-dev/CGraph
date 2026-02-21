defmodule CGraph.Messaging do
  @moduledoc """
  The Messaging context — thin delegation facade.

  Delegates to specialized sub-contexts:

  - `Conversations` — Conversation CRUD and participant management
  - `MessageOperations` — Message CRUD, pinning, read receipts, scheduling
  - `Reactions` — Message reactions
  - `Search` — Full-text message search
  - `SavedMessages` — Bookmarks
  - `PrivateMessageSystem` — MyBB-style PM system
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Messaging.{Conversation, ConversationParticipant, DeliveryTracking, Message, Reaction}
  alias CGraph.Messaging.{Conversations, MessageOperations, SavedMessages}
  alias CGraph.Repo
  alias CGraph.Search.Indexer

  # ============================================================================
  # Conversations
  # ============================================================================

  defdelegate list_conversations(user, opts \\ []), to: Conversations
  def list_user_conversations(user, opts \\ []), do: Conversations.list_conversations(user, opts)
  defdelegate get_conversation(id), to: Conversations
  defdelegate get_user_conversation(user, conversation_id), to: Conversations
  defdelegate authorize_access(user, conversation), to: Conversations
  defdelegate get_or_create_dm(user, other_user), to: Conversations
  defdelegate create_or_get_conversation(user, participant_ids), to: Conversations
  defdelegate create_conversation(user, attrs), to: Conversations

  # ============================================================================
  # Messages — core message listing + creation with idempotency
  # ============================================================================

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

  # ============================================================================
  # Reactions
  # ============================================================================

  defdelegate list_reactions(message, opts \\ []), to: CGraph.Messaging.Reactions

  @doc "Add reaction. Returns `{:ok, reaction, nil}` (3-element tuple for callers)."
  @spec add_reaction(struct(), struct(), String.t()) :: {:ok, struct(), nil} | {:error, :already_exists} | {:error, Ecto.Changeset.t()}
  def add_reaction(user, message, emoji) do
    existing_same = Repo.get_by(Reaction,
      user_id: user.id,
      message_id: message.id,
      emoji: emoji
    )

    if existing_same do
      {:error, :already_exists}
    else
      case %Reaction{}
        |> Reaction.changeset(%{user_id: user.id, message_id: message.id, emoji: emoji})
        |> Repo.insert() do
        {:ok, reaction} -> {:ok, reaction, nil}
        {:error, changeset} -> {:error, changeset}
      end
    end
  end

  @doc "Remove reaction."
  @spec remove_reaction(struct(), struct(), String.t()) :: {:ok, struct()} | {:error, :not_found}
  def remove_reaction(user, message, emoji) do
    query = from r in Reaction,
      where: r.user_id == ^user.id,
      where: r.message_id == ^message.id,
      where: r.emoji == ^emoji

    case Repo.one(query) do
      nil -> {:error, :not_found}
      reaction -> Repo.delete(reaction)
    end
  end

  @doc "Broadcast reaction added event."
  @spec broadcast_reaction_added(struct(), struct(), struct(), struct() | nil) :: :ok
  def broadcast_reaction_added(conversation, message, reaction, user \\ nil) do
    user_data = user || reaction.user

    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_added",
      %{
        message_id: message.id,
        emoji: reaction.emoji,
        user_id: reaction.user_id,
        user: if(user_data,
          do: %{id: user_data.id, username: user_data.username,
                display_name: user_data.display_name, avatar_url: user_data.avatar_url},
          else: %{id: reaction.user_id})
      }
    )
  end

  @doc "Broadcast reaction removed event."
  @spec broadcast_reaction_removed(struct(), struct(), struct(), String.t()) :: :ok
  def broadcast_reaction_removed(conversation, message, user, emoji) do
    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_removed",
      %{message_id: message.id, user_id: user.id, emoji: emoji}
    )
  end

  defdelegate get_reaction_users(message, emoji, opts \\ []), to: CGraph.Messaging.Reactions

  # ============================================================================
  # Search — delegated to Messaging.Search
  # ============================================================================

  defdelegate search_messages(user, query, opts \\ []), to: CGraph.Messaging.Search

  # ============================================================================
  # Message Operations — delegated to MessageOperations
  # ============================================================================

  @doc "Create a message from a map (channel messages)."
  @spec create_message(map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_message(attrs) when is_map(attrs), do: MessageOperations.create_message(attrs)

  @doc "Get a message by ID."
  @spec get_message(binary()) :: {:ok, struct()} | {:error, :not_found}
  def get_message(message_id) when is_binary(message_id), do: MessageOperations.get_message(message_id)

  defdelegate update_message(message, attrs), to: MessageOperations
  defdelegate pin_message(message_id, user_id), to: MessageOperations
  defdelegate count_user_pins(conversation_id, user_id), to: MessageOperations
  defdelegate unpin_message(message_id, user_id), to: MessageOperations
  defdelegate list_scheduled_messages(conversation, opts \\ []), to: MessageOperations
  defdelegate reschedule_message(message, new_scheduled_at), to: MessageOperations
  defdelegate cancel_scheduled_message(message), to: MessageOperations
  defdelegate edit_message(message_id, user_id, content), to: MessageOperations
  defdelegate hide_message(message_id, reason), to: MessageOperations
  defdelegate soft_delete_message(message_id, opts \\ []), to: MessageOperations
  defdelegate mark_message_read(message_id, user_id), to: MessageOperations
  defdelegate mark_messages_read(user, conversation, message_id), to: MessageOperations
  defdelegate get_unread_count(user, conversation), to: MessageOperations
  defdelegate mark_conversation_read(conversation, user), to: MessageOperations

  def mark_message_read(conversation, user, message_id), do: MessageOperations.mark_messages_read(user, conversation, message_id)
  def mark_as_read(message, user), do: MessageOperations.mark_message_read(message, user)

  @doc "Delete a message (soft delete, no auth check)."
  @spec delete_message(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_message(message) when is_struct(message), do: MessageOperations.delete_message(message)

  @spec delete_message(binary(), binary()) :: {:ok, struct()} | {:error, term()}
  def delete_message(message_id, user_id) when is_binary(message_id) and is_binary(user_id) do
    MessageOperations.delete_message(message_id, user_id)
  end

  def delete_message(%{sender_id: _} = message, %{id: _} = user) do
    MessageOperations.delete_message_by_user(message, user)
  end

  # ============================================================================
  # Private Messages — delegated to PrivateMessageSystem
  # ============================================================================

  alias CGraph.Messaging.PrivateMessageSystem

  defdelegate list_pm_folders(user_id), to: PrivateMessageSystem
  defdelegate create_pm_folder(attrs), to: PrivateMessageSystem
  defdelegate get_pm_folder(folder_id, user_id \\ nil), to: PrivateMessageSystem
  defdelegate get_pm_folder_by_name(user_id, name), to: PrivateMessageSystem
  @spec update_pm_folder(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_pm_folder(folder, attrs), do: PrivateMessageSystem.update_pm_folder(folder, attrs)
  @spec delete_pm_folder(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_pm_folder(folder), do: PrivateMessageSystem.delete_pm_folder(folder)
  defdelegate list_private_messages(user_id, opts), to: PrivateMessageSystem
  @spec list_private_messages(binary(), binary(), keyword()) :: {[struct()], map()}
  def list_private_messages(user_id, folder_id, opts), do: PrivateMessageSystem.list_private_messages(user_id, folder_id, opts)
  defdelegate get_private_message(message_id, user_id), to: PrivateMessageSystem
  defdelegate send_private_message(attrs), to: PrivateMessageSystem
  defdelegate update_private_message(message, attrs), to: PrivateMessageSystem
  defdelegate delete_private_message(message, user_id), to: PrivateMessageSystem
  defdelegate mark_pm_as_read(message_ids, user_id), to: PrivateMessageSystem
  defdelegate move_pm_to_folder(message_ids, folder_id, user_id), to: PrivateMessageSystem
  defdelegate list_pm_drafts(user_id, opts \\ []), to: PrivateMessageSystem
  defdelegate save_pm_draft(attrs), to: PrivateMessageSystem
  defdelegate get_pm_draft(draft_id, user_id), to: PrivateMessageSystem
  defdelegate update_pm_draft(draft, attrs), to: PrivateMessageSystem
  defdelegate delete_pm_draft(draft), to: PrivateMessageSystem
  defdelegate send_pm_draft(draft), to: PrivateMessageSystem
  defdelegate get_pm_stats(user_id), to: PrivateMessageSystem
  defdelegate export_pm(user_id, opts \\ []), to: PrivateMessageSystem

  # ============================================================================
  # Saved Messages — delegated to SavedMessages
  # ============================================================================

  defdelegate list_saved_messages(user_id, opts \\ []), to: SavedMessages
  defdelegate save_message(user_id, message_id, opts \\ []), to: SavedMessages
  defdelegate unsave_message(user_id, saved_message_id), to: SavedMessages
  defdelegate message_saved?(user_id, message_id), to: SavedMessages

  # ============================================================================
  # Ephemeral / Disappearing Messages
  # ============================================================================

  @spec update_conversation_ttl(struct(), integer() | nil) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_conversation_ttl(%Conversation{} = conversation, ttl) when is_nil(ttl) or is_integer(ttl) do
    conversation |> Ecto.Changeset.change(message_ttl: ttl) |> Repo.update()
  end

  @spec get_conversation_ttl(binary()) :: {:ok, integer() | nil} | {:error, :not_found}
  def get_conversation_ttl(conversation_id) when is_binary(conversation_id) do
    case Repo.get(Conversation, conversation_id) do
      nil -> {:error, :not_found}
      conv -> {:ok, conv.message_ttl}
    end
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

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

  # ===========================================================================
  # Sync Query Functions (WatermelonDB pull)
  # ===========================================================================

  @doc """
  List conversations the user is part of, updated since the given timestamp.
  `since` is a millisecond Unix timestamp or nil for full sync.
  """
  @spec list_user_conversations_since(struct(), integer() | nil) :: [struct()]
  def list_user_conversations_since(user, since) do
    user_id = user.id

    query =
      from c in Conversation,
        join: cp in ConversationParticipant, on: cp.conversation_id == c.id,
        where: cp.user_id == ^user_id and is_nil(cp.left_at),
        select: c

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from c in query, where: c.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List IDs of conversations the user has left since the given timestamp.
  """
  @spec list_deleted_conversation_ids_since(struct(), integer() | nil) :: [binary()]
  def list_deleted_conversation_ids_since(user, since) do
    user_id = user.id

    query =
      from cp in ConversationParticipant,
        where: cp.user_id == ^user_id and not is_nil(cp.left_at),
        select: cp.conversation_id

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from cp in query, where: cp.left_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List messages in user's conversations, updated since the given timestamp.
  """
  @spec list_user_messages_since(struct(), integer() | nil) :: [struct()]
  def list_user_messages_since(user, since) do
    user_id = user.id

    query =
      from m in Message,
        join: cp in ConversationParticipant, on: cp.conversation_id == m.conversation_id,
        where: cp.user_id == ^user_id and is_nil(cp.left_at) and is_nil(m.deleted_at),
        select: m

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from m in query, where: m.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List IDs of messages that were soft-deleted since the given timestamp.
  """
  @spec list_deleted_message_ids_since(struct(), integer() | nil) :: [binary()]
  def list_deleted_message_ids_since(user, since) do
    user_id = user.id

    query =
      from m in Message,
        join: cp in ConversationParticipant, on: cp.conversation_id == m.conversation_id,
        where: cp.user_id == ^user_id and not is_nil(m.deleted_at),
        select: m.id

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from m in query, where: m.deleted_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List conversation participants updated since the given timestamp.
  """
  @spec list_participants_since(struct(), integer() | nil) :: [struct()]
  def list_participants_since(user, since) do
    user_id = user.id

    query =
      from cp in ConversationParticipant,
        join: my_cp in ConversationParticipant,
          on: my_cp.conversation_id == cp.conversation_id and my_cp.user_id == ^user_id,
        where: is_nil(cp.left_at) and is_nil(my_cp.left_at),
        select: cp

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from cp in query, where: cp.updated_at > ^dt
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  List IDs of participants who left conversations since the given timestamp.
  """
  @spec list_removed_participant_ids_since(struct(), integer() | nil) :: [binary()]
  def list_removed_participant_ids_since(user, since) do
    user_id = user.id

    query =
      from cp in ConversationParticipant,
        join: my_cp in ConversationParticipant,
          on: my_cp.conversation_id == cp.conversation_id and my_cp.user_id == ^user_id,
        where: not is_nil(cp.left_at),
        select: cp.id

    query =
      if since do
        dt = DateTime.from_unix!(since, :millisecond)
        from cp in query, where: cp.left_at > ^dt
      else
        query
      end

    Repo.all(query)
  end
end
