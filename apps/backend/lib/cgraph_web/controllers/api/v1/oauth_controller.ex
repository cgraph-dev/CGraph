defmodule CgraphWeb.API.V1.OAuthController do
  @moduledoc """
  OAuth 2.0 authentication controller for external providers.
  
  Supports:
  - Google (Gmail)
  - Apple (Sign in with Apple / iTunes)
  - Facebook
  - TikTok
  
  ## Web Flow
  
  1. Client calls GET /api/v1/auth/oauth/:provider
  2. Server returns authorization URL
  3. Client redirects user to authorization URL
  4. Provider redirects back to GET /api/v1/auth/oauth/:provider/callback
  5. Server exchanges code for tokens and returns JWT
  
  ## Mobile Flow
  
  1. Mobile app uses native SDK to authenticate
  2. Mobile app calls POST /api/v1/auth/oauth/:provider/mobile
  3. Server verifies token and returns JWT
  """

  use CgraphWeb, :controller

  alias Cgraph.OAuth
  alias Cgraph.Crypto
  alias CgraphWeb.API.V1.AuthJSON

  require Logger

  @valid_providers ~w(google apple facebook tiktok)

  plug :validate_provider

  @doc """
  Get the authorization URL for a provider.
  
  GET /api/v1/auth/oauth/:provider
  
  Returns:
  - `authorization_url` - URL to redirect user to
  - `state` - State parameter to verify on callback
  """
  def authorize(conn, %{"provider" => provider}) do
    state = generate_state()
    provider_atom = String.to_existing_atom(provider)
    
    case OAuth.authorize_url(provider_atom, state) do
      {:ok, url} ->
        # Store state in session for verification
        conn
        |> put_session(:oauth_state, state)
        |> put_session(:oauth_provider, provider)
        |> json(%{
          authorization_url: url,
          state: state,
          provider: provider
        })
        
      {:error, :provider_not_configured} ->
        conn
        |> put_status(:service_unavailable)
        |> json(%{error: "#{provider} authentication is not configured"})
        
      {:error, reason} ->
        Logger.error("OAuth authorize failed", provider: provider, reason: inspect(reason))
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to generate authorization URL"})
    end
  end

  @doc """
  Handle the OAuth callback from the provider.
  
  GET /api/v1/auth/oauth/:provider/callback
  
  Query parameters:
  - `code` - Authorization code from provider
  - `state` - State parameter for CSRF verification
  
  For Apple (form_post):
  - Also accepts POST with form data
  """
  def callback(conn, %{"provider" => provider, "code" => code, "state" => state}) do
    stored_state = get_session(conn, :oauth_state)
    
    # Verify state to prevent CSRF
    if state != stored_state do
      Logger.warning("OAuth state mismatch", expected: stored_state, received: state)
      
      conn
      |> clear_oauth_session()
      |> put_status(:bad_request)
      |> json(%{error: "Invalid state parameter"})
    else
      provider_atom = String.to_existing_atom(provider)
      
      case OAuth.callback(provider_atom, code, state) do
        {:ok, %{user: user, tokens: tokens}} ->
          conn
          |> clear_oauth_session()
          |> put_status(:ok)
          |> render(:auth_response, user: user, tokens: tokens)
          
        {:error, :user_banned} ->
          conn
          |> clear_oauth_session()
          |> put_status(:forbidden)
          |> json(%{error: "Account has been banned"})
          
        {:error, :user_suspended} ->
          conn
          |> clear_oauth_session()
          |> put_status(:forbidden)
          |> json(%{error: "Account is suspended"})
          
        {:error, reason} ->
          Logger.error("OAuth callback failed", provider: provider, reason: inspect(reason))
          
          conn
          |> clear_oauth_session()
          |> put_status(:unauthorized)
          |> json(%{error: "Authentication failed", details: format_error(reason)})
      end
    end
  end

  def callback(conn, %{"provider" => provider, "error" => error}) do
    # Handle OAuth errors (user denied, etc.)
    Logger.info("OAuth authorization denied", provider: provider, error: error)
    
    error_description = conn.params["error_description"] || "Authorization was denied"
    
    conn
    |> clear_oauth_session()
    |> put_status(:unauthorized)
    |> json(%{error: error_description})
  end

  def callback(conn, %{"provider" => _provider}) do
    conn
    |> clear_oauth_session()
    |> put_status(:bad_request)
    |> json(%{error: "Missing authorization code"})
  end

  @doc """
  Mobile OAuth authentication.
  
  POST /api/v1/auth/oauth/:provider/mobile
  
  Body:
  - `access_token` - Access token from native SDK
  - `id_token` - ID token (required for Apple, optional for others)
  - `user_data` - Additional user data from SDK (name, etc.)
  """
  def mobile(conn, %{"provider" => provider, "access_token" => access_token} = params) do
    provider_atom = String.to_existing_atom(provider)
    id_token = params["id_token"]
    
    case OAuth.mobile_callback(provider_atom, access_token, id_token) do
      {:ok, %{user: user, tokens: tokens}} ->
        conn
        |> put_status(:ok)
        |> render(:auth_response, user: user, tokens: tokens)
        
      {:error, :user_banned} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Account has been banned"})
        
      {:error, :user_suspended} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Account is suspended"})
        
      {:error, reason} ->
        Logger.error("Mobile OAuth failed", provider: provider, reason: inspect(reason))
        
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication failed", details: format_error(reason)})
    end
  end

  def mobile(conn, %{"provider" => _provider}) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing access_token"})
  end

  @doc """
  List available OAuth providers.
  
  GET /api/v1/auth/oauth/providers
  """
  def list_providers(conn, _params) do
    providers = OAuth.configured_providers()
    |> Enum.map(fn provider ->
      %{
        id: provider,
        name: provider_display_name(provider),
        enabled: true
      }
    end)
    
    json(conn, %{providers: providers})
  end

  @doc """
  Link an OAuth account to the current user.
  
  POST /api/v1/auth/oauth/:provider/link
  
  Requires authentication.
  """
  def link(conn, %{"provider" => provider, "access_token" => access_token} = params) do
    user = conn.assigns.current_user
    provider_atom = String.to_existing_atom(provider)
    id_token = params["id_token"]
    
    # First verify the token and get user info
    tokens = %{"access_token" => access_token, "id_token" => id_token}
    
    with {:ok, user_info} <- get_user_info_from_tokens(provider_atom, tokens),
         {:ok, updated_user} <- OAuth.link_account(user, provider_atom, user_info.uid, user_info) do
      conn
      |> put_status(:ok)
      |> json(%{
        message: "#{provider_display_name(provider_atom)} account linked successfully",
        user: AuthJSON.user_json(updated_user)
      })
    else
      {:error, :already_linked} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "This #{provider_display_name(provider_atom)} account is already linked to another user"})
        
      {:error, reason} ->
        Logger.error("OAuth link failed", provider: provider, reason: inspect(reason))
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Failed to link account"})
    end
  end

  @doc """
  Unlink an OAuth account from the current user.
  
  DELETE /api/v1/auth/oauth/:provider/link
  
  Requires authentication.
  """
  def unlink(conn, %{"provider" => provider}) do
    user = conn.assigns.current_user
    provider_atom = String.to_existing_atom(provider)
    
    case OAuth.unlink_account(user, provider_atom) do
      {:ok, _user} ->
        conn
        |> put_status(:ok)
        |> json(%{message: "#{provider_display_name(provider_atom)} account unlinked successfully"})
        
      {:error, :cannot_unlink_only_auth_method} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Cannot unlink your only authentication method. Add a password or link another account first."})
        
      {:error, reason} ->
        Logger.error("OAuth unlink failed", provider: provider, reason: inspect(reason))
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Failed to unlink account"})
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp validate_provider(conn, _opts) do
    provider = conn.params["provider"]
    
    cond do
      provider == nil ->
        conn
        
      provider in @valid_providers ->
        conn
        
      true ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid provider. Supported: #{Enum.join(@valid_providers, ", ")}"})
        |> halt()
    end
  end

  defp generate_state do
    Crypto.generate_token(32)
  end

  defp clear_oauth_session(conn) do
    conn
    |> delete_session(:oauth_state)
    |> delete_session(:oauth_provider)
  end

  defp provider_display_name(:google), do: "Google"
  defp provider_display_name(:apple), do: "Apple"
  defp provider_display_name(:facebook), do: "Facebook"
  defp provider_display_name(:tiktok), do: "TikTok"
  defp provider_display_name(provider), do: to_string(provider) |> String.capitalize()

  defp format_error({:http_error, status, body}), do: "HTTP #{status}: #{body}"
  defp format_error({:invalid_provider, provider}), do: "Invalid provider: #{provider}"
  defp format_error(:missing_id_token), do: "ID token is required for this provider"
  defp format_error(:provider_not_configured), do: "Provider is not configured"
  defp format_error(:invalid_token), do: "Invalid or expired token"
  defp format_error(reason) when is_atom(reason), do: to_string(reason)
  defp format_error(_reason), do: "Unknown error"

  # Helper to get user info from tokens for linking
  defp get_user_info_from_tokens(:google, %{"access_token" => token}) do
    url = "https://www.googleapis.com/oauth2/v3/userinfo"
    headers = [{~c"Authorization", String.to_charlist("Bearer #{token}")}]
    
    case :httpc.request(:get, {String.to_charlist(url), headers}, [], []) do
      {:ok, {{_, 200, _}, _, body}} ->
        data = Jason.decode!(to_string(body))
        {:ok, %{uid: data["sub"], email: data["email"], name: data["name"], picture: data["picture"]}}
      _ ->
        {:error, :invalid_token}
    end
  end

  defp get_user_info_from_tokens(:apple, %{"id_token" => token}) when token != nil do
    case decode_apple_id_token(token) do
      {:ok, claims} ->
        {:ok, %{uid: claims["sub"], email: claims["email"], name: nil, picture: nil}}
      _ ->
        {:error, :invalid_token}
    end
  end

  defp get_user_info_from_tokens(:facebook, %{"access_token" => token}) do
    url = "https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=#{token}"
    
    case :httpc.request(:get, {String.to_charlist(url), []}, [], []) do
      {:ok, {{_, 200, _}, _, body}} ->
        data = Jason.decode!(to_string(body))
        {:ok, %{uid: data["id"], email: data["email"], name: data["name"], picture: get_in(data, ["picture", "data", "url"])}}
      _ ->
        {:error, :invalid_token}
    end
  end

  defp get_user_info_from_tokens(:tiktok, %{"access_token" => token}) do
    url = "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name"
    headers = [{"Authorization", "Bearer #{token}"}]
    
    case :httpc.request(:get, {String.to_charlist(url), headers}, [], []) do
      {:ok, {{_, 200, _}, _, body}} ->
        data = Jason.decode!(to_string(body))
        user = get_in(data, ["data", "user"]) || %{}
        {:ok, %{uid: user["open_id"], email: nil, name: user["display_name"], picture: user["avatar_url"]}}
      _ ->
        {:error, :invalid_token}
    end
  end

  defp get_user_info_from_tokens(_, _), do: {:error, :invalid_token}

  defp decode_apple_id_token(token) do
    case String.split(token, ".") do
      [_header, payload, _signature] ->
        case Base.url_decode64(payload, padding: false) do
          {:ok, json} -> {:ok, Jason.decode!(json)}
          :error -> {:error, :invalid_jwt}
        end
      _ ->
        {:error, :invalid_jwt}
    end
  end
end
