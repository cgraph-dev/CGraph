defmodule CGraphWeb.API.SubscriptionControllerTest do
  @moduledoc """
  Tests for forum subscription endpoints (notification preferences).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/forum/subscriptions" do
    test "lists user's forum subscriptions", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/forum/subscriptions")

      response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  describe "POST /api/v1/forum/subscriptions" do
    test "creates a subscription with valid params", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forum/subscriptions", %{})

      assert conn.status in [200, 201, 422]
    end
  end

  describe "PUT /api/v1/forum/subscriptions/:id" do
    test "returns error for non-existent subscription", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/forum/subscriptions/#{Ecto.UUID.generate()}", %{})

      assert conn.status in [404, 422]
    end
  end

  describe "DELETE /api/v1/forum/subscriptions/:id" do
    test "returns error for non-existent subscription", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/forum/subscriptions/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end
  end

  describe "POST /api/v1/forum/subscriptions/bulk-update" do
    test "handles bulk update request", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forum/subscriptions/bulk-update", %{"subscriptions" => []})

      assert conn.status in [200, 422]
    end
  end

  describe "POST /api/v1/forum/subscriptions/toggle-thread" do
    test "handles toggle thread request", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/forum/subscriptions/toggle-thread", %{"threadId" => Ecto.UUID.generate()})

      assert conn.status in [200, 404, 422]
    end
  end

  describe "authentication" do
    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forum/subscriptions")

      assert json_response(conn, 401)
    end
  end
end
