defmodule CGraph.OAuth.Providers do
  @moduledoc """
  OAuth token exchange and user info fetching for all supported providers.

  Handles the HTTP communication with OAuth providers to exchange
  authorization codes for tokens and fetch user profile information.
  """

  alias CGraph.OAuth.Apple

  require Logger

  @type provider :: :google | :apple | :facebook | :tiktok

  # Token exchange endpoints
  @google_token_url "https://oauth2.googleapis.com/token"
  @apple_token_url "https://appleid.apple.com/auth/token"
  @facebook_token_url "https://graph.facebook.com/v18.0/oauth/access_token"
  @tiktok_token_url "https://open.tiktokapis.com/v2/oauth/token/"

  # User info endpoints
  @google_userinfo_url "https://www.googleapis.com/oauth2/v3/userinfo"
  @facebook_userinfo_url "https://graph.facebook.com/v18.0/me"
  @tiktok_userinfo_url "https://open.tiktokapis.com/v2/user/info/"

  # ============================================================================
  # Token Exchange
  # ============================================================================

  @doc """
  Exchange an authorization code for tokens from the provider.
  """
  @spec exchange_code_for_tokens(provider(), Keyword.t(), String.t()) ::
          {:ok, map()} | {:error, term()}
  def exchange_code_for_tokens(:google, config, code) do
    body = %{
      code: code,
      client_id: config[:client_id],
      client_secret: config[:client_secret],
      redirect_uri: config[:redirect_uri],
      grant_type: "authorization_code"
    }

    post_request(@google_token_url, body)
  end

  def exchange_code_for_tokens(:apple, config, code) do
    client_secret = Apple.generate_client_secret(config)

    body = %{
      code: code,
      client_id: config[:client_id],
      client_secret: client_secret,
      redirect_uri: config[:redirect_uri],
      grant_type: "authorization_code"
    }

    post_request(@apple_token_url, body)
  end

  def exchange_code_for_tokens(:facebook, config, code) do
    body = %{
      code: code,
      client_id: config[:client_id],
      client_secret: config[:client_secret],
      redirect_uri: config[:redirect_uri]
    }

    post_request(@facebook_token_url, body)
  end

  def exchange_code_for_tokens(:tiktok, config, code) do
    body = %{
      code: code,
      client_key: config[:client_key],
      client_secret: config[:client_secret],
      grant_type: "authorization_code"
    }

    post_request(@tiktok_token_url, body)
  end

  # ============================================================================
  # User Info Fetching
  # ============================================================================

  @doc """
  Fetch user info from the provider using the obtained tokens.
  """
  @spec fetch_user_info(provider(), Keyword.t(), map()) ::
          {:ok, map()} | {:error, term()}
  def fetch_user_info(:google, _config, %{"access_token" => access_token}) do
    headers = [{"Authorization", "Bearer #{access_token}"}]

    case get_request(@google_userinfo_url, headers) do
      {:ok, data} ->
        {:ok, %{
          provider: :google,
          uid: data["sub"],
          email: data["email"],
          email_verified: data["email_verified"],
          name: data["name"],
          picture: data["picture"],
          raw: data
        }}
      error -> error
    end
  end

  def fetch_user_info(:apple, config, %{"id_token" => id_token}) when id_token != nil do
    case Apple.verify_id_token(id_token, config) do
      {:ok, claims} ->
        {:ok, %{
          provider: :apple,
          uid: claims["sub"],
          email: claims["email"],
          email_verified: claims["email_verified"] == "true" or claims["email_verified"] == true,
          name: nil,
          picture: nil,
          raw: claims
        }}
      {:error, reason} ->
        Logger.warning("Apple ID token verification failed", reason: inspect(reason))
        {:error, :invalid_id_token}
    end
  end

  def fetch_user_info(:apple, _config, _tokens) do
    {:error, :missing_id_token}
  end

  def fetch_user_info(:facebook, _config, %{"access_token" => access_token}) do
    url = "#{@facebook_userinfo_url}?fields=id,name,email,picture&access_token=#{access_token}"

    case get_request(url, []) do
      {:ok, data} ->
        {:ok, %{
          provider: :facebook,
          uid: data["id"],
          email: data["email"],
          email_verified: true,
          name: data["name"],
          picture: get_in(data, ["picture", "data", "url"]),
          raw: data
        }}
      error -> error
    end
  end

  def fetch_user_info(:tiktok, _config, %{"access_token" => access_token}) do
    headers = [
      {"Authorization", "Bearer #{access_token}"},
      {"Content-Type", "application/json"}
    ]

    url = "#{@tiktok_userinfo_url}?fields=open_id,avatar_url,display_name,union_id"

    case get_request(url, headers) do
      {:ok, %{"data" => %{"user" => user}}} ->
        {:ok, %{
          provider: :tiktok,
          uid: user["open_id"],
          email: nil,
          email_verified: false,
          name: user["display_name"],
          picture: user["avatar_url"],
          raw: user
        }}
      {:ok, data} ->
        Logger.warning("Unexpected TikTok response format", data: data)
        {:error, :invalid_response}
      error -> error
    end
  end

  # ============================================================================
  # HTTP Helpers
  # ============================================================================

  defp post_request(url, body) do
    headers = [{"Content-Type", "application/x-www-form-urlencoded"}]
    encoded_body = URI.encode_query(body)

    case :httpc.request(:post, {url, headers, ~c"application/x-www-form-urlencoded", encoded_body}, [], []) do
      {:ok, {{_, 200, _}, _, response_body}} ->
        {:ok, Jason.decode!(to_string(response_body))}
      {:ok, {{_, status, _}, _, response_body}} ->
        Logger.error("OAuth token request failed", status: status, body: to_string(response_body))
        {:error, {:http_error, status, to_string(response_body)}}
      {:error, reason} ->
        Logger.error("OAuth HTTP request failed", reason: inspect(reason))
        {:error, {:request_failed, reason}}
    end
  end

  defp get_request(url, extra_headers) do
    headers = extra_headers |> Enum.map(fn {k, v} -> {String.to_charlist(k), String.to_charlist(v)} end)

    case :httpc.request(:get, {url, headers}, [], []) do
      {:ok, {{_, 200, _}, _, response_body}} ->
        {:ok, Jason.decode!(to_string(response_body))}
      {:ok, {{_, status, _}, _, response_body}} ->
        Logger.error("OAuth user info request failed", status: status, body: to_string(response_body))
        {:error, {:http_error, status, to_string(response_body)}}
      {:error, reason} ->
        Logger.error("OAuth HTTP request failed", reason: inspect(reason))
        {:error, {:request_failed, reason}}
    end
  end
end
