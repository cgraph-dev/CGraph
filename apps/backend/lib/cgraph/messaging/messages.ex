defmodule CGraph.Messaging.Messages do
  @moduledoc """
  Sub-context for Message-related operations.

  Handles message creation, retrieval, editing, deletion, and pinning.
  Extracted from the main Messaging context for better maintainability.

  @since v0.7.29
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{Conversation, Message}
  alias CGraph.Repo

  @doc """
  List messages in a conversation with pagination.

  ## Options
    - `:page` - Page number (default: 1)
    - `:per_page` - Results per page (default: 50)
    - `:before` - Cursor for messages before this ID
    - `:after` - Cursor for messages after this ID

  ## Returns
    `{messages, metadata}` tuple
  """
  @spec list_messages(Conversation.t(), keyword()) :: {list(Message.t()), map()}
  def list_messages(conversation, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)

    query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      order_by: [desc: m.inserted_at],
      preload: [:sender, reactions: :user]

    total = Repo.aggregate(query, :count, :id)

    messages = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()
      |> Enum.reverse()

    meta = %{page: page, per_page: per_page, total: total}
    {messages, meta}
  end

  @doc """
  Get a single message by ID.
  """
  @spec get_message(String.t()) :: {:ok, Message.t()} | {:error, :not_found}
  def get_message(id) do
    query = from m in Message,
      where: m.id == ^id,
      preload: [:sender, reactions: :user]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  @doc """
  Get a message ensuring user has access.
  """
  @spec get_user_message(map(), String.t()) :: {:ok, Message.t()} | {:error, atom()}
  def get_user_message(user, message_id) do
    with {:ok, message} <- get_message(message_id),
         {:ok, _conversation} <- CGraph.Messaging.Conversations.get_user_conversation(user, message.conversation_id) do
      {:ok, message}
    end
  end

  @doc """
  Create a new message in a conversation.
  """
  @spec create_message(map(), Conversation.t(), map()) :: {:ok, Message.t()} | {:error, term()}
  def create_message(user, conversation, attrs) do
    message_attrs = attrs
      |> Map.put("sender_id", user.id)
      |> Map.put("conversation_id", conversation.id)
      |> Map.put("type", Map.get(attrs, "type", "text"))

    %Message{}
    |> Message.changeset(message_attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} ->
        update_conversation_last_message(conversation, message)
        {:ok, Repo.preload(message, [:sender, :reactions])}
      error ->
        error
    end
  end

  @doc """
  Create a message from raw attributes (for channel messages).
  """
  @spec create_message(map()) :: {:ok, Message.t()} | {:error, term()}
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
  Edit an existing message.
  """
  @spec edit_message(map(), Message.t(), map()) :: {:ok, Message.t()} | {:error, term()}
  def edit_message(user, message, attrs) do
    if message.sender_id != user.id do
      {:error, :forbidden}
    else
      message
      |> Message.edit_changeset(attrs)
      |> Repo.update()
      |> case do
        {:ok, message} -> {:ok, Repo.preload(message, [:sender, :reactions])}
        error -> error
      end
    end
  end

  @doc """
  Delete a message (soft delete by marking is_deleted).
  """
  @spec delete_message(map(), Message.t()) :: {:ok, Message.t()} | {:error, term()}
  def delete_message(user, message) do
    if message.sender_id != user.id do
      {:error, :forbidden}
    else
      message
      |> Message.changeset(%{is_deleted: true, content: "[Message deleted]"})
      |> Repo.update()
    end
  end

  @doc """
  Pin a message in a conversation.
  """
  @spec pin_message(map(), Message.t()) :: {:ok, Message.t()} | {:error, term()}
  def pin_message(user, message) do
    message
    |> Message.changeset(%{
      is_pinned: true,
      pinned_at: DateTime.utc_now(),
      pinned_by_id: user.id
    })
    |> Repo.update()
  end

  @doc """
  Unpin a message.
  """
  @spec unpin_message(Message.t()) :: {:ok, Message.t()} | {:error, term()}
  def unpin_message(message) do
    message
    |> Message.changeset(%{is_pinned: false, pinned_at: nil, pinned_by_id: nil})
    |> Repo.update()
  end

  @doc """
  List pinned messages in a conversation.
  """
  @spec list_pinned_messages(Conversation.t()) :: list(Message.t())
  def list_pinned_messages(conversation) do
    from(m in Message,
      where: m.conversation_id == ^conversation.id,
      where: m.is_pinned == true,
      order_by: [desc: m.pinned_at],
      preload: [:sender, :pinned_by]
    )
    |> Repo.all()
  end

  # Private helpers

  defp update_conversation_last_message(conversation, message) do
    conversation
    |> Ecto.Changeset.change(%{
      last_message_at: message.inserted_at,
      last_message_id: message.id
    })
    |> Repo.update()
  end
end
