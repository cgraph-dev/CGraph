defmodule CGraph.Messaging do
  @moduledoc """
  The Messaging context — thin delegation facade.

  Delegates to specialized sub-contexts:

  - `Conversations` — Conversation CRUD and participant management
  - `CoreMessages` — Message listing, creation, threading, ephemeral
  - `MessageOperations` — Message editing, pinning, read receipts, scheduling
  - `ReactionActions` — Inline reaction add/remove and broadcasts
  - `Reactions` — Reaction listing and user queries
  - `Search` — Full-text message search
  - `SavedMessages` — Bookmarks
  - `SyncQueries` — WatermelonDB-style pull sync
  - `PrivateMessageSystem` — MyBB-style PM system
  """

  alias CGraph.Messaging.{
    Conversations,
    CoreMessages,
    MessageOperations,
    PrivateMessageSystem,
    ReactionActions,
    SavedMessages,
    SyncQueries
  }

  # ============================================================================
  # Conversations
  # ============================================================================

  defdelegate list_conversations(user, opts \\ []), to: Conversations
  @doc "Lists all conversations for a user."
  @spec list_user_conversations(struct(), keyword()) :: {[struct()], map()}
  def list_user_conversations(user, opts \\ []), do: Conversations.list_conversations(user, opts)

  defdelegate get_conversation(id), to: Conversations
  defdelegate get_user_conversation(user, conversation_id), to: Conversations
  defdelegate authorize_access(user, conversation), to: Conversations
  defdelegate get_or_create_dm(user, other_user), to: Conversations
  defdelegate create_or_get_conversation(user, participant_ids), to: Conversations
  defdelegate create_conversation(user, attrs), to: Conversations

  # ============================================================================
  # Messages — listing, creation, threading
  # ============================================================================

  @doc "List messages in a conversation using cursor-based pagination."
  @spec list_messages(struct(), keyword()) :: {[struct()], map()}
  def list_messages(conversation, opts \\ []), do: CoreMessages.list_messages(conversation, opts)

  @doc "Get a message by conversation + message_id."
  @spec get_message(struct(), binary()) :: {:ok, struct()} | {:error, :not_found}
  defdelegate get_message(conversation, message_id), to: CoreMessages

  @doc "List thread replies for a parent message."
  @spec list_thread_replies(binary(), keyword()) :: {[struct()], map()}
  def list_thread_replies(parent_message_id, opts \\ []),
    do: CoreMessages.list_thread_replies(parent_message_id, opts)

  @doc "Count replies per parent message ID."
  @spec count_thread_replies([binary()]) :: %{binary() => non_neg_integer()}
  defdelegate count_thread_replies(parent_message_ids), to: CoreMessages

  @doc "Create a message in a conversation (with idempotency via client_message_id)."
  @spec create_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  defdelegate create_message(user, conversation, attrs), to: CoreMessages

  @doc "Send a message (alias for create_message with conversation first)."
  @spec send_message(struct(), struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  defdelegate send_message(conversation, user, attrs), to: CoreMessages

  @doc "Check if a user is a participant in a conversation."
  @spec user_in_conversation?(binary(), binary()) :: boolean()
  defdelegate user_in_conversation?(conversation_id, user_id), to: CoreMessages

  @doc "Broadcast typing indicator."
  @spec broadcast_typing(struct(), struct()) :: :ok
  defdelegate broadcast_typing(conversation, user), to: CoreMessages

  @doc "Forward a message to one or more conversations."
  @spec forward_message(struct(), binary(), [binary()]) ::
          {:ok, [struct()]} | {:error, atom() | String.t()}
  defdelegate forward_message(user, original_message_id, target_conversation_ids), to: CoreMessages

  # ============================================================================
  # Reactions
  # ============================================================================

  defdelegate list_reactions(message, opts \\ []), to: CGraph.Messaging.Reactions

  @doc "Add reaction. Returns `{:ok, reaction, nil}` (3-element tuple for callers)."
  @spec add_reaction(struct(), struct(), String.t()) :: {:ok, struct(), nil} | {:error, :already_exists} | {:error, Ecto.Changeset.t()}
  defdelegate add_reaction(user, message, emoji), to: ReactionActions

  @doc "Remove reaction."
  @spec remove_reaction(struct(), struct(), String.t()) :: {:ok, struct()} | {:error, :not_found}
  defdelegate remove_reaction(user, message, emoji), to: ReactionActions

  @doc "Broadcast reaction added event."
  @spec broadcast_reaction_added(struct(), struct(), struct(), struct() | nil) :: :ok
  def broadcast_reaction_added(conversation, message, reaction, user \\ nil),
    do: ReactionActions.broadcast_reaction_added(conversation, message, reaction, user)

  @doc "Broadcast reaction removed event."
  @spec broadcast_reaction_removed(struct(), struct(), struct(), String.t()) :: :ok
  defdelegate broadcast_reaction_removed(conversation, message, user, emoji), to: ReactionActions

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

  @doc "Marks a specific message as read."
  @spec mark_message_read(struct(), struct(), binary()) :: :ok | {:ok, struct()} | {:error, term()}
  def mark_message_read(conversation, user, message_id), do: MessageOperations.mark_messages_read(user, conversation, message_id)
  @spec mark_as_read(struct(), struct()) :: :ok | {:ok, struct()} | {:error, term()}
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

  defdelegate list_pm_folders(user_id), to: PrivateMessageSystem
  defdelegate create_pm_folder(attrs), to: PrivateMessageSystem
  defdelegate get_pm_folder(folder_id, user_id \\ nil), to: PrivateMessageSystem
  defdelegate get_pm_folder_by_name(user_id, name), to: PrivateMessageSystem
  @doc "Updates a private message folder."
  @spec update_pm_folder(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_pm_folder(folder, attrs), do: PrivateMessageSystem.update_pm_folder(folder, attrs)
  @doc "Lists private messages for a user."
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
  defdelegate update_conversation_ttl(conversation, ttl), to: CoreMessages

  @spec get_conversation_ttl(binary()) :: {:ok, integer() | nil} | {:error, :not_found}
  defdelegate get_conversation_ttl(conversation_id), to: CoreMessages

  # ============================================================================
  # Sync Query Functions (WatermelonDB pull)
  # ============================================================================

  defdelegate list_user_conversations_since(user, since), to: SyncQueries
  defdelegate list_deleted_conversation_ids_since(user, since), to: SyncQueries
  defdelegate list_user_messages_since(user, since), to: SyncQueries
  defdelegate list_deleted_message_ids_since(user, since), to: SyncQueries
  defdelegate list_participants_since(user, since), to: SyncQueries
  defdelegate list_removed_participant_ids_since(user, since), to: SyncQueries
end
