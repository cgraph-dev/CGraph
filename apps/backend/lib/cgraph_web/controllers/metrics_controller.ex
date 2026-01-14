defmodule CGraphWeb.MetricsController do
  @moduledoc """
  Exposes application metrics in Prometheus text format.
  """

  use CGraphWeb, :controller

  def index(conn, _params) do
    metrics = CGraph.Metrics.export(:prometheus)

    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, metrics)
  end
end
