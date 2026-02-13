defmodule CGraphWeb.API.V1.SavedMessageControllerTest do
  @moduledoc """
  Tests for saved/bookmarked messages (Telegram-style bookmarks).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/saved-messages
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/saved-messages" do
    test "returns list of saved messages for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/saved-messages")

      response = json_response(conn, 200)
      assert response["success"] == true
      assert is_list(response["data"])
    end

    test "accepts search filter param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/saved-messages?search=hello")

      response = json_response(conn, 200)
      assert response["success"] == true
    end

    test "returns empty list when no messages saved", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/saved-messages")

      response = json_response(conn, 200)
      assert response["data"] == []
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/saved-messages")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/saved-messages
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/saved-messages" do
    test "returns error for invalid message_id", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/saved-messages", %{message_id: Ecto.UUID.generate()})

      # Should fail since message doesn't exist
      status = conn.status
      assert status in [404, 422, 400]
    end

    test "returns error when message_id missing", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/saved-messages", %{})

      status = conn.status
      assert status in [400, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/saved-messages/:id
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/saved-messages/:id" do
    test "returns error for non-existent saved message", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/saved-messages/#{Ecto.UUID.generate()}")

      assert conn.status in [404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = delete(conn, ~p"/api/v1/saved-messages/#{Ecto.UUID.generate()}")

      assert json_response(conn, 401)
    end
  end
end
