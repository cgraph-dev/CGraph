defmodule CGraph.Subscriptions.Idempotency do
  @moduledoc """
  Idempotent webhook event processing.

  Uses PostgreSQL unique constraint on `stripe_event_id` with `on_conflict: :nothing`
  for lock-free, race-condition-free idempotency. Each Stripe event is processed
  exactly once regardless of how many times the webhook is delivered.

  ## Usage

      Idempotency.process_once(event, fn evt ->
        handle_subscription_event(evt)
      end)
  """

  alias CGraph.Subscriptions.WebhookEvent
  alias CGraph.Repo
  require Logger

  @doc """
  Process a Stripe event exactly once.

  Returns:
  - `{:ok, result}` if the event was processed successfully
  - `{:already_processed, event_id}` if the event was already seen
  - `{:error, reason}` on processing failure (event is marked as failed in DB)
  """
  @spec process_once(map(), (map() -> any())) ::
          {:ok, any()} | {:already_processed, String.t()} | {:error, any()}
  def process_once(%{id: event_id, type: event_type} = event, handler_fn) when is_function(handler_fn, 1) do
    changeset = WebhookEvent.changeset(%WebhookEvent{}, %{
      stripe_event_id: event_id,
      event_type: event_type,
      payload: serialize_event(event),
      processed_at: DateTime.utc_now() |> DateTime.truncate(:second)
    })

    case Repo.insert(changeset, on_conflict: :nothing, conflict_target: :stripe_event_id) do
      {:ok, %{id: nil}} ->
        # on_conflict: :nothing returns struct with nil id on conflict
        Logger.info("webhook_duplicate_skipped", stripe_event_id: event_id, event_type: event_type)
        {:already_processed, event_id}

      {:ok, webhook_event} ->
        # New event — process it
        try do
          result = handler_fn.(event)
          {:ok, result}
        rescue
          e ->
            # Mark the event as failed so we can investigate
            WebhookEvent.changeset(webhook_event, %{
              status: "failed",
              error_message: Exception.message(e)
            })
            |> Repo.update()

            Logger.error("webhook_processing_failed",
              stripe_event_id: event_id,
              event_type: event_type,
              error: Exception.message(e)
            )

            {:error, e}
        end

      {:error, changeset} ->
        Logger.error("webhook_event_insert_failed",
          stripe_event_id: event_id,
          errors: inspect(changeset.errors)
        )
        {:error, changeset}
    end
  end

  # Serialize event to storable map (strip non-serializable fields)
  defp serialize_event(%{id: id, type: type, data: data}) do
    %{
      "id" => id,
      "type" => type,
      "data" => inspect(data, limit: :infinity, printable_limit: :infinity)
    }
  end

  defp serialize_event(event) when is_map(event) do
    event
    |> Map.from_struct()
    |> Map.take([:id, :type])
    |> Enum.into(%{}, fn {k, v} -> {to_string(k), v} end)
  rescue
    _ -> %{"raw" => inspect(event)}
  end
end
