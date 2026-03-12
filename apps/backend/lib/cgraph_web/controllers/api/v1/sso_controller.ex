defmodule CGraphWeb.API.V1.SSOController do
  @moduledoc """
  SSO controller for enterprise SAML 2.0 and OIDC authentication.

  Endpoints:
  - `GET /api/v1/admin/enterprise/sso/providers?org_id=ID` — list SSO providers for org
  - `POST /api/v1/admin/enterprise/sso/providers` — create SSO provider
  - `PUT /api/v1/admin/enterprise/sso/providers/:id` — update SSO provider
  - `DELETE /api/v1/admin/enterprise/sso/providers/:id` — delete SSO provider
  - `GET /api/v1/sso/:provider_id/initiate` — start SSO flow
  - `POST /api/v1/sso/callback` — handle IdP callback
  """

  use CGraphWeb, :controller

  alias CGraph.Enterprise.{Organizations, SSO}
  alias CGraphWeb.API.V1.EnterpriseJSON

  action_fallback CGraphWeb.FallbackController

  @doc "List SSO providers for an organization."
  @spec list_providers(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_providers(conn, %{"org_id" => org_id}) do
    with {:ok, org} <- Organizations.get_org(org_id) do
      providers = SSO.list_providers(org.id)

      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.sso_providers(providers))
    end
  end

  @doc "Create a new SSO provider."
  @spec create_provider(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_provider(conn, %{"org_id" => org_id} = params) do
    with {:ok, org} <- Organizations.get_org(org_id),
         {:ok, provider} <-
           SSO.create_provider(Map.put(params, "org_id", org.id)) do
      conn
      |> put_status(:created)
      |> json(EnterpriseJSON.sso_provider(provider))
    end
  end

  @doc "Update an SSO provider."
  @spec update_provider(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_provider(conn, %{"id" => id} = params) do
    with {:ok, provider} <- SSO.get_provider(id),
         {:ok, updated} <- SSO.update_provider(provider, params) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.sso_provider(updated))
    end
  end

  @doc "Delete an SSO provider."
  @spec delete_provider(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_provider(conn, %{"id" => id}) do
    with {:ok, provider} <- SSO.get_provider(id),
         {:ok, _} <- SSO.delete_provider(provider) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc "Initiate SSO login flow — redirects to IdP."
  @spec initiate(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def initiate(conn, %{"provider_id" => provider_id}) do
    with {:ok, provider} <- SSO.get_provider(provider_id),
         {:ok, redirect_url} <- SSO.initiate_sso(provider.org_id) do
      conn
      |> put_status(:ok)
      |> json(%{data: %{redirect_url: redirect_url}})
    end
  end

  @doc "Handle SSO callback from identity provider."
  @spec callback(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def callback(conn, %{"provider_id" => provider_id} = params) do
    with {:ok, user_attrs} <- SSO.handle_callback(provider_id, params) do
      conn
      |> put_status(:ok)
      |> json(%{data: user_attrs})
    end
  end
end
