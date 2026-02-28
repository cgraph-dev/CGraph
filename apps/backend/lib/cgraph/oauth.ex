defmodule CGraph.OAuth do
  @moduledoc """
  OAuth 2.0 authentication module supporting Google, Apple, Facebook, and TikTok.

  This module provides the public API for OAuth flows. Implementation is
  delegated to submodules:

  - `CGraph.OAuth.Config` - Provider configuration, validation, URL building
  - `CGraph.OAuth.Providers` - Token exchange and user info fetching
  - `CGraph.OAuth.Apple` - Apple Sign In JWT/JWKS verification
  - `CGraph.OAuth.UserManager` - User creation, linking, and unlinking

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

  alias CGraph.Guardian
  alias CGraph.OAuth.{Apple, Config, Providers, UserManager}

  require Logger

  @type provider :: :google | :apple | :facebook | :tiktok
  @type oauth_result :: {:ok, map()} | {:error, term()}

  # ============================================================================
  # Delegated API
  # ============================================================================

  defdelegate list_providers, to: Config
  defdelegate provider_configured?(provider), to: Config
  defdelegate configured_providers, to: Config
  defdelegate get_provider_config(provider), to: Config
  defdelegate link_account(user, provider, provider_uid, provider_data), to: UserManager
  defdelegate unlink_account(user, provider), to: UserManager

  @doc """
  Verify an Apple ID token using Apple's JWKS.

  See `CGraph.OAuth.Apple.verify_token/2` for details.
  """
  @spec verify_apple_token(String.t(), Keyword.t()) :: {:ok, map()} | {:error, term()}
  defdelegate verify_apple_token(id_token, config), to: Apple, as: :verify_token

  # ============================================================================
  # Orchestrator Functions
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

      {:ok, url} = CGraph.OAuth.authorize_url(:google, "random-state-string")
  """
  @doc "Generates the OAuth authorization URL."
  @spec authorize_url(provider(), String.t()) :: {:ok, String.t()} | {:error, term()}
  def authorize_url(provider, state) when provider in [:google, :apple, :facebook, :tiktok] do
    config = Config.get_provider_config(provider)

    if Config.config_valid?(provider, config) do
      url = Config.build_authorize_url(provider, config, state)
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
  @doc "Handles the OAuth callback after authorization."
  @spec callback(provider(), String.t(), String.t()) :: oauth_result()
  def callback(provider, code, _state) when provider in [:google, :apple, :facebook, :tiktok] do
    # OAuth bypasses 2FA — identity already verified by provider (Google/Apple/Facebook/TikTok).
    # This is a deliberate security decision: OAuth login ≠ password login.
    config = Config.get_provider_config(provider)

    with {:ok, tokens} <- Providers.exchange_code_for_tokens(provider, config, code),
         {:ok, user_info} <- Providers.fetch_user_info(provider, config, tokens),
         {:ok, user} <- UserManager.find_or_create_user(provider, user_info),
         {:ok, jwt_tokens} <- CGraph.Auth.TokenManager.generate_tokens(user) do

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
  @doc "Handles the OAuth callback for mobile clients."
  @spec mobile_callback(provider(), String.t(), String.t() | nil) :: oauth_result()
  def mobile_callback(provider, access_token, id_token \\ nil)

  def mobile_callback(provider, access_token, id_token)
      when provider in [:google, :apple, :facebook, :tiktok] do
    # OAuth bypasses 2FA — identity already verified by provider (Google/Apple/Facebook/TikTok).
    # This is a deliberate security decision: OAuth login ≠ password login.
    config = Config.get_provider_config(provider)

    tokens = %{
      "access_token" => access_token,
      "id_token" => id_token
    }

    with {:ok, user_info} <- Providers.fetch_user_info(provider, config, tokens),
         {:ok, user} <- UserManager.find_or_create_user(provider, user_info),
         {:ok, jwt_tokens} <- CGraph.Auth.TokenManager.generate_tokens(user) do

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
end
