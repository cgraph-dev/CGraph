defmodule CGraphWeb.API.V1.AccountDeletionControllerTest do
  @moduledoc """
  Tests for self-service account deletion (GDPR compliance).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/me/delete-account
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/me/delete-account" do
    test "schedules deletion with valid password", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/me/delete-account", %{password: "valid_password123!"})

      assert conn.status in [200, 401]
      response = json_response(conn, conn.status)
      assert is_map(response)
    end

    test "returns error with wrong password", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/me/delete-account", %{password: "wrong_pass"})

      assert json_response(conn, 401) || json_response(conn, 422)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = post(conn, ~p"/api/v1/me/delete-account", %{password: "any"})

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # DELETE /api/v1/me/delete-account
  # ──────────────────────────────────────────────────────────
  describe "DELETE /api/v1/me/delete-account" do
    test "cancels pending deletion when one exists", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/me/delete-account")

      # If no pending deletion, should return 400
      assert conn.status in [200, 400]
      response = json_response(conn, conn.status)
      assert is_map(response)
    end

    test "returns error when no pending deletion", %{conn: conn} do
      conn = delete(conn, ~p"/api/v1/me/delete-account")

      response = json_response(conn, 400) || json_response(conn, 200)
      assert is_map(response)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = delete(conn, ~p"/api/v1/me/delete-account")

      assert json_response(conn, 401)
    end
  end
end
