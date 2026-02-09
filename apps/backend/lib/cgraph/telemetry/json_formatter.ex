defmodule CGraph.Telemetry.JsonFormatter do
  @moduledoc """
  JSON log formatter for production log aggregation.

  Outputs structured JSON logs compatible with:
  - Grafana Loki
  - Datadog Logs
  - CloudWatch Logs
  - Fly.io log shipping
  - Any JSON-based log aggregator

  ## Output Format

  ```json
  {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "level": "info",
    "message": "message_sent",
    "trace_id": "abc123...",
    "span_id": "def456...",
    "request_id": "F1234...",
    "user_id": "user_abc",
    "service": "cgraph",
    "node": "cgraph@fly-abc123"
  }
  ```

  ## Configuration

  In `config/prod.exs`:

      config :logger, :console,
        format: {CGraph.Telemetry.JsonFormatter, :format},
        metadata: [:request_id, :user_id, :trace_id, :span_id]
  """

  @service_name "cgraph"

  @doc """
  Format a log entry as a JSON string.

  Called by Logger as the format function.
  """
  def format(level, message, timestamp, metadata) do
    json =
      %{
        timestamp: format_timestamp(timestamp),
        level: Atom.to_string(level),
        message: IO.iodata_to_binary(message),
        service: @service_name,
        node: node_name()
      }
      |> add_metadata(metadata)
      |> Jason.encode!()

    [json, "\n"]
  rescue
    _error ->
      # Fallback to plain text if JSON encoding fails
      ts = format_timestamp(timestamp)
      ["#{ts} [#{level}] #{IO.iodata_to_binary(message)}\n"]
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp format_timestamp({date, {h, m, s, ms}}) do
    {year, month, day} = date

    :io_lib.format(
      "~4..0B-~2..0B-~2..0BT~2..0B:~2..0B:~2..0B.~3..0BZ",
      [year, month, day, h, m, s, ms]
    )
    |> IO.iodata_to_binary()
  end

  defp add_metadata(json, metadata) do
    Enum.reduce(metadata, json, fn
      {:trace_id, value}, acc when not is_nil(value) ->
        Map.put(acc, :trace_id, to_string(value))

      {:span_id, value}, acc when not is_nil(value) ->
        Map.put(acc, :span_id, to_string(value))

      {:request_id, value}, acc when not is_nil(value) ->
        Map.put(acc, :request_id, to_string(value))

      {:user_id, value}, acc when not is_nil(value) ->
        Map.put(acc, :user_id, to_string(value))

      {:remote_ip, value}, acc when not is_nil(value) ->
        Map.put(acc, :remote_ip, to_string(value))

      {:method, value}, acc when not is_nil(value) ->
        Map.put(acc, :http_method, to_string(value))

      {:path, value}, acc when not is_nil(value) ->
        Map.put(acc, :http_path, to_string(value))

      {:status, value}, acc when not is_nil(value) ->
        Map.put(acc, :http_status, value)

      {:duration_us, value}, acc when not is_nil(value) and is_integer(value) ->
        Map.put(acc, :duration_ms, value / 1000)

      {key, value}, acc when not is_nil(value) ->
        Map.put(acc, key, safe_value(value))

      _, acc ->
        acc
    end)
  end

  defp safe_value(value) when is_binary(value), do: value
  defp safe_value(value) when is_number(value), do: value
  defp safe_value(value) when is_boolean(value), do: value
  defp safe_value(value) when is_atom(value), do: Atom.to_string(value)
  defp safe_value(value), do: inspect(value)

  defp node_name do
    Node.self() |> Atom.to_string()
  end
end
