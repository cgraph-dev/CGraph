defmodule CGraph.Messaging.ScheduledMessage do
  @moduledoc """
  Schema and context for scheduled messages.

  Users can schedule messages for future delivery in any conversation.
  An Oban worker fires at `scheduled_at` to deliver the message.
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Messaging.ConversationParticipant

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "scheduled_messages" do
    field :content, :string
    field :content_type, :string, default: "text"
    field :is_encrypted, :boolean, default: false
    field :scheduled_at, :utc_datetime
    field :status, :string, default: "pending"
    field :sent_at, :utc_datetime
    field :cancelled_at, :utc_datetime

    belongs_to :sender, CGraph.Accounts.User
    belongs_to :conversation, CGraph.Messaging.Conversation

    timestamps()
  end

  @statuses ~w(pending sent cancelled failed)

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(msg, attrs) do
    msg
    |> cast(attrs, [:content, :content_type, :is_encrypted, :scheduled_at,
                    :status, :sent_at, :cancelled_at, :sender_id, :conversation_id])
    |> validate_required([:content, :scheduled_at, :sender_id, :conversation_id])
    |> validate_inclusion(:status, @statuses)
    |> validate_length(:content, max: 10_000)
    |> validate_future_schedule()
    |> foreign_key_constraint(:sender_id)
    |> foreign_key_constraint(:conversation_id)
  end

  defp validate_future_schedule(changeset) do
    validate_change(changeset, :scheduled_at, fn :scheduled_at, scheduled_at ->
      min_time = DateTime.utc_now() |> DateTime.add(30, :second)
      max_time = DateTime.utc_now() |> DateTime.add(7 * 24 * 3600, :second)

      cond do
        DateTime.compare(scheduled_at, min_time) == :lt ->
          [scheduled_at: "must be at least 1 minute in the future"]
        DateTime.compare(scheduled_at, max_time) == :gt ->
          [scheduled_at: "must be within 7 days"]
        true ->
          []
      end
    end)
  end

  # ── Public API ──────────────────────────────────────────

  @doc "Schedule a message for future delivery."
  @spec schedule_message(String.t(), String.t(), String.t(), DateTime.t(), keyword()) ::
          {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t() | atom()}
  def schedule_message(sender_id, conversation_id, content, scheduled_at, opts \\ []) do
    unless member?(sender_id, conversation_id) do
      {:error, :not_member}
    else
      attrs = %{
        sender_id: sender_id,
        conversation_id: conversation_id,
        content: content,
        scheduled_at: scheduled_at,
        content_type: Keyword.get(opts, :content_type, "text"),
        is_encrypted: Keyword.get(opts, :is_encrypted, false)
      }

      changeset = changeset(%__MODULE__{}, attrs)

      case Repo.insert(changeset) do
        {:ok, scheduled} ->
          # Enqueue Oban job
          %{scheduled_message_id: scheduled.id}
          |> CGraph.Workers.SendScheduledMessage.new(scheduled_at: scheduled.scheduled_at)
          |> Oban.insert()

          {:ok, scheduled}

        error ->
          error
      end
    end
  end

  @doc "Cancel a scheduled message. Only the sender can cancel."
  @spec cancel(String.t(), String.t()) :: {:ok, %__MODULE__{}} | {:error, atom()}
  def cancel(message_id, user_id) do
    case Repo.get(__MODULE__, message_id) do
      nil ->
        {:error, :not_found}

      %{sender_id: ^user_id, status: "pending"} = msg ->
        msg
        |> changeset(%{status: "cancelled", cancelled_at: DateTime.truncate(DateTime.utc_now(), :second)})
        |> Repo.update()

      %{sender_id: ^user_id} ->
        {:error, :already_processed}

      _ ->
        {:error, :unauthorized}
    end
  end

  @doc "List pending scheduled messages for a user in a conversation."
  @spec list_pending(String.t(), String.t()) :: [%__MODULE__{}]
  def list_pending(user_id, conversation_id) do
    from(sm in __MODULE__,
      where: sm.sender_id == ^user_id,
      where: sm.conversation_id == ^conversation_id,
      where: sm.status == "pending",
      order_by: [asc: sm.scheduled_at]
    )
    |> Repo.all()
  end

  defp member?(user_id, conversation_id) do
    from(cp in ConversationParticipant,
      where: cp.user_id == ^user_id,
      where: cp.conversation_id == ^conversation_id,
      where: is_nil(cp.left_at)
    )
    |> Repo.exists?()
  end
end
