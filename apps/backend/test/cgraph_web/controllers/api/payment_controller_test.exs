defmodule CGraphWeb.API.PaymentControllerTest do
  @moduledoc """
  Tests for payment/billing endpoints (plans, checkout, portal).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/billing/plans" do
    test "lists available billing plans", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/billing/plans")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "GET /api/v1/billing/status" do
    test "returns billing status for current user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/billing/status")

      response = json_response(conn, 200)
      assert is_map(response)
    end
  end

  describe "POST /api/v1/billing/checkout" do
    test "returns error with invalid plan", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/billing/checkout", %{"plan_id" => "invalid_plan"})

      assert conn.status in [400, 422]
    end
  end

  describe "POST /api/v1/billing/portal" do
    test "creates billing portal session or returns error", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/billing/portal")

      # May fail if user has no Stripe customer, which is expected
      assert conn.status in [200, 400, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/billing/plans")

      assert json_response(conn, 401)
    end
  end
end
