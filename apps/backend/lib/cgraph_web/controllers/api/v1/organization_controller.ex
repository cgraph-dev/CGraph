defmodule CGraphWeb.API.V1.OrganizationController do
  @moduledoc """
  Organization management controller.

  Endpoints:
  - `GET /api/v1/organizations` — list user's organizations
  - `POST /api/v1/organizations` — create organization
  - `GET /api/v1/organizations/:slug` — get organization
  - `PUT /api/v1/organizations/:slug` — update organization
  - `DELETE /api/v1/organizations/:slug` — soft-delete organization
  - `GET /api/v1/organizations/:slug/members` — list members
  - `POST /api/v1/organizations/:slug/members` — add member
  - `DELETE /api/v1/organizations/:slug/members/:user_id` — remove member
  - `PUT /api/v1/organizations/:slug/settings` — update settings
  - `POST /api/v1/organizations/:slug/transfer` — transfer ownership
  """

  use CGraphWeb, :controller

  alias CGraph.Enterprise.Organizations
  alias CGraphWeb.API.V1.EnterpriseJSON

  action_fallback CGraphWeb.FallbackController

  @doc "List organizations the current user belongs to."
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    {orgs, meta} = Organizations.list_orgs(Enum.into(params, []))

    conn
    |> put_status(:ok)
    |> json(EnterpriseJSON.organizations(orgs, meta))
  end

  @doc "Create a new organization."
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, params) do
    owner_id = conn.assigns.current_user.id

    with {:ok, org} <- Organizations.create_org(owner_id, params) do
      conn
      |> put_status(:created)
      |> json(EnterpriseJSON.organization(org))
    end
  end

  @doc "Get an organization by slug."
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"slug" => slug}) do
    with {:ok, org} <- Organizations.get_org_by_slug(slug) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.organization(org))
    end
  end

  @doc "Update an organization."
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"slug" => slug} = params) do
    with {:ok, org} <- Organizations.get_org_by_slug(slug),
         :ok <- authorize_org_admin(conn, org),
         {:ok, updated} <- Organizations.update_org(org, params) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.organization(updated))
    end
  end

  @doc "Soft-delete an organization."
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"slug" => slug}) do
    with {:ok, org} <- Organizations.get_org_by_slug(slug),
         :ok <- authorize_org_owner(conn, org),
         {:ok, _} <- Organizations.delete_org(org) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc "List members of an organization."
  @spec list_members(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_members(conn, %{"slug" => slug} = params) do
    with {:ok, org} <- Organizations.get_org_by_slug(slug) do
      {members, meta} = Organizations.list_members(org.id, Enum.into(params, []))

      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.org_members(members, meta))
    end
  end

  @doc "Add a member to an organization."
  @spec add_member(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def add_member(conn, %{"slug" => slug, "user_id" => user_id} = params) do
    role = Map.get(params, "role", "member") |> String.to_existing_atom()

    with {:ok, org} <- Organizations.get_org_by_slug(slug),
         :ok <- authorize_org_admin(conn, org),
         {:ok, membership} <- Organizations.add_member(org.id, user_id, role) do
      conn
      |> put_status(:created)
      |> json(EnterpriseJSON.org_membership(membership))
    end
  end

  @doc "Remove a member from an organization."
  @spec remove_member(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def remove_member(conn, %{"slug" => slug, "user_id" => user_id}) do
    with {:ok, org} <- Organizations.get_org_by_slug(slug),
         :ok <- authorize_org_admin(conn, org),
         {:ok, _} <- Organizations.remove_member(org.id, user_id) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc "Update organization settings."
  @spec update_settings(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_settings(conn, %{"slug" => slug} = params) do
    with {:ok, org} <- Organizations.get_org_by_slug(slug),
         :ok <- authorize_org_admin(conn, org),
         {:ok, settings} <- Organizations.update_settings(org.id, params) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.org_settings(settings))
    end
  end

  @doc "Transfer organization ownership."
  @spec transfer_ownership(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def transfer_ownership(conn, %{"slug" => slug, "new_owner_id" => new_owner_id}) do
    current_user_id = conn.assigns.current_user.id

    with {:ok, org} <- Organizations.get_org_by_slug(slug),
         {:ok, updated_org} <- Organizations.transfer_ownership(org, current_user_id, new_owner_id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.organization(updated_org))
    end
  end

  # ============================================================================
  # Authorization Helpers
  # ============================================================================

  defp authorize_org_owner(conn, org) do
    if conn.assigns.current_user.id == org.owner_id do
      :ok
    else
      {:error, :forbidden}
    end
  end

  defp authorize_org_admin(conn, org) do
    user_id = conn.assigns.current_user.id

    if user_id == org.owner_id do
      :ok
    else
      case Enum.find(org.memberships, &(&1.user_id == user_id)) do
        %{role: role} when role in [:owner, :admin] -> :ok
        _ -> {:error, :forbidden}
      end
    end
  end

  # ============================================================================
  # Admin Actions (super-admin only, via /api/v1/admin/enterprise)
  # ============================================================================

  @doc "Admin: list all organizations with pagination."
  @spec admin_list(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def admin_list(conn, params) do
    {orgs, meta} = Organizations.list_orgs(Enum.into(params, []))

    conn
    |> put_status(:ok)
    |> json(EnterpriseJSON.organizations(orgs, meta))
  end

  @doc "Admin: get any organization by ID."
  @spec admin_show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def admin_show(conn, %{"id" => id}) do
    with {:ok, org} <- Organizations.get_org(id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.organization(org))
    end
  end

  @doc "Admin: suspend an organization (soft-delete)."
  @spec suspend(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def suspend(conn, %{"id" => id}) do
    with {:ok, org} <- Organizations.get_org(id),
         {:ok, suspended} <- Organizations.delete_org(org) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.organization(suspended))
    end
  end

  @doc "Admin: unsuspend an organization."
  @spec unsuspend(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def unsuspend(conn, %{"id" => id}) do
    with {:ok, org} <- Organizations.get_org_including_deleted(id),
         {:ok, restored} <- Organizations.restore_org(org) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.organization(restored))
    end
  end
end
