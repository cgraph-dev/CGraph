defmodule CgraphWeb.HealthControllerTest do
  use CgraphWeb.ConnCase, async: true

  describe "GET /health" do
    test "returns healthy status", %{conn: conn} do
      conn = get(conn, ~p"/health")

      response = json_response(conn, 200)
      # render_data wraps in %{data: ...}
      assert response["data"]["service"] == "cgraph-api"
      assert response["data"]["status"] in ["healthy", "ok"]
    end
  end

  describe "GET /ready" do
    test "returns ready status when all services are up", %{conn: conn} do
      conn = get(conn, ~p"/ready")

      response = json_response(conn, 200)

      assert response["status"] in ["ready", "degraded"]
      assert response["checks"]["database"] == "ok"
    end

    test "returns status of each service", %{conn: conn} do
      conn = get(conn, ~p"/ready")

      response = json_response(conn, 200)
      assert is_map(response["checks"])
      assert Map.has_key?(response["checks"], "database")
      assert Map.has_key?(response["checks"], "redis")
    end
  end
end
