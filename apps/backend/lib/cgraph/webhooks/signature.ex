defmodule CGraph.Webhooks.Signature do
  @moduledoc """
  Webhook signature generation and verification.

  Implements HMAC-SHA256 webhook signing and verification following
  the standard `t=<timestamp>,v1=<signature>` header format.

  ## Verification

  Recipients should verify incoming webhooks:

      signature = HMAC-SHA256(secret, timestamp <> "." <> payload)
      header = "t=<timestamp>,v1=<signature>"
  """

  @signature_tolerance_seconds 300

  @doc """
  Verify a webhook signature.

  For use by webhook recipients to verify authenticity.
  """
  @spec verify_signature(String.t(), String.t(), String.t()) ::
          {:ok, :valid} | {:error, term()}
  def verify_signature(payload, signature_header, secret) do
    with {:ok, timestamp, signatures} <- parse_signature_header(signature_header),
         :ok <- check_timestamp(timestamp) do
      expected = compute_signature(timestamp, payload, secret)

      if Enum.any?(signatures, &secure_compare(&1, expected)) do
        {:ok, :valid}
      else
        {:error, :invalid_signature}
      end
    end
  end

  @doc """
  Generate a test event for endpoint verification.
  """
  @spec send_test_event(String.t()) :: {:ok, map()} | {:error, term()}
  def send_test_event(endpoint_id) do
    CGraph.Webhooks.Deliveries.dispatch("system.health", %{
      test: true,
      message: "Test webhook from Cgraph",
      timestamp: DateTime.utc_now()
    })
    |> case do
      {:ok, event_id} -> {:ok, %{event_id: event_id, endpoint_id: endpoint_id}}
      error -> error
    end
  end

  @doc """
  Compute a webhook signature (exposed for the delivery worker).
  """
  @spec compute_signature(integer(), String.t(), String.t()) :: String.t()
  def compute_signature(timestamp, payload, secret) do
    signed_payload = "#{timestamp}.#{payload}"

    :crypto.mac(:hmac, :sha256, secret, signed_payload)
    |> Base.encode16(case: :lower)
  end

  # -- Private ----------------------------------------------------------------

  defp parse_signature_header(header) when is_binary(header) do
    parts = String.split(header, ",")

    timestamp =
      Enum.find_value(parts, fn part ->
        case String.split(part, "=", parts: 2) do
          ["t", value] -> String.to_integer(value)
          _ -> nil
        end
      end)

    signatures =
      Enum.flat_map(parts, fn part ->
        case String.split(part, "=", parts: 2) do
          ["v1", value] -> [value]
          _ -> []
        end
      end)

    case {timestamp, signatures} do
      {ts, [_ | _]} when not is_nil(ts) ->
        {:ok, ts, signatures}

      _ ->
        {:error, :invalid_header_format}
    end
  end

  defp parse_signature_header(_), do: {:error, :invalid_header}

  defp check_timestamp(timestamp) do
    now = System.system_time(:second)

    if abs(now - timestamp) <= @signature_tolerance_seconds,
      do: :ok,
      else: {:error, :timestamp_expired}
  end

  defp secure_compare(a, b) when byte_size(a) == byte_size(b) do
    :crypto.hash_equals(a, b)
  end

  defp secure_compare(_, _), do: false
end
