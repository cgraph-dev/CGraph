defmodule CGraphWeb.API.V1.WebPushController do
  @moduledoc """
  Controller for Web Push notification configuration and management.

  Provides endpoints for:
  - Getting VAPID public key for client-side subscription
  - Registering web push subscriptions
  - Testing web push notifications
  - Managing push preferences
  """
  use CGraphWeb, :controller

  alias CGraph.Notifications
  alias CGraph.Notifications.PushService.WebPushClient

  action_fallback CGraphWeb.FallbackController

  @doc """
  Get the VAPID public key for browser push subscription.

  This endpoint is public (no auth required) as browsers need the key
  to request push permission before user authentication.

  GET /api/v1/web-push/vapid-key
  """
  def vapid_key(conn, _params) do
    case WebPushClient.get_vapid_public_key() do
      {:ok, public_key} ->
        json(conn, %{
          data: %{
            vapid_public_key: public_key,
            # Base64URL encoded, browser-ready format
            application_server_key: public_key
          }
        })

      {:error, :not_configured} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{
          error: %{
            code: "web_push_not_configured",
            message: "Web push notifications are not configured on this server"
          }
        })
    end
  end

  @doc """
  Register a web push subscription.

  The subscription object should contain:
  - endpoint: The push service URL
  - keys.p256dh: The client public key
  - keys.auth: The authentication secret

  POST /api/v1/web-push/subscribe
  """
  def subscribe(conn, %{"subscription" => subscription} = params) do
    user = conn.assigns.current_user

    with :ok <- WebPushClient.validate_subscription(subscription) do
      # Extract subscription details for storage
      token_params = %{
        "token" => subscription["endpoint"],
        "platform" => "web",
        "device_id" => Map.get(params, "device_id", generate_device_id()),
        "device_name" => Map.get(params, "device_name", detect_browser(conn)),
        # Store full subscription as metadata for encryption
        "metadata" => %{
          "endpoint" => subscription["endpoint"],
          "keys" => subscription["keys"],
          "expiration_time" => subscription["expirationTime"]
        }
      }

      case Notifications.register_push_token(user, token_params) do
        {:ok, push_token} ->
          conn
          |> put_status(:created)
          |> json(%{
            data: %{
              id: push_token.id,
              platform: "web",
              device_name: Map.get(push_token, :device_name, push_token.device_id),
              created_at: push_token.inserted_at,
              message: "Web push subscription registered successfully"
            }
          })

        {:error, changeset} ->
          {:error, changeset}
      end
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{
          error: %{
            code: "invalid_subscription",
            message: "Invalid push subscription: #{inspect(reason)}"
          }
        })
    end
  end

  def subscribe(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      error: %{
        code: "missing_subscription",
        message: "Request must include a subscription object"
      }
    })
  end

  @doc """
  Unsubscribe from web push notifications.

  DELETE /api/v1/web-push/unsubscribe
  """
  def unsubscribe(conn, %{"endpoint" => endpoint}) do
    user = conn.assigns.current_user

    case Notifications.get_push_token_by_value(user, endpoint) do
      {:ok, push_token} ->
        case Notifications.delete_push_token(push_token) do
          {:ok, _} ->
            send_resp(conn, :no_content, "")

          {:error, _} ->
            conn
            |> put_status(:internal_server_error)
            |> json(%{error: %{message: "Failed to unsubscribe"}})
        end

      {:error, :not_found} ->
        # Already unsubscribed, that's fine
        send_resp(conn, :no_content, "")
    end
  end

  def unsubscribe(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      error: %{
        code: "missing_endpoint",
        message: "Request must include the subscription endpoint"
      }
    })
  end

  @doc """
  Test web push notification.

  Sends a test notification to verify the subscription is working.

  POST /api/v1/web-push/test
  """
  def test(conn, %{"subscription" => subscription}) do
    with :ok <- WebPushClient.validate_subscription(subscription) do
      notification = %{
        title: "CGraph Test Notification",
        body: "If you see this, web push is working! 🎉",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        data: %{
          type: "test",
          url: "/",
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      }

      case WebPushClient.send(subscription, notification) do
        :ok ->
          json(conn, %{
            data: %{
              success: true,
              message: "Test notification sent successfully"
            }
          })

        {:error, :expired} ->
          conn
          |> put_status(:gone)
          |> json(%{
            error: %{
              code: "subscription_expired",
              message: "Push subscription has expired. Please resubscribe."
            }
          })

        {:error, reason} ->
          conn
          |> put_status(:bad_gateway)
          |> json(%{
            error: %{
              code: "push_failed",
              message: "Failed to send test notification: #{inspect(reason)}"
            }
          })
      end
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{
          error: %{
            code: "invalid_subscription",
            message: "Invalid push subscription: #{inspect(reason)}"
          }
        })
    end
  end

  def test(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{
      error: %{
        code: "missing_subscription",
        message: "Request must include a subscription object for testing"
      }
    })
  end

  @doc """
  Check if web push is supported and configured.

  GET /api/v1/web-push/status
  """
  def status(conn, _params) do
    case WebPushClient.get_vapid_public_key() do
      {:ok, _} ->
        json(conn, %{
          data: %{
            supported: true,
            configured: true
          }
        })

      {:error, :not_configured} ->
        json(conn, %{
          data: %{
            supported: true,
            configured: false
          }
        })
    end
  end

  # Private helpers

  defp generate_device_id do
    :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
  end

  defp detect_browser(conn) do
    user_agent = Plug.Conn.get_req_header(conn, "user-agent") |> List.first() || ""

    cond do
      String.contains?(user_agent, "Chrome") -> "Chrome Browser"
      String.contains?(user_agent, "Firefox") -> "Firefox Browser"
      String.contains?(user_agent, "Safari") -> "Safari Browser"
      String.contains?(user_agent, "Edge") -> "Edge Browser"
      String.contains?(user_agent, "Opera") -> "Opera Browser"
      true -> "Web Browser"
    end
  end
end
