defmodule CGraphWeb.API.V1.EnterpriseAdminController do
  @moduledoc """
  Enterprise admin console controller for managing admin users,
  roles, and viewing audit entries.
  """

  use CGraphWeb, :controller

  alias CGraph.Enterprise.AdminConsole
  alias CGraphWeb.API.V1.EnterpriseJSON

  action_fallback CGraphWeb.FallbackController

  # ---------------------------------------------------------------------------
  # Admin Users
  # ---------------------------------------------------------------------------

  @spec list_admins(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_admins(conn, params) do
    {admins, meta} = AdminConsole.list_admin_users(Enum.into(params, []))

    conn
    |> put_status(:ok)
    |> json(EnterpriseJSON.admin_users(admins, meta))
  end

  @spec show_admin(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show_admin(conn, %{"id" => id}) do
    with {:ok, admin} <- AdminConsole.get_admin_user(id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.admin_user(admin))
    end
  end

  @spec create_admin(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_admin(conn, params) do
    with {:ok, admin} <- AdminConsole.create_admin_user(params) do
      conn
      |> put_status(:created)
      |> json(EnterpriseJSON.admin_user(admin))
    end
  end

  @spec update_admin(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_admin(conn, %{"id" => id} = params) do
    with {:ok, admin} <- AdminConsole.get_admin_user(id),
         {:ok, updated} <- AdminConsole.update_admin_user(admin, params) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.admin_user(updated))
    end
  end

  @spec delete_admin(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_admin(conn, %{"id" => id}) do
    with {:ok, admin} <- AdminConsole.get_admin_user(id),
         {:ok, _} <- AdminConsole.delete_admin_user(admin) do
      send_resp(conn, :no_content, "")
    end
  end

  # ---------------------------------------------------------------------------
  # Roles
  # ---------------------------------------------------------------------------

  @spec list_roles(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_roles(conn, _params) do
    roles = AdminConsole.list_roles()

    conn
    |> put_status(:ok)
    |> json(EnterpriseJSON.admin_roles(roles))
  end

  @spec create_role(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create_role(conn, params) do
    with {:ok, role} <- AdminConsole.create_role(params) do
      conn
      |> put_status(:created)
      |> json(EnterpriseJSON.admin_role(role))
    end
  end

  # ---------------------------------------------------------------------------
  # Audit Entries
  # ---------------------------------------------------------------------------

  @spec list_audit_entries(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_audit_entries(conn, params) do
    {entries, meta} = AdminConsole.list_audit_entries(Enum.into(params, []))

    conn
    |> put_status(:ok)
    |> json(EnterpriseJSON.audit_entries(entries, meta))
  end

  @spec show_audit_entry(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show_audit_entry(conn, %{"id" => id}) do
    with {:ok, entry} <- AdminConsole.get_audit_entry(id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.audit_entry(entry))
    end
  end

  @spec export_audit(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def export_audit(conn, params) do
    entries = AdminConsole.export_audit_entries(Enum.into(params, []))

    conn
    |> put_status(:ok)
    |> json(%{data: entries})
  end

  # ---------------------------------------------------------------------------
  # Platform Stats
  # ---------------------------------------------------------------------------

  @spec platform_stats(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def platform_stats(conn, _params) do
    stats = AdminConsole.platform_stats()

    conn
    |> put_status(:ok)
    |> json(%{data: stats})
  end
end
