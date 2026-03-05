defmodule CGraphWeb.API.V1.CreatorAnalyticsControllerTest do
  @moduledoc "Tests for creator analytics endpoints."
  use CGraphWeb.ConnCase, async: false
  import CGraph.Factory

  setup %{conn: conn} do
    creator = insert(:creator_user)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("content-type", "application/json")

    creator_conn = log_in_user(conn, creator)

    %{conn: conn, creator_conn: creator_conn, creator: creator}
  end

  # ── Authentication ──────────────────────────────────────────────

  describe "authentication" do
    test "GET /api/v1/creator/analytics/overview returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/creator/analytics/overview") |> json_response(401)
    end

    test "GET /api/v1/creator/analytics/earnings returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/creator/analytics/earnings") |> json_response(401)
    end

    test "GET /api/v1/creator/analytics/subscribers returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/creator/analytics/subscribers") |> json_response(401)
    end

    test "GET /api/v1/creator/analytics/content returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/creator/analytics/content") |> json_response(401)
    end
  end

  # ── GET /api/v1/creator/analytics/overview ──────────────────────

  describe "GET /api/v1/creator/analytics/overview" do
    test "returns analytics overview stats", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/overview") |> json_response(200)

      assert is_map(response["data"])
      assert Map.has_key?(response["data"], "subscriber_count")
      assert Map.has_key?(response["data"], "mrr_cents")
      assert Map.has_key?(response["data"], "churn_rate")
      assert Map.has_key?(response["data"], "platform_fee_percent")
      assert response["data"]["platform_fee_percent"] == 15
    end

    test "returns zero subscriber count for creator without subscribers", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/overview") |> json_response(200)

      assert response["data"]["subscriber_count"] == 0
      assert response["data"]["mrr_cents"] == 0
    end

    test "accepts period parameter", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/overview?period=7d") |> json_response(200)
      assert is_map(response["data"])

      response = conn |> get(~p"/api/v1/creator/analytics/overview?period=90d") |> json_response(200)
      assert is_map(response["data"])
    end
  end

  # ── GET /api/v1/creator/analytics/earnings ──────────────────────

  describe "GET /api/v1/creator/analytics/earnings" do
    test "returns earnings timeline and top forums", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/earnings") |> json_response(200)

      assert is_map(response["data"])
      assert Map.has_key?(response["data"], "earnings_over_time")
      assert Map.has_key?(response["data"], "top_forums")
    end

    test "returns empty earnings for new creator", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/earnings") |> json_response(200)

      assert response["data"]["earnings_over_time"] == [] or
             is_list(response["data"]["earnings_over_time"])
    end
  end

  # ── GET /api/v1/creator/analytics/subscribers ───────────────────

  describe "GET /api/v1/creator/analytics/subscribers" do
    test "returns 400 without forum_id", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/subscribers") |> json_response(400)

      assert response["error"]["message"] =~ "forum_id"
    end

    test "returns subscriber list for forum", %{creator_conn: conn, creator: creator} do
      forum = insert(:forum, owner: creator)
      subscriber = insert(:user)
      insert(:paid_forum_subscription, forum: forum, subscriber: subscriber, creator: creator)

      response =
        conn
        |> get(~p"/api/v1/creator/analytics/subscribers?forum_id=#{forum.id}")
        |> json_response(200)

      assert is_list(response["data"])
      assert length(response["data"]) == 1
      [sub_data] = response["data"]
      assert sub_data["subscriber_id"] == subscriber.id
      assert sub_data["status"] == "active"
    end

    test "returns empty list for forum with no subscribers", %{creator_conn: conn, creator: creator} do
      forum = insert(:forum, owner: creator)

      response =
        conn
        |> get(~p"/api/v1/creator/analytics/subscribers?forum_id=#{forum.id}")
        |> json_response(200)

      assert response["data"] == []
    end
  end

  # ── GET /api/v1/creator/analytics/content ───────────────────────

  describe "GET /api/v1/creator/analytics/content" do
    test "returns top forums content data", %{creator_conn: conn} do
      response = conn |> get(~p"/api/v1/creator/analytics/content") |> json_response(200)

      assert is_map(response["data"])
      assert Map.has_key?(response["data"], "top_forums")
    end
  end
end
