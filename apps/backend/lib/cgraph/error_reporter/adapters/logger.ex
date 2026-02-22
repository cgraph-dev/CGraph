defmodule CGraph.ErrorReporter.Adapters.Logger do
  @moduledoc """
  Logger adapter for error reporting.

  Writes error events and messages to the Elixir `Logger` with
  structured metadata.
  """

  require Logger

  @doc """
  Report an event via the Elixir Logger.
  """
  @spec report(map(), keyword()) :: :ok
  def report(event, opts) do
    level = Keyword.get(opts, :level, :error)

    case event.type do
      :exception ->
        Logger.log(level, fn ->
          """
          [ErrorReporter] #{event.exception.type}: #{event.exception.message}
          Fingerprint: #{event.fingerprint}
          """
        end,
          error_type: event.exception.type,
          fingerprint: event.fingerprint,
          context: event.context
        )

      :message ->
        Logger.log(level, "error_reporter_message",
          message: event.message,
          severity: event.severity,
          context: event.context
        )
    end
  end
end
