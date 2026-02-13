defmodule CGraph.Messaging do
  @moduledoc """
  The Messaging context.

  Handles direct messages, conversations, reactions, and read receipts.

  This module acts as the main entry point and delegates to specialized
  sub-contexts for better organization:

  - `CGraph.Messaging.Conversations` - Conversation CRUD and participant management
  - `CGraph.Messaging.Messages` - Message CRUD, pinning, editing
  - `CGraph.Messaging.Reactions` - Message reactions
  - `CGraph.Messaging.ReadReceipts` - Read status and delivery tracking
  - `CGraph.Messaging.Search` - Message search functionality

  @since v0.7.29 - Refactored to use sub-contexts
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{Conversation, ConversationParticipant, DeliveryTracking, Message, Reaction, ReadReceipt}
  alias CGraph.Messaging.Conversations
  alias CGraph.Repo
  alias CGraph.Search.Indexer

  # ============================================================================
  # Conversations - Delegated to Conversations sub-context

  # ============================================================================

  @doc """
  List conversations for a user.

  See `CGraph.Messaging.Conversations.list_conversations/2` for details.
  """
  defdelegate list_conversations(user, opts \\ []), to: Conversations

  @doc """
  Alias for list_conversations with user first.
  """
  def list_user_conversations(user, opts \\ []), do: Conversations.list_conversations(user, opts)

  @doc """
  Get a conversation by ID.

  See `CGraph.Messaging.Conversations.get_conversation/1` for details.
  """
  defdelegate get_conversation(id), to: Conversations

  @doc """
  Get a conversation for a specific user, ensuring they have access.

  See `CGraph.Messaging.Conversations.get_user_conversation/2` for details.
  """
  defdelegate get_user_conversation(user, conversation_id), to: Conversations

  @doc """
  Authorize user access to a conversation.

  See `CGraph.Messaging.Conversations.authorize_access/2` for details.
  """
  defdelegate authorize_access(user, conversation), to: Conversations

  @doc """
  Get or create a DM conversation between two users.

  See `CGraph.Messaging.Conversations.get_or_create_dm/2` for details.
  """
  defdelegate get_or_create_dm(user, other_user), to: Conversations

  @doc """
  Create or get an existing conversation between users.

  See `CGraph.Messaging.Conversations.create_or_get_conversation/2` for details.
  """
  defdelegate create_or_get_conversation(user, participant_ids), to: Conversations

  @doc """
  Create a new conversation.

  See `CGraph.Messaging.Conversations.create_conversation/2` for details.
  """
  defdelegate create_conversation(user, attrs), to: Conversations

  # ============================================================================
  # Messages
  # ============================================================================

  @doc """
  List messages in a conversation using cursor-based pagination.

  ## Options

    * `:cursor` - Opaque cursor string for pagination
    * `:limit` - Number of messages to fetch (default: 50, max: 100)
    * `:before` - Fetch messages before this message ID (legacy, prefer cursor)
    * `:after` - Fetch messages after this message ID (legacy, prefer cursor)
    * `:include_total` - Include total count (default: false, expensive at scale)

  Returns `{messages, page_info}` where page_info contains cursor metadata.
  """
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

    # Support legacy before_id/after_id params alongside cursor pagination
    base_query = if before_id do
      from m in base_query, where: m.id < ^before_id
    else
      base_query
    end

    base_query = if after_id do
      from m in base_query, where: m.id > ^after_id
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
      include_total: include_total
    }

    {messages, page_info} = Pagination.paginate(base_query, pagination_opts)

    # Return in chronological order (oldest first) for chat display
    messages = Enum.reverse(messages)

    # Build backward-compatible meta with cursor pagination info
    meta = %{
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor,
      has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    meta = if include_total do
      Map.put(meta, :total, page_info[:total_count])
    else
      meta
    end

    {messages, meta}
  end

  @doc """
  Get a message by ID.
  """
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

  @doc """
  List all replies (thread) for a given parent message.

  Returns replies in chronological order (oldest first) with cursor pagination.
  Uses the DB index on `reply_to_id` for O(log N) lookups.

  ## Options
    * `:cursor` - Pagination cursor
    * `:limit` - Max replies per page (default: 50, max: 100)
  """
  def list_thread_replies(parent_message_id, opts \\ []) do
    alias CGraph.Pagination

    limit = min(Keyword.get(opts, :limit, 50), 100)
    cursor = Keyword.get(opts, :cursor)

    base_query =
      from m in Message,
        where: m.reply_to_id == ^parent_message_id,
        preload: [[sender: :customization], [reactions: :user], [reply_to: [sender: :customization]]]

    pagination_opts = %{
      cursor: cursor,
      after_cursor: nil,
      before_cursor: nil,
      limit: limit,
      sort_field: :inserted_at,
      sort_direction: :asc,
      include_total: false
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

  @doc """
  Count replies to a list of parent message IDs.

  Returns a map of `%{message_id => reply_count}`.
  Uses a single aggregate query — O(N) where N = number of parent IDs.
  """
  def count_thread_replies(parent_message_ids) when is_list(parent_message_ids) do
    from(m in Message,
      where: m.reply_to_id in ^parent_message_ids,
      where: is_nil(m.deleted_at),
      group_by: m.reply_to_id,
      select: {m.reply_to_id, count(m.id)}
    )
    |> Repo.all()
    |> Map.new()
  end

  @doc """
  Create a message in a conversation.

  Supports idempotency via `client_message_id` parameter. If a message with
  the same client_message_id already exists in the conversation, returns
  the existing message instead of creating a duplicate.
  """
  def create_message(user, conversation, attrs) do
    # Ensure consistent string keys
    # Message schema uses sender_id, not user_id
    message_attrs = attrs
      |> stringify_keys()
      |> Map.put("sender_id", user.id)
      |> Map.put("conversation_id", conversation.id)

    # Check for idempotency - if client_message_id exists, return existing message
    case check_idempotency(conversation.id, message_attrs) do
      {:ok, existing_message} ->
        {:ok, existing_message}

      :not_found ->
        do_create_message(conversation, message_attrs)
    end
  end

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
    # Auto-set expires_at based on conversation TTL
    message_attrs = maybe_set_expires_at(conversation, message_attrs)

    result = %Message{}
      |> Message.changeset(message_attrs)
      |> Repo.insert()

    case result do
      {:ok, message} ->
        # Update conversation last_message_at
        # Truncate to seconds for :utc_datetime field
        now = DateTime.utc_now() |> DateTime.truncate(:second)
        conversation
        |> Ecto.Changeset.change(last_message_at: now)
        |> Repo.update()

        # Track delivery receipts for all participants (WhatsApp-style ✓✓ marks)
        track_delivery_for_participants(message, conversation)

        # Index message in MeiliSearch for full-text search
        try do
          Indexer.index_async(:messages, message)
        rescue
          _ -> :ok  # Don't fail message creation if search indexing fails
        end

        # Note: Message broadcasting is handled by the channel layer (conversation_channel.ex)
        # to ensure proper serialization and consistent camelCase format for WebSocket clients.
        # Do not broadcast here to avoid duplicate messages.

        {:ok, Repo.preload(message, [[sender: :customization], :reactions, [reply_to: [sender: :customization]]])}

      error -> error
    end
  end

  # Track delivery receipts for all conversation participants except the sender
  defp track_delivery_for_participants(message, conversation) do
    recipient_ids =
      from(cp in CGraph.Messaging.ConversationParticipant,
        where: cp.conversation_id == ^conversation.id,
        where: cp.user_id != ^message.sender_id,
        select: cp.user_id
      )
      |> Repo.all()

    if recipient_ids != [] do
      DeliveryTracking.track_sent(message, recipient_ids)
    end
  rescue
    _ -> :ok  # Don't fail message creation if delivery tracking fails
  end

  @doc """
  Send a message (alias for create_message with conversation first).
  """
  def send_message(conversation, user, attrs) do
    create_message(user, conversation, attrs)
  end

  @doc """
  Mark a message as read.

  Supports multiple argument patterns:
  - `mark_message_read(message_id, user_id)` - binary IDs for WebSocket channels
  - `mark_message_read(message, user)` - Message struct and user struct
  - `mark_message_read(conversation, user, message_id)` - full context with conversation
  """
  def mark_message_read(message_id, user_id) when is_binary(message_id) and is_binary(user_id) do
    # Get the message to verify it exists
    case Repo.get(Message, message_id) do
      nil -> {:error, :not_found}
      _message ->
        # Update or create read receipt by message_id and user_id
        case Repo.get_by(ReadReceipt, user_id: user_id, message_id: message_id) do
          nil ->
            # Truncate to seconds for :utc_datetime field
            now = DateTime.utc_now() |> DateTime.truncate(:second)
            %ReadReceipt{}
            |> ReadReceipt.changeset(%{
              user_id: user_id,
              message_id: message_id
            })
            |> Ecto.Changeset.put_change(:read_at, now)
            |> Repo.insert()

          receipt ->
            # Already read, just return it
            {:ok, receipt}
        end
    end
  end

  def mark_message_read(%Message{} = message, user) do
    mark_message_read(message.id, user.id)
  end

  def mark_message_read(conversation, user, message_id) do
    mark_messages_read(user, conversation, message_id)
  end

  @doc """
  Check if a user is a participant in a conversation.
  """
  def user_in_conversation?(conversation_id, user_id) do
    query = from cp in ConversationParticipant,
      where: cp.conversation_id == ^conversation_id,
      where: cp.user_id == ^user_id,
      where: is_nil(cp.left_at)

    Repo.exists?(query)
  end

  @doc """
  Mark messages as read up to a given message.
  Creates read receipts for all messages up to and including the specified message.
  Uses batch insert for efficiency.
  """
  def mark_messages_read(user, conversation, message_id) do
    # Get all unread messages in this conversation up to message_id
    # A message is unread if there's no read receipt for it by this user
    unread_query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      where: m.sender_id != ^user.id,
      where: m.id <= ^message_id,
      left_join: r in ReadReceipt, on: r.message_id == m.id and r.user_id == ^user.id,
      where: is_nil(r.id),
      select: m.id

    unread_message_ids = Repo.all(unread_query)

    unless Enum.empty?(unread_message_ids) do
      # read_at uses :utc_datetime (no microseconds)
      # inserted_at uses :utc_datetime_usec (with microseconds)
      # Note: ReadReceipt schema has timestamps(updated_at: false) - no updated_at field
      now = DateTime.utc_now()
      read_at = DateTime.truncate(now, :second)

      # Batch insert read receipts - much more efficient than individual inserts
      read_receipts = Enum.map(unread_message_ids, fn mid ->
        %{
          id: Ecto.UUID.generate(),
          message_id: mid,
          user_id: user.id,
          read_at: read_at,
          inserted_at: now
        }
      end)

      # Insert all at once, ignoring conflicts (on_conflict: :nothing)
      Repo.insert_all(ReadReceipt, read_receipts, on_conflict: :nothing)
    end

    {:ok, length(unread_message_ids)}
  end

  @doc """
  Get unread message count for a conversation.
  """
  def get_unread_count(user, conversation) do
    # Count messages in the conversation that:
    # 1. Were not sent by this user
    # 2. Don't have a read receipt from this user
    query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      where: m.sender_id != ^user.id,
      left_join: r in ReadReceipt, on: r.message_id == m.id and r.user_id == ^user.id,
      where: is_nil(r.id),
      select: count(m.id)

    Repo.one(query) || 0
  end

  @doc """
  Broadcast typing indicator.
  """
  def broadcast_typing(conversation, user) do
    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "typing",
      %{user_id: user.id, username: user.username}
    )
    :ok
  end

  # Note: Message broadcasting is now handled exclusively by the channel layer
  # This function is kept for reference but should not be called
  # Uncommented to avoid unused function warning
  # defp broadcast_message(_conversation, _message) do
  #   CGraphWeb.Endpoint.broadcast(
  #     "conversation:#{conversation.id}",
  #     "new_message",
  #     %{message: message}
  #   )
  # end

  # ============================================================================
  # Reactions
  # ============================================================================

  defdelegate list_reactions(message, opts \\ []), to: CGraph.Messaging.Reactions

  @doc """
  Add a reaction to a message.
  Allows multiple different emoji reactions per user per message (Discord/Telegram pattern).
  Returns {:ok, reaction} on success, {:error, :already_exists} if same emoji already used.
  """
  def add_reaction(user, message, emoji) do
    # Check if already reacted with this exact emoji
    existing_same = Repo.get_by(Reaction,
      user_id: user.id,
      message_id: message.id,
      emoji: emoji
    )

    if existing_same do
      {:error, :already_exists}
    else
      # Allow multiple unique emoji per user per message
      case %Reaction{}
        |> Reaction.changeset(%{
          user_id: user.id,
          message_id: message.id,
          emoji: emoji
        })
        |> Repo.insert() do
        {:ok, reaction} -> {:ok, reaction, nil}
        {:error, changeset} -> {:error, changeset}
      end
    end
  end

  @doc """
  Remove a reaction from a message.
  """
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

  @doc """
  Broadcast reaction added event.
  """
  def broadcast_reaction_added(conversation, message, reaction, user \\ nil) do
    # Use provided user or try to get from reaction
    user_data = user || reaction.user

    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_added",
      %{
        message_id: message.id,
        emoji: reaction.emoji,
        user_id: reaction.user_id,
        user: if user_data do
          %{
            id: user_data.id,
            username: user_data.username,
            display_name: user_data.display_name,
            avatar_url: user_data.avatar_url
          }
        else
          %{id: reaction.user_id}
        end
      }
    )
  end

  @doc """
  Broadcast reaction removed event.
  """
  def broadcast_reaction_removed(conversation, message, user, emoji) do
    CGraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_removed",
      %{message_id: message.id, user_id: user.id, emoji: emoji}
    )
  end

  defdelegate get_reaction_users(message, emoji, opts \\ []), to: CGraph.Messaging.Reactions

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search messages accessible to user using cursor-based pagination.

  ## Options

    * `:cursor` - Opaque cursor string for pagination
    * `:limit` - Number of results to fetch (default: 20, max: 100)
    * `:conversation_id` - Filter by specific conversation
    * `:include_total` - Include total count (default: false)
  """
  def search_messages(user, query, opts \\ []) do
    alias CGraph.Pagination

    cursor = Keyword.get(opts, :cursor)
    limit = Keyword.get(opts, :limit, Keyword.get(opts, :per_page, 20))
    conversation_id = Keyword.get(opts, :conversation_id)
    include_total = Keyword.get(opts, :include_total, false)
    search_term = "%#{query}%"

    # Get conversation IDs user is part of
    user_conversation_ids = from(cp in ConversationParticipant,
      where: cp.user_id == ^user.id,
      where: is_nil(cp.left_at),
      select: cp.conversation_id
    ) |> Repo.all()

    base_query = from m in Message,
      where: m.conversation_id in ^user_conversation_ids,
      where: ilike(m.content, ^search_term),
      preload: [:sender, :conversation]

    base_query = if conversation_id do
      from m in base_query, where: m.conversation_id == ^conversation_id
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
      include_total: include_total
    }

    {messages, page_info} = Pagination.paginate(base_query, pagination_opts)

    meta = %{
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor,
      has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    meta = if include_total do
      total = Repo.aggregate(base_query, :count, :id)
      Map.put(meta, :total, total)
    else
      meta
    end

    {messages, meta}
  end

  # ============================================================================
  # Single-arity helpers for channels
  # ============================================================================

  @doc """
  Create a message with a map of attributes (for channel messages).
  """
  def create_message(attrs) when is_map(attrs) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} -> {:ok, Repo.preload(message, [[sender: :customization], :reactions])}
      error -> error
    end
  end

  @doc """
  Get a message by ID.
  """
  def get_message(message_id) when is_binary(message_id) do
    case Repo.get(Message, message_id) do
      nil -> {:error, :not_found}
      message -> {:ok, Repo.preload(message, [[sender: :customization], :reactions])}
    end
  end

  @doc """
  Update a message content.
  """
  def update_message(message, attrs) do
    message
    |> Message.edit_changeset(stringify_keys(attrs))
    |> Repo.update()
  end

  @doc """
  Pin a message in a conversation.
  Only participants can pin messages.
  Each user can pin up to 3 messages per conversation.
  """
  @max_pins_per_user 3

  def pin_message(message_id, user_id) when is_binary(message_id) and is_binary(user_id) do
    case get_message(message_id) do
      {:error, :not_found} -> {:error, :not_found}
      {:ok, message} ->
        cond do
          !message.conversation_id || !user_in_conversation?(message.conversation_id, user_id) ->
            {:error, :unauthorized}

          message.is_pinned ->
            {:error, :already_pinned}

          count_user_pins(message.conversation_id, user_id) >= @max_pins_per_user ->
            {:error, :pin_limit_reached}

          true ->
            message
            |> Ecto.Changeset.change(is_pinned: true, pinned_at: DateTime.utc_now() |> DateTime.truncate(:second), pinned_by_id: user_id)
            |> Repo.update()
        end
    end
  end

  @doc """
  Count how many messages a user has pinned in a conversation.
  """
  def count_user_pins(conversation_id, user_id) do
    from(m in Message,
      where: m.conversation_id == ^conversation_id,
      where: m.pinned_by_id == ^user_id,
      where: m.is_pinned == true,
      select: count(m.id)
    )
    |> Repo.one() || 0
  end

  @doc """
  Unpin a message in a conversation.
  """
  def unpin_message(message_id, user_id) when is_binary(message_id) and is_binary(user_id) do
    case get_message(message_id) do
      {:error, :not_found} -> {:error, :not_found}
      {:ok, message} ->
        if message.conversation_id && user_in_conversation?(message.conversation_id, user_id) do
          message
          |> Ecto.Changeset.change(is_pinned: false, pinned_at: nil, pinned_by_id: nil)
          |> Repo.update()
        else
          {:error, :unauthorized}
        end
    end
  end

  @doc """
  List scheduled messages for a conversation.
  Returns messages with schedule_status = 'scheduled', ordered by scheduled_at.
  """
  def list_scheduled_messages(conversation, opts \\ []) do
    query =
      from m in Message,
        where: m.conversation_id == ^conversation.id,
        where: m.schedule_status == "scheduled",
        where: not is_nil(m.scheduled_at),
        where: is_nil(m.deleted_at),
        preload: [:sender]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :scheduled_at,
      sort_direction: :asc
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Reschedule a scheduled message to a new time.
  Only works for messages with schedule_status = 'scheduled'.
  """
  def reschedule_message(message, new_scheduled_at) do
    if message.schedule_status == "scheduled" do
      message
      |> Ecto.Changeset.change(scheduled_at: new_scheduled_at)
      |> Repo.update()
    else
      {:error, :message_not_scheduled}
    end
  end

  @doc """
  Cancel a scheduled message.
  Updates schedule_status to 'cancelled'.
  """
  def cancel_scheduled_message(message) do
    if message.schedule_status == "scheduled" do
      message
      |> Ecto.Changeset.change(schedule_status: "cancelled")
      |> Repo.update()
    else
      {:error, :message_not_scheduled}
    end
  end

  @doc """
  Edit a message by ID (only by sender).
  """
  def edit_message(message_id, user_id, content) do
    case get_message(message_id) do
      {:error, :not_found} ->
        {:error, :not_found}

      {:ok, message} ->
        if message.sender_id == user_id do
          update_message(message, %{content: content})
        else
          {:error, :unauthorized}
        end
    end
  end

  @doc """
  Delete a message (soft delete, no authorization check).
  """
  def delete_message(message) when is_struct(message) do
    # Truncate to seconds for :utc_datetime field
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    message
    |> Ecto.Changeset.change(deleted_at: now)
    |> Repo.update()
  end

  @doc """
  Hide a message for moderation purposes (quarantine).
  Sets visibility to hidden and records the reason.
  """
  def hide_message(message_id, reason) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    case get_message(message_id) do
      {:ok, message} ->
        message
        |> Ecto.Changeset.change(%{
          hidden_at: now,
          hidden_reason: reason,
          visible: false
        })
        |> Repo.update()
      error -> error
    end
  end

  @doc """
  Soft delete a message with tracking information.
  Used for moderation actions that need audit trail.
  """
  def soft_delete_message(message_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, :user_deleted)
    report_id = Keyword.get(opts, :report_id)
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    case get_message(message_id) do
      {:ok, message} ->
        message
        |> Ecto.Changeset.change(%{
          deleted_at: now,
          deletion_reason: reason,
          deleted_by_report_id: report_id
        })
        |> Repo.update()
      error -> error
    end
  end

  @doc """
  Delete a message.
  Can be called with message_id and user_id, or with message struct and user.
  """
  def delete_message(message_id, user_id)

  def delete_message(message_id, user_id) when is_binary(message_id) and is_binary(user_id) do
    case get_message(message_id) do
      {:error, :not_found} ->
        {:error, :not_found}

      {:ok, message} ->
        if message.sender_id == user_id do
          delete_message(message)
        else
          {:error, :unauthorized}
        end
    end
  end

  def delete_message(%{sender_id: sender_id} = message, %{id: user_id}) do
    if sender_id == user_id do
      delete_message(message)
    else
      {:error, :unauthorized}
    end
  end

  @doc """
  Mark a message as read (alias for mark_message_read).
  """
  def mark_as_read(message, user) do
    mark_message_read(message, user)
  end

  @doc """
  Mark all messages in a conversation as read up to the latest message.
  """
  def mark_conversation_read(conversation, user) do
    # Get the latest message in the conversation
    latest_message = Repo.one(
      from m in Message,
        where: m.conversation_id == ^conversation.id,
        order_by: [desc: m.inserted_at],
        limit: 1
    )

    if latest_message do
      mark_messages_read(user, conversation, latest_message.id)
    else
      {:ok, :no_messages}
    end
  end

  # ============================================================================
  # Private Messages (MyBB-style PM System)
  # ============================================================================

  alias CGraph.Messaging.{PMDraft, PMFolder, PrivateMessage}

  @default_pm_folders ["Inbox", "Sent", "Drafts", "Trash"]

  @doc """
  List PM folders for a user.
  """
  def list_pm_folders(user_id) do
    query =
      from f in PMFolder,
        where: f.user_id == ^user_id,
        order_by: [asc: f.is_system, asc: f.order, asc: f.name]

    folders = Repo.all(query)

    if Enum.empty?(folders) do
      create_default_pm_folders(user_id)
    else
      folders
    end
  end

  defp create_default_pm_folders(user_id) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    default_entries =
      @default_pm_folders
      |> Enum.with_index()
      |> Enum.map(fn {name, idx} ->
        %{
          id: Ecto.UUID.generate(),
          user_id: user_id,
          name: name,
          is_system: true,
          order: idx,
          inserted_at: now,
          updated_at: now
        }
      end)

    Repo.insert_all(PMFolder, default_entries, on_conflict: :nothing)
    list_pm_folders(user_id)
  end

  @doc """
  Create a PM folder.
  """
  def create_pm_folder(attrs) do
    %PMFolder{}
    |> PMFolder.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Get a PM folder.
  """
  def get_pm_folder(folder_id, user_id \\ nil) do
    query =
      if user_id do
        from f in PMFolder, where: f.id == ^folder_id and f.user_id == ^user_id
      else
        from f in PMFolder, where: f.id == ^folder_id
      end

    case Repo.one(query) do
      nil -> {:error, :not_found}
      folder -> {:ok, folder}
    end
  end

  @doc """
  Get a PM folder by name for a user.
  """
  def get_pm_folder_by_name(user_id, name) do
    Repo.get_by(PMFolder, user_id: user_id, name: name)
  end

  @doc """
  Update a PM folder.
  """
  def update_pm_folder(%PMFolder{is_system: true}, _attrs) do
    {:error, :cannot_modify_system_folder}
  end

  def update_pm_folder(%PMFolder{} = folder, attrs) do
    folder
    |> PMFolder.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a PM folder.
  """
  def delete_pm_folder(%PMFolder{is_system: true}) do
    {:error, :cannot_delete_system_folder}
  end

  def delete_pm_folder(%PMFolder{} = folder) do
    inbox = get_pm_folder_by_name(folder.user_id, "Inbox")

    from(m in PrivateMessage, where: m.folder_id == ^folder.id)
    |> Repo.update_all(set: [folder_id: inbox.id])

    Repo.delete(folder)
  end

  @doc """
  List private messages in a folder using cursor-based pagination.

  ## Options

    * `:cursor` - Opaque cursor string for pagination
    * `:limit` - Number of messages to fetch (default: 20, max: 100)
    * `:folder_id` - Filter by folder ID
    * `:unread_only` - Only return unread messages (default: false)
    * `:search` - Search subject/content (minimum 2 characters)
    * `:include_total` - Include total count (default: false)

  Returns `{messages, page_info}` with cursor-based pagination metadata.
  """
  def list_private_messages(user_id, opts) when is_list(opts) do
    alias CGraph.Pagination

    cursor = Keyword.get(opts, :cursor)
    limit = Keyword.get(opts, :limit, Keyword.get(opts, :per_page, 20))
    folder_id = Keyword.get(opts, :folder_id)
    unread_only = Keyword.get(opts, :unread_only, false)
    search = Keyword.get(opts, :search)
    include_total = Keyword.get(opts, :include_total, false)

    base_query =
      from m in PrivateMessage,
        where: m.recipient_id == ^user_id,
        preload: [:sender]

    base_query =
      if folder_id do
        from m in base_query, where: m.folder_id == ^folder_id
      else
        base_query
      end

    base_query =
      if unread_only do
        from m in base_query, where: m.is_read == false
      else
        base_query
      end

    base_query =
      if search && String.length(search) >= 2 do
        search_pattern = "%#{search}%"
        from m in base_query, where: ilike(m.subject, ^search_pattern) or ilike(m.content, ^search_pattern)
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
      include_total: include_total
    }

    {messages, page_info} = Pagination.paginate(base_query, pagination_opts)

    pagination = %{
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor,
      has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    pagination = if include_total do
      total_count = Repo.aggregate(base_query, :count, :id)
      Map.merge(pagination, %{
        total_count: total_count,
        total_pages: ceil(total_count / limit)
      })
    else
      pagination
    end

    {messages, pagination}
  end

  def list_private_messages(user_id, folder_id, opts) when is_binary(folder_id) do
    list_private_messages(user_id, Keyword.put(opts, :folder_id, folder_id))
  end

  @doc """
  Get a private message.
  """
  def get_private_message(message_id, user_id) do
    query =
      from m in PrivateMessage,
        where: m.id == ^message_id,
        where: m.sender_id == ^user_id or m.recipient_id == ^user_id,
        preload: [:sender, :recipient]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  @doc """
  Send a private message.
  """
  def send_private_message(attrs) do
    recipient_inbox = get_pm_folder_by_name(attrs.recipient_id, "Inbox") ||
      create_default_pm_folders_and_get_folder(attrs.recipient_id, "Inbox")

    sender_sent = get_pm_folder_by_name(attrs.sender_id, "Sent") ||
      create_default_pm_folders_and_get_folder(attrs.sender_id, "Sent")

    recipient_attrs = Map.merge(attrs, %{
      folder_id: recipient_inbox.id,
      is_read: false
    })

    with {:ok, message} <- create_private_message(recipient_attrs) do
      sender_attrs = Map.merge(attrs, %{
        folder_id: sender_sent.id,
        is_read: true
      })
      create_private_message(sender_attrs)

      {:ok, Repo.preload(message, [:sender, :recipient])}
    end
  end

  defp create_default_pm_folders_and_get_folder(user_id, folder_name) do
    create_default_pm_folders(user_id)
    get_pm_folder_by_name(user_id, folder_name)
  end

  defp create_private_message(attrs) do
    %PrivateMessage{}
    |> PrivateMessage.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a private message.
  """
  def update_private_message(%PrivateMessage{} = message, attrs) do
    message
    |> PrivateMessage.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a private message.
  """
  def delete_private_message(%PrivateMessage{} = message, user_id) do
    trash = get_pm_folder_by_name(user_id, "Trash")

    if message.folder_id == trash.id do
      Repo.delete(message)
    else
      update_private_message(message, %{folder_id: trash.id})
    end
  end

  @doc """
  Mark private messages as read.
  """
  def mark_pm_as_read(message_ids, user_id) when is_list(message_ids) do
    from(m in PrivateMessage,
      where: m.id in ^message_ids and m.recipient_id == ^user_id
    )
    |> Repo.update_all(set: [is_read: true, read_at: DateTime.utc_now()])

    :ok
  end

  @doc """
  Move private messages to a folder.
  """
  def move_pm_to_folder(message_ids, folder_id, user_id) when is_list(message_ids) do
    from(m in PrivateMessage,
      where: m.id in ^message_ids and m.recipient_id == ^user_id
    )
    |> Repo.update_all(set: [folder_id: folder_id])

    :ok
  end

  @doc """
  List PM drafts using cursor-based pagination.

  ## Options

    * `:cursor` - Opaque cursor string for pagination
    * `:limit` - Number of drafts to fetch (default: 20, max: 100)
    * `:include_total` - Include total count (default: false)
  """
  def list_pm_drafts(user_id, opts \\ []) do
    alias CGraph.Pagination

    cursor = Keyword.get(opts, :cursor)
    limit = Keyword.get(opts, :limit, Keyword.get(opts, :per_page, 20))
    include_total = Keyword.get(opts, :include_total, false)

    base_query =
      from d in PMDraft,
        where: d.sender_id == ^user_id,
        preload: [:recipient]

    pagination_opts = %{
      cursor: cursor,
      after_cursor: nil,
      before_cursor: nil,
      limit: min(limit, 100),
      sort_field: :updated_at,
      sort_direction: :desc,
      include_total: include_total
    }

    {drafts, page_info} = Pagination.paginate(base_query, pagination_opts)

    pagination = %{
      has_more: page_info.has_next_page,
      end_cursor: page_info.end_cursor,
      start_cursor: page_info.start_cursor,
      has_next_page: page_info.has_next_page,
      has_previous_page: page_info.has_previous_page
    }

    pagination = if include_total do
      total_count = Repo.aggregate(base_query, :count, :id)
      Map.merge(pagination, %{
        total_count: total_count,
        total_pages: ceil(total_count / limit)
      })
    else
      pagination
    end

    {drafts, pagination}
  end

  @doc """
  Save a PM draft.
  """
  def save_pm_draft(attrs) do
    %PMDraft{}
    |> PMDraft.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Get a PM draft.
  """
  def get_pm_draft(draft_id, user_id) do
    query =
      from d in PMDraft,
        where: d.id == ^draft_id and d.sender_id == ^user_id,
        preload: [:recipient]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      draft -> {:ok, draft}
    end
  end

  @doc """
  Update a PM draft.
  """
  def update_pm_draft(%PMDraft{} = draft, attrs) do
    draft
    |> PMDraft.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Delete a PM draft.
  """
  def delete_pm_draft(%PMDraft{} = draft) do
    Repo.delete(draft)
  end

  @doc """
  Send a PM draft.
  """
  def send_pm_draft(%PMDraft{} = draft) do
    with {:ok, message} <- send_private_message(%{
           sender_id: draft.sender_id,
           recipient_id: draft.recipient_id,
           subject: draft.subject,
           content: draft.content
         }),
         {:ok, _} <- delete_pm_draft(draft) do
      {:ok, message}
    end
  end

  @doc """
  Get PM statistics for a user.
  """
  def get_pm_stats(user_id) do
    inbox = get_pm_folder_by_name(user_id, "Inbox")
    sent = get_pm_folder_by_name(user_id, "Sent")

    inbox_id = if inbox, do: inbox.id, else: nil
    sent_id = if sent, do: sent.id, else: nil

    total_received =
      from(m in PrivateMessage, where: m.recipient_id == ^user_id)
      |> Repo.aggregate(:count, :id)

    unread_count =
      if inbox_id do
        from(m in PrivateMessage,
          where: m.recipient_id == ^user_id and m.is_read == false and m.folder_id == ^inbox_id
        )
        |> Repo.aggregate(:count, :id)
      else
        0
      end

    total_sent =
      if sent_id do
        from(m in PrivateMessage, where: m.sender_id == ^user_id and m.folder_id == ^sent_id)
        |> Repo.aggregate(:count, :id)
      else
        0
      end

    drafts_count =
      from(d in PMDraft, where: d.sender_id == ^user_id)
      |> Repo.aggregate(:count, :id)

    %{
      total_received: total_received,
      unread_count: unread_count,
      total_sent: total_sent,
      drafts_count: drafts_count
    }
  end

  @doc """
  Export all private messages for a user.
  """
  def export_pm(user_id, _opts \\ []) do
    messages =
      from(m in PrivateMessage,
        where: m.sender_id == ^user_id or m.recipient_id == ^user_id,
        order_by: [desc: m.inserted_at],
        preload: [:sender, :recipient, :folder]
      )
      |> Repo.all()

    {:ok, messages}
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  @doc false
  # Converts a map with atom keys to string keys for consistent Ecto changeset handling.
  # This prevents mixed key issues when attrs come from different sources (e.g., JSON vs code).
  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  # ============================================================================
  # Saved Messages (Bookmarks)
  # ============================================================================

  alias CGraph.Messaging.SavedMessage

  @doc """
  List saved messages for a user, with optional text search.
  Results include the original message content and sender info.
  """
  def list_saved_messages(user_id, opts \\ []) do
    search = Keyword.get(opts, :search)

    query =
      from sm in SavedMessage,
        where: sm.user_id == ^user_id,
        join: m in Message, on: m.id == sm.message_id,
        join: sender in assoc(m, :sender),
        order_by: [desc: sm.saved_at],
        preload: [message: {m, sender: sender}]

    query =
      if search && search != "" do
        term = "%#{search}%"
        from [sm, m, _s] in query, where: ilike(m.content, ^term)
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  Save (bookmark) a message for a user.
  Returns `{:ok, saved_message}` or `{:error, changeset}`.
  """
  def save_message(user_id, message_id, opts \\ []) do
    note = Keyword.get(opts, :note)

    %SavedMessage{}
    |> SavedMessage.changeset(%{user_id: user_id, message_id: message_id, note: note})
    |> Repo.insert()
  end

  @doc """
  Remove a saved message bookmark.
  Returns `{:ok, saved_message}` or `{:error, :not_found}`.
  """
  def unsave_message(user_id, saved_message_id) do
    case Repo.get_by(SavedMessage, id: saved_message_id, user_id: user_id) do
      nil -> {:error, :not_found}
      saved -> Repo.delete(saved)
    end
  end

  @doc """
  Check if a message is saved by a user.
  """
  def message_saved?(user_id, message_id) do
    Repo.exists?(
      from sm in SavedMessage,
        where: sm.user_id == ^user_id and sm.message_id == ^message_id
    )
  end

  # ============================================================================
  # Ephemeral / Disappearing Messages
  # ============================================================================

  @doc """
  Update the message TTL for a conversation.
  When set, new messages auto-expire after the specified duration.
  Pass nil to disable disappearing messages.
  """
  def update_conversation_ttl(%Conversation{} = conversation, ttl) when is_nil(ttl) or is_integer(ttl) do
    conversation
    |> Ecto.Changeset.change(message_ttl: ttl)
    |> Repo.update()
  end

  @doc """
  Get the message TTL for a conversation.
  """
  def get_conversation_ttl(conversation_id) when is_binary(conversation_id) do
    case Repo.get(Conversation, conversation_id) do
      nil -> {:error, :not_found}
      conv -> {:ok, conv.message_ttl}
    end
  end

  # Auto-set expires_at on messages when conversation has a TTL
  defp maybe_set_expires_at(%Conversation{message_ttl: nil}, attrs), do: attrs
  defp maybe_set_expires_at(%Conversation{message_ttl: ttl}, attrs) when is_integer(ttl) and ttl > 0 do
    expires_at = DateTime.utc_now() |> DateTime.add(ttl, :second)
    Map.put(attrs, "expires_at", expires_at)
  end
  defp maybe_set_expires_at(_conversation, attrs), do: attrs
end
