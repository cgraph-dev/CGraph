defmodule CGraphWeb.IAPControllerTest do
  @moduledoc """
  Tests for IAP (In-App Purchase) controller.

  Tests authentication requirements, input validation, and notification
  endpoint security. Does NOT test against live Apple/Google APIs.
  """
  use CGraphWeb.ConnCase, async: false
  import CGraph.Factory

  setup %{conn: conn} do
    user = insert(:user)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("content-type", "application/json")

    authed_conn = log_in_user(conn, user)

    %{conn: conn, authed_conn: authed_conn, user: user}
  end

  # ── Authentication Tests ─────────────────────────────────────────

  describe "authentication" do
    test "POST /api/v1/iap/validate returns 401 without auth", %{conn: conn} do
      conn |> post(~p"/api/v1/iap/validate", %{}) |> json_response(401)
    end

    test "POST /api/v1/iap/restore returns 401 without auth", %{conn: conn} do
      conn |> post(~p"/api/v1/iap/restore", %{}) |> json_response(401)
    end

    test "Apple notification endpoint does NOT require auth (unauthenticated)", %{conn: conn} do
      # Should return 400 (missing payload) not 401 (no auth required)
      response = conn |> post(~p"/api/v1/iap/notifications/apple", %{}) |> json_response(400)
      assert response["error"] =~ "signedPayload"
    end

    test "Google notification endpoint returns 401 for missing bearer token", %{conn: conn} do
      # Without authorization header, should return 401
      conn
      |> post(~p"/api/v1/iap/notifications/google", %{
        "message" => %{"data" => Base.encode64("{}")}
      })
      |> json_response(401)
    end
  end

  # ── POST /api/v1/iap/validate ───────────────────────────────────

  describe "POST /api/v1/iap/validate" do
    test "returns 422 with missing platform", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/iap/validate", %{
          "transaction_id" => "test_txn_123",
          "receipt_data" => "test_receipt"
        })
        |> json_response(422)

      assert response["success"] == false
      assert is_binary(response["error"])
    end

    test "returns 422 with unsupported platform", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/iap/validate", %{
          "platform" => "windows",
          "transaction_id" => "test_txn_123",
          "receipt_data" => "test_receipt"
        })
        |> json_response(422)

      assert response["success"] == false
      assert response["error"] =~ "Unsupported platform"
    end

    test "returns 422 with missing transaction_id", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/iap/validate", %{
          "platform" => "apple",
          "receipt_data" => "test_receipt"
        })
        |> json_response(422)

      assert response["success"] == false
    end

    test "returns 422 for Apple validation without real API", %{authed_conn: conn} do
      # Apple API won't be reachable in test — verify error handling
      response =
        conn
        |> post(~p"/api/v1/iap/validate", %{
          "platform" => "apple",
          "transaction_id" => "txn_test_123",
          "receipt_data" => "fake_receipt_data",
          "product_id" => "com.cgraph.premium.monthly"
        })
        |> json_response(422)

      assert response["success"] == false
      assert is_binary(response["error"])
    end

    test "returns 422 for Google validation without real API", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/iap/validate", %{
          "platform" => "google",
          "transaction_id" => "GPA.test.123",
          "receipt_data" => "fake_receipt",
          "product_id" => "com.cgraph.premium.monthly",
          "purchase_token" => "fake_purchase_token"
        })
        |> json_response(422)

      assert response["success"] == false
      assert is_binary(response["error"])
    end
  end

  # ── POST /api/v1/iap/restore ────────────────────────────────────

  describe "POST /api/v1/iap/restore" do
    test "returns result for user with no previous purchases", %{authed_conn: conn} do
      response = conn |> post(~p"/api/v1/iap/restore") |> json_response(200)

      assert response["success"] == true
      assert response["data"]["restored_count"] == 0
      assert response["data"]["receipts"] == []
    end
  end

  # ── POST /api/v1/iap/notifications/apple ────────────────────────

  describe "POST /api/v1/iap/notifications/apple" do
    test "returns 400 when signedPayload is missing" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/v1/iap/notifications/apple", %{})

      response = json_response(conn, 400)
      assert response["error"] =~ "signedPayload"
    end

    test "returns 401 for tampered JWS payload" do
      # Craft a fake JWS with no valid Apple certificate
      fake_header = Base.url_encode64(Jason.encode!(%{"alg" => "ES256", "x5c" => ["not_a_cert"]}), padding: false)
      fake_payload = Base.url_encode64(Jason.encode!(%{"notificationType" => "DID_RENEW"}), padding: false)
      fake_sig = Base.url_encode64("fake_signature", padding: false)
      fake_jws = "#{fake_header}.#{fake_payload}.#{fake_sig}"

      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/v1/iap/notifications/apple", %{"signedPayload" => fake_jws})

      assert json_response(conn, 401)["error"] =~ "verification"
    end

    test "returns 401 for non-Apple certificate in JWS" do
      # JWS with valid Base64 but certificate that doesn't chain to Apple CA
      fake_cert = Base.encode64(:crypto.strong_rand_bytes(100))
      header = Base.url_encode64(
        Jason.encode!(%{"alg" => "ES256", "x5c" => [fake_cert]}),
        padding: false
      )
      payload = Base.url_encode64(
        Jason.encode!(%{"notificationType" => "SUBSCRIBED", "data" => %{}}),
        padding: false
      )
      sig = Base.url_encode64("sig", padding: false)
      jws = "#{header}.#{payload}.#{sig}"

      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/v1/iap/notifications/apple", %{"signedPayload" => jws})

      assert json_response(conn, 401)["error"] =~ "verification"
    end
  end

  # ── POST /api/v1/iap/notifications/google ───────────────────────

  describe "POST /api/v1/iap/notifications/google" do
    test "returns 401 without authorization header" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/v1/iap/notifications/google", %{
          "message" => %{"data" => Base.encode64(Jason.encode!(%{}))}
        })

      assert json_response(conn, 401)["error"] =~ "Authentication" or
             json_response(conn, 401)["error"] =~ "invalid"
    end

    test "returns 401 with invalid bearer token" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> put_req_header("authorization", "Bearer fake_invalid_token")
        |> post(~p"/api/v1/iap/notifications/google", %{
          "message" => %{"data" => Base.encode64(Jason.encode!(%{}))}
        })

      assert json_response(conn, 401)["error"] =~ "Authentication" or
             json_response(conn, 401)["error"] =~ "invalid"
    end
  end
end
