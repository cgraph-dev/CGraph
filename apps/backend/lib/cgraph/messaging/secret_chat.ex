defmodule CGraph.Messaging.SecretChat do
  @moduledoc """
  Context for Telegram-style secret chats.

  Secret chats are device-bound, E2EE-mandatory conversations where the server
  only stores opaque ciphertext. Messages support self-destruct timers and
  hard-delete on termination (not soft-delete — this is a privacy feature).

  ## Key Principles

  - Server NEVER sees plaintext — only ciphertext blobs
  - Device-bound — sessions don't sync across devices
  - Self-destruct — configurable per-conversation timer
  - Hard-delete on terminate — no recovery possible
  - One active secret chat per user pair
  """

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Redis
  alias CGraph.Messaging.{SecretConversation, SecretMessage}
  alias CGraph.Presence.GhostMode

  # ============================================================================
  # Conversation Lifecycle
  # ============================================================================

  @doc """
  Creates a new secret conversation between two users.

  Only one active secret chat can exist per pair. Returns
  `{:error, :already_exists}` if one is already active.

  ## Options

    * `:device_id` — initiator's device identifier
    * `:fingerprint` — initiator's key fingerprint
  """
  @spec create_secret_conversation(map(), String.t(), keyword()) ::
          {:ok, SecretConversation.t()} | {:error, atom() | Ecto.Changeset.t()}
  def create_secret_conversation(initiator, recipient_id, opts \\ []) do
    if initiator.id == recipient_id do
      {:error, :cannot_chat_with_self}
    else
      # Normalize user order for the unique constraint
      {init_id, recip_id} = order_ids(initiator.id, recipient_id)

      attrs = %{
        initiator_id: init_id,
        recipient_id: recip_id,
        initiator_device_id: Keyword.get(opts, :device_id),
        initiator_fingerprint: Keyword.get(opts, :fingerprint)
      }

      %SecretConversation{}
      |> SecretConversation.changeset(attrs)
      |> Repo.insert()
      |> case do
        {:ok, conversation} ->
          {:ok, Repo.preload(conversation, [:initiator, :recipient])}

        {:error, %Ecto.Changeset{errors: errors} = changeset} ->
          if Keyword.has_key?(errors, :initiator_id) || has_unique_error?(changeset) do
            {:error, :already_exists}
          else
            {:error, changeset}
          end
      end
    end
  end

  @doc """
  Lists active secret conversations for a user.
  """
  @spec list_secret_conversations(String.t()) :: [SecretConversation.t()]
  def list_secret_conversations(user_id) do
    from(sc in SecretConversation,
      where: sc.status == "active",
      where: sc.initiator_id == ^user_id or sc.recipient_id == ^user_id,
      order_by: [desc: sc.updated_at],
      preload: [:initiator, :recipient]
    )
    |> Repo.all()
  end

  @doc """
  Gets a secret conversation by ID, verifying the user is a participant.
  """
  @spec get_secret_conversation(String.t(), String.t()) ::
          {:ok, SecretConversation.t()} | {:error, :not_found}
  def get_secret_conversation(conversation_id, user_id) do
    case Repo.get(SecretConversation, conversation_id) do
      nil ->
        {:error, :not_found}

      %SecretConversation{} = convo ->
        if SecretConversation.participant?(convo, user_id) do
          {:ok, Repo.preload(convo, [:initiator, :recipient])}
        else
          {:error, :not_found}
        end
    end
  end

  @doc """
  Terminates a secret conversation and hard-deletes ALL messages.

  This is a privacy feature — no message recovery is possible after termination.
  """
  @spec destroy_secret_chat(SecretConversation.t(), String.t()) ::
          {:ok, SecretConversation.t()} | {:error, atom()}
  def destroy_secret_chat(%SecretConversation{} = conversation, user_id) do
    unless SecretConversation.participant?(conversation, user_id) do
      {:error, :not_found}
    else
      Repo.transaction(fn ->
        # Hard-delete ALL messages first
        from(m in SecretMessage, where: m.secret_conversation_id == ^conversation.id)
        |> Repo.delete_all()

        # Terminate the conversation
        conversation
        |> SecretConversation.terminate_changeset(user_id)
        |> Repo.update!()
      end)
      |> case do
        {:ok, terminated} ->
          # Broadcast termination to both participants
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "secret_chat:#{conversation.id}",
            {:secret_chat_terminated, %{conversation_id: conversation.id, terminated_by: user_id}}
          )

          {:ok, terminated}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  # ============================================================================
  # Messages
  # ============================================================================

  @doc """
  Stores a secret message (ciphertext blob).

  The server never inspects the ciphertext content. If the conversation has
  a self-destruct timer, `expires_at` is computed from the current time.

  ## Required attrs

    * `:ciphertext` — encrypted message blob (binary)
    * `:nonce` — encryption nonce
    * `:ratchet_header` — ratchet protocol header

  ## Optional attrs

    * `:content_type` — "text", "image", "video", etc. (default: "text")
    * `:file_metadata` — encrypted file metadata map
  """
  @spec send_secret_message(SecretConversation.t(), map(), map()) ::
          {:ok, SecretMessage.t()} | {:error, atom() | Ecto.Changeset.t()}
  def send_secret_message(%SecretConversation{status: "active"} = conversation, sender, attrs) do
    unless SecretConversation.participant?(conversation, sender.id) do
      {:error, :not_participant}
    else
      message_attrs =
        attrs
        |> Map.put(:secret_conversation_id, conversation.id)
        |> Map.put(:sender_id, sender.id)
        |> maybe_set_expiry(conversation)

      %SecretMessage{}
      |> SecretMessage.changeset(message_attrs)
      |> Repo.insert()
      |> case do
        {:ok, message} ->
          # Touch conversation updated_at
          conversation
          |> Ecto.Changeset.change(%{updated_at: DateTime.utc_now() |> DateTime.truncate(:microsecond)})
          |> Repo.update()

          {:ok, message}

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  def send_secret_message(%SecretConversation{status: status}, _sender, _attrs)
      when status != "active" do
    {:error, :conversation_terminated}
  end

  @doc """
  Lists secret messages in a conversation (cursor-paginated, excludes expired).
  """
  @spec list_secret_messages(SecretConversation.t(), keyword()) :: [SecretMessage.t()]
  def list_secret_messages(%SecretConversation{} = conversation, opts \\ []) do
    limit = opts |> Keyword.get(:limit, 50) |> min(100) |> max(1)
    before = Keyword.get(opts, :before)
    now = DateTime.utc_now()

    query =
      from(m in SecretMessage,
        where: m.secret_conversation_id == ^conversation.id,
        where: is_nil(m.expires_at) or m.expires_at > ^now,
        order_by: [desc: m.inserted_at],
        limit: ^limit
      )

    query =
      if before do
        where(query, [m], m.inserted_at < ^before)
      else
        query
      end

    Repo.all(query)
  end

  @doc """
  Marks a secret message as read. If the conversation has a self-destruct timer,
  sets the expiry based on the timer value from read time.
  """
  @spec mark_secret_message_read(String.t(), String.t()) ::
          {:ok, SecretMessage.t()} | {:error, atom()}
  def mark_secret_message_read(message_id, user_id) do
    with {:ok, message} <- get_secret_message(message_id),
         {:ok, conversation} <- get_secret_conversation(message.secret_conversation_id, user_id),
         true <- message.sender_id != user_id || {:error, :own_message} do
      now = DateTime.utc_now() |> DateTime.truncate(:microsecond)
      expires_at = compute_expiry(now, conversation.self_destruct_seconds)

      message
      |> Ecto.Changeset.change(%{read_at: now, expires_at: expires_at})
      |> Repo.update()
    else
      {:error, reason} -> {:error, reason}
      false -> {:error, :own_message}
    end
  end

  # ============================================================================
  # Self-Destruct Timer
  # ============================================================================

  @doc """
  Sets or clears the self-destruct timer on a secret conversation.

  Valid values: nil (off), 5, 30, 60, 300, 3600, 86400, 604800 seconds.
  Broadcasts the change to both participants.
  """
  @spec set_self_destruct_timer(SecretConversation.t(), String.t(), integer() | nil) ::
          {:ok, SecretConversation.t()} | {:error, atom() | Ecto.Changeset.t()}
  def set_self_destruct_timer(%SecretConversation{} = conversation, user_id, seconds) do
    unless SecretConversation.participant?(conversation, user_id) do
      {:error, :not_participant}
    else
      conversation
      |> SecretConversation.timer_changeset(seconds)
      |> Repo.update()
      |> case do
        {:ok, updated} ->
          Phoenix.PubSub.broadcast(
            CGraph.PubSub,
            "secret_chat:#{conversation.id}",
            {:timer_changed, %{seconds: seconds, changed_by: user_id}}
          )

          {:ok, updated}

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  # ============================================================================
  # Conversation Expiry
  # ============================================================================

  @doc """
  Set or update the expiry time on a secret conversation.

  Pass a `DateTime` to set an absolute expiry, or `nil` to clear it.
  Only participants can modify the expiry.
  """
  @spec set_expires_at(SecretConversation.t(), String.t(), DateTime.t() | nil) ::
          {:ok, SecretConversation.t()} | {:error, atom() | Ecto.Changeset.t()}
  def set_expires_at(%SecretConversation{} = conversation, user_id, expires_at) do
    unless SecretConversation.participant?(conversation, user_id) do
      {:error, :not_participant}
    else
      conversation
      |> Ecto.Changeset.change(%{expires_at: truncate_datetime(expires_at)})
      |> Repo.update()
    end
  end

  defp truncate_datetime(nil), do: nil
  defp truncate_datetime(%DateTime{} = dt), do: DateTime.truncate(dt, :microsecond)

  # ============================================================================
  # Panic Wipe
  # ============================================================================

  @doc """
  Panic wipe: terminate ALL active secret conversations for a user and clear
  associated Redis keys.

  This is an emergency action that:
  1. Hard-deletes all secret messages in the user's active conversations
  2. Marks all active conversations as terminated
  3. Clears any ghost mode Redis keys for the user

  Returns `{:ok, count}` with the number of conversations terminated.
  """
  @spec panic_wipe(String.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def panic_wipe(user_id) do
    now = DateTime.utc_now() |> DateTime.truncate(:microsecond)

    conversations =
      from(sc in SecretConversation,
        where: sc.status == "active",
        where: sc.initiator_id == ^user_id or sc.recipient_id == ^user_id
      )
      |> Repo.all()

    conversation_ids = Enum.map(conversations, & &1.id)

    Repo.transaction(fn ->
      # 1. Hard-delete all messages in affected conversations
      if conversation_ids != [] do
        from(m in SecretMessage, where: m.secret_conversation_id in ^conversation_ids)
        |> Repo.delete_all()
      end

      # 2. Terminate all active conversations
      {count, _} =
        from(sc in SecretConversation,
          where: sc.id in ^conversation_ids,
          where: sc.status == "active"
        )
        |> Repo.update_all(
          set: [
            status: "terminated",
            terminated_at: now,
            terminated_by: user_id
          ]
        )

      # 3. Clear ghost mode Redis key
      GhostMode.deactivate(user_id)

      # 4. Broadcast termination for each conversation
      Enum.each(conversations, fn convo ->
        Phoenix.PubSub.broadcast(
          CGraph.PubSub,
          "secret_chat:#{convo.id}",
          {:secret_chat_terminated, %{conversation_id: convo.id, terminated_by: user_id, panic_wipe: true}}
        )
      end)

      count
    end)
  end

  # ============================================================================
  # Cleanup
  # ============================================================================

  @doc """
  Deletes all expired secret messages. Called by Oban cleanup worker.
  Returns the number of messages deleted.
  """
  @spec cleanup_expired_messages() :: non_neg_integer()
  def cleanup_expired_messages do
    now = DateTime.utc_now()

    {count, _} =
      from(m in SecretMessage,
        where: not is_nil(m.expires_at) and m.expires_at < ^now
      )
      |> Repo.delete_all()

    count
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp get_secret_message(message_id) do
    case Repo.get(SecretMessage, message_id) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  defp maybe_set_expiry(attrs, %SecretConversation{self_destruct_seconds: nil}), do: attrs
  defp maybe_set_expiry(attrs, %SecretConversation{self_destruct_seconds: 0}), do: attrs

  defp maybe_set_expiry(attrs, %SecretConversation{self_destruct_seconds: _seconds}) do
    # Self-destruct timer starts when message is READ, not when sent.
    # We don't set expires_at here — mark_secret_message_read/2 will compute it.
    attrs
  end

  defp compute_expiry(_read_at, nil), do: nil
  defp compute_expiry(_read_at, 0), do: nil

  defp compute_expiry(read_at, seconds) when is_integer(seconds) and seconds > 0 do
    DateTime.add(read_at, seconds, :second) |> DateTime.truncate(:microsecond)
  end

  defp order_ids(id1, id2) when id1 <= id2, do: {id1, id2}
  defp order_ids(id1, id2), do: {id2, id1}

  defp has_unique_error?(%Ecto.Changeset{errors: errors}) do
    Enum.any?(errors, fn
      {_field, {_msg, opts}} -> opts[:constraint] == :unique
      _ -> false
    end)
  end
end
