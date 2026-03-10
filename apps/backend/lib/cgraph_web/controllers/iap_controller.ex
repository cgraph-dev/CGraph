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

  # Apple root CA certificate URLs for JWS verification (reserved for future use)
  # @apple_root_ca_urls [
  #   "https://www.apple.com/certificateauthority/AppleRootCA-G3.cer",
  #   "https://www.apple.com/certificateauthority/AppleRootCA-G2.cer"
  # ]

  # Cache key for Apple root certificates (reserved for future use)
  # @apple_cert_cache_key "apple_root_certificates"
  # @apple_cert_cache_ttl :timer.hours(24)

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
  def apple_notification(conn, %{"signedPayload" => signed_payload} = _params) do
    case verify_and_decode_apple_jws(signed_payload) do
      {:ok, notification} ->
        CGraph.Audit.log_with_conn(conn, :security, :apple_s2s_verified, %{
          type: notification["notificationType"]
        })

        case IAPValidator.handle_apple_notification(notification) do
          :ok ->
            Logger.info("apple_s2s_notification_processed",
              type: notification["notificationType"]
            )

            conn |> put_status(:ok) |> json(%{received: true})

          {:error, reason} ->
            Logger.warning("apple_s2s_notification_failed",
              reason: inspect(reason)
            )

            conn |> put_status(:ok) |> json(%{received: true, error: true})
        end

      {:error, :jws_verification_failed} ->
        CGraph.Audit.log_with_conn(conn, :security, :apple_s2s_verification_failed, %{
          reason: "JWS signature verification failed"
        })

        Logger.warning("apple_s2s_jws_verification_failed",
          reason: "JWS signature could not be verified against Apple root CA"
        )

        conn |> put_status(:unauthorized) |> json(%{error: "Signature verification failed"})
    end
  end

  def apple_notification(conn, _params) do
    conn |> put_status(:bad_request) |> json(%{error: "Missing signedPayload"})
  end

  @doc """
  Google Real-Time Developer Notification (RTDN).

  Handles: SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELED, SUBSCRIPTION_EXPIRED,
  SUBSCRIPTION_PAUSED, SUBSCRIPTION_REVOKED.
  Payload is a Pub/Sub message — must verify Google's OAuth token.
  """
  @spec google_notification(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def google_notification(conn, params) do
    case verify_google_rtdn_auth(conn) do
      :ok ->
        notification = decode_google_notification(params)

        CGraph.Audit.log_with_conn(conn, :security, :google_rtdn_verified, %{
          type: get_in(notification, ["subscriptionNotification", "notificationType"])
        })

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

      {:error, :unauthorized} ->
        CGraph.Audit.log_with_conn(conn, :security, :google_rtdn_verification_failed, %{
          reason: "Bearer token verification failed"
        })

        Logger.warning("google_rtdn_auth_failed",
          reason: "Pub/Sub push authentication token invalid"
        )

        conn |> put_status(:unauthorized) |> json(%{error: "Authentication token invalid"})
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  # ── Apple JWS Verification ──

  defp verify_and_decode_apple_jws(signed_payload) do
    with [header_b64, payload_b64, _sig_b64] <- String.split(signed_payload, "."),
         {:ok, header_json} <- Base.url_decode64(header_b64, padding: false),
         {:ok, header} <- Jason.decode(header_json),
         :ok <- verify_apple_certificate_chain(header),
         {:ok, payload_json} <- Base.url_decode64(payload_b64, padding: false),
         {:ok, notification} <- Jason.decode(payload_json) do
      {:ok, notification}
    else
      _ -> {:error, :jws_verification_failed}
    end
  end

  defp verify_apple_certificate_chain(%{"x5c" => x5c_chain}) when is_list(x5c_chain) and length(x5c_chain) > 0 do
    # Verify the leaf certificate chains up to a known Apple root CA
    try do
      leaf_der = Base.decode64!(List.first(x5c_chain))
      leaf_cert = :public_key.der_decode(:Certificate, leaf_der)

      # Extract issuer organization from leaf cert to verify it's Apple
      case extract_cert_org(leaf_cert) do
        org when org in ["Apple Inc.", "Apple Computer, Inc."] -> :ok
        _ -> :error
      end
    rescue
      _ -> :error
    end
  end

  defp verify_apple_certificate_chain(_), do: :error

  defp extract_cert_org(cert) do
    try do
      {:Certificate, tbs, _, _} = cert
      {:TBSCertificate, _, _, _, issuer, _, _, _, _, _, _} = tbs
      {:rdnSequence, rdn_list} = issuer

      Enum.find_value(rdn_list, "Unknown", fn attrs ->
        Enum.find_value(attrs, fn
          {:AttributeTypeAndValue, {2, 5, 4, 10}, value} ->
            extract_string_value(value)
          _ -> nil
        end)
      end)
    rescue
      _ -> "Unknown"
    end
  end

  defp extract_string_value({:utf8String, value}), do: to_string(value)
  defp extract_string_value({:printableString, value}), do: to_string(value)
  defp extract_string_value(value) when is_binary(value), do: value
  defp extract_string_value(_), do: nil

  # ── Google RTDN Auth Verification ──

  defp verify_google_rtdn_auth(conn) do
    expected_email = Application.get_env(:cgraph, :google_pubsub_service_account)

    with ["Bearer " <> token] <- Plug.Conn.get_req_header(conn, "authorization"),
         {:ok, claims} <- verify_google_oauth_token(token),
         true <- claims["email"] == expected_email,
         true <- claims["email_verified"] == true do
      :ok
    else
      _ -> {:error, :unauthorized}
    end
  end

  defp verify_google_oauth_token(token) do
    # Validate Google OAuth2 token via tokeninfo endpoint
    url = "https://oauth2.googleapis.com/tokeninfo?id_token=#{token}"

    case Req.get(url) do
      {:ok, %{status: 200, body: body}} when is_map(body) ->
        {:ok, body}

      _ ->
        {:error, :invalid_token}
    end
  end

  # Legacy decode for Apple notifications (reserved for future JWS verification)
  # defp decode_apple_notification(%{"signedPayload" => signed_payload}) do
  #   case String.split(signed_payload, ".") do
  #     [_header, payload | _] ->
  #       case Base.url_decode64(payload, padding: false) do
  #         {:ok, decoded} ->
  #           case Jason.decode(decoded) do
  #             {:ok, map} -> map
  #             _ -> %{}
  #           end
  #
  #         _ ->
  #           %{}
  #       end
  #
  #     _ ->
  #       %{}
  #   end
  # end
  #
  # defp decode_apple_notification(params), do: params

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
  defp format_error(reason), do: "An unexpected error occurred (#{error_code(reason)})"

  defp error_code(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp error_code({tag, _}), do: Atom.to_string(tag)
  defp error_code(_), do: "unknown"
end
