defmodule CgraphWeb.HealthControllerTest do
  use CgraphWeb.ConnCase, async: true

  describe "GET /health" do
    test "returns healthy status", %{conn: conn} do
      conn = get(conn, ~p"/health")
      
      response = json_response(conn, 200)
      # Accept either "healthy" or "ok" as valid status values
      assert response["service"] == "cgraph-api"
      assert response["status"] in ["healthy", "ok"]
    end
  end

  describe "GET /ready" do
    test "returns ready status when all services are up", %{conn: conn} do
      conn = get(conn, ~p"/ready")
      
      response = json_response(conn, 200)
      
      assert response["status"] == "ready"
      assert response["checks"]["database"] == "ok"
    end

    test "returns status of each service", %{conn: conn} do
      conn = get(conn, ~p"/ready")
      
      assert %{
        "checks" => %{
          "database" => _db_status,
          "redis" => _redis_status
        }
      } = json_response(conn, 200)
    end
  end
end
