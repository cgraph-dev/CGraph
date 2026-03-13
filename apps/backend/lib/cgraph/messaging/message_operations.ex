defmodule CGraph.Messaging.MessageOperations do
  @moduledoc """
  Message operations: create (single-arity), get, update, pin/unpin,
  schedule/reschedule/cancel, edit, delete variants, hide, and soft-delete.

  Extracted from `CGraph.Messaging` to keep the facade under 500 lines.
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{Message, MessageEdit, ReadReceipt}
  alias CGraph.Repo
  alias Ecto.Multi
  import CGraph.Query.SoftDelete

  @max_pins_per_user 3

  @doc "Create a message from a map (for channel messages)."
  @spec create_message(map()) :: {:ok, Message.t()} | {:error, Ecto.Changeset.t()}
  def create_message(attrs) when is_map(attrs) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, message} -> {:ok, Repo.preload(message, [[sender: :customization], :reactions])}
      error -> error
    end
  end

  @doc "Get a message by ID."
  @spec get_message(String.t()) :: {:ok, Message.t()} | {:error, :not_found}
  def get_message(message_id) when is_binary(message_id) do
    case Repo.get(Message, message_id) do
      nil -> {:error, :not_found}
      message -> {:ok, Repo.preload(message, [[sender: :customization], :reactions])}
    end
  end

  @doc "Update a message."
  @spec update_message(Message.t(), map()) :: {:ok, Message.t()} | {:error, Ecto.Changeset.t()}
  def update_message(message, attrs) do
    message
    |> Message.edit_changeset(stringify_keys(attrs))
    |> Repo.update()
  end

  @doc "Pin a message. Each user can pin up to #{@max_pins_per_user} per conversation."
  @spec pin_message(String.t(), String.t()) :: {:ok, Message.t()} | {:error, atom()}
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
            |> Ecto.Changeset.change(is_pinned: true, pinned_at: DateTime.truncate(DateTime.utc_now(), :second), pinned_by_id: user_id)
            |> Repo.update()
        end
    end
  end

  @doc "Count how many messages a user has pinned in a conversation."
  @spec count_user_pins(String.t(), String.t()) :: non_neg_integer()
  def count_user_pins(conversation_id, user_id) do
    from(m in Message,
      where: m.conversation_id == ^conversation_id,
      where: m.pinned_by_id == ^user_id,
      where: m.is_pinned == true,
      select: count(m.id)
    )
    |> Repo.one() || 0
  end

  @doc "Unpin a message."
  @spec unpin_message(String.t(), String.t()) :: {:ok, Message.t()} | {:error, atom()}
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

  @doc "List scheduled messages for a conversation."
  @spec list_scheduled_messages(map(), keyword()) :: {[Message.t()], map()}
  def list_scheduled_messages(conversation, opts \\ []) do
    query =
      from m in Message,
        where: m.conversation_id == ^conversation.id,
        where: m.schedule_status == "scheduled",
        where: not is_nil(m.scheduled_at),
        where: not_deleted(m),
        preload: [[sender: :customization]]

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :scheduled_at,
      sort_direction: :asc
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Reschedule a scheduled message."
  @spec reschedule_message(Message.t(), DateTime.t()) :: {:ok, Message.t()} | {:error, :message_not_scheduled}
  def reschedule_message(message, new_scheduled_at) do
    if message.schedule_status == "scheduled" do
      message
      |> Ecto.Changeset.change(scheduled_at: new_scheduled_at)
      |> Repo.update()
    else
      {:error, :message_not_scheduled}
    end
  end

  @doc "Cancel a scheduled message."
  @spec cancel_scheduled_message(Message.t()) :: {:ok, Message.t()} | {:error, :message_not_scheduled}
  def cancel_scheduled_message(message) do
    if message.schedule_status == "scheduled" do
      message
      |> Ecto.Changeset.change(schedule_status: "cancelled")
      |> Repo.update()
    else
      {:error, :message_not_scheduled}
    end
  end

  @doc "Edit a message by ID (only by sender)."
  @spec edit_message(String.t(), String.t(), String.t()) :: {:ok, Message.t()} | {:error, atom()}
  def edit_message(message_id, user_id, content) do
    case get_message(message_id) do
      {:error, :not_found} ->
        {:error, :not_found}

      {:ok, message} ->
        if message.sender_id == user_id do
          previous_content = message.content

          Multi.new()
          |> Multi.run(:count_edits, fn _repo, _changes ->
            count =
              from(me in MessageEdit,
                where: me.message_id == ^message.id,
                select: count(me.id)
              )
              |> Repo.one()

            {:ok, count || 0}
          end)
          |> Multi.run(:save_history, fn _repo, %{count_edits: count} ->
            %MessageEdit{}
            |> MessageEdit.changeset(%{
              previous_content: previous_content,
              edit_number: count + 1,
              edited_by_id: user_id,
              message_id: message.id
            })
            |> Repo.insert()
          end)
          |> Multi.run(:update_message, fn _repo, _changes ->
            update_message(message, %{content: content})
          end)
          |> Repo.transaction()
          |> case do
            {:ok, %{update_message: updated_message}} ->
              {:ok, Repo.preload(updated_message, [:edits], force: true)}

            {:error, _step, changeset, _changes} ->
              {:error, changeset}
          end
        else
          {:error, :unauthorized}
        end
    end
  end

  @doc "Delete a message (soft delete, no authorization check)."
  @spec delete_message(Message.t()) :: {:ok, Message.t()} | {:error, Ecto.Changeset.t()}
  def delete_message(message) when is_struct(message) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    message
    |> Ecto.Changeset.change(deleted_at: now)
    |> Repo.update()
  end

  @doc "Hide a message for moderation (quarantine)."
  @spec hide_message(String.t(), String.t()) :: {:ok, Message.t()} | {:error, :not_found}
  def hide_message(message_id, reason) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
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

  @doc "Soft delete with audit trail for moderation."
  @spec soft_delete_message(String.t(), keyword()) :: {:ok, Message.t()} | {:error, :not_found}
  def soft_delete_message(message_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, :user_deleted)
    report_id = Keyword.get(opts, :report_id)
    now = DateTime.truncate(DateTime.utc_now(), :second)

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

  @doc "Delete message with authorization check (binary IDs)."
  @spec delete_message(String.t(), String.t()) :: {:ok, Message.t()} | {:error, atom()}
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

  @doc "Delete message with authorization check (structs)."
  @spec delete_message_by_user(map(), map()) :: {:ok, Message.t()} | {:error, :unauthorized}
  def delete_message_by_user(%{sender_id: sender_id} = message, %{id: user_id}) do
    if sender_id == user_id do
      delete_message(message)
    else
      {:error, :unauthorized}
    end
  end

  @doc "Mark a message as read (message_id + user_id)."
  @spec mark_message_read(String.t(), String.t()) :: {:ok, ReadReceipt.t()} | {:error, :not_found}
  def mark_message_read(message_id, user_id) when is_binary(message_id) and is_binary(user_id) do
    case Repo.get(Message, message_id) do
      nil -> {:error, :not_found}
      _message ->
        case Repo.get_by(ReadReceipt, user_id: user_id, message_id: message_id) do
          nil ->
            now = DateTime.truncate(DateTime.utc_now(), :second)
            %ReadReceipt{}
            |> ReadReceipt.changeset(%{user_id: user_id, message_id: message_id})
            |> Ecto.Changeset.put_change(:read_at, now)
            |> Repo.insert()

          receipt ->
            {:ok, receipt}
        end
    end
  end

  def mark_message_read(%Message{} = message, user) do
    mark_message_read(message.id, user.id)
  end

  @doc "Mark messages as read up to a given message (batch)."
  @spec mark_messages_read(map(), map(), String.t()) :: {:ok, non_neg_integer()}
  def mark_messages_read(user, conversation, message_id) do
    unread_query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      where: m.sender_id != ^user.id,
      where: m.id <= ^message_id,
      left_join: r in ReadReceipt, on: r.message_id == m.id and r.user_id == ^user.id,
      where: is_nil(r.id),
      select: m.id

    unread_message_ids = Repo.all(unread_query)

    unless Enum.empty?(unread_message_ids) do
      now = DateTime.utc_now()
      read_at = DateTime.truncate(now, :second)

      read_receipts = Enum.map(unread_message_ids, fn mid ->
        %{
          id: Ecto.UUID.generate(),
          message_id: mid,
          user_id: user.id,
          read_at: read_at,
          inserted_at: now
        }
      end)

      Repo.insert_all(ReadReceipt, read_receipts, on_conflict: :nothing)
    end

    {:ok, length(unread_message_ids)}
  end

  @doc "Get unread message count for a conversation."
  @spec get_unread_count(map(), map()) :: non_neg_integer()
  def get_unread_count(user, conversation) do
    query = from m in Message,
      where: m.conversation_id == ^conversation.id,
      where: m.sender_id != ^user.id,
      left_join: r in ReadReceipt, on: r.message_id == m.id and r.user_id == ^user.id,
      where: is_nil(r.id),
      select: count(m.id)

    Repo.one(query) || 0
  end

  @doc "Mark all messages in a conversation as read."
  @spec mark_conversation_read(map(), map()) :: {:ok, non_neg_integer()} | {:ok, :no_messages}
  def mark_conversation_read(conversation, user) do
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

  # Private helpers

  defp user_in_conversation?(conversation_id, user_id) do
    alias CGraph.Messaging.ConversationParticipant

    query = from cp in ConversationParticipant,
      where: cp.conversation_id == ^conversation_id,
      where: cp.user_id == ^user_id,
      where: is_nil(cp.left_at)

    Repo.exists?(query)
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
