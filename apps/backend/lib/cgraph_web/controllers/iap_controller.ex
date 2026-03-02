defmodule CGraphWeb.IAPController do
  @moduledoc """
  Controller for In-App Purchase receipt validation and server notifications.

  ## Endpoints

  - `POST /api/v1/iap/validate` — Validate receipt from mobile (authenticated)
  - `POST /api/v1/iap/restore` — Restore purchases for user (authenticated)
  - `POST /api/v1/iap/notifications/apple` — Apple S2S notification v2
  - `POST /api/v1/iap/notifications/google` — Google RTDN
  """

  use CGraphWeb, :controller
  require Logger

  alias CGraph.Subscriptions.IAPValidator

  # ---------------------------------------------------------------------------
  # Authenticated Endpoints
  # ---------------------------------------------------------------------------

  @doc """
  Validate an IAP receipt from mobile and activate subscription.

  Expects JSON body:
  - `platform` — "apple" | "google"
  - `transaction_id` — Apple transaction ID or Google order ID
  - `receipt_data` — raw receipt / transaction receipt
  - `product_id` — SKU identifier
  - `purchase_token` — Google Play purchase token (Google only)
  """
  @spec validate(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def validate(conn, params) do
    user = conn.assigns.current_user

    case IAPValidator.validate_receipt(user, params) do
      {:ok, receipt} ->
        Logger.info("iap_receipt_validated",
          user_id: user.id,
          platform: receipt.platform,
          product_id: receipt.product_id
        )

        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          data: %{
            platform: receipt.platform,
            product_id: receipt.product_id,
            validation_status: receipt.validation_status,
            expires_at: receipt.expires_at && DateTime.to_iso8601(receipt.expires_at)
          }
        })

      {:error, reason} ->
        Logger.warning("iap_receipt_validation_failed",
          user_id: user.id,
          reason: inspect(reason)
        )

        conn
        |> put_status(:unprocessable_entity)
        |> json(%{
          success: false,
          error: format_error(reason)
        })
    end
  end

  @doc """
  Restore purchases for the authenticated user.

  Re-validates all stored receipts and restores subscription state.
  """
  @spec restore(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def restore(conn, _params) do
    user = conn.assigns.current_user

    case IAPValidator.restore_purchases(user) do
      {:ok, receipts} ->
        Logger.info("iap_purchases_restored",
          user_id: user.id,
          count: length(receipts)
        )

        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          data: %{
            restored_count: length(receipts),
            receipts:
              Enum.map(receipts, fn r ->
                %{
                  platform: r.platform,
                  product_id: r.product_id,
                  expires_at: r.expires_at && DateTime.to_iso8601(r.expires_at)
                }
              end)
          }
        })

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{success: false, error: format_error(reason)})
    end
  end

  # ---------------------------------------------------------------------------
  # Server-to-Server Notification Endpoints (Unauthenticated)
  # ---------------------------------------------------------------------------

  @doc """
  Apple Server-to-Server Notification v2.

  Handles: DID_RENEW, DID_CHANGE_RENEWAL_STATUS, REFUND, EXPIRED, REVOKE, SUBSCRIBED.
  Payload is a signed JWS — must verify Apple's signature before processing.
  """
  @spec apple_notification(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def apple_notification(conn, params) do
    # In production, verify Apple's JWS signature on signedPayload
    notification = decode_apple_notification(params)

    case IAPValidator.handle_apple_notification(notification) do
      :ok ->
        Logger.info("apple_s2s_notification_processed",
          type: notification["notificationType"]
        )

        conn |> put_status(:ok) |> json(%{received: true})

      {:error, reason} ->
        Logger.warning("apple_s2s_notification_failed", reason: inspect(reason))
        conn |> put_status(:ok) |> json(%{received: true, error: true})
    end
  end

  @doc """
  Google Real-Time Developer Notification (RTDN).

  Handles: SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELED, SUBSCRIPTION_EXPIRED,
  SUBSCRIPTION_PAUSED, SUBSCRIPTION_REVOKED.
  Payload is a Pub/Sub message — must verify Google's OAuth token.
  """
  @spec google_notification(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def google_notification(conn, params) do
    # Google RTDN arrives as a Pub/Sub push message
    notification = decode_google_notification(params)

    case IAPValidator.handle_google_notification(notification) do
      :ok ->
        Logger.info("google_rtdn_notification_processed",
          type: get_in(notification, ["subscriptionNotification", "notificationType"])
        )

        conn |> put_status(:ok) |> json(%{received: true})

      {:error, reason} ->
        Logger.warning("google_rtdn_notification_failed", reason: inspect(reason))
        conn |> put_status(:ok) |> json(%{received: true, error: true})
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp decode_apple_notification(%{"signedPayload" => signed_payload}) do
    # Apple S2S v2: decode JWS payload
    case String.split(signed_payload, ".") do
      [_header, payload | _] ->
        case Base.url_decode64(payload, padding: false) do
          {:ok, decoded} ->
            case Jason.decode(decoded) do
              {:ok, map} -> map
              _ -> %{}
            end

          _ ->
            %{}
        end

      _ ->
        %{}
    end
  end

  defp decode_apple_notification(params), do: params

  defp decode_google_notification(%{"message" => %{"data" => data}}) when is_binary(data) do
    case Base.decode64(data) do
      {:ok, decoded} ->
        case Jason.decode(decoded) do
          {:ok, map} -> map
          _ -> %{}
        end

      _ ->
        %{}
    end
  end

  defp decode_google_notification(params), do: params

  defp format_error({:unsupported_platform, platform}), do: "Unsupported platform: #{platform}"
  defp format_error(:missing_platform), do: "Missing platform parameter"
  defp format_error(:missing_transaction_id), do: "Missing transaction_id parameter"
  defp format_error(:missing_purchase_token), do: "Missing purchase_token or product_id parameter"
  defp format_error({:apple_api_error, status}), do: "Apple API error (#{status})"
  defp format_error({:google_api_error, status}), do: "Google API error (#{status})"
  defp format_error(:receipt_insert_failed), do: "Failed to store receipt"
  defp format_error(reason), do: inspect(reason)
end
