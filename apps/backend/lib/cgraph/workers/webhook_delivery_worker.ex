defmodule CGraph.Workers.WebhookDeliveryWorker do
  @moduledoc """
  Oban worker that delivers webhook payloads to registered endpoints.

  Handles HTTP POST with HMAC-SHA256 signed payloads, tracking delivery
  status and response in the database. Retries are scheduled as new Oban
  jobs with exponential backoff delays.

  ## Usage

      %{delivery_id: "whd_abc123"}
      |> WebhookDeliveryWorker.new()
      |> Oban.insert()
  """

  use Oban.Worker,
    queue: :webhooks,
    max_attempts: 1,
    priority: 1

  require Logger

  alias CGraph.Repo
  alias CGraph.Webhooks.{Delivery, Endpoint}

  @default_timeout 30_000
  @max_retries 5
  @retry_delays [1_000, 5_000, 30_000, 120_000, 600_000]

  @doc "Executes the job."
  @spec perform(Oban.Job.t()) :: :ok | {:error, term()}
  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"delivery_id" => delivery_id}}) do
    with {:ok, delivery} <- fetch_delivery(delivery_id),
         {:ok, endpoint} <- fetch_endpoint(delivery.endpoint_id) do
      execute_delivery(endpoint, delivery)
    else
      {:error, :delivery_not_found} ->
        Logger.warning("webhook_delivery_not_found_discarding", delivery_id: delivery_id)
        :ok

      {:error, :endpoint_not_found} ->
        mark_failed(delivery_id, "Endpoint deleted")
        :ok

      {:error, :endpoint_disabled} ->
        mark_failed(delivery_id, "Endpoint disabled")
        :ok
    end
  end

  # ---------------------------------------------------------------------------
  # Internal
  # ---------------------------------------------------------------------------

  defp fetch_delivery(id) do
    case Repo.get(Delivery, id) do
      nil -> {:error, :delivery_not_found}
      delivery -> {:ok, delivery}
    end
  end

  defp fetch_endpoint(endpoint_id) do
    case Repo.get(Endpoint, endpoint_id) do
      nil -> {:error, :endpoint_not_found}
      %Endpoint{active: false} -> {:error, :endpoint_disabled}
      endpoint -> {:ok, endpoint}
    end
  end

  defp execute_delivery(endpoint, delivery) do
    start_time = System.monotonic_time(:millisecond)

    emit_telemetry(:start, endpoint, delivery)

    payload_json =
      Jason.encode!(%{
        id: delivery.event_id,
        type: delivery.event_type,
        data: delivery.payload,
        created_at: delivery.inserted_at
      })

    timestamp = System.system_time(:second)
    signature = compute_signature(timestamp, payload_json, endpoint.secret)

    headers = [
      {"Content-Type", "application/json"},
      {"X-Webhook-Signature", "t=#{timestamp},v1=#{signature}"},
      {"X-Webhook-ID", delivery.id},
      {"X-Webhook-Timestamp", to_string(timestamp)},
      {"User-Agent", "Cgraph-Webhooks/1.0"}
    ]

    result =
      try do
        Finch.build(:post, endpoint.url, headers, payload_json)
        |> Finch.request(CGraph.Finch, receive_timeout: @default_timeout)
      rescue
        e -> {:error, Exception.message(e)}
      end

    latency = System.monotonic_time(:millisecond) - start_time
    attempts = delivery.attempts + 1

    case result do
      {:ok, %Finch.Response{status: status}} when status in 200..299 ->
        emit_telemetry(:success, endpoint, delivery, %{status: status, latency: latency})

        Repo.update!(
          Ecto.Changeset.change(delivery, %{
            status: "success",
            attempts: attempts,
            last_attempt_at: DateTime.utc_now(),
            response_code: status,
            latency_ms: latency
          })
        )

        # Reset endpoint failure count on success
        if endpoint.failure_count > 0 do
          Repo.update!(Ecto.Changeset.change(endpoint, %{failure_count: 0}))
        end

        :ok

      {:ok, %Finch.Response{status: status, body: body}} ->
        emit_telemetry(:failure, endpoint, delivery, %{status: status, latency: latency})
        handle_failure(endpoint, delivery, attempts, %{error: "HTTP #{status}", status: status, body: body, latency: latency})

      {:error, reason} ->
        error_msg = if is_binary(reason), do: reason, else: inspect(reason)
        emit_telemetry(:failure, endpoint, delivery, %{status: nil, latency: latency})
        handle_failure(endpoint, delivery, attempts, %{error: error_msg, status: nil, body: nil, latency: latency})
    end
  end

  defp handle_failure(endpoint, delivery, attempts, %{error: error, status: status, body: body, latency: latency}) do
    changes = %{
      attempts: attempts,
      last_attempt_at: DateTime.utc_now(),
      error: error,
      response_code: status,
      response_body: if(body, do: String.slice(body, 0, 1000)),
      latency_ms: latency
    }

    if attempts >= @max_retries do
      Repo.update!(
        Ecto.Changeset.change(delivery, Map.merge(changes, %{
          status: "failed",
          error: "Max retries exceeded: #{error}"
        }))
      )

      # Increment endpoint failure count
      Repo.update!(
        Ecto.Changeset.change(endpoint, %{
          failure_count: endpoint.failure_count + 1
        })
      )

      :ok
    else
      delay = Enum.at(@retry_delays, attempts - 1, List.last(@retry_delays))
      next_retry = DateTime.add(DateTime.utc_now(), delay, :millisecond)

      Repo.update!(
        Ecto.Changeset.change(delivery, Map.merge(changes, %{
          status: "pending",
          next_retry_at: next_retry
        }))
      )

      # Schedule retry as a new Oban job
      %{delivery_id: delivery.id}
      |> __MODULE__.new(scheduled_at: next_retry)
      |> Oban.insert!()

      :ok
    end
  end

  defp compute_signature(timestamp, payload, secret) do
    signed_payload = "#{timestamp}.#{payload}"

    :crypto.mac(:hmac, :sha256, secret, signed_payload)
    |> Base.encode16(case: :lower)
  end

  defp emit_telemetry(phase, endpoint, delivery, meta \\ %{}) do
    :telemetry.execute(
      [:cgraph, :webhooks, :delivery, phase],
      Map.merge(%{count: 1}, meta),
      %{
        endpoint_id: endpoint.id,
        endpoint_url: endpoint.url,
        delivery_id: delivery.id,
        event_type: delivery.event_type
      }
    )
  end

  defp mark_failed(delivery_id, error) do
    case Repo.get(Delivery, delivery_id) do
      nil ->
        :ok

      delivery ->
        Repo.update!(
          Ecto.Changeset.change(delivery, %{
            status: "failed",
            error: error,
            last_attempt_at: DateTime.utc_now()
          })
        )
    end
  end
end
