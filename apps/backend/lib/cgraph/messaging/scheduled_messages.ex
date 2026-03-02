defmodule CGraph.Messaging.ScheduledMessages do
  @moduledoc """
  Context module for scheduled message CRUD operations.

  Provides user-scoped queries for creating, listing, updating, and
  cancelling scheduled messages. Works with the existing Message schema
  which has `scheduled_at` and `schedule_status` fields.

  The `ScheduledMessageWorker` (Oban) picks up messages where
  `schedule_status == "scheduled"` and `scheduled_at <= now()`.
  """

  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Messaging.Message

  @doc """
  List all scheduled messages for a user, ordered by scheduled_at ascending.

  Options:
    - `:conversation_id` — filter to a specific conversation
  """
  @spec list_scheduled(binary(), keyword()) :: [Message.t()]
  def list_scheduled(user_id, opts \\ []) do
    conversation_id = Keyword.get(opts, :conversation_id)

    Message
    |> where([m], m.sender_id == ^user_id and m.schedule_status == "scheduled")
    |> where([m], is_nil(m.deleted_at))
    |> then(fn q ->
      if conversation_id,
        do: where(q, [m], m.conversation_id == ^conversation_id),
        else: q
    end)
    |> order_by([m], asc: m.scheduled_at)
    |> Repo.all()
  end

  @doc """
  Create a scheduled message with a future `scheduled_at` timestamp.

  Sets `schedule_status` to "scheduled" so the ScheduledMessageWorker
  will pick it up when the time arrives.
  """
  @spec create_scheduled(binary(), map()) :: {:ok, Message.t()} | {:error, term()}
  def create_scheduled(user_id, attrs) do
    attrs =
      attrs
      |> Map.put("sender_id", user_id)
      |> Map.put("schedule_status", "scheduled")

    with {:ok, _attrs} <- validate_scheduled_at(attrs) do
      %Message{}
      |> Message.changeset(attrs)
      |> Repo.insert()
    end
  end

  @doc """
  Update a scheduled message (content, scheduled_at, etc.).

  Only messages still in "scheduled" status can be updated.
  """
  @spec update_scheduled(binary(), binary(), map()) :: {:ok, Message.t()} | {:error, term()}
  def update_scheduled(user_id, message_id, attrs) do
    with {:ok, message} <- get_user_scheduled(user_id, message_id),
         {:ok, _attrs} <- validate_scheduled_at_if_present(attrs) do
      message
      |> Message.changeset(attrs)
      |> Repo.update()
    end
  end

  @doc """
  Cancel a scheduled message by setting its status to "cancelled".
  """
  @spec cancel_scheduled(binary(), binary()) :: {:ok, Message.t()} | {:error, term()}
  def cancel_scheduled(user_id, message_id) do
    with {:ok, message} <- get_user_scheduled(user_id, message_id) do
      message
      |> Ecto.Changeset.change(schedule_status: "cancelled")
      |> Repo.update()
    end
  end

  @doc """
  Get a single scheduled message owned by the user.
  """
  @spec get_user_scheduled(binary(), binary()) :: {:ok, Message.t()} | {:error, :not_found}
  def get_user_scheduled(user_id, message_id) do
    Message
    |> where([m], m.id == ^message_id and m.sender_id == ^user_id and m.schedule_status == "scheduled")
    |> where([m], is_nil(m.deleted_at))
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      message -> {:ok, message}
    end
  end

  # Validate that scheduled_at is in the future
  defp validate_scheduled_at(%{"scheduled_at" => at} = attrs) when not is_nil(at) do
    scheduled_at =
      case at do
        %DateTime{} -> at
        str when is_binary(str) ->
          case DateTime.from_iso8601(str) do
            {:ok, dt, _} -> dt
            _ -> nil
          end
        _ -> nil
      end

    if scheduled_at && DateTime.compare(scheduled_at, DateTime.utc_now()) == :gt do
      {:ok, attrs}
    else
      {:error, :scheduled_at_must_be_future}
    end
  end

  defp validate_scheduled_at(_attrs), do: {:error, :scheduled_at_required}

  # Only validate scheduled_at if it's provided in the update attrs
  defp validate_scheduled_at_if_present(%{"scheduled_at" => at} = attrs) when not is_nil(at) do
    validate_scheduled_at(attrs)
  end

  defp validate_scheduled_at_if_present(attrs), do: {:ok, attrs}
end
