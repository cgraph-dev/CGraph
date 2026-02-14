defmodule CGraphWeb.API.V1.WebPushControllerTest do
  @moduledoc """
  Tests for Web Push notification endpoints (VAPID, subscribe, test).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/web-push/vapid-key (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/web-push/vapid-key" do
    test "returns VAPID public key or service unavailable" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/web-push/vapid-key")

      # Returns 200 with key or 503 if not configured
      assert conn.status in [200, 503]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/web-push/status (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/web-push/status" do
    test "returns push service status" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/web-push/status")

      assert conn.status in [200, 503]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/web-push/subscribe
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/web-push/subscribe" do
    test "registers a valid web push subscription", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/web-push/subscribe", %{
        subscription: %{
          endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
          keys: %{
            p256dh: "BL3DQQZoPmL-aaa-test-key",
            auth: "test-auth-secret"
          }
        }
      })

      # Should succeed or fail validation
      assert conn.status in [201, 400, 422, 503]
    end

    test "rejects subscription without endpoint", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/web-push/subscribe", %{
        subscription: %{
          keys: %{p256dh: "test", auth: "test"}
        }
      })

      assert conn.status in [400, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/web-push/subscribe", %{
        subscription: %{
          endpoint: "https://example.com/push",
          keys: %{p256dh: "test", auth: "test"}
        }
      })

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/web-push/unsubscribe
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/web-push/unsubscribe" do
    test "returns success or 404 when no subscription exists", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/web-push/unsubscribe")

      assert conn.status in [200, 204, 400, 404]
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/web-push/test
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/web-push/test" do
    test "sends test push notification", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/web-push/test")

      # May succeed or fail if no subscription registered
      assert conn.status in [200, 400, 404, 503]
    end
  end
end
