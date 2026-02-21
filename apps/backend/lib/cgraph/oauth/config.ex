defmodule CGraph.OAuth.Config do
  @moduledoc """
  OAuth provider configuration, validation, and authorization URL building.

  Handles provider credential lookup from application config and
  constructs authorization URLs for each supported OAuth provider.
  """

  @type provider :: :google | :apple | :facebook | :tiktok

  # Provider-specific OIDC/OAuth endpoint URLs
  @google_authorize_url "https://accounts.google.com/o/oauth2/v2/auth"
  @apple_authorize_url "https://appleid.apple.com/auth/authorize"
  @facebook_authorize_url "https://www.facebook.com/v18.0/dialog/oauth"
  @tiktok_authorize_url "https://www.tiktok.com/v2/auth/authorize"

  # ============================================================================
  # Public API
  # ============================================================================

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

  @doc """
  Get the configuration for an OAuth provider.

  ## Parameters

  - `provider` - The OAuth provider atom

  ## Returns

  The provider configuration keyword list.
  """
  @spec get_provider_config(provider()) :: Keyword.t()
  def get_provider_config(provider) do
    Application.get_env(:cgraph, :oauth, [])
    |> Keyword.get(provider, [])
  end

  @doc """
  Check if the configuration for a provider contains all required fields.
  """
  @spec config_valid?(provider(), Keyword.t()) :: boolean()
  def config_valid?(:google, config) do
    config[:client_id] not in [nil, ""] and
    config[:client_secret] not in [nil, ""]
  end

  def config_valid?(:apple, config) do
    config[:client_id] not in [nil, ""] and
    config[:team_id] not in [nil, ""] and
    config[:key_id] not in [nil, ""]
  end

  def config_valid?(:facebook, config) do
    config[:client_id] not in [nil, ""] and
    config[:client_secret] not in [nil, ""]
  end

  def config_valid?(:tiktok, config) do
    config[:client_key] not in [nil, ""] and
    config[:client_secret] not in [nil, ""]
  end

  @doc """
  Build the authorization URL for the given provider.
  """
  @spec build_authorize_url(provider(), Keyword.t(), String.t()) :: String.t()
  def build_authorize_url(:google, config, state) do
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

  def build_authorize_url(:apple, config, state) do
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

  def build_authorize_url(:facebook, config, state) do
    params = %{
      client_id: config[:client_id],
      redirect_uri: config[:redirect_uri],
      response_type: "code",
      scope: "email,public_profile",
      state: state
    }

    @facebook_authorize_url <> "?" <> URI.encode_query(params)
  end

  def build_authorize_url(:tiktok, config, state) do
    params = %{
      client_key: config[:client_key],
      redirect_uri: config[:redirect_uri],
      response_type: "code",
      scope: "user.info.basic",
      state: state
    }

    @tiktok_authorize_url <> "?" <> URI.encode_query(params)
  end
end
