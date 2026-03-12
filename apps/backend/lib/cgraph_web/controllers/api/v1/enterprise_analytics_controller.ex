defmodule CGraphWeb.API.V1.EnterpriseAnalyticsController do
  @moduledoc """
  Enterprise analytics dashboard controller.

  Provides data for the admin analytics views including platform
  overview, per-org breakdown, and time-series exports.
  """

  use CGraphWeb, :controller

  alias CGraph.Enterprise.AnalyticsDashboard
  alias CGraphWeb.API.V1.EnterpriseJSON

  action_fallback CGraphWeb.FallbackController

  @doc "Get platform-wide overview analytics."
  @spec overview(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def overview(conn, _params) do
    with {:ok, data} <- AnalyticsDashboard.platform_overview() do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.analytics_overview(data))
    end
  end

  @doc "Get analytics breakdown for a specific organization."
  @spec org_breakdown(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def org_breakdown(conn, %{"org_id" => org_id}) do
    with {:ok, data} <- AnalyticsDashboard.org_breakdown(org_id) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.analytics_overview(data))
    end
  end

  @doc "Get time-series analytics data."
  @spec time_series(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def time_series(conn, %{"metric" => metric} = params) do
    org_id = Map.get(params, "org_id")
    start_date = parse_date(Map.get(params, "start_date"), Date.add(Date.utc_today(), -30))
    end_date = parse_date(Map.get(params, "end_date"), Date.utc_today())

    with {:ok, series} <- AnalyticsDashboard.time_series(metric, org_id, start_date, end_date) do
      conn
      |> put_status(:ok)
      |> json(EnterpriseJSON.analytics_time_series(series))
    end
  end

  @doc "Export analytics as CSV-formatted JSON."
  @spec export(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def export(conn, %{"org_id" => org_id}) do
    with {:ok, rows} <- AnalyticsDashboard.export_csv(org_id) do
      conn
      |> put_status(:ok)
      |> json(%{data: rows})
    end
  end

  defp parse_date(nil, default), do: default

  defp parse_date(date_string, default) when is_binary(date_string) do
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      _ -> default
    end
  end

  defp parse_date(_, default), do: default
end
