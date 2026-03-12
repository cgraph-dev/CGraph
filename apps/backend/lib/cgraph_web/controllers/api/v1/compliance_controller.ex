defmodule CGraphWeb.API.V1.ComplianceController do
  @moduledoc """
  Enterprise compliance management controller.

  Provides endpoints for compliance auditing, data residency verification,
  and white-label branding configuration.
  """

  use CGraphWeb, :controller

  alias CGraph.Enterprise.{ComplianceSuite, DataResidency, WhiteLabel}
  alias CGraphWeb.API.V1.EnterpriseJSON

  action_fallback CGraphWeb.FallbackController

  @doc "Get compliance status for an organization."
  @spec status(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def status(conn, %{"org_id" => org_id}) do
    with {:ok, result} <- ComplianceSuite.get_status(org_id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.compliance_status(result))
    end
  end

  @doc "Run compliance audit for a specific framework."
  @spec audit(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def audit(conn, %{"org_id" => org_id, "framework" => framework}) do
    fw = String.to_existing_atom(framework)

    with {:ok, report} <- ComplianceSuite.run_audit(fw, org_id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.compliance_report(report))
    end
  rescue
    ArgumentError -> {:error, :invalid_framework}
  end

  @doc "List available data regions."
  @spec list_regions(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def list_regions(conn, _params) do
    regions = DataResidency.list_regions()

    conn
    |> put_status(:ok)
    |> json(%{data: regions})
  end

  @doc "Verify data residency for a region."
  @spec verify_residency(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def verify_residency(conn, %{"region" => region}) do
    with {:ok, result} <- DataResidency.verify_residency(region) do
      conn
      |> put_status(:ok)
      |> json(%{data: result})
    end
  end

  @doc "Get white-label branding for an organization."
  @spec get_branding(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_branding(conn, %{"org_id" => org_id}) do
    with {:ok, branding} <- WhiteLabel.get_branding(org_id) do
      conn
      |> put_status(:ok)
      |> json(%{data: branding})
    end
  end

  @doc "Get computed CSS theme for white-label."
  @spec get_theme(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_theme(conn, %{"org_id" => org_id}) do
    with {:ok, theme} <- WhiteLabel.apply_theme(org_id) do
      conn
      |> put_status(:ok)
      |> json(%{data: theme})
    end
  end

  @doc "Update white-label branding."
  @spec update_branding(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_branding(conn, %{"org_id" => org_id} = params) do
    branding_params = Map.get(params, "branding", %{})

    with {:ok, settings} <- WhiteLabel.update_branding(org_id, branding_params) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.org_settings(settings))
    end
  end
end
