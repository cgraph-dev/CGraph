defmodule CGraph.Messaging.SyncQueries do
  @moduledoc """
  WatermelonDB-style sync query functions for offline-first pull replication.

  Provides "list since" and "deleted since" queries for conversations,
  messages, and participants, using millisecond Unix timestamps.

  Extracted from `CGraph.Messaging` for maintainability.
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{Conversation, ConversationParticipant, Message}
  alias CGraph.Repo

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
