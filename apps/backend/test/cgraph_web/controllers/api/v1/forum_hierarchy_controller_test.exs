defmodule CGraphWeb.API.V1.ForumHierarchyControllerTest do
  @moduledoc """
  Tests for forum hierarchy endpoints (tree, roots, subtrees, breadcrumbs).
  """
  use CGraphWeb.ConnCase, async: true

  import CgraphWeb.UserFixtures

  setup %{conn: conn} do
    user = user_fixture()
    conn = log_in_user(conn, user)
    %{conn: conn, user: user}
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/tree (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/tree" do
    test "returns full forum hierarchy tree" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/tree")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/roots (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/roots" do
    test "returns root-level forums" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/roots")

      assert response = json_response(conn, 200)
      assert is_map(response) or is_list(response)
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:id/subtree (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:id/subtree" do
    test "returns 404 for non-existent forum" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/subtree")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:id/children (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:id/children" do
    test "returns 404 for non-existent forum" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/children")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:id/ancestors (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:id/ancestors" do
    test "returns 404 for non-existent forum" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/ancestors")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/forums/:id/breadcrumbs (public)
  # ──────────────────────────────────────────────────────────
  describe "GET /api/v1/forums/:id/breadcrumbs" do
    test "returns 404 for non-existent forum" do
      conn = build_conn()
      conn = get(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/breadcrumbs")

      assert conn.status in [404, 422]
    end
  end

  # ──────────────────────────────────────────────────────────
  # PUT /api/v1/forums/:id/move (authenticated)
  # ──────────────────────────────────────────────────────────
  describe "PUT /api/v1/forums/:id/move" do
    test "returns 403/404 for non-admin user", %{conn: conn} do
      conn = put(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/move", %{
        parent_id: Ecto.UUID.generate()
      })

      assert conn.status in [403, 404, 422]
    end

    test "returns 401 for unauthenticated request" do
      conn = build_conn()
      conn = put(conn, ~p"/api/v1/forums/#{Ecto.UUID.generate()}/move", %{parent_id: nil})

      assert json_response(conn, 401)
    end
  end
end
