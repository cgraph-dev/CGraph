defmodule CGraphWeb.API.V1.ReportJSON do
  @moduledoc """
  JSON rendering for report resources.
  """

  alias CGraph.Moderation.Report

  @doc """
  Renders a list of reports.
  """
  def index(%{reports: {reports, _meta}}) when is_list(reports) do
    %{data: for(report <- reports, do: data(report))}
  end

  def index(%{reports: reports}) when is_list(reports) do
    %{data: for(report <- reports, do: data(report))}
  end

  @doc """
  Renders a single report.
  """
  def show(%{report: report}) do
    %{data: data(report)}
  end

  defp data(%Report{} = report) do
    %{
      id: report.id,
      target_type: report.target_type,
      target_id: report.target_id,
      category: report.category,
      description: report.description,
      status: report.status,
      created_at: report.inserted_at,
      reviewed_at: report.reviewed_at
    }
  end
end
