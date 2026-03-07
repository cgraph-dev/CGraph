defmodule CGraphWeb.API.V1.LottieControllerTest do
  @moduledoc "Tests for the Lottie animation catalog REST controller."
  use CGraphWeb.ConnCase, async: true

  # Animation endpoints are public (api_relaxed pipeline, no auth required)

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/animations/emojis
  # ──────────────────────────────────────────────────────────

  describe "GET /api/v1/animations/emojis" do
    test "returns paginated list of animated emojis", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis")
      response = json_response(conn, 200)

      assert %{"data" => data, "meta" => meta} = response
      assert is_list(data)
      assert is_integer(meta["total"])
      assert meta["page"] == 1
      assert meta["per_page"] == 50
    end

    test "supports pagination params", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis?page=2&per_page=5")
      response = json_response(conn, 200)

      assert %{"meta" => meta} = response
      assert meta["page"] == 2
      assert meta["per_page"] == 5
    end

    test "caps per_page at 200", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis?per_page=500")
      response = json_response(conn, 200)

      assert %{"meta" => meta} = response
      assert meta["per_page"] == 200
    end

    test "emoji entries have expected fields", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis?per_page=1")
      %{"data" => [emoji | _]} = json_response(conn, 200)

      assert Map.has_key?(emoji, "codepoint")
      assert Map.has_key?(emoji, "emoji")
      assert Map.has_key?(emoji, "name")
      assert Map.has_key?(emoji, "category")
      assert Map.has_key?(emoji, "animations")
      assert Map.has_key?(emoji, "has_animation")
      assert emoji["has_animation"] == true

      # Animations object has all formats
      animations = emoji["animations"]
      assert animations["lottie"] =~ "lottie.json"
      assert animations["webp"] =~ "512.webp"
      assert animations["gif"] =~ "512.gif"
    end

    test "sets cache-control header", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis?per_page=1")
      assert get_resp_header(conn, "cache-control") == ["public, max-age=86400"]
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/animations/emojis/search
  # ──────────────────────────────────────────────────────────

  describe "GET /api/v1/animations/emojis/search" do
    test "searches emojis by name", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis/search?q=grin")
      response = json_response(conn, 200)

      assert %{"data" => results, "meta" => %{"query" => "grin"}} = response
      assert is_list(results)
    end

    test "returns empty results for empty query", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis/search?q=")
      response = json_response(conn, 200)

      assert %{"data" => []} = response
    end

    test "returns empty results for no match", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis/search?q=xyznonexistent")
      response = json_response(conn, 200)

      assert %{"data" => []} = response
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/animations/emojis/:codepoint
  # ──────────────────────────────────────────────────────────

  describe "GET /api/v1/animations/emojis/:codepoint" do
    test "returns animation for known codepoint", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis/1f600")
      response = json_response(conn, 200)

      assert %{"data" => data} = response
      assert data["codepoint"] == "1f600"
      assert data["emoji"] == "😀"
      assert data["has_animation"] == true
      assert data["animations"]["lottie"] =~ "1f600/lottie.json"
    end

    test "returns 404 for unknown codepoint", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/emojis/00000")
      response = json_response(conn, 404)
      assert response["error"] =~ "not found"
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/animations/categories
  # ──────────────────────────────────────────────────────────

  describe "GET /api/v1/animations/categories" do
    test "returns category list with counts", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/categories")
      response = json_response(conn, 200)

      assert %{"data" => categories} = response
      assert is_list(categories)
      assert length(categories) > 0

      first = hd(categories)
      assert Map.has_key?(first, "name")
      assert Map.has_key?(first, "animated_count")
      assert is_integer(first["animated_count"])
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/animations/borders (placeholder)
  # ──────────────────────────────────────────────────────────

  describe "GET /api/v1/animations/borders" do
    test "returns coming soon placeholder", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/borders")
      response = json_response(conn, 200)

      assert %{"data" => [], "meta" => %{"message" => msg}} = response
      assert msg =~ "coming soon"
    end
  end

  # ──────────────────────────────────────────────────────────
  # GET /api/v1/animations/effects (placeholder)
  # ──────────────────────────────────────────────────────────

  describe "GET /api/v1/animations/effects" do
    test "returns coming soon placeholder", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/animations/effects")
      response = json_response(conn, 200)

      assert %{"data" => [], "meta" => %{"message" => msg}} = response
      assert msg =~ "coming soon"
    end
  end
end
