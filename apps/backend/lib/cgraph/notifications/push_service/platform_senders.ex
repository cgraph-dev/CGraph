defmodule CGraph.Notifications.PushService.PlatformSenders do
  @moduledoc false

  require Logger

  alias CGraph.Notifications.PushService.{ApnsClient, ExpoClient, FcmClient, WebPushClient}
  alias CGraph.Notifications.PushService.CircuitBreakers

  # ============================================================================
  # Platform-Specific Senders
  # ============================================================================

  @spec send_to_apns([map()], map(), boolean()) :: {:ok, non_neg_integer(), non_neg_integer(), [String.t()]} | {:error, atom(), non_neg_integer()}
  def send_to_apns([], _notification, _silent), do: {:ok, 0, 0, []}
  def send_to_apns(tokens, notification, silent) do
    case CircuitBreakers.call(:apns, fn ->
      start_time = System.monotonic_time()

      payload = build_apns_payload(notification, silent)

      results = Enum.map(tokens, fn token ->
        case ApnsClient.send(token.token, payload) do
          {:ok, _} -> {:ok, token}
          {:error, :invalid_token} -> {:invalid, token}
          {:error, _reason} -> {:error, token}
        end
      end)

      sent = Enum.count(results, &match?({:ok, _}, &1))
      failed = Enum.count(results, &match?({:error, _}, &1))
      invalid = results |> Enum.filter(&match?({:invalid, _}, &1)) |> Enum.map(fn {:invalid, t} -> t.token end)

      duration = System.monotonic_time() - start_time
      emit_platform_telemetry(:apns, sent, failed, duration)

      {:ok, sent, failed, invalid}
    end) do
      {:error, :circuit_open} ->
        Logger.warning("apns_circuit_open_skipping", token_count: length(tokens))
        {:error, :apns_error, length(tokens)}
      result -> result
    end
  rescue
    e ->
      Logger.error("apns_batch_send_failed", error: inspect(e))
      {:error, :apns_error, length(tokens)}
  end

  @spec send_to_fcm([map()], map(), boolean()) :: {:ok, non_neg_integer(), non_neg_integer(), [String.t()]} | {:error, atom(), non_neg_integer()}
  def send_to_fcm([], _notification, _silent), do: {:ok, 0, 0, []}
  def send_to_fcm(tokens, notification, silent) do
    case CircuitBreakers.call(:fcm, fn ->
      start_time = System.monotonic_time()

      payload = build_fcm_payload(notification, silent)

      # FCM supports batch sending (up to 500 per request)
      token_strings = Enum.map(tokens, & &1.token)

      case FcmClient.send_multicast(token_strings, payload) do
        {:ok, response} ->
          {sent, failed, invalid} = parse_fcm_response(response, tokens)

          duration = System.monotonic_time() - start_time
          emit_platform_telemetry(:fcm, sent, failed, duration)

          {:ok, sent, failed, invalid}

        {:error, reason} ->
          Logger.error("fcm_batch_send_failed", reason: inspect(reason))
          {:error, :fcm_error, length(tokens)}
      end
    end) do
      {:error, :circuit_open} ->
        Logger.warning("fcm_circuit_open_skipping", token_count: length(tokens))
        {:error, :fcm_error, length(tokens)}
      result -> result
    end
  rescue
    e ->
      Logger.error("fcm_batch_send_failed", error: inspect(e))
      {:error, :fcm_error, length(tokens)}
  end

  @spec send_to_expo([map()], map(), boolean()) :: {:ok, non_neg_integer(), non_neg_integer(), [String.t()]} | {:error, atom(), non_neg_integer()}
  def send_to_expo([], _notification, _silent), do: {:ok, 0, 0, []}
  def send_to_expo(tokens, notification, silent) do
    case CircuitBreakers.call(:expo, fn ->
      start_time = System.monotonic_time()

      messages = Enum.map(tokens, fn token ->
        build_expo_message(token.token, notification, silent)
      end)

      case ExpoClient.send_batch(messages) do
        {:ok, response} ->
          {sent, failed, invalid} = parse_expo_response(response, tokens)

          duration = System.monotonic_time() - start_time
          emit_platform_telemetry(:expo, sent, failed, duration)

          {:ok, sent, failed, invalid}

        {:error, reason} ->
          Logger.error("expo_batch_send_failed", reason: inspect(reason))
          {:error, :expo_error, length(tokens)}
      end
    end) do
      {:error, :circuit_open} ->
        Logger.warning("expo_circuit_open_skipping", token_count: length(tokens))
        {:error, :expo_error, length(tokens)}
      result -> result
    end
  rescue
    e ->
      Logger.error("expo_batch_send_failed", error: inspect(e))
      {:error, :expo_error, length(tokens)}
  end

  @spec send_to_web([map()], map()) :: {:ok, non_neg_integer(), non_neg_integer(), [String.t()]} | {:error, atom(), non_neg_integer()}
  def send_to_web([], _notification), do: {:ok, 0, 0, []}
  def send_to_web(tokens, notification) do
    case CircuitBreakers.call(:web_push, fn ->
      start_time = System.monotonic_time()

      payload = build_web_push_payload(notification)

      results = Enum.map(tokens, fn token ->
        case WebPushClient.send(token.token, token.auth_keys, payload) do
          {:ok, _} -> {:ok, token}
          {:error, :gone} -> {:invalid, token}
          {:error, _reason} -> {:error, token}
        end
      end)

      sent = Enum.count(results, &match?({:ok, _}, &1))
      failed = Enum.count(results, &match?({:error, _}, &1))
      invalid = results |> Enum.filter(&match?({:invalid, _}, &1)) |> Enum.map(fn {:invalid, t} -> t.token end)

      duration = System.monotonic_time() - start_time
      emit_platform_telemetry(:web, sent, failed, duration)

      {:ok, sent, failed, invalid}
    end) do
      {:error, :circuit_open} ->
        Logger.warning("web_push_circuit_open_skipping", token_count: length(tokens))
        {:error, :web_push_error, length(tokens)}
      result -> result
    end
  rescue
    e ->
      Logger.error("web_push_batch_send_failed", error: inspect(e))
      {:error, :web_push_error, length(tokens)}
  end

  # ============================================================================
  # Payload Builders
  # ============================================================================

  @spec build_apns_payload(map(), boolean()) :: map()
  def build_apns_payload(notification, silent) do
    base_aps = if silent do
      %{"content-available" => 1}
    else
      %{
        "alert" => %{
          "title" => notification.title,
          "body" => notification.body
        },
        "sound" => Map.get(notification, :sound, "default"),
        "badge" => Map.get(notification, :badge, 1)
      }
    end

    aps = base_aps
    |> maybe_add("category", Map.get(notification, :category))
    |> maybe_add("thread-id", Map.get(notification, :thread_id))
    |> maybe_add("mutable-content", if(Map.get(notification, :image_url), do: 1, else: nil))

    payload = %{"aps" => aps}

    # Add custom data
    if data = Map.get(notification, :data) do
      Map.merge(payload, data)
    else
      payload
    end
  end

  @spec build_fcm_payload(map(), boolean()) :: map()
  def build_fcm_payload(notification, silent) do
    if silent do
      %{
        "data" => Map.get(notification, :data, %{})
      }
    else
      base = %{
        "notification" => %{
          "title" => notification.title,
          "body" => notification.body
        }
      }

      notification_opts = %{}
      |> maybe_add("sound", Map.get(notification, :sound, "default"))
      |> maybe_add("image", Map.get(notification, :image_url))
      |> maybe_add("click_action", Map.get(notification, :category))

      base = update_in(base, ["notification"], &Map.merge(&1, notification_opts))

      # Add data payload
      if data = Map.get(notification, :data) do
        Map.put(base, "data", data)
      else
        base
      end

      # Add Android-specific options
      |> Map.put("android", %{
        "priority" => priority_to_fcm(Map.get(notification, :priority, :high)),
        "ttl" => "#{Map.get(notification, :ttl, 86400)}s",
        "collapse_key" => Map.get(notification, :collapse_key)
      })
    end
  end

  @spec build_expo_message(String.t(), map(), boolean()) :: map()
  def build_expo_message(token, notification, silent) do
    base = %{
      "to" => token,
      "title" => notification.title,
      "body" => notification.body,
      "sound" => Map.get(notification, :sound, "default"),
      "badge" => Map.get(notification, :badge, 1),
      "data" => Map.get(notification, :data, %{}),
      "priority" => priority_to_expo(Map.get(notification, :priority, :high)),
      "ttl" => Map.get(notification, :ttl, 86_400)
    }

    if silent do
      base
      |> Map.put("_contentAvailable", true)
      |> Map.delete("title")
      |> Map.delete("body")
    else
      base
    end
    |> maybe_add("categoryId", Map.get(notification, :category))
    |> maybe_add("channelId", Map.get(notification, :thread_id))
  end

  @spec build_web_push_payload(map()) :: String.t()
  def build_web_push_payload(notification) do
    %{
      "title" => notification.title,
      "body" => notification.body,
      "icon" => "/icon-192x192.png",
      "badge" => "/badge-72x72.png",
      "data" => Map.get(notification, :data, %{}),
      "requireInteraction" => Map.get(notification, :priority) == :high,
      "tag" => Map.get(notification, :collapse_key)
    }
    |> maybe_add("image", Map.get(notification, :image_url))
    |> Jason.encode!()
  end

  # ============================================================================
  # Response Parsers
  # ============================================================================

  @spec parse_fcm_response(map(), [map()]) :: {non_neg_integer(), non_neg_integer(), [String.t()]}
  def parse_fcm_response(response, tokens) do
    results = Map.get(response, "responses", [])

    {sent, failed, invalid} =
      results
      |> Enum.zip(tokens)
      |> Enum.reduce({0, 0, []}, fn {result, token}, {s, f, i} ->
        case result do
          %{"success" => true} -> {s + 1, f, i}
          %{"error" => %{"code" => code}} when code in ["INVALID_ARGUMENT", "UNREGISTERED"] ->
            {s, f + 1, [token.token | i]}
          _ -> {s, f + 1, i}
        end
      end)

    {sent, failed, invalid}
  end

  @spec parse_expo_response(map(), [map()]) :: {non_neg_integer(), non_neg_integer(), [String.t()]}
  def parse_expo_response(response, tokens) do
    results = Map.get(response, "data", [])

    {sent, failed, invalid} =
      results
      |> Enum.zip(tokens)
      |> Enum.reduce({0, 0, []}, fn {result, token}, {s, f, i} ->
        case result do
          %{"status" => "ok"} -> {s + 1, f, i}
          %{"status" => "error", "details" => %{"error" => "DeviceNotRegistered"}} ->
            {s, f + 1, [token.token | i]}
          _ -> {s, f + 1, i}
        end
      end)

    {sent, failed, invalid}
  end

  # ============================================================================
  # Helpers
  # ============================================================================

  @spec priority_to_fcm(atom()) :: String.t()
  def priority_to_fcm(:high), do: "high"
  def priority_to_fcm(:normal), do: "normal"
  def priority_to_fcm(:low), do: "normal"
  def priority_to_fcm(_), do: "high"

  @spec priority_to_expo(atom()) :: String.t()
  def priority_to_expo(:high), do: "high"
  def priority_to_expo(:normal), do: "default"
  def priority_to_expo(:low), do: "default"
  def priority_to_expo(_), do: "high"

  defp maybe_add(map, _key, nil), do: map
  defp maybe_add(map, key, value), do: Map.put(map, key, value)

  defp emit_platform_telemetry(platform, sent, failed, duration) do
    :telemetry.execute(
      [:cgraph, :push_service, :platform_send],
      %{
        sent: sent,
        failed: failed,
        duration: System.convert_time_unit(duration, :native, :millisecond)
      },
      %{platform: platform}
    )
  end
end
