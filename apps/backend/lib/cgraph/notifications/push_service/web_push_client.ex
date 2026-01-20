defmodule CGraph.Notifications.PushService.WebPushClient do
  @moduledoc """
  Web Push Notification Client using VAPID protocol.

  Handles push notification delivery to web browsers using the Web Push API
  with VAPID (Voluntary Application Server Identification) authentication.

  ## Configuration

      config :cgraph, CGraph.Notifications.PushService,
        vapid_subject: "mailto:admin@cgraph.io",
        vapid_public_key: System.get_env("VAPID_PUBLIC_KEY"),
        vapid_private_key: System.get_env("VAPID_PRIVATE_KEY")

  ## Features

  - VAPID authentication for secure push delivery
  - Support for all major browsers (Chrome, Firefox, Safari, Edge)
  - Automatic retry with exponential backoff
  - Payload encryption (RFC 8291)
  - TTL and urgency support
  - Topic-based notification replacement

  ## Generating VAPID Keys

  Generate VAPID key pair using:
      
      # In iex:
      CGraph.Notifications.PushService.WebPushClient.generate_vapid_keys()

  ## Web Push Subscription Format

  Web push subscriptions contain:
  - endpoint: The push service URL
  - keys.p256dh: The client's public key
  - keys.auth: The authentication secret
  """

  require Logger

  alias CGraph.Crypto

  @default_timeout 30_000
  @max_retries 3
  @default_ttl 86_400  # 24 hours

  # Urgency levels for push priority
  @urgency_levels [:very_low, :low, :normal, :high]

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Sends a web push notification to a subscription.

  ## Parameters

  - `subscription` - Map containing endpoint, keys.p256dh, and keys.auth
  - `message` - The notification payload
  - `opts` - Optional keyword list

  ## Options

  - `:ttl` - Time to live in seconds (default: 86400)
  - `:urgency` - Priority level: :very_low, :low, :normal, :high (default: :normal)
  - `:topic` - Topic string for notification replacement
  - `:vapid_details` - Override VAPID details

  ## Returns

  - `:ok` - Notification was delivered
  - `{:error, :expired}` - Subscription has expired (should be deleted)
  - `{:error, :invalid_subscription}` - Subscription is invalid
  - `{:error, reason}` - Other failure
  """
  @spec send(map(), map(), keyword()) :: :ok | {:error, term()}
  def send(subscription, message, opts \\ [])

  def send(%{"endpoint" => endpoint, "keys" => keys} = _subscription, message, opts) do
    send_internal(endpoint, keys, message, opts, 0)
  end

  def send(%{endpoint: endpoint, keys: keys} = _subscription, message, opts) do
    send_internal(endpoint, keys, message, opts, 0)
  end

  def send(_, _, _), do: {:error, :invalid_subscription_format}

  @doc """
  Sends web push notifications to multiple subscriptions.

  ## Parameters

  - `subscriptions` - List of subscription maps
  - `message` - The notification payload
  - `opts` - Optional keyword list

  ## Returns

  - `{:ok, %{sent: n, failed: m, expired: k}}`
  """
  @spec send_batch(list(map()), map(), keyword()) ::
          {:ok, %{sent: non_neg_integer(), failed: non_neg_integer(), expired: non_neg_integer()}}
  def send_batch(subscriptions, message, opts \\ []) do
    results =
      subscriptions
      |> Task.async_stream(
        fn sub -> {sub, send(sub, message, opts)} end,
        max_concurrency: 10,
        timeout: @default_timeout * 2
      )
      |> Enum.reduce(%{sent: 0, failed: 0, expired: []}, fn
        {:ok, {_sub, :ok}}, acc ->
          %{acc | sent: acc.sent + 1}

        {:ok, {sub, {:error, :expired}}}, acc ->
          %{acc | expired: [sub | acc.expired]}

        {:ok, {_sub, {:error, _}}}, acc ->
          %{acc | failed: acc.failed + 1}

        {:exit, _}, acc ->
          %{acc | failed: acc.failed + 1}
      end)

    {:ok, %{
      sent: results.sent,
      failed: results.failed,
      expired: length(results.expired)
    }}
  end

  @doc """
  Generates a new VAPID key pair.

  Returns a map with :public_key and :private_key in base64url format.
  These should be stored securely and configured in your application.
  """
  @spec generate_vapid_keys() :: {:ok, %{public_key: String.t(), private_key: String.t()}}
  def generate_vapid_keys do
    # Generate P-256 EC key pair
    {public_key, private_key} = :crypto.generate_key(:ecdh, :prime256v1)

    # Convert to base64url format (uncompressed public key format)
    public_key_b64 = Base.url_encode64(public_key, padding: false)
    private_key_b64 = Base.url_encode64(private_key, padding: false)

    {:ok, %{
      public_key: public_key_b64,
      private_key: private_key_b64
    }}
  end

  @doc """
  Gets the VAPID public key for client-side subscription.

  This key should be provided to the browser when requesting push permission.
  """
  @spec get_vapid_public_key() :: {:ok, String.t()} | {:error, :not_configured}
  def get_vapid_public_key do
    case get_config(:vapid_public_key) do
      nil -> {:error, :not_configured}
      key -> {:ok, key}
    end
  end

  @doc """
  Validates a web push subscription object.
  """
  @spec validate_subscription(map()) :: :ok | {:error, term()}
  def validate_subscription(subscription) do
    with :ok <- validate_endpoint(subscription),
         :ok <- validate_keys(subscription) do
      :ok
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp send_internal(endpoint, keys, message, opts, retry_count) do
    ttl = Keyword.get(opts, :ttl, @default_ttl)
    urgency = Keyword.get(opts, :urgency, :normal)
    topic = Keyword.get(opts, :topic)

    with {:ok, encrypted_payload} <- encrypt_payload(message, keys),
         {:ok, vapid_headers} <- generate_vapid_headers(endpoint),
         {:ok, response} <- do_send(endpoint, encrypted_payload, vapid_headers, ttl, urgency, topic) do
      handle_response(response, endpoint, keys, message, opts, retry_count)
    else
      {:error, reason} = error ->
        Logger.warning("Web push send failed: #{inspect(reason)}")
        error
    end
  end

  defp do_send(endpoint, payload, vapid_headers, ttl, urgency, topic) do
    headers =
      [
        {"Content-Type", "application/octet-stream"},
        {"Content-Encoding", "aes128gcm"},
        {"TTL", Integer.to_string(ttl)},
        {"Urgency", urgency_to_string(urgency)}
      ]
      |> add_vapid_headers(vapid_headers)
      |> add_topic_header(topic)

    case CGraph.Http.post(endpoint, payload, headers, timeout: @default_timeout) do
      {:ok, response} -> {:ok, response}
      {:error, reason} -> {:error, {:request_failed, reason}}
    end
  end

  defp handle_response(%{status_code: status}, _endpoint, _keys, _message, _opts, _retry)
       when status in 200..299 do
    :ok
  end

  defp handle_response(%{status_code: 404}, _endpoint, _keys, _message, _opts, _retry) do
    {:error, :expired}
  end

  defp handle_response(%{status_code: 410}, _endpoint, _keys, _message, _opts, _retry) do
    # 410 Gone - subscription is no longer valid
    {:error, :expired}
  end

  defp handle_response(%{status_code: 413}, _endpoint, _keys, _message, _opts, _retry) do
    {:error, :payload_too_large}
  end

  defp handle_response(%{status_code: 429}, endpoint, keys, message, opts, retry_count)
       when retry_count < @max_retries do
    # Rate limited - back off and retry
    backoff = :math.pow(2, retry_count) * 1000 |> round()
    Process.sleep(backoff)
    send_internal(endpoint, keys, message, opts, retry_count + 1)
  end

  defp handle_response(%{status_code: status}, _endpoint, _keys, _message, _opts, _retry)
       when status >= 500 do
    {:error, {:server_error, status}}
  end

  defp handle_response(%{status_code: status, body: body}, _endpoint, _keys, _message, _opts, _retry) do
    Logger.warning("Web push failed with status #{status}: #{inspect(body)}")
    {:error, {:unexpected_status, status}}
  end

  # Payload encryption using RFC 8291 (aes128gcm)
  defp encrypt_payload(message, keys) do
    payload = Jason.encode!(message)
    
    with {:ok, p256dh} <- get_key(keys, "p256dh"),
         {:ok, auth} <- get_key(keys, "auth") do
      # Decode client keys from base64url
      client_public_key = Base.url_decode64!(p256dh, padding: false)
      client_auth = Base.url_decode64!(auth, padding: false)

      # Generate ephemeral key pair for ECDH
      {server_public_key, server_private_key} = :crypto.generate_key(:ecdh, :prime256v1)

      # Compute shared secret
      shared_secret = :crypto.compute_key(:ecdh, client_public_key, server_private_key, :prime256v1)

      # Derive encryption key using HKDF
      {content_encryption_key, nonce} = derive_keys(shared_secret, client_auth, client_public_key, server_public_key)

      # Encrypt payload with AES-GCM
      # Add padding as per RFC 8291
      padded_payload = <<0::16, payload::binary>>
      
      {ciphertext, tag} = :crypto.crypto_one_time_aead(
        :aes_128_gcm,
        content_encryption_key,
        nonce,
        padded_payload,
        <<>>,
        true
      )

      # Build the encrypted message with header
      # Record size (4 bytes) + key id length (1 byte) + key id (server public key)
      record_size = byte_size(ciphertext) + 16 + 1  # +16 for tag, +1 for padding delimiter
      key_id_length = byte_size(server_public_key)
      
      encrypted_message = <<
        # Salt for HKDF (16 bytes, random)
        :crypto.strong_rand_bytes(16)::binary,
        # Record size (4 bytes, big endian)
        record_size::32,
        # Key ID length (1 byte)
        key_id_length::8,
        # Key ID (server public key)
        server_public_key::binary,
        # Ciphertext with auth tag
        ciphertext::binary,
        tag::binary
      >>

      {:ok, encrypted_message}
    end
  rescue
    e ->
      Logger.error("Payload encryption failed: #{inspect(e)}")
      {:error, :encryption_failed}
  end

  defp derive_keys(shared_secret, auth_secret, client_public_key, server_public_key) do
    # PRK = HKDF-Extract(auth_secret, ecdh_secret)
    prk = hkdf_extract(auth_secret, shared_secret)

    # Key info for content encryption key
    key_info = build_info("aesgcm", client_public_key, server_public_key)
    
    # Nonce info
    nonce_info = build_info("nonce", client_public_key, server_public_key)

    # Derive CEK (16 bytes for AES-128)
    cek = hkdf_expand(prk, key_info, 16)
    
    # Derive nonce (12 bytes)
    nonce = hkdf_expand(prk, nonce_info, 12)

    {cek, nonce}
  end

  defp build_info(type, client_public_key, server_public_key) do
    <<
      "Content-Encoding: ",
      type::binary,
      0,
      "P-256",
      0,
      byte_size(client_public_key)::16,
      client_public_key::binary,
      byte_size(server_public_key)::16,
      server_public_key::binary
    >>
  end

  defp hkdf_extract(salt, ikm) do
    :crypto.mac(:hmac, :sha256, salt, ikm)
  end

  defp hkdf_expand(prk, info, length) do
    :crypto.mac(:hmac, :sha256, prk, <<info::binary, 1>>)
    |> binary_part(0, length)
  end

  defp generate_vapid_headers(endpoint) do
    vapid_subject = get_config(:vapid_subject) || "mailto:admin@cgraph.io"
    vapid_public_key = get_config(:vapid_public_key)
    vapid_private_key = get_config(:vapid_private_key)

    if is_nil(vapid_public_key) or is_nil(vapid_private_key) do
      {:error, :vapid_not_configured}
    else
      # Parse endpoint to get audience (origin)
      uri = URI.parse(endpoint)
      audience = "#{uri.scheme}://#{uri.host}"

      # Create VAPID JWT claims
      now = System.system_time(:second)
      claims = %{
        "aud" => audience,
        "exp" => now + 3600,  # 1 hour expiry
        "sub" => vapid_subject
      }

      # Sign JWT with VAPID private key
      with {:ok, jwt} <- create_vapid_jwt(claims, vapid_private_key) do
        {:ok, %{
          authorization: "vapid t=#{jwt}, k=#{vapid_public_key}",
          crypto_key: "p256ecdsa=#{vapid_public_key}"
        }}
      end
    end
  end

  defp create_vapid_jwt(claims, private_key_b64) do
    try do
      # Decode private key
      private_key = Base.url_decode64!(private_key_b64, padding: false)

      # Create JWT header and payload
      header = %{"alg" => "ES256", "typ" => "JWT"}
      header_b64 = Base.url_encode64(Jason.encode!(header), padding: false)
      payload_b64 = Base.url_encode64(Jason.encode!(claims), padding: false)

      # Create signing input
      signing_input = "#{header_b64}.#{payload_b64}"

      # Sign with ECDSA P-256
      signature = :crypto.sign(:ecdsa, :sha256, signing_input, [private_key, :prime256v1])
      
      # Convert DER signature to raw R||S format
      signature_raw = der_to_raw_signature(signature)
      signature_b64 = Base.url_encode64(signature_raw, padding: false)

      {:ok, "#{signing_input}.#{signature_b64}"}
    rescue
      e ->
        Logger.error("VAPID JWT creation failed: #{inspect(e)}")
        {:error, :jwt_creation_failed}
    end
  end

  # Convert DER-encoded ECDSA signature to raw R||S format
  defp der_to_raw_signature(<<0x30, _len, 0x02, r_len::8, rest::binary>>) do
    <<r::binary-size(r_len), 0x02, s_len::8, s::binary-size(s_len), _::binary>> = rest
    
    # Pad or trim R and S to 32 bytes each
    r_padded = pad_or_trim(r, 32)
    s_padded = pad_or_trim(s, 32)
    
    <<r_padded::binary, s_padded::binary>>
  end

  defp pad_or_trim(bytes, target_size) when byte_size(bytes) == target_size, do: bytes
  defp pad_or_trim(bytes, target_size) when byte_size(bytes) < target_size do
    padding_size = target_size - byte_size(bytes)
    <<0::size(padding_size * 8), bytes::binary>>
  end
  defp pad_or_trim(bytes, target_size) when byte_size(bytes) > target_size do
    # Remove leading zeros
    trim_size = byte_size(bytes) - target_size
    <<_::binary-size(trim_size), trimmed::binary>> = bytes
    trimmed
  end

  defp add_vapid_headers(headers, %{authorization: auth, crypto_key: _crypto_key}) do
    # Modern Web Push uses combined VAPID header
    [{"Authorization", auth} | headers]
  end

  defp add_topic_header(headers, nil), do: headers
  defp add_topic_header(headers, topic) when is_binary(topic) do
    [{"Topic", topic} | headers]
  end

  defp urgency_to_string(:very_low), do: "very-low"
  defp urgency_to_string(:low), do: "low"
  defp urgency_to_string(:normal), do: "normal"
  defp urgency_to_string(:high), do: "high"

  defp get_key(keys, key) when is_map(keys) do
    value = Map.get(keys, key) || Map.get(keys, String.to_atom(key))
    if value, do: {:ok, value}, else: {:error, {:missing_key, key}}
  end

  defp validate_endpoint(%{"endpoint" => endpoint}) when is_binary(endpoint) do
    uri = URI.parse(endpoint)
    if uri.scheme in ["https"] and not is_nil(uri.host) do
      :ok
    else
      {:error, :invalid_endpoint}
    end
  end
  defp validate_endpoint(%{endpoint: endpoint}), do: validate_endpoint(%{"endpoint" => endpoint})
  defp validate_endpoint(_), do: {:error, :missing_endpoint}

  defp validate_keys(%{"keys" => %{"p256dh" => p256dh, "auth" => auth}})
       when is_binary(p256dh) and is_binary(auth) do
    :ok
  end
  defp validate_keys(%{keys: %{p256dh: p256dh, auth: auth}})
       when is_binary(p256dh) and is_binary(auth) do
    :ok
  end
  defp validate_keys(_), do: {:error, :missing_keys}

  defp get_config(key) do
    Application.get_env(:cgraph, CGraph.Notifications.PushService, [])
    |> Keyword.get(key)
  end
end
