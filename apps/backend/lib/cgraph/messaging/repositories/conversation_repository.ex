defmodule CGraph.Messaging.Repositories.ConversationRepository do
  @moduledoc """
  Repository for Conversation entity data access.
  """

  import Ecto.Query, warn: false, except: [update: 2]

  alias CGraph.Repo
  alias CGraph.Messaging.Conversation
  alias CGraph.Messaging.ConversationParticipant
  alias CGraph.Cache

  @cache_ttl :timer.minutes(5)

  @doc """
  Get a conversation by ID with optional preloads.
  """
  @spec get(String.t(), list()) :: Conversation.t() | nil
  def get(id, preloads \\ []) do
    cache_key = "conversation:#{id}"

    case Cache.get(cache_key) do
      {:ok, nil} ->
        conversation =
          Conversation
          |> Repo.get(id)
          |> maybe_preload(preloads)

        if conversation, do: Cache.put(cache_key, conversation, @cache_ttl)
        conversation

      {:ok, cached} ->
        cached

      {:error, _} ->
        Conversation
        |> Repo.get(id)
        |> maybe_preload(preloads)
    end
  end

  @doc """
  Get a conversation by ID, raising if not found.
  """
  @spec get!(String.t(), list()) :: Conversation.t()
  def get!(id, preloads \\ []) do
    case get(id, preloads) do
      nil -> raise Ecto.NoResultsError, queryable: Conversation
      conversation -> conversation
    end
  end

  @doc """
  Find a direct conversation between two users.
  """
  @spec find_direct(String.t(), String.t()) :: Conversation.t() | nil
  def find_direct(user1_id, user2_id) do
    # Find DM conversation where both users are participants
    from(c in Conversation,
      where: c.type == :direct,
      join: p1 in ConversationParticipant,
      on: p1.conversation_id == c.id and p1.user_id == ^user1_id,
      join: p2 in ConversationParticipant,
      on: p2.conversation_id == c.id and p2.user_id == ^user2_id,
      limit: 1
    )
    |> Repo.one()
  end

  @doc """
  List conversations for a user with pagination.
  """
  @spec list_for_user(String.t(), keyword()) :: {list(Conversation.t()), map()}
  def list_for_user(user_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    offset = Keyword.get(opts, :offset, 0)

    query =
      from c in Conversation,
        join: p in ConversationParticipant,
        on: p.conversation_id == c.id,
        where: p.user_id == ^user_id and is_nil(p.left_at),
        order_by: [desc: c.last_message_at, desc: c.inserted_at],
        preload: [:participants, :last_message],
        limit: ^limit,
        offset: ^offset

    conversations = Repo.all(query)

    total =
      from(p in ConversationParticipant,
        where: p.user_id == ^user_id and is_nil(p.left_at),
        select: count(p.id)
      )
      |> Repo.one()

    {conversations, %{total: total, limit: limit, offset: offset}}
  end

  @doc """
  Create a new conversation.
  """
  @spec create(map()) :: {:ok, Conversation.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %Conversation{}
    |> Conversation.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Update a conversation.
  """
  @spec update(Conversation.t(), map()) :: {:ok, Conversation.t()} | {:error, Ecto.Changeset.t()}
  def update(%Conversation{} = conversation, attrs) do
    result =
      conversation
      |> Conversation.changeset(attrs)
      |> Repo.update()

    # Invalidate cache on update
    case result do
      {:ok, updated} ->
        Cache.delete("conversation:#{updated.id}")
        {:ok, updated}
      error ->
        error
    end
  end

  @doc """
  Delete a conversation.
  """
  @spec delete(Conversation.t()) :: {:ok, Conversation.t()} | {:error, Ecto.Changeset.t()}
  def delete(%Conversation{} = conversation) do
    result = Repo.delete(conversation)

    case result do
      {:ok, deleted} ->
        Cache.delete("conversation:#{deleted.id}")
        {:ok, deleted}
      error ->
        error
    end
  end

  @doc """
  Update last message timestamp for a conversation.
  """
  @spec touch(String.t()) :: {:ok, Conversation.t()} | {:error, term()}
  def touch(conversation_id) do
    case get(conversation_id) do
      nil -> {:error, :not_found}
      conversation -> update(conversation, %{last_message_at: DateTime.utc_now()})
    end
  end

  # Private helpers

  defp maybe_preload(nil, _), do: nil
  defp maybe_preload(record, []), do: record
  defp maybe_preload(record, preloads), do: Repo.preload(record, preloads)
end
