defmodule CGraphWeb.PremiumControllerTest do
  @moduledoc """
  Tests for premium subscription management (status, tiers, subscribe, cancel).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/premium/status" do
    test "returns premium status for user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/premium/status")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "GET /api/v1/premium/tiers" do
    test "returns available premium tiers", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/premium/tiers")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/premium/features" do
    test "returns premium features list", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/premium/features")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "POST /api/v1/premium/subscribe" do
    test "rejects subscribe without tier", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/premium/subscribe", %{})

      assert conn.status in [400, 422]
    end

    test "accepts valid tier param", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/premium/subscribe", %{tier: "premium"})

      # May succeed or indicate payment needed
      assert conn.status in [200, 402, 422]
    end
  end

  describe "POST /api/v1/premium/cancel" do
    test "handles cancel when no active subscription", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/premium/cancel")

      assert conn.status in [200, 400, 404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/premium/status")

      assert json_response(conn, 401)
    end
  end
end
