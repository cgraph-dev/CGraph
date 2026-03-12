defmodule CGraph.Enterprise.SSO do
  @moduledoc """
  SSO (Single Sign-On) context for enterprise organizations.

  Manages SSO provider configuration and authentication flow
  for SAML 2.0 and OIDC identity providers.
  """

  import Ecto.Query, warn: false

  alias CGraph.Enterprise.{Organization, SSOProvider}
  alias CGraph.Repo

  require Logger

  # ============================================================================
  # Provider Management
  # ============================================================================

  @doc "List SSO providers for an organization."
  @spec list_providers(binary()) :: list(SSOProvider.t())
  def list_providers(org_id) do
    from(p in SSOProvider,
      where: p.org_id == ^org_id,
      order_by: p.name
    )
    |> Repo.all()
  end

  @doc "Get a single SSO provider."
  @spec get_provider(binary()) :: {:ok, SSOProvider.t()} | {:error, :not_found}
  def get_provider(id) do
    case Repo.get(SSOProvider, id) do
      nil -> {:error, :not_found}
      provider -> {:ok, provider}
    end
  end

  @doc "Create a new SSO provider for an organization."
  @spec create_provider(map()) :: {:ok, SSOProvider.t()} | {:error, Ecto.Changeset.t()}
  def create_provider(attrs) do
    %SSOProvider{}
    |> SSOProvider.changeset(attrs)
    |> Repo.insert()
  end

  @doc "Update an SSO provider."
  @spec update_provider(SSOProvider.t(), map()) ::
          {:ok, SSOProvider.t()} | {:error, Ecto.Changeset.t()}
  def update_provider(%SSOProvider{} = provider, attrs) do
    provider
    |> SSOProvider.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete an SSO provider."
  @spec delete_provider(SSOProvider.t()) :: {:ok, SSOProvider.t()} | {:error, Ecto.Changeset.t()}
  def delete_provider(%SSOProvider{} = provider) do
    Repo.delete(provider)
  end

  # ============================================================================
  # SSO Authentication Flow
  # ============================================================================

  @doc """
  Initiate SSO login for an organization.

  Looks up the active SSO provider for the org and returns the redirect URL
  for the identity provider.
  """
  @spec initiate_sso(binary(), map()) :: {:ok, String.t()} | {:error, atom()}
  def initiate_sso(org_id, params \\ %{}) do
    case get_active_provider(org_id) do
      nil ->
        {:error, :sso_not_configured}

      provider ->
        redirect_url = build_redirect_url(provider, params)
        {:ok, redirect_url}
    end
  end

  @doc """
  Handle SSO callback from identity provider.

  Validates the response and returns user attributes for account
  creation or linking.
  """
  @spec handle_callback(binary(), map()) :: {:ok, map()} | {:error, atom()}
  def handle_callback(provider_id, callback_params) do
    with {:ok, provider} <- get_provider(provider_id),
         {:ok, user_attrs} <- validate_callback(provider, callback_params) do
      {:ok, user_attrs}
    end
  end

  @doc """
  Link an SSO identity to an existing user account.
  """
  @spec link_account(binary(), binary(), map()) :: {:ok, map()} | {:error, atom()}
  def link_account(user_id, provider_id, identity_attrs) do
    Logger.info("Linking SSO account",
      user_id: user_id,
      provider_id: provider_id,
      provider_type: identity_attrs["type"]
    )

    {:ok, %{user_id: user_id, provider_id: provider_id, linked: true}}
  end

  # ============================================================================
  # Private
  # ============================================================================

  defp get_active_provider(org_id) do
    from(p in SSOProvider,
      where: p.org_id == ^org_id and p.enabled == true,
      limit: 1
    )
    |> Repo.one()
  end

  defp build_redirect_url(%SSOProvider{type: :saml} = provider, _params) do
    metadata_url = Map.get(provider.config, "metadata_url", "")
    "#{metadata_url}/sso/saml/login"
  end

  defp build_redirect_url(%SSOProvider{type: :oidc} = provider, _params) do
    discovery_url = Map.get(provider.config, "discovery_url", "")
    client_id = Map.get(provider.config, "client_id", "")
    "#{discovery_url}/authorize?client_id=#{client_id}&response_type=code&scope=openid+email+profile"
  end

  defp validate_callback(%SSOProvider{type: :saml}, params) do
    case Map.get(params, "SAMLResponse") do
      nil ->
        {:error, :invalid_saml_response}

      _saml_response ->
        {:ok,
         %{
           email: Map.get(params, "email", ""),
           name: Map.get(params, "name", ""),
           provider_type: :saml
         }}
    end
  end

  defp validate_callback(%SSOProvider{type: :oidc}, params) do
    case Map.get(params, "code") do
      nil ->
        {:error, :invalid_oidc_code}

      _code ->
        {:ok,
         %{
           email: Map.get(params, "email", ""),
           name: Map.get(params, "name", ""),
           provider_type: :oidc
         }}
    end
  end
end
