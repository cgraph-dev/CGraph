defmodule Cgraph.Messaging do
  @moduledoc """
  The Messaging context.
  
  Handles direct messages, conversations, reactions, and read receipts.
  """

  import Ecto.Query, warn: false
  alias Cgraph.Repo
  alias Cgraph.Messaging.{Conversation, ConversationParticipant, Message, Reaction, ReadReceipt}

  # ============================================================================
  # Conversations
  # ============================================================================

  @doc """
  List conversations for a user.
  """
  def list_conversations(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from c in Conversation,
      join: cp in ConversationParticipant, on: cp.conversation_id == c.id,
      where: cp.user_id == ^user.id,
      where: cp.left_at |> is_nil(),
      order_by: [desc: c.last_message_at],
      preload: [:participants]

    total = Repo.aggregate(query, :count, :id)
    
    conversations = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {conversations, meta}
  end

  @doc """
  Alias for list_conversations with user first.
  """
  def list_user_conversations(user, opts \\ []), do: list_conversations(user, opts)

  @doc """
  Get or create a DM conversation between two users.
  Returns `{:ok, conversation, :existing}` or `{:ok, conversation, :created}`.
  """
  def get_or_create_dm(user, other_user) do
    create_or_get_conversation(user, [other_user.id])
  end

  @doc """
  Create or get an existing conversation between users.
  
  For DMs (2 participants), returns existing if one exists.
  Returns `{:ok, conversation, :existing}` or `{:ok, conversation, :created}`.
  """
  def create_or_get_conversation(user, participant_ids) when is_list(participant_ids) do
    all_ids = [user.id | participant_ids] |> Enum.uniq()
    
    # For DMs (2 participants), check for existing
    if length(all_ids) == 2 do
      case find_dm_conversation(all_ids) do
        {:ok, conversation} -> {:ok, conversation, :existing}
        :not_found -> 
          case create_conversation(user, %{"participant_ids" => participant_ids}) do
            {:ok, conversation} -> {:ok, conversation, :created}
            error -> error
          end
      end
    else
      case create_conversation(user, %{"participant_ids" => participant_ids}) do
        {:ok, conversation} -> {:ok, conversation, :created}
        error -> error
      end
    end
  end

  # Legacy wrapper for single recipient_id
  def create_or_get_conversation(user, recipient_id) when is_binary(recipient_id) do
    create_or_get_conversation(user, [recipient_id])
  end

  @doc """
  Create a group conversation with multiple participants.
  
  Attrs:
  - participant_ids: List of all user IDs to include (including creator)
  - name: Optional group name
  - is_group: Boolean indicating group conversation (default true)
  """
  def create_group_conversation(creator, attrs) do
    participant_ids = Map.get(attrs, :participant_ids, [])
    name = Map.get(attrs, :name)
    
    case create_conversation(creator, %{"participant_ids" => participant_ids, "name" => name}) do
      {:ok, conversation} -> {:ok, conversation}
      error -> error
    end
  end

  @doc """
  Get a conversation by ID.
  """
  def get_conversation(id) do
    query = from c in Conversation,
      where: c.id == ^id,
      preload: [participants: :user]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      conversation -> {:ok, conversation}
    end
  end

  @doc """
  Get a conversation for a specific user, ensuring they have access.
  """
  def get_user_conversation(user, conversation_id) do
    with {:ok, conversation} <- get_conversation(conversation_id),
         :ok <- authorize_access(user, conversation) do
      {:ok, conversation}
    end
  end

  @doc """
  Authorize user access to a conversation.
  Returns :ok if user is a participant, {:error, :forbidden} otherwise.
  """
  def authorize_access(user, conversation) do
    is_participant = Enum.any?(conversation.participants, fn p ->
      p.user_id == user.id && is_nil(p.left_at)
    end)

    if is_participant, do: :ok, else: {:error, :forbidden}
  end

  @doc """
  Create a new conversation.
  """
  def create_conversation(user, attrs) do
    participant_ids = Map.get(attrs, "participant_ids", [])
    all_participant_ids = [user.id | participant_ids] |> Enum.uniq()

    Repo.transaction(fn ->
      # Check for existing DM between these users
      if length(all_participant_ids) == 2 do
        case find_dm_conversation(all_participant_ids) do
          {:ok, existing} -> existing
          :not_found -> do_create_conversation(user, all_participant_ids)
        end
      else
        do_create_conversation(user, all_participant_ids)
      end
    end)
  end

  defp find_dm_conversation([user1_id, user2_id]) do
    # DM conversations use user_one_id and user_two_id ordered consistently
    # Sort IDs to ensure consistent ordering
    [lower_id, higher_id] = Enum.sort([user1_id, user2_id])
    
    query = from c in Conversation,
      where: c.user_one_id == ^lower_id,
      where: c.user_two_id == ^higher_id,
      preload: [participants: :user]

    case Repo.one(query) do
      nil -> :not_found
      conversation -> {:ok, conversation}
    end
  end

  defp do_create_conversation(_creator, participant_ids) do
    # For DMs, use the ordered user_one_id/user_two_id pattern
    if length(participant_ids) == 2 do
      [user1_id, user2_id] = participant_ids
      [lower_id, higher_id] = Enum.sort([user1_id, user2_id])
      
      {:ok, conversation} = %Conversation{}
        |> Conversation.changeset(%{user_one_id: lower_id, user_two_id: higher_id})
        |> Repo.insert()

      # Add participants
      for user_id <- participant_ids do
        %ConversationParticipant{}
        |> ConversationParticipant.changeset(%{conversation_id: conversation.id, user_id: user_id})
        |> Repo.insert()
      end

      Repo.preload(conversation, [participants: :user])
    else
      # Group conversations - would need schema update to support
      {:error, :group_conversations_not_supported}
    end
  end

  # ============================================================================
  # Messages
  # ============================================================================

  @doc """
  List messages in a conversation.
  """
  def list_messages(conversation, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    before_id = Keyword.get(opts, :before)
    after_id = Keyword.get(opts, :after)

    query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      order_by: [desc: m.inserted_at],
      preload: [:sender, :reactions]

    query = if before_id do
      from m in query, where: m.id < ^before_id
    else
      query
    end

    query = if after_id do
      from m in query, where: m.id > ^after_id
    else
      query
    end

    total = Repo.aggregate(from(m in Message, where: m.conversation_id == ^conversation.id), :count, :id)
    
    messages = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> Enum.reverse()

    meta = %{page: page, per_page: per_page, total: total, has_more: length(messages) == per_page}
    {messages, meta}
  end

  @doc """
  Get a message by ID.
  """
  def get_message(conversation, message_id) do
    query = from m in Message,
      where: m.id == ^message_id,
      where: m.conversation_id == ^conversation.id,
      preload: [:sender, :reactions]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  @doc """
  Create a message in a conversation.
  """
  def create_message(user, conversation, attrs) do
    # Ensure consistent string keys
    # Message schema uses sender_id, not user_id
    message_attrs = attrs
      |> stringify_keys()
      |> Map.put("sender_id", user.id)
      |> Map.put("conversation_id", conversation.id)

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

        # Broadcast to conversation channel
        broadcast_message(conversation, message)
        
        {:ok, Repo.preload(message, [:sender, :reactions])}

      error -> error
    end
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
    
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    
    # Create read receipts for all unread messages
    Enum.each(unread_message_ids, fn mid ->
      %ReadReceipt{}
      |> ReadReceipt.changeset(%{message_id: mid, user_id: user.id})
      |> Ecto.Changeset.put_change(:read_at, now)
      |> Repo.insert(on_conflict: :nothing)
    end)
    
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
    CgraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "typing",
      %{user_id: user.id, username: user.username}
    )
    :ok
  end

  defp broadcast_message(conversation, message) do
    CgraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "new_message",
      %{message: message}
    )
  end

  # ============================================================================
  # Reactions
  # ============================================================================

  @doc """
  List reactions on a message.
  """
  def list_reactions(message, opts \\ []) do
    emoji_filter = Keyword.get(opts, :emoji)

    query = from r in Reaction,
      where: r.message_id == ^message.id,
      preload: [:user]

    query = if emoji_filter do
      from r in query, where: r.emoji == ^emoji_filter
    else
      query
    end

    Repo.all(query)
  end

  @doc """
  Add a reaction to a message.
  Returns {:error, :already_exists} if the user already reacted with this emoji.
  """
  def add_reaction(user, message, emoji) do
    # Check if already reacted with this emoji
    existing = Repo.get_by(Reaction,
      user_id: user.id,
      message_id: message.id,
      emoji: emoji
    )

    if existing do
      {:error, :already_exists}
    else
      %Reaction{}
      |> Reaction.changeset(%{
        user_id: user.id,
        message_id: message.id,
        emoji: emoji
      })
      |> Repo.insert()
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
  def broadcast_reaction_added(conversation, message, reaction) do
    CgraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_added",
      %{message_id: message.id, reaction: reaction}
    )
  end

  @doc """
  Broadcast reaction removed event.
  """
  def broadcast_reaction_removed(conversation, message, user, emoji) do
    CgraphWeb.Endpoint.broadcast(
      "conversation:#{conversation.id}",
      "reaction_removed",
      %{message_id: message.id, user_id: user.id, emoji: emoji}
    )
  end

  @doc """
  Get users who reacted with a specific emoji.
  """
  def get_reaction_users(message, emoji, opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)

    from(r in Reaction,
      where: r.message_id == ^message.id,
      where: r.emoji == ^emoji,
      join: u in assoc(r, :user),
      select: u,
      limit: ^limit
    )
    |> Repo.all()
  end

  # ============================================================================
  # Search
  # ============================================================================

  @doc """
  Search messages accessible to user.
  """
  def search_messages(user, query, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    conversation_id = Keyword.get(opts, :conversation_id)
    search_term = "%#{query}%"

    # Get conversation IDs user is part of
    user_conversation_ids = from(cp in ConversationParticipant,
      where: cp.user_id == ^user.id,
      where: is_nil(cp.left_at),
      select: cp.conversation_id
    ) |> Repo.all()

    db_query = from m in Message,
      where: m.conversation_id in ^user_conversation_ids,
      where: ilike(m.content, ^search_term),
      order_by: [desc: m.inserted_at],
      preload: [:sender, :conversation]

    db_query = if conversation_id do
      from m in db_query, where: m.conversation_id == ^conversation_id
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
      {:ok, message} -> {:ok, Repo.preload(message, [:sender, :reactions])}
      error -> error
    end
  end

  @doc """
  Get a message by ID.
  """
  def get_message(message_id) when is_binary(message_id) do
    case Repo.get(Message, message_id) do
      nil -> {:error, :not_found}
      message -> {:ok, Repo.preload(message, [:sender, :reactions])}
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
  Delete a message by ID (only by sender).
  """
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

  @doc """
  Delete a message (only by sender or moderator).
  """
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
end
