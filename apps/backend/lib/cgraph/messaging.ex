defmodule Cgraph.Messaging do
  @moduledoc """
  The Messaging context.

  Handles direct messages, conversations, reactions, and read receipts.

  This module acts as the main entry point and delegates to specialized
  sub-contexts for better organization:

  - `Cgraph.Messaging.Conversations` - Conversation CRUD and participant management
  - `Cgraph.Messaging.Messages` - Message CRUD, pinning, editing
  - `Cgraph.Messaging.Reactions` - Message reactions
  - `Cgraph.Messaging.ReadReceipts` - Read status and delivery tracking
  - `Cgraph.Messaging.Search` - Message search functionality

  @since v0.7.29 - Refactored to use sub-contexts
  """

  import Ecto.Query, warn: false

  alias Cgraph.Messaging.{ConversationParticipant, Message, Reaction, ReadReceipt}
  alias Cgraph.Messaging.Conversations
  alias Cgraph.Repo

  # ============================================================================
  # Conversations - Delegated to Conversations sub-context

  # ============================================================================

  @doc """
  List conversations for a user.

  See `Cgraph.Messaging.Conversations.list_conversations/2` for details.
  """
  defdelegate list_conversations(user, opts \\ []), to: Conversations

  @doc """
  Alias for list_conversations with user first.
  """
  def list_user_conversations(user, opts \\ []), do: Conversations.list_conversations(user, opts)

  @doc """
  Get a conversation by ID.

  See `Cgraph.Messaging.Conversations.get_conversation/1` for details.
  """
  defdelegate get_conversation(id), to: Conversations

  @doc """
  Get a conversation for a specific user, ensuring they have access.

  See `Cgraph.Messaging.Conversations.get_user_conversation/2` for details.
  """
  defdelegate get_user_conversation(user, conversation_id), to: Conversations

  @doc """
  Authorize user access to a conversation.

  See `Cgraph.Messaging.Conversations.authorize_access/2` for details.
  """
  defdelegate authorize_access(user, conversation), to: Conversations

  @doc """
  Get or create a DM conversation between two users.

  See `Cgraph.Messaging.Conversations.get_or_create_dm/2` for details.
  """
  defdelegate get_or_create_dm(user, other_user), to: Conversations

  @doc """
  Create or get an existing conversation between users.

  See `Cgraph.Messaging.Conversations.create_or_get_conversation/2` for details.
  """
  defdelegate create_or_get_conversation(user, participant_ids), to: Conversations

  @doc """
  Create a new conversation.

  See `Cgraph.Messaging.Conversations.create_conversation/2` for details.
  """
  defdelegate create_conversation(user, attrs), to: Conversations

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
      preload: [:sender, [reactions: :user], [reply_to: :sender]]

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
      preload: [:sender, [reactions: :user], [reply_to: :sender]]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
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
        message -> {:ok, Repo.preload(message, [:sender, :reactions, [reply_to: :sender]])}
      end
    else
      :not_found
    end
  end

  defp do_create_message(conversation, message_attrs) do
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

        # Note: Message broadcasting is handled by the channel layer (conversation_channel.ex)
        # to ensure proper serialization and consistent camelCase format for WebSocket clients.
        # Do not broadcast here to avoid duplicate messages.

        {:ok, Repo.preload(message, [:sender, :reactions, [reply_to: :sender]])}

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
    CgraphWeb.Endpoint.broadcast(
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
  #   CgraphWeb.Endpoint.broadcast(
  #     "conversation:#{conversation.id}",
  #     "new_message",
  #     %{message: message}
  #   )
  # end

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
  Limit: 1 reaction per user per message. If user already has a different reaction,
  it will be replaced with the new one.
  Returns {:ok, reaction, replaced_emoji} on success, {:error, :already_exists} if same emoji.
  replaced_emoji is nil if no reaction was replaced.
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
      # Check if user has any other reaction on this message (limit 1 per user)
      existing_other = Repo.get_by(Reaction,
        user_id: user.id,
        message_id: message.id
      )

      # If user has a different reaction, remove it first
      replaced_emoji = if existing_other do
        old_emoji = existing_other.emoji
        Repo.delete(existing_other)
        old_emoji
      else
        nil
      end

      # Add the new reaction
      case %Reaction{}
        |> Reaction.changeset(%{
          user_id: user.id,
          message_id: message.id,
          emoji: emoji
        })
        |> Repo.insert() do
        {:ok, reaction} -> {:ok, reaction, replaced_emoji}
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

    CgraphWeb.Endpoint.broadcast(
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
