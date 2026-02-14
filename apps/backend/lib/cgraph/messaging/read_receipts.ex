defmodule CGraph.Messaging.ReadReceipts do
  @moduledoc """
  Sub-context for Read Receipt operations.

  Handles marking messages as read and tracking read status.
  Extracted from the main Messaging context for better maintainability.

  @since v0.7.29
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{Conversation, ConversationParticipant, Message, ReadReceipt}
  alias CGraph.Repo

  @doc """
  Mark messages as read for a user in a conversation.

  Updates the participant's last_read_at and creates individual read receipts
  for delivery tracking.
  """
  @spec mark_as_read(map(), Conversation.t(), String.t() | nil) :: {:ok, map()} | {:error, term()}
  def mark_as_read(user, conversation, last_read_message_id \\ nil) do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    # Update participant's last_read_at
    participant_query = from cp in ConversationParticipant,
      where: cp.conversation_id == ^conversation.id,
      where: cp.user_id == ^user.id

    Repo.update_all(participant_query, set: [last_read_at: now])

    # Create read receipts for unread messages if specified
    if last_read_message_id do
      create_read_receipts(user, conversation, last_read_message_id)
    end

    {:ok, %{read_at: now}}
  end

  @doc """
  Get the unread message count for a user in a conversation.
  """
  @spec get_unread_count(map(), Conversation.t()) :: integer()
  def get_unread_count(user, conversation) do
    last_read_at = get_last_read_at(user, conversation)

    query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      where: m.sender_id != ^user.id

    query = if last_read_at do
      from m in query, where: m.inserted_at > ^last_read_at
    else
      query
    end

    Repo.aggregate(query, :count, :id)
  end

  @doc """
  Get the last read timestamp for a user in a conversation.
  """
  @spec get_last_read_at(map(), Conversation.t()) :: DateTime.t() | nil
  def get_last_read_at(user, conversation) do
    from(cp in ConversationParticipant,
      where: cp.conversation_id == ^conversation.id,
      where: cp.user_id == ^user.id,
      select: cp.last_read_at
    )
    |> Repo.one()
  end

  @doc """
  Get read receipts for a specific message.
  """
  @spec get_read_receipts(Message.t()) :: list(ReadReceipt.t())
  def get_read_receipts(message) do
    from(rr in ReadReceipt,
      where: rr.message_id == ^message.id,
      preload: [:user]
    )
    |> Repo.all()
  end

  @doc """
  Check if a user has read a specific message.
  """
  @spec has_read?(map(), Message.t()) :: boolean()
  def has_read?(user, message) do
    from(rr in ReadReceipt,
      where: rr.message_id == ^message.id,
      where: rr.user_id == ^user.id
    )
    |> Repo.exists?()
  end

  @doc """
  Get delivery/read status for a message.
  Returns `:sent`, `:delivered`, or `:read` based on receipts.
  """
  @spec get_message_status(Message.t(), String.t()) :: :sent | :delivered | :read
  def get_message_status(message, recipient_id) do
    receipt = from(rr in ReadReceipt,
      where: rr.message_id == ^message.id,
      where: rr.user_id == ^recipient_id
    )
    |> Repo.one()

    cond do
      receipt && receipt.read_at -> :read
      receipt && receipt.delivered_at -> :delivered
      true -> :sent
    end
  end

  @doc """
  Mark a message as delivered to a user.
  """
  @spec mark_as_delivered(map(), Message.t()) :: {:ok, ReadReceipt.t()} | {:error, term()}
  def mark_as_delivered(user, message) do
    now = DateTime.truncate(DateTime.utc_now(), :second)

    case get_receipt(user, message) do
      nil ->
        %ReadReceipt{}
        |> ReadReceipt.changeset(%{
          user_id: user.id,
          message_id: message.id,
          delivered_at: now
        })
        |> Repo.insert()

      receipt ->
        if is_nil(receipt.delivered_at) do
          receipt
          |> ReadReceipt.changeset(%{delivered_at: now})
          |> Repo.update()
        else
          {:ok, receipt}
        end
    end
  end

  # Private helpers

  defp get_receipt(user, message) do
    from(rr in ReadReceipt,
      where: rr.message_id == ^message.id,
      where: rr.user_id == ^user.id
    )
    |> Repo.one()
  end

  defp create_read_receipts(user, conversation, up_to_message_id) do
    read_now = DateTime.truncate(DateTime.utc_now(), :second)
    ts_now = DateTime.utc_now()

    # Get message timestamp
    case Repo.get(Message, up_to_message_id) do
      nil -> :ok
      target_message ->
        # Find all unread messages from other users up to this point
        messages = from(m in Message,
          where: m.conversation_id == ^conversation.id,
          where: m.sender_id != ^user.id,
          where: m.inserted_at <= ^target_message.inserted_at,
          left_join: rr in ReadReceipt, on: rr.message_id == m.id and rr.user_id == ^user.id,
          where: is_nil(rr.id),
          select: m.id
        )
        |> Repo.all()

        # Bulk insert read receipts
        receipts = Enum.map(messages, fn msg_id ->
          %{
            user_id: user.id,
            message_id: msg_id,
            read_at: read_now,
            delivered_at: read_now,
            inserted_at: ts_now,
            updated_at: ts_now
          }
        end)

        Repo.insert_all(ReadReceipt, receipts, on_conflict: :nothing)
    end
  end
end
