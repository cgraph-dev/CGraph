defmodule CGraph.ErrorReporter.Adapters.Webhook do
  @moduledoc """
  Webhook adapter for error reporting to custom endpoints.

  Posts structured error events to a configured URL. Currently logs
  the payload at debug level; replace with an HTTP client (e.g. Finch)
  for production use.
  """

  require Logger

  @doc """
  Report an event by posting to the configured webhook URL.
  """
  @spec report(map(), keyword()) :: :ok
  def report(event, opts) do
    url = Keyword.fetch!(opts, :url)

    payload = %{
      type: event.type,
      message: get_message(event),
      severity: event.severity,
      timestamp: DateTime.to_iso8601(event.timestamp),
      environment: event.environment,
      context: event.context
    }

    # Would use HTTPoison or Finch here
    Logger.debug("would_post_to", url: url, payload: inspect(payload))
  end

  defp get_message(%{type: :exception} = event) do
    "#{event.exception.type}: #{event.exception.message}"
  end

  defp get_message(event), do: event.message
end
