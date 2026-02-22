defmodule CGraph.Webhooks.Deliveries do
  @moduledoc """
  Webhook event dispatching and delivery tracking.

  Handles dispatching events to subscribed endpoints, tracking delivery
  status, retry logic, and delivery statistics.
  """

  require Logger
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Webhooks.{Endpoint, Delivery}
  alias CGraph.Webhooks.Endpoints, as: EndpointOps
  alias CGraph.Workers.WebhookDeliveryWorker

  @valid_events ~w(
    message.created message.updated message.deleted
    user.joined user.left user.updated
    channel.created channel.updated channel.deleted
    reaction.added reaction.removed
    file.uploaded file.deleted
    system.health system.maintenance
  )

  @doc """
  Dispatch an event to all subscribed endpoints asynchronously via Oban.

  Creates a delivery record per matching endpoint and enqueues an Oban job
  for each. Returns `{:ok, event_id}`.
  """
  @spec dispatch(String.t(), map(), keyword()) :: {:ok, String.t()}
  def dispatch(event_type, payload, _opts \\ []) when event_type in @valid_events do
    event_id = generate_event_id()

    endpoints =
      from(e in Endpoint, where: e.active == true)
      |> Repo.all()
      |> Enum.filter(fn ep -> EndpointOps.event_matches?(ep.events, event_type) end)

    Enum.each(endpoints, fn endpoint ->
      delivery_id = generate_delivery_id()

      attrs = %{
        id: delivery_id,
        endpoint_id: endpoint.id,
        event_id: event_id,
        event_type: event_type,
        payload: payload,
        status: "pending",
        attempts: 0,
        max_attempts: 5
      }

      case Repo.insert(Delivery.changeset(%Delivery{}, attrs)) do
        {:ok, _delivery} ->
          %{delivery_id: delivery_id}
          |> WebhookDeliveryWorker.new()
          |> Oban.insert!()

        {:error, reason} ->
          Logger.error("Failed to create webhook delivery",
            endpoint_id: endpoint.id,
            event_type: event_type,
            error: inspect(reason)
          )
      end
    end)

    emit_dispatch_telemetry(%{id: event_id, type: event_type})

    {:ok, event_id}
  end

  @doc """
  Retry a failed or pending delivery by re-enqueuing its Oban job.
  """
  @spec retry_delivery(String.t()) :: :ok | {:error, :not_found}
  def retry_delivery(delivery_id) do
    case Repo.get(Delivery, delivery_id) do
      nil ->
        {:error, :not_found}

      delivery ->
        Repo.update!(Ecto.Changeset.change(delivery, %{
          status: "pending",
          next_retry_at: DateTime.utc_now()
        }))

        %{delivery_id: delivery_id}
        |> WebhookDeliveryWorker.new()
        |> Oban.insert!()

        :ok
    end
  end

  @doc """
  List deliveries for an endpoint with optional `:status` and `:limit` filters.
  """
  @spec list_deliveries(String.t(), keyword()) :: {:ok, list()}
  def list_deliveries(endpoint_id, opts \\ []) do
    limit = opts[:limit] || 100

    query =
      from(d in Delivery,
        where: d.endpoint_id == ^endpoint_id,
        order_by: [desc: d.inserted_at],
        limit: ^limit
      )
      |> maybe_where_status(opts[:status])

    {:ok, Repo.all(query)}
  end

  @doc """
  Get delivery details.
  """
  @spec get_delivery(String.t()) :: {:ok, struct()} | {:error, :not_found}
  def get_delivery(delivery_id) do
    case Repo.get(Delivery, delivery_id) do
      nil -> {:error, :not_found}
      delivery -> {:ok, delivery}
    end
  end

  @doc """
  Get delivery statistics for an endpoint.
  """
  @spec get_stats(String.t()) :: {:ok, map()}
  def get_stats(endpoint_id) do
    total =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id, select: count())
      |> Repo.one()

    success =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id and d.status == "success", select: count())
      |> Repo.one()

    failed =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id and d.status == "failed", select: count())
      |> Repo.one()

    pending =
      from(d in Delivery, where: d.endpoint_id == ^endpoint_id and d.status == "pending", select: count())
      |> Repo.one()

    avg_latency =
      from(d in Delivery,
        where: d.endpoint_id == ^endpoint_id and not is_nil(d.latency_ms),
        select: avg(d.latency_ms)
      )
      |> Repo.one()

    completed = success + failed
    success_rate = if completed > 0, do: Float.round(success / completed * 100, 2), else: 0.0

    {:ok, %{
      total: total,
      success: success,
      failed: failed,
      pending: pending,
      success_rate: success_rate,
      avg_latency_ms: avg_latency
    }}
  end

  # -- Private ----------------------------------------------------------------

  defp maybe_where_status(query, nil), do: query

  defp maybe_where_status(query, status) do
    status_str = to_string(status)
    from(d in query, where: d.status == ^status_str)
  end

  defp generate_delivery_id, do: "whd_" <> random_id()
  defp generate_event_id, do: "evt_" <> random_id()

  defp random_id do
    :crypto.strong_rand_bytes(16)
    |> Base.url_encode64(padding: false)
  end

  defp emit_dispatch_telemetry(event) do
    :telemetry.execute(
      [:cgraph, :webhooks, :dispatch],
      %{count: 1},
      %{event_type: event.type, event_id: event.id}
    )
  end
end
