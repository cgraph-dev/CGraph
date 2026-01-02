defmodule Cgraph.Notifications.PushService.ExpoClient do
  @moduledoc """
  Expo Push Notification Service Client.
  
  Handles push notification delivery for Expo/React Native apps.
  Expo provides a unified API that routes to APNs and FCM.
  
  ## Configuration
  
      config :cgraph, Cgraph.Notifications.PushService,
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
        Logger.warning("Expo push failed: #{msg}")
        {:error, error}
        
      {:ok, %{"data" => [%{"status" => "error", "message" => msg}]}} ->
        Logger.warning("Expo push failed: #{msg}")
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
      # Send in chunks and combine results
      messages
      |> Enum.chunk_every(@batch_size)
      |> Enum.reduce({:ok, %{"data" => []}}, fn
        chunk, {:ok, acc} ->
          case do_send_batch(chunk, 0) do
            {:ok, result} ->
              {:ok, %{"data" => acc["data"] ++ result["data"]}}
            {:error, _} = err ->
              err
          end
        _chunk, error ->
          error
      end)
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
        Logger.warning("Expo rate limited - backing off #{delay}ms")
        Process.sleep(delay)
        do_send_batch(messages, retry_count + 1)
        
      {:ok, status, _headers, body} when status >= 500 ->
        # Server error - retry
        Logger.warning("Expo server error #{status} - retrying")
        Process.sleep(500 * (retry_count + 1))
        do_send_batch(messages, retry_count + 1)
        
      {:ok, status, _headers, body} ->
        Logger.error("Expo request failed (#{status}): #{body}")
        {:error, :request_failed}
        
      {:error, reason} ->
        Logger.error("Expo connection error: #{inspect(reason)}")
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
        Logger.error("Expo receipts request failed (#{status}): #{body}")
        {:error, :request_failed}
        
      {:error, reason} ->
        Logger.error("Expo connection error: #{inspect(reason)}")
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
    config = Application.get_env(:cgraph, Cgraph.Notifications.PushService, [])
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
    
    case Finch.request(request, Cgraph.Finch, receive_timeout: @default_timeout) do
      {:ok, %Finch.Response{status: status, headers: resp_headers, body: resp_body}} ->
        # Handle gzip compression
        body = maybe_decompress(resp_body, resp_headers)
        {:ok, status, resp_headers, body}
        
      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("HTTP request failed: #{inspect(e)}")
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

defmodule Cgraph.Notifications.PushService.WebPushClient do
  @moduledoc """
  Web Push API Client.
  
  Handles push notifications to web browsers via the Web Push protocol.
  Uses VAPID (Voluntary Application Server Identification) for authentication.
  
  ## Configuration
  
      config :cgraph, Cgraph.Notifications.PushService,
        vapid_subject: "mailto:admin@cgraph.app",
        vapid_public_key: "BN...",
        vapid_private_key: "..."
  
  ## Browser Support
  
  - Chrome/Chromium (via FCM)
  - Firefox
  - Safari (macOS Ventura+, iOS 16.4+)
  - Edge
  
  ## Subscription Format
  
  Web push subscriptions contain:
  - endpoint: The push service URL
  - keys.p256dh: Client public key
  - keys.auth: Client auth secret
  """
  
  require Logger
  
  @default_timeout 10_000
  @max_payload_size 4096
  @max_retries 2
  
  # ============================================================================
  # Public API
  # ============================================================================
  
  @doc """
  Sends a push notification to a web push subscription.
  
  ## Parameters
  
  - `endpoint` - The push service endpoint URL
  - `auth_keys` - Map with "p256dh" and "auth" keys
  - `payload` - The notification payload (will be encrypted)
  - `opts` - Optional keyword list
  
  ## Options
  
  - `:ttl` - Time to live in seconds (default: 86400)
  - `:urgency` - "very-low", "low", "normal", "high" (default: "normal")
  - `:topic` - Topic for collapsing notifications
  
  ## Returns
  
  - `{:ok, :sent}` - Notification was accepted
  - `{:error, :gone}` - Subscription is no longer valid
  - `{:error, reason}` - Notification failed
  """
  @spec send(String.t(), map(), String.t() | map(), keyword()) :: {:ok, :sent} | {:error, term()}
  def send(endpoint, auth_keys, payload, opts \\ []) do
    do_send(endpoint, auth_keys, payload, opts, 0)
  end
  
  @doc """
  Validates a web push subscription.
  """
  @spec valid_subscription?(map()) :: boolean()
  def valid_subscription?(subscription) when is_map(subscription) do
    endpoint = subscription["endpoint"] || subscription[:endpoint]
    keys = subscription["keys"] || subscription[:keys]
    
    is_binary(endpoint) and
      String.starts_with?(endpoint, "https://") and
      is_map(keys) and
      is_binary(keys["p256dh"] || keys[:p256dh]) and
      is_binary(keys["auth"] || keys[:auth])
  end
  def valid_subscription?(_), do: false
  
  @doc """
  Returns the VAPID public key for client-side subscription.
  """
  @spec get_public_key() :: String.t() | nil
  def get_public_key do
    config = Application.get_env(:cgraph, Cgraph.Notifications.PushService, [])
    Keyword.get(config, :vapid_public_key)
  end
  
  # ============================================================================
  # Private Implementation
  # ============================================================================
  
  defp do_send(endpoint, auth_keys, payload, opts, retry_count) when retry_count < @max_retries do
    config = load_config()
    
    # Prepare payload
    payload_bytes = if is_binary(payload), do: payload, else: Jason.encode!(payload)
    
    if byte_size(payload_bytes) > @max_payload_size do
      {:error, :payload_too_large}
    else
      # Encrypt payload
      p256dh = auth_keys["p256dh"] || auth_keys[:p256dh]
      auth = auth_keys["auth"] || auth_keys[:auth]
      
      case encrypt_payload(payload_bytes, p256dh, auth) do
        {:ok, encrypted, salt, server_public_key} ->
          # Build request
          ttl = Keyword.get(opts, :ttl, 86400)
          urgency = Keyword.get(opts, :urgency, "normal")
          topic = Keyword.get(opts, :topic)
          
          headers = build_vapid_headers(endpoint, config, ttl, urgency, topic, salt, server_public_key)
          
          case http_post(endpoint, headers, encrypted) do
            {:ok, status, _headers, _body} when status in [200, 201] ->
              {:ok, :sent}
              
            {:ok, 410, _headers, _body} ->
              # Gone - subscription no longer valid
              {:error, :gone}
              
            {:ok, 413, _headers, _body} ->
              {:error, :payload_too_large}
              
            {:ok, 429, _headers, _body} ->
              Process.sleep(1000 * (retry_count + 1))
              do_send(endpoint, auth_keys, payload, opts, retry_count + 1)
              
            {:ok, status, _headers, body} ->
              Logger.warning("Web push failed (#{status}): #{body}")
              {:error, :send_failed}
              
            {:error, reason} ->
              Logger.error("Web push connection error: #{inspect(reason)}")
              do_send(endpoint, auth_keys, payload, opts, retry_count + 1)
          end
          
        {:error, reason} ->
          Logger.error("Web push encryption failed: #{inspect(reason)}")
          {:error, :encryption_failed}
      end
    end
  end
  
  defp do_send(_endpoint, _auth_keys, _payload, _opts, _retry_count) do
    {:error, :max_retries}
  end
  
  # ============================================================================
  # VAPID & Encryption
  # ============================================================================
  
  defp build_vapid_headers(endpoint, config, ttl, urgency, topic, salt, server_public_key) do
    vapid_token = generate_vapid_token(endpoint, config)
    
    headers = [
      {"content-type", "application/octet-stream"},
      {"content-encoding", "aes128gcm"},
      {"ttl", to_string(ttl)},
      {"urgency", urgency},
      {"authorization", "vapid t=#{vapid_token}, k=#{config[:vapid_public_key]}"},
      {"crypto-key", "dh=#{Base.url_encode64(server_public_key, padding: false)}"},
      {"encryption", "salt=#{Base.url_encode64(salt, padding: false)}"}
    ]
    
    if topic do
      [{"topic", topic} | headers]
    else
      headers
    end
  end
  
  defp generate_vapid_token(endpoint, config) do
    uri = URI.parse(endpoint)
    audience = "#{uri.scheme}://#{uri.host}"
    
    now = System.system_time(:second)
    
    claims = %{
      "aud" => audience,
      "exp" => now + 86400,
      "sub" => config[:vapid_subject]
    }
    
    # Sign with ES256
    private_key = Base.url_decode64!(config[:vapid_private_key], padding: false)
    
    header = %{"alg" => "ES256", "typ" => "JWT"}
    
    header_b64 = header |> Jason.encode!() |> Base.url_encode64(padding: false)
    claims_b64 = claims |> Jason.encode!() |> Base.url_encode64(padding: false)
    
    signing_input = "#{header_b64}.#{claims_b64}"
    
    signature = :crypto.sign(:ecdsa, :sha256, signing_input, [private_key, :secp256r1])
    signature_b64 = Base.url_encode64(signature, padding: false)
    
    "#{signing_input}.#{signature_b64}"
  rescue
    e ->
      Logger.error("VAPID token generation failed: #{inspect(e)}")
      ""
  end
  
  defp encrypt_payload(payload, p256dh_b64, auth_b64) do
    # Decode client keys
    p256dh = Base.url_decode64!(p256dh_b64, padding: false)
    auth = Base.url_decode64!(auth_b64, padding: false)
    
    # Generate server ECDH key pair
    {server_public, server_private} = :crypto.generate_key(:ecdh, :secp256r1)
    
    # Derive shared secret using ECDH
    shared_secret = :crypto.compute_key(:ecdh, p256dh, server_private, :secp256r1)
    
    # Generate salt
    salt = :crypto.strong_rand_bytes(16)
    
    # Derive encryption key using HKDF
    # info = "WebPush: info" || 0x00 || client_public || server_public
    info_base = "WebPush: info" <> <<0>> <> p256dh <> server_public
    
    # PRK = HMAC-SHA256(auth, shared_secret)
    prk = :crypto.mac(:hmac, :sha256, auth, shared_secret)
    
    # IKM = HKDF-Extract(salt, prk)
    ikm = :crypto.mac(:hmac, :sha256, salt, prk)
    
    # Content encryption key: HKDF-Expand(ikm, "Content-Encoding: aes128gcm" || 0x01, 16)
    cek_info = "Content-Encoding: aes128gcm" <> <<1>>
    cek = hkdf_expand(ikm, cek_info, 16)
    
    # Nonce: HKDF-Expand(ikm, "Content-Encoding: nonce" || 0x01, 12)
    nonce_info = "Content-Encoding: nonce" <> <<1>>
    nonce = hkdf_expand(ikm, nonce_info, 12)
    
    # Pad and encrypt payload
    # Padding: record_size (4 bytes) + key_id_len (1 byte) + key_id + padding + 0x02 + payload
    padded_payload = <<2>> <> payload  # 0x02 delimiter + payload
    
    # Encrypt with AES-128-GCM
    {ciphertext, tag} = :crypto.crypto_one_time_aead(
      :aes_128_gcm,
      cek,
      nonce,
      padded_payload,
      <<>>,
      16,
      true
    )
    
    encrypted = ciphertext <> tag
    
    {:ok, encrypted, salt, server_public}
  rescue
    e ->
      Logger.error("Encryption failed: #{inspect(e)}")
      {:error, e}
  end
  
  defp hkdf_expand(prk, info, length) do
    # HKDF-Expand using HMAC-SHA256
    t = :crypto.mac(:hmac, :sha256, prk, info <> <<1>>)
    binary_part(t, 0, min(length, byte_size(t)))
  end
  
  # ============================================================================
  # Helpers
  # ============================================================================
  
  defp load_config do
    config = Application.get_env(:cgraph, Cgraph.Notifications.PushService, [])
    
    %{
      vapid_subject: Keyword.get(config, :vapid_subject, "mailto:admin@cgraph.app"),
      vapid_public_key: Keyword.get(config, :vapid_public_key),
      vapid_private_key: Keyword.get(config, :vapid_private_key)
    }
  end
  
  defp http_post(url, headers, body) do
    request = Finch.build(:post, url, headers, body)
    
    case Finch.request(request, Cgraph.Finch, receive_timeout: @default_timeout) do
      {:ok, %Finch.Response{status: status, headers: headers, body: body}} ->
        {:ok, status, headers, body}
        
      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("HTTP request failed: #{inspect(e)}")
      {:error, :request_failed}
  end
end
