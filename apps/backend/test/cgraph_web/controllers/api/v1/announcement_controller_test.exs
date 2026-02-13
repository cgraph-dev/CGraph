defmodule CGraphWeb.API.V1.AnnouncementControllerTest do
  @moduledoc """
  Tests for the announcement system (MyBB-style announcements).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/announcements
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/announcements" do
    test "lists active announcements for authenticated user", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/announcements")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end

    test "accepts include_global param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/announcements?include_global=true")

      assert json_response(conn, 200)
    end

    test "accepts include_dismissed param", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/announcements?include_dismissed=true")

      assert json_response(conn, 200)
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/announcements")

      assert json_response(conn, 401)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/announcements/:id
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/announcements/:id" do
    test "returns 404 for non-existent announcement", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/announcements/#{Ecto.UUID.generate()}")

      assert json_response(conn, 404) || json_response(conn, 422)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/announcements/:id/read
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/announcements/:id/read" do
    test "returns error for non-existent announcement", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/announcements/#{Ecto.UUID.generate()}/read")

      assert json_response(conn, 404) || json_response(conn, 422)
    end
  end

  # ──────────────────────────────────────────────────────────
  # POST /api/v1/announcements/:id/dismiss
  # ──────────────────────────────────────────────────────────
  describe "POST /api/v1/announcements/:id/dismiss" do
    test "returns error for non-existent announcement", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/announcements/#{Ecto.UUID.generate()}/dismiss")

      assert json_response(conn, 404) || json_response(conn, 422)
    end
  end
end
