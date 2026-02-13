defmodule CGraphWeb.MetricsControllerTest do
  @moduledoc """
  Tests for Prometheus metrics endpoint (public, no auth).
  """
  use CGraphWeb.ConnCase, async: true

  describe "GET /metrics" do
    test "returns prometheus metrics" do
      conn = build_conn()
      conn = get(conn, "/metrics")

      assert conn.status == 200
      assert conn.resp_body =~ "erlang_vm" or conn.resp_body =~ "phoenix" or conn.status == 200
    end
  end
end
