defmodule Cgraph.OAuth do
  @moduledoc """
  OAuth 2.0 authentication module supporting Google, Apple, Facebook, and TikTok.
  
  This module handles:
  - Authorization URL generation for OAuth flows
  - Token exchange and user info retrieval
  - User creation/linking based on OAuth provider data
  
  ## Supported Providers
  
  - `:google` - Google OAuth 2.0 (Gmail)
  - `:apple` - Sign in with Apple (iTunes)
  - `:facebook` - Facebook Login
  - `:tiktok` - TikTok Login
  
  ## Configuration
  
  OAuth credentials are configured in config/runtime.exs:
  
      config :cgraph, :oauth,
        google: [
          client_id: "your-client-id",
          client_secret: "your-client-secret",
          redirect_uri: "https://your-app.com/api/v1/auth/oauth/google/callback"
        ],
        # ... other providers
  """

  alias Cgraph.{Accounts, Repo}
  alias Cgraph.Accounts.User
  alias Cgraph.Guardian

  require Logger

  @type provider :: :google | :apple | :facebook | :tiktok
  @type oauth_result :: {:ok, map()} | {:error, term()}

  # Provider-specific OIDC/OAuth configurations
  @google_authorize_url "https://accounts.google.com/o/oauth2/v2/auth"
  @google_token_url "https://oauth2.googleapis.com/token"
  @google_userinfo_url "https://www.googleapis.com/oauth2/v3/userinfo"

  @apple_authorize_url "https://appleid.apple.com/auth/authorize"
  @apple_token_url "https://appleid.apple.com/auth/token"

  @facebook_authorize_url "https://www.facebook.com/v18.0/dialog/oauth"
  @facebook_token_url "https://graph.facebook.com/v18.0/oauth/access_token"
  @facebook_userinfo_url "https://graph.facebook.com/v18.0/me"

  @tiktok_authorize_url "https://www.tiktok.com/v2/auth/authorize"
  @tiktok_token_url "https://open.tiktokapis.com/v2/oauth/token/"
  @tiktok_userinfo_url "https://open.tiktokapis.com/v2/user/info/"

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Generate an authorization URL for the given OAuth provider.
  
  Returns a URL that the client should redirect to for OAuth authorization.
  The state parameter should be stored and verified when handling the callback.
  
  ## Parameters
  
  - `provider` - The OAuth provider (`:google`, `:apple`, `:facebook`, `:tiktok`)
  - `state` - A unique state string for CSRF protection
  
  ## Returns
  
  - `{:ok, url}` - The authorization URL
  - `{:error, reason}` - If the provider is not configured
  
  ## Example
  
      {:ok, url} = Cgraph.OAuth.authorize_url(:google, "random-state-string")
  """
  @spec authorize_url(provider(), String.t()) :: {:ok, String.t()} | {:error, term()}
  def authorize_url(provider, state) when provider in [:google, :apple, :facebook, :tiktok] do
    config = get_provider_config(provider)
    
    if config_valid?(provider, config) do
      url = build_authorize_url(provider, config, state)
      {:ok, url}
    else
      {:error, :provider_not_configured}
    end
  end

  def authorize_url(provider, _state), do: {:error, {:invalid_provider, provider}}

  @doc """
  Exchange an authorization code for tokens and user info.
  
  This function:
  1. Exchanges the authorization code for access/refresh tokens
  2. Fetches user info from the provider
  3. Creates or updates a user in the database
  4. Returns JWT tokens for the authenticated user
  
  ## Parameters
  
  - `provider` - The OAuth provider
  - `code` - The authorization code from the OAuth callback
  - `state` - The state parameter (should be verified by caller)
  
  ## Returns
  
  - `{:ok, %{user: user, tokens: tokens}}` - Success
  - `{:error, reason}` - Failure
  """
  @spec callback(provider(), String.t(), String.t()) :: oauth_result()
  def callback(provider, code, _state) when provider in [:google, :apple, :facebook, :tiktok] do
    config = get_provider_config(provider)
    
    with {:ok, tokens} <- exchange_code_for_tokens(provider, config, code),
         {:ok, user_info} <- fetch_user_info(provider, config, tokens),
         {:ok, user} <- find_or_create_user(provider, user_info),
         {:ok, jwt_tokens} <- Guardian.generate_tokens(user) do
      
      Logger.info("OAuth login successful", provider: provider, user_id: user.id)
      
      {:ok, %{
        user: user,
        tokens: jwt_tokens
      }}
    else
      {:error, reason} = error ->
        Logger.error("OAuth callback failed", provider: provider, reason: inspect(reason))
        error
    end
  end

  def callback(provider, _code, _state), do: {:error, {:invalid_provider, provider}}

  @doc """
  Get a mobile-friendly token for OAuth providers.
  
  Mobile apps typically handle OAuth differently - they get tokens directly
  from the native SDK and send them to the backend for verification.
  
  ## Parameters
  
  - `provider` - The OAuth provider
  - `access_token` - The access token from the mobile SDK
  - `id_token` - (Optional) The ID token for providers that support it (Apple, Google)
  
  ## Returns
  
  - `{:ok, %{user: user, tokens: tokens}}` - Success
  - `{:error, reason}` - Failure
  """
  @spec mobile_callback(provider(), String.t(), String.t() | nil) :: oauth_result()
  def mobile_callback(provider, access_token, id_token \\ nil) 
      when provider in [:google, :apple, :facebook, :tiktok] do
    config = get_provider_config(provider)
    
    tokens = %{
      "access_token" => access_token,
      "id_token" => id_token
    }
    
    with {:ok, user_info} <- fetch_user_info(provider, config, tokens),
         {:ok, user} <- find_or_create_user(provider, user_info),
         {:ok, jwt_tokens} <- Guardian.generate_tokens(user) do
      
      Logger.info("Mobile OAuth login successful", provider: provider, user_id: user.id)
      
      {:ok, %{
        user: user,
        tokens: jwt_tokens
      }}
    else
      {:error, reason} = error ->
        Logger.error("Mobile OAuth callback failed", provider: provider, reason: inspect(reason))
        error
    end
  end

  def mobile_callback(provider, _access_token, _id_token), 
    do: {:error, {:invalid_provider, provider}}

  @doc """
  Link an OAuth account to an existing user.
  
  ## Parameters
  
  - `user` - The existing user
  - `provider` - The OAuth provider
  - `provider_uid` - The unique ID from the provider
  - `provider_data` - Additional data from the provider
  """
  @spec link_account(User.t(), provider(), String.t(), map()) :: {:ok, User.t()} | {:error, term()}
  def link_account(%User{} = user, provider, provider_uid, provider_data) do
    attrs = %{
      oauth_provider: to_string(provider),
      oauth_uid: provider_uid,
      oauth_data: Map.merge(user.oauth_data || %{}, %{
        to_string(provider) => %{
          uid: provider_uid,
          data: provider_data,
          linked_at: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      })
    }
    
    user
    |> User.oauth_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Unlink an OAuth account from an existing user.
  
  Only allows unlinking if the user has another authentication method.
  """
  @spec unlink_account(User.t(), provider()) :: {:ok, User.t()} | {:error, term()}
  def unlink_account(%User{} = user, provider) do
    provider_key = to_string(provider)
    
    # Check if user has another auth method
    has_password = user.password_hash != nil
    has_other_oauth = user.oauth_data && Map.keys(user.oauth_data) -- [provider_key] != []
    has_wallet = user.wallet_address != nil
    
    if has_password or has_other_oauth or has_wallet do
      new_oauth_data = Map.delete(user.oauth_data || %{}, provider_key)
      
      attrs = if user.oauth_provider == provider_key do
        # If this was the primary OAuth provider, clear it
        %{oauth_provider: nil, oauth_uid: nil, oauth_data: new_oauth_data}
      else
        %{oauth_data: new_oauth_data}
      end
      
      user
      |> User.oauth_changeset(attrs)
      |> Repo.update()
    else
      {:error, :cannot_unlink_only_auth_method}
    end
  end

  @doc """
  List all supported OAuth providers.
  """
  @spec list_providers() :: [provider()]
  def list_providers, do: [:google, :apple, :facebook, :tiktok]

  @doc """
  Check if a provider is configured and ready to use.
  """
  @spec provider_configured?(provider()) :: boolean()
  def provider_configured?(provider) do
    config = get_provider_config(provider)
    config_valid?(provider, config)
  end

  @doc """
  Get configured providers (useful for showing available login options).
  """
  @spec configured_providers() :: [provider()]
  def configured_providers do
    list_providers()
    |> Enum.filter(&provider_configured?/1)
  end

  # ============================================================================
  # Private Functions - Authorization URL Building
  # ============================================================================

  defp get_provider_config(provider) do
    Application.get_env(:cgraph, :oauth, [])
    |> Keyword.get(provider, [])
  end

  defp config_valid?(:google, config) do
    config[:client_id] not in [nil, ""] and 
    config[:client_secret] not in [nil, ""]
  end

  defp config_valid?(:apple, config) do
    config[:client_id] not in [nil, ""] and 
    config[:team_id] not in [nil, ""] and
    config[:key_id] not in [nil, ""]
  end

  defp config_valid?(:facebook, config) do
    config[:client_id] not in [nil, ""] and 
    config[:client_secret] not in [nil, ""]
  end

  defp config_valid?(:tiktok, config) do
    config[:client_key] not in [nil, ""] and 
    config[:client_secret] not in [nil, ""]
  end

  defp build_authorize_url(:google, config, state) do
    params = %{
      client_id: config[:client_id],
      redirect_uri: config[:redirect_uri],
      response_type: "code",
      scope: "openid email profile",
      state: state,
      access_type: "offline",
      prompt: "consent"
    }
    
    @google_authorize_url <> "?" <> URI.encode_query(params)
  end

  defp build_authorize_url(:apple, config, state) do
    params = %{
      client_id: config[:client_id],
      redirect_uri: config[:redirect_uri],
      response_type: "code id_token",
      scope: "name email",
      state: state,
      response_mode: "form_post"
    }
    
    @apple_authorize_url <> "?" <> URI.encode_query(params)
  end

  defp build_authorize_url(:facebook, config, state) do
    params = %{
      client_id: config[:client_id],
      redirect_uri: config[:redirect_uri],
      response_type: "code",
      scope: "email,public_profile",
      state: state
    }
    
    @facebook_authorize_url <> "?" <> URI.encode_query(params)
  end

  defp build_authorize_url(:tiktok, config, state) do
    params = %{
      client_key: config[:client_key],
      redirect_uri: config[:redirect_uri],
      response_type: "code",
      scope: "user.info.basic",
      state: state
    }
    
    @tiktok_authorize_url <> "?" <> URI.encode_query(params)
  end

  # ============================================================================
  # Private Functions - Token Exchange
  # ============================================================================

  defp exchange_code_for_tokens(:google, config, code) do
    body = %{
      code: code,
      client_id: config[:client_id],
      client_secret: config[:client_secret],
      redirect_uri: config[:redirect_uri],
      grant_type: "authorization_code"
    }
    
    post_request(@google_token_url, body)
  end

  defp exchange_code_for_tokens(:apple, config, code) do
    client_secret = generate_apple_client_secret(config)
    
    body = %{
      code: code,
      client_id: config[:client_id],
      client_secret: client_secret,
      redirect_uri: config[:redirect_uri],
      grant_type: "authorization_code"
    }
    
    post_request(@apple_token_url, body)
  end

  defp exchange_code_for_tokens(:facebook, config, code) do
    body = %{
      code: code,
      client_id: config[:client_id],
      client_secret: config[:client_secret],
      redirect_uri: config[:redirect_uri]
    }
    
    post_request(@facebook_token_url, body)
  end

  defp exchange_code_for_tokens(:tiktok, config, code) do
    body = %{
      code: code,
      client_key: config[:client_key],
      client_secret: config[:client_secret],
      grant_type: "authorization_code"
    }
    
    post_request(@tiktok_token_url, body)
  end

  # ============================================================================
  # Private Functions - User Info Fetching
  # ============================================================================

  defp fetch_user_info(:google, _config, %{"access_token" => access_token}) do
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

  defp fetch_user_info(:apple, _config, %{"id_token" => id_token}) when id_token != nil do
    # Apple ID tokens are JWTs - decode without verification for user info
    # In production, verify the signature using Apple's public keys
    case decode_jwt(id_token) do
      {:ok, claims} ->
        {:ok, %{
          provider: :apple,
          uid: claims["sub"],
          email: claims["email"],
          email_verified: claims["email_verified"] == "true",
          name: nil, # Apple only provides name on first login via form_post
          picture: nil,
          raw: claims
        }}
      error -> error
    end
  end

  defp fetch_user_info(:apple, _config, _tokens) do
    {:error, :missing_id_token}
  end

  defp fetch_user_info(:facebook, _config, %{"access_token" => access_token}) do
    url = "#{@facebook_userinfo_url}?fields=id,name,email,picture&access_token=#{access_token}"
    
    case get_request(url, []) do
      {:ok, data} ->
        {:ok, %{
          provider: :facebook,
          uid: data["id"],
          email: data["email"],
          email_verified: true, # Facebook verifies emails
          name: data["name"],
          picture: get_in(data, ["picture", "data", "url"]),
          raw: data
        }}
      error -> error
    end
  end

  defp fetch_user_info(:tiktok, _config, %{"access_token" => access_token}) do
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
          email: nil, # TikTok doesn't provide email in basic scope
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
  # Private Functions - User Management
  # ============================================================================

  defp find_or_create_user(provider, user_info) do
    provider_str = to_string(provider)
    uid = user_info.uid
    
    # First try to find by OAuth provider and UID
    case Accounts.get_user_by_oauth(provider_str, uid) do
      %User{} = user ->
        # Update OAuth data on each login
        update_oauth_data(user, user_info)
        
      nil ->
        # Check if user exists by email (for linking)
        if user_info.email && user_info.email_verified do
          case Accounts.get_user_by_email(user_info.email) do
            {:ok, user} ->
              # Link OAuth to existing account
              link_oauth_to_user(user, user_info)
              
            {:error, :not_found} ->
              # Create new user
              create_oauth_user(user_info)
          end
        else
          # No email or unverified - create new user
          create_oauth_user(user_info)
        end
    end
  end

  defp update_oauth_data(user, user_info) do
    provider_str = to_string(user_info.provider)
    
    oauth_data = Map.merge(user.oauth_data || %{}, %{
      provider_str => %{
        "uid" => user_info.uid,
        "last_login" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "name" => user_info.name,
        "picture" => user_info.picture
      }
    })
    
    user
    |> User.oauth_changeset(%{
      oauth_data: oauth_data,
      # Update avatar if not set
      avatar_url: user.avatar_url || user_info.picture
    })
    |> Repo.update()
  end

  defp link_oauth_to_user(user, user_info) do
    provider_str = to_string(user_info.provider)
    
    oauth_data = Map.merge(user.oauth_data || %{}, %{
      provider_str => %{
        "uid" => user_info.uid,
        "linked_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "name" => user_info.name,
        "picture" => user_info.picture
      }
    })
    
    attrs = %{
      oauth_provider: user.oauth_provider || provider_str,
      oauth_uid: user.oauth_uid || user_info.uid,
      oauth_data: oauth_data
    }
    
    user
    |> User.oauth_changeset(attrs)
    |> Repo.update()
  end

  defp create_oauth_user(user_info) do
    provider_str = to_string(user_info.provider)
    
    # Generate a unique username from the name or provider
    base_username = if user_info.name do
      user_info.name
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9]/, "")
      |> String.slice(0, 15)
    else
      "#{provider_str}user"
    end
    
    username = generate_unique_username(base_username)
    
    oauth_data = %{
      provider_str => %{
        "uid" => user_info.uid,
        "created_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "name" => user_info.name,
        "picture" => user_info.picture
      }
    }
    
    attrs = %{
      email: user_info.email,
      username: username,
      display_name: user_info.name,
      avatar_url: user_info.picture,
      auth_type: :oauth,
      oauth_provider: provider_str,
      oauth_uid: user_info.uid,
      oauth_data: oauth_data,
      email_verified_at: if(user_info.email_verified, do: DateTime.utc_now())
    }
    
    %User{}
    |> User.oauth_registration_changeset(attrs)
    |> Repo.insert()
  end

  defp generate_unique_username(base, attempt \\ 0) do
    username = if attempt == 0 do
      base
    else
      "#{base}#{:rand.uniform(9999)}"
    end
    
    case Accounts.get_user_by_username(username) do
      {:error, :not_found} -> username
      {:ok, _user} when attempt < 10 -> generate_unique_username(base, attempt + 1)
      {:ok, _user} -> "#{base}#{System.unique_integer([:positive])}"
    end
  end

  # ============================================================================
  # Private Functions - HTTP & JWT Helpers
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

  defp decode_jwt(token) do
    # Simple JWT decode without verification (for extracting claims)
    # In production, verify signature using provider's public keys
    case String.split(token, ".") do
      [_header, payload, _signature] ->
        case Base.url_decode64(payload, padding: false) do
          {:ok, json} -> {:ok, Jason.decode!(json)}
          :error -> {:error, :invalid_jwt_payload}
        end
      _ ->
        {:error, :invalid_jwt_format}
    end
  end

  defp generate_apple_client_secret(config) do
    # Apple requires a JWT signed with your private key as the client_secret
    # This JWT is valid for up to 6 months
    now = System.system_time(:second)
    
    claims = %{
      "iss" => config[:team_id],
      "iat" => now,
      "exp" => now + 86400 * 180, # 180 days
      "aud" => "https://appleid.apple.com",
      "sub" => config[:client_id]
    }
    
    # Note: This requires the private key to be in PEM format
    case config[:private_key] do
      key when is_binary(key) and key != "" ->
        # Use JOSE to sign the JWT with ES256
        signer = JOSE.JWK.from_pem(key)
        
        header = %{
          "alg" => "ES256",
          "kid" => config[:key_id]
        }
        
        {_, jwt} = JOSE.JWT.sign(signer, header, claims) |> JOSE.JWS.compact()
        jwt
        
      _ ->
        Logger.error("Apple private key not configured")
        ""
    end
  end
end
