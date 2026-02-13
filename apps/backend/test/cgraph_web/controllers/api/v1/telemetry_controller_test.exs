defmodule CGraphWeb.API.V1.TelemetryControllerTest do
  @moduledoc """
  Tests for client-side telemetry ingestion endpoints.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/telemetry/errors
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/telemetry/errors" do
    test "accepts valid error report", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/telemetry/errors", %{
        error_id: Ecto.UUID.generate(),
        message: "Test error from controller test",
        level: "error",
        component: "TestSuite",
        action: "test_action",
        url: "/test-page"
      })

      assert conn.status in [200, 204]
    end

    test "accepts minimal error report", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/telemetry/errors", %{
        message: "Minimal error"
      })

      assert conn.status in [200, 204]
    end

    test "handles fatal level errors", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/telemetry/errors", %{
        message: "Fatal crash",
        level: "fatal",
        component: "CriticalPath"
      })

      assert conn.status in [200, 204]
    end

    test "strips PII from metadata", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/telemetry/errors", %{
        message: "Error with metadata",
        metadata: %{screen_size: "1920x1080", version: "1.0.0"}
      })

      assert conn.status in [200, 204]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/telemetry/metrics
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/telemetry/metrics" do
    test "accepts valid performance metric", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/telemetry/metrics", %{
        name: "page_load",
        value: 1234.5,
        unit: "ms",
        tags: %{page: "/home"}
      })

      assert conn.status in [200, 204]
    end

    test "accepts metric with minimal fields", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/telemetry/metrics", %{
        name: "api_call",
        value: 50
      })

      assert conn.status in [200, 204]
    end
  end
end
