defmodule CGraph.Messaging.DeliveryTracking do
  @moduledoc """
  Delivery tracking sub-context.

  Manages the full message delivery lifecycle:
  1. Message sent → server creates DeliveryReceipt with status=:sent
  2. Client ACKs receipt → status updated to :delivered
  3. User reads conversation → ReadReceipt created (existing system)

  ## Integration Points

  - `ConversationChannel`: Client sends "msg_ack" event when message is displayed
  - `PushService`: Failed push creates receipt with status=:failed
  - `ReadReceipts`: Existing module handles the read (blue check) state
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.{DeliveryReceipt, Message}
  alias CGraph.Repo

  require Logger

  @doc """
  Create delivery receipts for all participants when a message is sent.
  Called by the messaging pipeline after message insertion.
  """
  @spec track_sent(Message.t(), [String.t()]) :: {:ok, non_neg_integer()} | {:error, term()}
  def track_sent(%Message{} = message, recipient_ids) when is_list(recipient_ids) do
    now = DateTime.utc_now()

    entries = Enum.map(recipient_ids, fn recipient_id ->
      %{
        id: Ecto.UUID.generate(),
        message_id: message.id,
        recipient_id: recipient_id,
        status: :sent,
        inserted_at: now
      }
    end)

    case Repo.insert_all(DeliveryReceipt, entries, on_conflict: :nothing) do
      {count, _} ->
        :telemetry.execute(
          [:cgraph, :delivery, :tracked],
          %{count: count},
          %{message_id: message.id}
        )
        {:ok, count}
    end
  rescue
    e ->
      Logger.error("delivery_tracking_failed",
        message_id: message.id,
        error: inspect(e)
      )
      {:error, :tracking_failed}
  end

  @doc """
  Mark a message as delivered to a specific recipient's device.
  Called when client sends a "msg_ack" WebSocket event.
  """
  @spec mark_delivered(String.t(), String.t(), map()) :: {:ok, DeliveryReceipt.t()} | {:error, term()}
  def mark_delivered(message_id, recipient_id, opts \\ %{}) do
    device_id = Map.get(opts, :device_id)
    platform = Map.get(opts, :platform)

    query = from dr in DeliveryReceipt,
      where: dr.message_id == ^message_id,
      where: dr.recipient_id == ^recipient_id,
      where: dr.status == :sent

    case Repo.update_all(query,
      set: [
        status: :delivered,
        delivered_at: DateTime.utc_now(),
        device_id: device_id,
        platform: platform
      ]
    ) do
      {0, _} -> {:error, :not_found}
      {count, _} ->
        :telemetry.execute(
          [:cgraph, :delivery, :confirmed],
          %{count: count},
          %{message_id: message_id, recipient_id: recipient_id}
        )
        {:ok, count}
    end
  end

  @doc """
  Mark a delivery as failed (push notification failed, circuit breaker tripped, etc.).
  """
  @spec mark_failed(String.t(), String.t(), String.t()) :: {:ok, non_neg_integer()} | {:error, term()}
  def mark_failed(message_id, recipient_id, reason) do
    query = from dr in DeliveryReceipt,
      where: dr.message_id == ^message_id,
      where: dr.recipient_id == ^recipient_id,
      where: dr.status == :sent

    case Repo.update_all(query,
      set: [
        status: :failed,
        failure_reason: reason
      ]
    ) do
      {count, _} -> {:ok, count}
    end
  end

  @doc """
  Get delivery status for a message. Returns a map of recipient_id => status.

  Used by the sender's client to display check marks.
  """
  @spec get_delivery_status(String.t()) :: map()
  def get_delivery_status(message_id) do
    from(dr in DeliveryReceipt,
      where: dr.message_id == ^message_id,
      select: {dr.recipient_id, %{
        status: dr.status,
        delivered_at: dr.delivered_at,
        platform: dr.platform
      }}
    )
    |> Repo.all()
    |> Map.new()
  end

  @doc """
  Get undelivered messages for a recipient (messages that haven't been ACKed).
  Used for retry/sync when client reconnects.
  """
  @spec get_pending_deliveries(String.t(), keyword()) :: [DeliveryReceipt.t()]
  def get_pending_deliveries(recipient_id, opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)

    from(dr in DeliveryReceipt,
      where: dr.recipient_id == ^recipient_id,
      where: dr.status == :sent,
      order_by: [asc: dr.inserted_at],
      limit: ^limit,
      preload: [:message]
    )
    |> Repo.all()
  end

  @doc """
  Count undelivered messages for a recipient. Used for badge counts.
  """
  @spec pending_count(String.t()) :: non_neg_integer()
  def pending_count(recipient_id) do
    from(dr in DeliveryReceipt,
      where: dr.recipient_id == ^recipient_id,
      where: dr.status == :sent
    )
    |> Repo.aggregate(:count, :id)
  end
end
