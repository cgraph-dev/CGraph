defmodule CGraph.Notifications.PushService.ExpoClient do
  @moduledoc """
  Expo Push Notification Service Client.

  Handles push notification delivery for Expo/React Native apps.
  Expo provides a unified API that routes to APNs and FCM.

  ## Configuration

      config :cgraph, CGraph.Notifications.PushService,
        expo_access_token: System.get_env("EXPO_ACCESS_TOKEN")

  ## Features

  - Batch sending (up to 100 per request)
  - Receipt checking for delivery confirmation
  - Automatic chunking for large batches
  - Ticket management for async delivery tracking
  - Support for all Expo push notification features

  ## Expo Token Format

  Expo tokens have the format: ExponentPushToken[xxxxx]
  """

  require Logger

  @expo_push_url "https://exp.host/--/api/v2/push/send"
  @expo_receipts_url "https://exp.host/--/api/v2/push/getReceipts"

  @batch_size 100
  @default_timeout 30_000
  @max_retries 3

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Sends a single push notification to an Expo token.

  ## Parameters

  - `token` - The Expo push token (ExponentPushToken[xxx])
  - `message` - The message map

  ## Message Options

  - `title` - Notification title
  - `body` - Notification body text
  - `data` - Custom data payload
  - `sound` - Sound to play ("default" or custom)
  - `badge` - Badge count for iOS
  - `ttl` - Time to live in seconds
  - `expiration` - Unix timestamp when notification expires
  - `priority` - "default", "normal", or "high"
  - `channelId` - Android notification channel
  - `categoryId` - iOS notification category
  - `mutableContent` - Enable notification service extension (iOS)

  ## Returns

  - `{:ok, ticket_id}` - Message was accepted
  - `{:error, reason}` - Message failed
  """
  @spec send(String.t(), map()) :: {:ok, String.t()} | {:error, term()}
  def send(token, message) do
    case send_batch([Map.put(message, "to", token)]) do
      {:ok, %{"data" => [%{"status" => "ok", "id" => id}]}} ->
        {:ok, id}

      {:ok, %{"data" => [%{"status" => "error", "message" => msg, "details" => details}]}} ->
        error = parse_error_details(details)
        Logger.warning("expo_push_failed", msg: msg)
        {:error, error}

      {:ok, %{"data" => [%{"status" => "error", "message" => msg}]}} ->
        Logger.warning("expo_push_failed", msg: msg)
        {:error, :send_failed}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Sends a batch of push notifications.

  Automatically chunks requests to stay within Expo's limits.

  ## Parameters

  - `messages` - List of message maps, each must include "to" field

  ## Returns

  - `{:ok, response}` - Response containing ticket data for each message
  - `{:error, reason}` - Batch request failed
  """
  @spec send_batch(list(map())) :: {:ok, map()} | {:error, term()}
  def send_batch(messages) when is_list(messages) do
    if length(messages) <= @batch_size do
      do_send_batch(messages, 0)
    else
      send_chunked_batch(messages)
    end
  end

  defp send_chunked_batch(messages) do
    messages
    |> Enum.chunk_every(@batch_size)
    |> Enum.reduce({:ok, %{"data" => []}}, &merge_batch_result/2)
  end

  defp merge_batch_result(_chunk, {:error, _} = error), do: error
  defp merge_batch_result(chunk, {:ok, acc}) do
    case do_send_batch(chunk, 0) do
      {:ok, result} -> {:ok, %{"data" => acc["data"] ++ result["data"]}}
      {:error, _} = err -> err
    end
  end

  @doc """
  Checks delivery receipts for previously sent notifications.

  Call this with ticket IDs from send responses to verify delivery.

  ## Parameters

  - `ticket_ids` - List of ticket IDs from send responses

  ## Returns

  - `{:ok, receipts}` - Map of ticket_id => receipt
  - `{:error, reason}` - Request failed
  """
  @spec get_receipts(list(String.t())) :: {:ok, map()} | {:error, term()}
  def get_receipts(ticket_ids) when is_list(ticket_ids) do
    # Expo recommends checking receipts at least 15 minutes after sending
    do_get_receipts(ticket_ids, 0)
  end

  @doc """
  Validates if a token is in valid Expo format.
  """
  @spec valid_token?(String.t()) :: boolean()
  def valid_token?(token) when is_binary(token) do
    String.starts_with?(token, "ExponentPushToken[") and String.ends_with?(token, "]")
  end
  def valid_token?(_), do: false

  # ============================================================================
  # Private Implementation
  # ============================================================================

  defp do_send_batch(messages, retry_count) when retry_count < @max_retries do
    headers = build_headers()
    body = Jason.encode!(messages)

    case http_post(@expo_push_url, headers, body) do
      {:ok, 200, _headers, response_body} ->
        case Jason.decode(response_body) do
          {:ok, response} ->
            {:ok, response}
          {:error, _} ->
            Logger.error("Failed to parse Expo response")
            {:error, :invalid_response}
        end

      {:ok, 429, _headers, _body} ->
        # Rate limited - back off and retry
        delay = :math.pow(2, retry_count) * 1000 |> round()
        Logger.warning("expo_rate_limited_backing_off_ms", delay: delay)
        Process.sleep(delay)
        do_send_batch(messages, retry_count + 1)

      {:ok, status, _headers, _body} when status >= 500 ->
        # Server error - retry
        Logger.warning("expo_server_error_retrying", status: status)
        Process.sleep(500 * (retry_count + 1))
        do_send_batch(messages, retry_count + 1)

      {:ok, status, _headers, body} ->
        Logger.error("expo_request_failed", status: status, body: body)
        {:error, :request_failed}

      {:error, reason} ->
        Logger.error("expo_connection_error", reason: inspect(reason))
        Process.sleep(500 * (retry_count + 1))
        do_send_batch(messages, retry_count + 1)
    end
  end

  defp do_send_batch(_messages, _retry_count) do
    {:error, :max_retries}
  end

  defp do_get_receipts(ticket_ids, retry_count) when retry_count < @max_retries do
    headers = build_headers()
    body = Jason.encode!(%{"ids" => ticket_ids})

    case http_post(@expo_receipts_url, headers, body) do
      {:ok, 200, _headers, response_body} ->
        case Jason.decode(response_body) do
          {:ok, %{"data" => receipts}} ->
            {:ok, receipts}
          {:error, _} ->
            {:error, :invalid_response}
        end

      {:ok, 429, _headers, _body} ->
        delay = :math.pow(2, retry_count) * 1000 |> round()
        Process.sleep(delay)
        do_get_receipts(ticket_ids, retry_count + 1)

      {:ok, status, _headers, _body} when status >= 500 ->
        Process.sleep(500 * (retry_count + 1))
        do_get_receipts(ticket_ids, retry_count + 1)

      {:ok, status, _headers, body} ->
        Logger.error("expo_receipts_request_failed", status: status, body: body)
        {:error, :request_failed}

      {:error, reason} ->
        Logger.error("expo_connection_error", reason: inspect(reason))
        {:error, reason}
    end
  end

  defp do_get_receipts(_ticket_ids, _retry_count) do
    {:error, :max_retries}
  end

  # ============================================================================
  # Helpers
  # ============================================================================

  defp build_headers do
    config = Application.get_env(:cgraph, CGraph.Notifications.PushService, [])
    access_token = Keyword.get(config, :expo_access_token)

    headers = [
      {"content-type", "application/json"},
      {"accept", "application/json"},
      {"accept-encoding", "gzip, deflate"}
    ]

    if access_token do
      [{"authorization", "Bearer #{access_token}"} | headers]
    else
      headers
    end
  end

  defp http_post(url, headers, body) do
    request = Finch.build(:post, url, headers, body)

    case Finch.request(request, CGraph.Finch, receive_timeout: @default_timeout) do
      {:ok, %Finch.Response{status: status, headers: resp_headers, body: resp_body}} ->
        # Handle gzip compression
        body = maybe_decompress(resp_body, resp_headers)
        {:ok, status, resp_headers, body}

      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("http_request_failed", e: inspect(e))
      {:error, :request_failed}
  end

  defp maybe_decompress(body, headers) do
    encoding = headers
    |> Enum.find(fn {k, _} -> String.downcase(k) == "content-encoding" end)
    |> case do
      {_, "gzip"} -> :gzip
      {_, "deflate"} -> :deflate
      _ -> :none
    end

    case encoding do
      :gzip -> :zlib.gunzip(body)
      :deflate -> :zlib.uncompress(body)
      :none -> body
    end
  rescue
    _ -> body
  end

  defp parse_error_details(%{"error" => "DeviceNotRegistered"}), do: :device_not_registered
  defp parse_error_details(%{"error" => "InvalidCredentials"}), do: :invalid_credentials
  defp parse_error_details(%{"error" => "MessageTooBig"}), do: :message_too_big
  defp parse_error_details(%{"error" => "MessageRateExceeded"}), do: :rate_exceeded
  defp parse_error_details(%{"error" => "MismatchSenderId"}), do: :mismatch_sender_id
  defp parse_error_details(_), do: :unknown_error
end
