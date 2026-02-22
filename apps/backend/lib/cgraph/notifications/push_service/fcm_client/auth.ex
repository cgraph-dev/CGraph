defmodule CGraph.Notifications.PushService.FcmClient.Auth do
  @moduledoc """
  OAuth 2.0 authentication for Firebase Cloud Messaging.

  Manages service account credentials and JWT-based token exchange
  for FCM API access. Tokens are refreshed proactively before expiry.
  """

  require Logger

  alias CGraph.Notifications.PushService.FcmClient.Http

  # OAuth token scope for FCM
  @fcm_scope "https://www.googleapis.com/auth/firebase.messaging"

  # Token refresh 5 minutes before expiry
  @token_buffer_seconds 300

  @doc """
  Refreshes the OAuth access token using service account credentials.

  Returns the updated state with a new access token and expiry.
  """
  @spec refresh_access_token(map()) :: map()
  def refresh_access_token(state) do
    case get_access_token(state.config) do
      {:ok, token, expires_in} ->
        expires_at = System.monotonic_time(:second) + expires_in - @token_buffer_seconds
        Logger.debug("fcm_token_refreshed", expires_in: expires_in)
        %{state | access_token: token, token_expires_at: expires_at}

      {:error, reason} ->
        Logger.error("fcm_token_refresh_failed", reason: inspect(reason))
        state
    end
  end

  @doc """
  Ensures the current token is valid, refreshing if necessary.
  """
  @spec ensure_valid_token(map()) :: map()
  def ensure_valid_token(state) do
    if token_valid?(state) do
      state
    else
      refresh_access_token(state)
    end
  end

  @doc """
  Checks whether the current access token is still valid.
  """
  @spec token_valid?(map()) :: boolean()
  def token_valid?(state) do
    state.access_token != nil and
      state.token_expires_at != nil and
      System.monotonic_time(:second) < state.token_expires_at
  end

  @doc """
  Returns the number of seconds until the token expires.
  """
  @spec token_expires_in(map()) :: non_neg_integer()
  def token_expires_in(state) do
    if state.token_expires_at do
      max(0, state.token_expires_at - System.monotonic_time(:second))
    else
      0
    end
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp get_access_token(config) do
    service_account = load_service_account(config)

    # Create JWT for service account authentication
    private_key = service_account["private_key"]
    client_email = service_account["client_email"]
    token_uri = service_account["token_uri"] || "https://oauth2.googleapis.com/token"

    assertion = build_jwt_assertion(private_key, client_email, token_uri)
    exchange_jwt_for_token(token_uri, assertion)
  rescue
    e ->
      Logger.error("fcm_access_token_error", error: inspect(e))
      {:error, e}
  end

  defp load_service_account(config) do
    cond do
      path = config[:service_account_path] ->
        path |> File.read!() |> Jason.decode!()

      account = config[:service_account] ->
        account

      true ->
        {:error, :fcm_not_configured}
    end
  end

  defp build_jwt_assertion(private_key, client_email, token_uri) do
    now = System.system_time(:second)

    claims = %{
      "iss" => client_email,
      "sub" => client_email,
      "aud" => token_uri,
      "iat" => now,
      "exp" => now + 3600,
      "scope" => @fcm_scope
    }

    # Sign JWT with RS256
    jwk = JOSE.JWK.from_pem(private_key)
    jws = %{"alg" => "RS256"}
    {_, assertion} = JOSE.JWT.sign(jwk, jws, claims) |> JOSE.JWS.compact()
    assertion
  end

  defp exchange_jwt_for_token(token_uri, assertion) do
    body =
      URI.encode_query(%{
        "grant_type" => "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion" => assertion
      })

    headers = [{"content-type", "application/x-www-form-urlencoded"}]

    case Http.http_post(token_uri, headers, body) do
      {:ok, 200, _headers, response_body} ->
        parse_token_response(response_body)

      {:ok, status, _headers, body} ->
        Logger.error("fcm_oauth_token_failed", status: status, body: body)
        {:error, :token_request_failed}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp parse_token_response(response_body) do
    case Jason.decode(response_body) do
      {:ok, %{"access_token" => token, "expires_in" => expires_in}} ->
        {:ok, token, expires_in}

      _ ->
        {:error, :invalid_response}
    end
  end
end
