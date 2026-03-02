defmodule CGraph.Subscriptions.IAPValidator do
  @moduledoc """
  Validates IAP receipts from Apple App Store and Google Play Store.

  Dispatches to platform-specific validation logic:
  - Apple: App Store Server API v2 (signed JWS transactions)
  - Google: Play Developer API v3 (androidpublisher purchases.subscriptions)

  After successful validation, activates the user's subscription via
  `CGraph.Subscriptions.activate_subscription/2` and records IAP-specific
  fields on the user record.
  """

  alias CGraph.Accounts.User
  alias CGraph.Subscriptions
  alias CGraph.Subscriptions.ReceiptValidation
  alias CGraph.Repo
  require Logger

  @apple_production_url "https://api.storekit.itunes.apple.com"
  @apple_sandbox_url "https://api.storekit-sandbox.itunes.apple.com"
  @google_api_url "https://androidpublisher.googleapis.com/androidpublisher/v3"

  @product_tier_map %{
    "com.cgraph.premium.monthly" => "premium",
    "com.cgraph.premium.yearly" => "premium",
    "com.cgraph.enterprise.monthly" => "enterprise",
    "com.cgraph.enterprise.yearly" => "enterprise"
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Validate a receipt and activate subscription if valid.

  Dispatches to Apple or Google validation based on the `platform` param.
  Returns `{:ok, receipt}` on success or `{:error, reason}` on failure.
  """
  @spec validate_receipt(User.t(), map()) :: {:ok, ReceiptValidation.t()} | {:error, term()}
  def validate_receipt(user, %{"platform" => "apple"} = params) do
    validate_apple(user, params)
  end

  def validate_receipt(user, %{"platform" => "google"} = params) do
    validate_google(user, params)
  end

  def validate_receipt(_user, %{"platform" => platform}) do
    {:error, {:unsupported_platform, platform}}
  end

  def validate_receipt(_user, _params) do
    {:error, :missing_platform}
  end

  @doc """
  Restore all purchases for a user by re-validating stored receipts.
  Returns the list of active receipts.
  """
  @spec restore_purchases(User.t()) :: {:ok, [ReceiptValidation.t()]}
  def restore_purchases(user) do
    import Ecto.Query

    receipts =
      ReceiptValidation
      |> where([r], r.user_id == ^user.id and r.validation_status == "valid")
      |> Repo.all()

    active_receipts =
      Enum.filter(receipts, fn receipt ->
        is_nil(receipt.expires_at) or
          DateTime.compare(receipt.expires_at, DateTime.utc_now()) == :gt
      end)

    # Re-activate subscription from best active receipt if user tier is "free"
    case {active_receipts, Subscriptions.get_tier(user)} do
      {[best | _], "free"} ->
        tier = product_id_to_tier(best.product_id)

        Subscriptions.activate_subscription(user, %{
          tier: tier,
          current_period_end: DateTime.to_unix(best.expires_at || DateTime.utc_now()),
          stripe_subscription_id: nil,
          stripe_customer_id: user.stripe_customer_id
        })

      _ ->
        :ok
    end

    {:ok, active_receipts}
  end

  @doc """
  Handle an Apple Server-to-Server notification v2.
  Processes renewal, cancellation, refund, and expiration events.
  """
  @spec handle_apple_notification(map()) :: :ok | {:error, term()}
  def handle_apple_notification(%{"notificationType" => type, "data" => data}) do
    txn_id = get_in(data, ["signedTransactionInfo", "originalTransactionId"]) || ""

    case Repo.get_by(ReceiptValidation, platform: "apple", original_transaction_id: txn_id) do
      nil ->
        Logger.warning("apple_notification_unknown_txn", transaction_id: txn_id, type: type)
        {:error, :unknown_transaction}

      receipt ->
        handle_notification_type(type, receipt)
    end
  end

  def handle_apple_notification(_), do: {:error, :invalid_notification}

  @doc """
  Handle a Google Real-Time Developer Notification (RTDN).
  Processes renewed, canceled, expired, and paused subscription events.
  """
  @spec handle_google_notification(map()) :: :ok | {:error, term()}
  def handle_google_notification(%{"subscriptionNotification" => notification}) do
    token = notification["purchaseToken"] || ""
    type = notification["notificationType"]

    case Repo.get_by(ReceiptValidation, platform: "google", original_transaction_id: token) do
      nil ->
        Logger.warning("google_notification_unknown_token", token: token, type: type)
        {:error, :unknown_transaction}

      receipt ->
        google_notification_type(type, receipt)
    end
  end

  def handle_google_notification(_), do: {:error, :invalid_notification}

  # ---------------------------------------------------------------------------
  # Apple Validation
  # ---------------------------------------------------------------------------

  defp validate_apple(user, %{"transaction_id" => txn_id} = params) do
    receipt_data = params["receipt_data"] || ""

    # Idempotency: already validated?
    case Repo.get_by(ReceiptValidation, platform: "apple", original_transaction_id: txn_id) do
      %ReceiptValidation{validation_status: "valid"} = existing ->
        {:ok, existing}

      _ ->
        case call_apple_api(txn_id) do
          {:ok, transaction_info} ->
            store_and_activate(user, "apple", txn_id, receipt_data, transaction_info)

          {:error, reason} ->
            Logger.error("apple_validation_failed", transaction_id: txn_id, reason: inspect(reason))
            {:error, reason}
        end
    end
  end

  defp validate_apple(_user, _params), do: {:error, :missing_transaction_id}

  # ---------------------------------------------------------------------------
  # Google Validation
  # ---------------------------------------------------------------------------

  defp validate_google(user, %{"purchase_token" => token, "product_id" => product_id}) do
    case Repo.get_by(ReceiptValidation, platform: "google", original_transaction_id: token) do
      %ReceiptValidation{validation_status: "valid"} = existing ->
        {:ok, existing}

      _ ->
        case call_google_api(product_id, token) do
          {:ok, subscription_info} ->
            store_and_activate(user, "google", token, token, subscription_info)

          {:error, reason} ->
            Logger.error("google_validation_failed", token: token, reason: inspect(reason))
            {:error, reason}
        end
    end
  end

  defp validate_google(_user, _params), do: {:error, :missing_purchase_token}

  # ---------------------------------------------------------------------------
  # Store & Activate
  # ---------------------------------------------------------------------------

  defp store_and_activate(user, platform, txn_id, receipt_data, info) do
    attrs = %{
      user_id: user.id,
      platform: platform,
      product_id: info.product_id,
      original_transaction_id: txn_id,
      receipt_data: receipt_data,
      validation_status: "valid",
      expires_at: info.expires_at,
      purchase_date: info.purchase_date,
      environment: info.environment,
      auto_renewing: Map.get(info, :auto_renewing, true)
    }

    changeset = ReceiptValidation.changeset(%ReceiptValidation{}, attrs)

    case Repo.insert(changeset,
           on_conflict: {:replace, [:validation_status, :expires_at, :auto_renewing, :updated_at]},
           conflict_target: [:platform, :original_transaction_id]
         ) do
      {:ok, receipt} ->
        # Activate subscription via shared path
        tier = product_id_to_tier(info.product_id)

        Subscriptions.activate_subscription(user, %{
          tier: tier,
          current_period_end: DateTime.to_unix(info.expires_at || DateTime.utc_now()),
          stripe_subscription_id: nil,
          stripe_customer_id: user.stripe_customer_id
        })

        # Set IAP-specific fields
        user
        |> User.subscription_changeset(%{iap_provider: platform, iap_transaction_id: txn_id})
        |> Repo.update()

        {:ok, receipt}

      {:error, changeset} ->
        Logger.error("iap_receipt_insert_failed", errors: inspect(changeset.errors))
        {:error, :receipt_insert_failed}
    end
  end

  # ---------------------------------------------------------------------------
  # Notification Handlers
  # ---------------------------------------------------------------------------

  defp handle_notification_type(type, receipt)
       when type in ["DID_RENEW", "SUBSCRIBED"] do
    receipt
    |> ReceiptValidation.changeset(%{validation_status: "valid"})
    |> Repo.update()

    maybe_reactivate_user(receipt)
    :ok
  end

  defp handle_notification_type("EXPIRED", receipt) do
    receipt
    |> ReceiptValidation.changeset(%{validation_status: "expired"})
    |> Repo.update()

    maybe_deactivate_user(receipt)
    :ok
  end

  defp handle_notification_type(type, receipt)
       when type in ["REFUND", "REVOKE"] do
    receipt
    |> ReceiptValidation.changeset(%{
      validation_status: "refunded",
      cancellation_date: DateTime.utc_now() |> DateTime.truncate(:second)
    })
    |> Repo.update()

    maybe_deactivate_user(receipt)
    :ok
  end

  defp handle_notification_type("DID_CHANGE_RENEWAL_STATUS", receipt) do
    receipt
    |> ReceiptValidation.changeset(%{auto_renewing: false})
    |> Repo.update()

    :ok
  end

  defp handle_notification_type(type, _receipt) do
    Logger.info("apple_notification_unhandled", type: type)
    :ok
  end

  # Google RTDN notification types (numeric)
  defp google_notification_type(type, receipt)
       when type in [2, 7] do
    # 2 = SUBSCRIPTION_RENEWED, 7 = SUBSCRIPTION_RESTARTED
    receipt
    |> ReceiptValidation.changeset(%{validation_status: "valid"})
    |> Repo.update()

    maybe_reactivate_user(receipt)
    :ok
  end

  defp google_notification_type(type, receipt)
       when type in [3, 13] do
    # 3 = SUBSCRIPTION_CANCELED, 13 = SUBSCRIPTION_EXPIRED
    receipt
    |> ReceiptValidation.changeset(%{validation_status: "expired"})
    |> Repo.update()

    maybe_deactivate_user(receipt)
    :ok
  end

  defp google_notification_type(10, receipt) do
    # 10 = SUBSCRIPTION_PAUSED
    receipt
    |> ReceiptValidation.changeset(%{auto_renewing: false})
    |> Repo.update()

    :ok
  end

  defp google_notification_type(12, receipt) do
    # 12 = SUBSCRIPTION_REVOKED
    receipt
    |> ReceiptValidation.changeset(%{validation_status: "refunded"})
    |> Repo.update()

    maybe_deactivate_user(receipt)
    :ok
  end

  defp google_notification_type(type, _receipt) do
    Logger.info("google_notification_unhandled", type: type)
    :ok
  end

  # ---------------------------------------------------------------------------
  # User Subscription Management
  # ---------------------------------------------------------------------------

  defp maybe_reactivate_user(%ReceiptValidation{user_id: user_id, product_id: product_id, expires_at: expires_at}) do
    case Repo.get(User, user_id) do
      nil -> :ok
      user ->
        tier = product_id_to_tier(product_id)

        Subscriptions.activate_subscription(user, %{
          tier: tier,
          current_period_end: DateTime.to_unix(expires_at || DateTime.utc_now()),
          stripe_subscription_id: nil,
          stripe_customer_id: user.stripe_customer_id
        })
    end
  end

  defp maybe_deactivate_user(%ReceiptValidation{user_id: user_id}) do
    case Repo.get(User, user_id) do
      nil -> :ok
      user -> Subscriptions.cancel_subscription(user)
    end
  end

  # ---------------------------------------------------------------------------
  # Apple App Store Server API v2
  # ---------------------------------------------------------------------------

  defp call_apple_api(transaction_id) do
    url = apple_base_url() <> "/inApps/v1/transactions/#{transaction_id}"

    headers = [
      {"Authorization", "Bearer #{apple_jwt_token()}"},
      {"Content-Type", "application/json"}
    ]

    case :hackney.request(:get, url, headers, "", [recv_timeout: 15_000]) do
      {:ok, 200, _headers, client_ref} ->
        {:ok, body} = :hackney.body(client_ref)
        parse_apple_response(body)

      {:ok, status, _headers, client_ref} ->
        {:ok, body} = :hackney.body(client_ref)
        Logger.error("apple_api_error", status: status, body: body)
        {:error, {:apple_api_error, status}}

      {:error, reason} ->
        Logger.error("apple_api_request_failed", reason: inspect(reason))
        {:error, {:request_failed, reason}}
    end
  end

  defp parse_apple_response(body) do
    case Jason.decode(body) do
      {:ok, %{"signedTransactionInfo" => signed_info}} ->
        # In production, decode JWS and verify Apple's signature
        # For now, extract fields from the decoded payload
        info = decode_jws_payload(signed_info)

        {:ok,
         %{
           product_id: info["productId"] || info["product_id"],
           expires_at: parse_apple_timestamp(info["expiresDate"]),
           purchase_date: parse_apple_timestamp(info["purchaseDate"]),
           environment: if(info["environment"] == "Sandbox", do: "sandbox", else: "production"),
           auto_renewing: info["autoRenewStatus"] == 1
         }}

      {:ok, _} ->
        {:error, :invalid_apple_response}

      {:error, _} ->
        {:error, :json_decode_failed}
    end
  end

  # ---------------------------------------------------------------------------
  # Google Play Developer API v3
  # ---------------------------------------------------------------------------

  defp call_google_api(product_id, purchase_token) do
    package_name = google_package_name()
    url = "#{@google_api_url}/applications/#{package_name}/purchases/subscriptions/#{product_id}/tokens/#{purchase_token}"

    headers = [
      {"Authorization", "Bearer #{google_access_token()}"},
      {"Content-Type", "application/json"}
    ]

    case :hackney.request(:get, url, headers, "", [recv_timeout: 15_000]) do
      {:ok, 200, _headers, client_ref} ->
        {:ok, body} = :hackney.body(client_ref)
        parse_google_response(body, product_id)

      {:ok, status, _headers, client_ref} ->
        {:ok, body} = :hackney.body(client_ref)
        Logger.error("google_api_error", status: status, body: body)
        {:error, {:google_api_error, status}}

      {:error, reason} ->
        Logger.error("google_api_request_failed", reason: inspect(reason))
        {:error, {:request_failed, reason}}
    end
  end

  defp parse_google_response(body, product_id) do
    case Jason.decode(body) do
      {:ok, info} ->
        {:ok,
         %{
           product_id: product_id,
           expires_at: parse_google_millis(info["expiryTimeMillis"]),
           purchase_date: parse_google_millis(info["startTimeMillis"]),
           environment: if(info["purchaseType"] == 0, do: "sandbox", else: "production"),
           auto_renewing: info["autoRenewing"] == true
         }}

      {:error, _} ->
        {:error, :json_decode_failed}
    end
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp product_id_to_tier(product_id) do
    Map.get(@product_tier_map, product_id, "premium")
  end

  defp apple_base_url do
    env = Application.get_env(:cgraph, :iap_environment, :production)
    if env == :sandbox, do: @apple_sandbox_url, else: @apple_production_url
  end

  defp apple_jwt_token do
    # Apple App Store Server API requires JWT signed with App Store Connect API Key
    # In production, generate JWT from private key configured in env
    Application.get_env(:cgraph, :apple_iap_jwt_token, "")
  end

  defp google_access_token do
    # Google Play Developer API requires OAuth2 service account token
    # In production, obtain via service account key in env
    Application.get_env(:cgraph, :google_iap_access_token, "")
  end

  defp google_package_name do
    Application.get_env(:cgraph, :google_package_name, "com.cgraph.app")
  end

  defp decode_jws_payload(jws) when is_binary(jws) do
    # JWS format: header.payload.signature
    case String.split(jws, ".") do
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

  defp decode_jws_payload(_), do: %{}

  defp parse_apple_timestamp(nil), do: DateTime.utc_now() |> DateTime.truncate(:second)

  defp parse_apple_timestamp(ms) when is_integer(ms) do
    ms
    |> div(1000)
    |> DateTime.from_unix!()
    |> DateTime.truncate(:second)
  end

  defp parse_apple_timestamp(ms) when is_binary(ms) do
    case Integer.parse(ms) do
      {val, _} -> parse_apple_timestamp(val)
      :error -> DateTime.utc_now() |> DateTime.truncate(:second)
    end
  end

  defp parse_google_millis(nil), do: DateTime.utc_now() |> DateTime.truncate(:second)

  defp parse_google_millis(ms) when is_binary(ms) do
    case Integer.parse(ms) do
      {val, _} ->
        val
        |> div(1000)
        |> DateTime.from_unix!()
        |> DateTime.truncate(:second)

      :error ->
        DateTime.utc_now() |> DateTime.truncate(:second)
    end
  end

  defp parse_google_millis(ms) when is_integer(ms) do
    ms
    |> div(1000)
    |> DateTime.from_unix!()
    |> DateTime.truncate(:second)
  end
end
