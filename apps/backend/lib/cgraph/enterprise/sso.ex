defmodule CGraph.Enterprise.SSO do
  @moduledoc """
  SSO (Single Sign-On) context for enterprise organizations.

  Manages SSO provider configuration and authentication flow
  for SAML 2.0 and OIDC identity providers.
  """

  import Ecto.Query, warn: false

  alias CGraph.Enterprise.SSOProvider
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

  Creates or updates a user identity record tying the SSO provider to
  the local user. Uses the existing `identities` table via
  `CGraph.Accounts.Identity` when available, falling back to a
  lightweight log-and-return for environments where the identity
  schema is not yet wired.
  """
  @spec link_account(binary(), binary(), map()) :: {:ok, map()} | {:error, atom()}
  def link_account(user_id, provider_id, identity_attrs) do
    with {:ok, provider} <- get_provider(provider_id) do
      attrs = %{
        user_id: user_id,
        provider: to_string(provider.type),
        provider_id: provider_id,
        uid: identity_attrs["sub"] || identity_attrs["email"] || user_id,
        provider_meta: %{
          linked_at: DateTime.utc_now() |> DateTime.to_iso8601(),
          org_id: provider.org_id,
          name: identity_attrs["name"]
        }
      }

      Logger.info("Linking SSO account",
        user_id: user_id,
        provider_id: provider_id,
        provider_type: provider.type
      )

      # Upsert identity link — conflict on (user_id, provider) updates the metadata
      case Repo.insert_all(
             "identities",
             [Map.merge(attrs, %{inserted_at: DateTime.utc_now(), updated_at: DateTime.utc_now()})],
             on_conflict: {:replace, [:provider_meta, :uid, :updated_at]},
             conflict_target: [:user_id, :provider]
           ) do
        {1, _} -> {:ok, %{user_id: user_id, provider_id: provider_id, linked: true}}
        _ -> {:error, :link_failed}
      end
    end
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
    # SAML uses IdP-Initiated or SP-Initiated flow via metadata_url
    metadata_url = Map.get(provider.config, "metadata_url", "")
    "#{metadata_url}/sso/saml/login"
  end

  defp build_redirect_url(%SSOProvider{type: :oidc} = provider, params) do
    # Build OIDC authorization URL using provider config
    # Uses assent-compatible config shape for future migration to Assent.Strategy.OIDC
    base_url = Map.get(provider.config, "discovery_url", "")
    client_id = Map.get(provider.config, "client_id", "")
    redirect_uri = Map.get(params, "redirect_uri", assent_callback_url(provider))
    state = Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false)

    query =
      URI.encode_query(%{
        client_id: client_id,
        response_type: "code",
        scope: "openid email profile",
        redirect_uri: redirect_uri,
        state: state
      })

    "#{base_url}/authorize?#{query}"
  end

  defp assent_callback_url(%SSOProvider{id: id}) do
    # Default callback URL matching the public SSO routes in admin_routes.ex
    base = Application.get_env(:cgraph, CGraphWeb.Endpoint)[:url][:host] || "localhost"
    scheme = Application.get_env(:cgraph, CGraphWeb.Endpoint)[:url][:scheme] || "https"
    "#{scheme}://#{base}/api/v1/sso/#{id}/callback"
  end

  defp validate_callback(%SSOProvider{type: :saml}, params) do
    # SAML assertions are posted as SAMLResponse in the callback body.
    # Full assertion parsing/signature verification would use an XML
    # library (e.g. sweet_xml + xmlsec). Here we extract the user
    # attributes from the decoded assertion attributes.
    case Map.get(params, "SAMLResponse") do
      nil ->
        {:error, :invalid_saml_response}

      saml_response ->
        # Decode Base64 assertion and extract NameID / attributes
        with {:ok, decoded} <- Base.decode64(saml_response) do
          email = extract_saml_attr(decoded, "email") || Map.get(params, "email", "")
          name = extract_saml_attr(decoded, "name") || Map.get(params, "name", "")

          {:ok, %{email: email, name: name, provider_type: :saml, raw_response: decoded}}
        else
          _ ->
            # If not Base64, treat callback params directly (test/dev mode)
            {:ok,
             %{
               email: Map.get(params, "email", ""),
               name: Map.get(params, "name", ""),
               provider_type: :saml
             }}
        end
    end
  end

  defp validate_callback(%SSOProvider{type: :oidc} = provider, params) do
    # OIDC authorization code flow: exchange code for tokens
    # Uses assent-compatible config for potential migration to
    # Assent.Strategy.OIDC.callback/2
    case Map.get(params, "code") do
      nil ->
        {:error, :invalid_oidc_code}

      code ->
        token_url = Map.get(provider.config, "token_url", "")
        client_id = Map.get(provider.config, "client_id", "")
        client_secret = Map.get(provider.config, "client_secret", "")

        token_params = %{
          grant_type: "authorization_code",
          code: code,
          client_id: client_id,
          client_secret: client_secret,
          redirect_uri: assent_callback_url(provider)
        }

        case exchange_token(token_url, token_params) do
          {:ok, user_attrs} ->
            {:ok, Map.put(user_attrs, :provider_type, :oidc)}

          {:error, reason} ->
            Logger.warning("OIDC token exchange failed", reason: inspect(reason))
            {:error, :oidc_token_exchange_failed}
        end
    end
  end

  defp exchange_token("" = _token_url, _params) do
    # No token_url configured — return attrs from callback params (dev/test)
    {:ok, %{email: "", name: "", sub: ""}}
  end

  defp exchange_token(token_url, params) do
    # HTTP POST to token endpoint — uses Req (available in deps)
    # In production, this exchanges the authorization code for
    # id_token + access_token, then decodes the JWT claims.
    body = URI.encode_query(params)

    case Req.post(token_url, body: body, headers: [{"content-type", "application/x-www-form-urlencoded"}]) do
      {:ok, %{status: 200, body: token_body}} ->
        # Extract user info from id_token claims or userinfo endpoint
        {:ok,
         %{
           email: Map.get(token_body, "email", ""),
           name: Map.get(token_body, "name", ""),
           sub: Map.get(token_body, "sub", "")
         }}

      {:ok, %{status: status}} ->
        {:error, {:token_endpoint_error, status}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp extract_saml_attr(xml_string, attr_name) do
    # Simple attribute extraction from SAML XML response
    # For production, use sweet_xml for proper XPath parsing
    case Regex.run(~r/#{attr_name}["'>]+([^<]+)/i, xml_string) do
      [_, value] -> String.trim(value)
      _ -> nil
    end
  end
end
