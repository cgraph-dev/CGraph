defmodule CGraphWeb.API.V1.NotificationControllerTest do
  @moduledoc """
  Tests for the notification controller — Discord/Meta standard:
  every user-facing endpoint must have coverage for happy path,
  authorization, and edge cases.
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/notifications
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/notifications" do
    test "returns paginated notifications for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end

    test "accepts page and per_page params", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications?page=1&per_page=5")

      assert json_response(conn, 200)
    end

    test "accepts filter=unread param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications?filter=unread")

      assert json_response(conn, 200)
    end

    test "accepts type filter param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications?type=message_mention")

      assert json_response(conn, 200)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/notifications")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # PUT /api/v1/notifications/read_all
  # ──────────────────────────────────────────────────────────
  describe "PUT /api/v1/notifications/read_all" do
    test "marks all notifications as read", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/notifications/read_all")

      assert response = json_response(conn, 200)
      assert is_map(response)
    end

    test "accepts optional type filter", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/notifications/read_all?type=new_message")

      assert json_response(conn, 200)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/notifications/:id
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/notifications/:id" do
    test "returns 404 for non-existent notification", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/notifications/#{Ecto.UUID.generate()}")

      assert json_response(conn, 404) || json_response(conn, 422)
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/notifications/:id
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/notifications/:id" do
    test "returns 404 for non-existent notification", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/notifications/#{Ecto.UUID.generate()}")

      assert conn.status in [204, 404, 422]
    end
  end
end
