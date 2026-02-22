defmodule CGraph.Notifications.PushService.FcmClient.MessageBuilder do
  @moduledoc """
  Builds FCM HTTP v1 API message payloads.

  Constructs properly formatted messages for single token, topic,
  condition, and multicast sends, including Android-specific options.
  """

  @doc """
  Builds an FCM message map from a target and payload.

  The target should be a map with one of: `"token"`, `"topic"`, or `"condition"`.
  The payload may contain `"notification"`, `"data"`, `"android"`, and `"webpush"` keys.
  """
  @spec build_message(map(), map()) :: map()
  def build_message(target, payload) do
    base = target

    # Add notification if present
    base =
      if notification = payload["notification"] do
        Map.put(base, "notification", notification)
      else
        base
      end

    # Add data if present
    base =
      if data = payload["data"] do
        # FCM requires all data values to be strings
        string_data = Map.new(data, fn {k, v} -> {to_string(k), to_string(v)} end)
        Map.put(base, "data", string_data)
      else
        base
      end

    # Add Android-specific options
    base =
      if android = payload["android"] do
        Map.put(base, "android", build_android_config(android))
      else
        base
      end

    # Add webpush options if targeting web
    base =
      if webpush = payload["webpush"] do
        Map.put(base, "webpush", webpush)
      else
        base
      end

    base
  end

  @doc """
  Builds Android-specific notification configuration.

  Supports `priority`, `ttl`, `collapse_key`, and `notification` fields.
  """
  @spec build_android_config(map()) :: map()
  def build_android_config(android) do
    config = %{}

    config =
      if priority = android["priority"] do
        Map.put(config, "priority", String.upcase(to_string(priority)))
      else
        config
      end

    config =
      if ttl = android["ttl"] do
        Map.put(config, "ttl", ttl)
      else
        config
      end

    config =
      if collapse_key = android["collapse_key"] do
        Map.put(config, "collapse_key", collapse_key)
      else
        config
      end

    config =
      if notification = android["notification"] do
        Map.put(config, "notification", notification)
      else
        config
      end

    config
  end
end
