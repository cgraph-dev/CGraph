defmodule Cgraph.Messaging.Conversations do
  @moduledoc """
  Sub-context for Conversation-related operations.
  
  Handles conversation creation, retrieval, and participant management.
  Extracted from the main Messaging context for better maintainability.
  
  @since v0.7.29
  """

  import Ecto.Query, warn: false

  alias Cgraph.Messaging.{Conversation, ConversationParticipant}
  alias Cgraph.Repo

  @doc """
  List conversations for a user with pagination.
  
  ## Options
    - `:page` - Page number (default: 1)
    - `:per_page` - Results per page (default: 20)
  
  ## Returns
    `{conversations, metadata}` tuple
  """
  @spec list_conversations(map(), keyword()) :: {list(Conversation.t()), map()}
  def list_conversations(user, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from c in Conversation,
      join: cp in ConversationParticipant, on: cp.conversation_id == c.id,
      where: cp.user_id == ^user.id,
      where: cp.left_at |> is_nil(),
      order_by: [desc: c.last_message_at],
      preload: [participants: :user]

    total = Repo.aggregate(query, :count, :id)

    conversations = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {conversations, meta}
  end

  @doc """
  Get a conversation by ID with preloaded participants.
  """
  @spec get_conversation(String.t()) :: {:ok, Conversation.t()} | {:error, :not_found}
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
  Get a conversation ensuring user has access.
  """
  @spec get_user_conversation(map(), String.t()) :: {:ok, Conversation.t()} | {:error, atom()}
  def get_user_conversation(user, conversation_id) do
    with {:ok, conversation} <- get_conversation(conversation_id),
         :ok <- authorize_access(user, conversation) do
      {:ok, conversation}
    end
  end

  @doc """
  Authorize user access to a conversation.
  """
  @spec authorize_access(map(), Conversation.t()) :: :ok | {:error, :forbidden}
  def authorize_access(user, conversation) do
    is_participant = Enum.any?(conversation.participants, fn p ->
      p.user_id == user.id && is_nil(p.left_at)
    end)

    if is_participant, do: :ok, else: {:error, :forbidden}
  end

  @doc """
  Get or create a DM conversation between two users.
  """
  @spec get_or_create_dm(map(), map()) :: {:ok, Conversation.t(), :existing | :created} | {:error, term()}
  def get_or_create_dm(user, other_user) do
    create_or_get_conversation(user, [other_user.id])
  end

  @doc """
  Create or get an existing conversation.
  For DMs, returns existing if one exists.
  """
  @spec create_or_get_conversation(map(), list(String.t())) ::
          {:ok, Conversation.t(), :existing | :created} | {:error, term()}
  def create_or_get_conversation(user, participant_ids) when is_list(participant_ids) do
    all_ids = [user.id | participant_ids] |> Enum.uniq()

    case check_existing_dm(all_ids) do
      {:ok, conversation} -> {:ok, conversation, :existing}
      :not_dm -> create_new_conversation(user, participant_ids)
      :not_found -> create_new_conversation(user, participant_ids)
    end
  end

  def create_or_get_conversation(user, recipient_id) when is_binary(recipient_id) do
    create_or_get_conversation(user, [recipient_id])
  end

  @doc """
  Create a new conversation.
  """
  @spec create_conversation(map(), map()) :: {:ok, Conversation.t()} | {:error, term()}
  def create_conversation(user, attrs) do
    participant_ids = Map.get(attrs, "participant_ids", [])
    all_participant_ids = [user.id | participant_ids] |> Enum.uniq()

    Repo.transaction(fn ->
      get_or_create_conversation_for_participants(user, all_participant_ids)
    end)
  end

  # Private helpers

  defp check_existing_dm([_, _] = all_ids), do: find_dm_conversation(all_ids)
  defp check_existing_dm(_all_ids), do: :not_dm

  defp create_new_conversation(user, participant_ids) do
    case create_conversation(user, %{"participant_ids" => participant_ids}) do
      {:ok, conversation} -> {:ok, conversation, :created}
      error -> error
    end
  end

  defp get_or_create_conversation_for_participants(user, [_, _] = all_ids) do
    case find_dm_conversation(all_ids) do
      {:ok, existing} -> existing
      :not_found -> do_create_conversation(user, all_ids)
    end
  end

  defp get_or_create_conversation_for_participants(user, all_ids) do
    do_create_conversation(user, all_ids)
  end

  defp find_dm_conversation([user1_id, user2_id]) do
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
    if length(participant_ids) == 2 do
      [user1_id, user2_id] = participant_ids
      [lower_id, higher_id] = Enum.sort([user1_id, user2_id])

      {:ok, conversation} = %Conversation{}
        |> Conversation.changeset(%{user_one_id: lower_id, user_two_id: higher_id})
        |> Repo.insert()

      for user_id <- participant_ids do
        %ConversationParticipant{}
        |> ConversationParticipant.changeset(%{conversation_id: conversation.id, user_id: user_id})
        |> Repo.insert()
      end

      Repo.preload(conversation, [participants: :user])
    else
      {:error, :group_conversations_not_supported}
    end
  end
end
