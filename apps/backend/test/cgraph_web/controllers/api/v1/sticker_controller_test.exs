defmodule CGraphWeb.API.V1.StickerControllerTest do
  @moduledoc """
  Tests for the sticker API endpoints.

  All sticker packs are official/shared — no user-uploaded custom stickers.
  """
  use CGraphWeb.ConnCase, async: false
  import CGraph.Factory

  setup %{conn: conn} do
    user = insert(:user, coins: 500)

    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> put_req_header("content-type", "application/json")

    authed_conn = log_in_user(conn, user)

    %{conn: conn, authed_conn: authed_conn, user: user}
  end

  # ============================================================================
  # Authentication
  # ============================================================================

  describe "authentication" do
    test "GET /api/v1/stickers/store returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/stickers/store") |> json_response(401)
    end

    test "GET /api/v1/stickers/my-packs returns 401 without auth", %{conn: conn} do
      conn |> get(~p"/api/v1/stickers/my-packs") |> json_response(401)
    end

    test "POST /api/v1/stickers/packs/:id/add returns 401 without auth", %{conn: conn} do
      conn |> post(~p"/api/v1/stickers/packs/#{Ecto.UUID.generate()}/add") |> json_response(401)
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/store
  # ============================================================================

  describe "GET /api/v1/stickers/store" do
    test "returns paginated sticker packs", %{authed_conn: conn} do
      for _ <- 1..3, do: insert(:sticker_pack, published: true)

      response = conn |> get(~p"/api/v1/stickers/store") |> json_response(200)

      assert length(response["packs"]) == 3
      assert response["pagination"]["total"] == 3
      assert response["pagination"]["page"] == 1
    end

    test "filters by category", %{authed_conn: conn} do
      insert(:sticker_pack, category: "animals")
      insert(:sticker_pack, category: "emotions")

      response =
        conn
        |> get(~p"/api/v1/stickers/store?category=animals")
        |> json_response(200)

      assert length(response["packs"]) == 1
      assert hd(response["packs"])["category"] == "animals"
    end

    test "filters by premium status", %{authed_conn: conn} do
      insert(:sticker_pack, is_premium: false)
      insert(:sticker_pack, is_premium: true, coin_price: 100)

      response =
        conn
        |> get(~p"/api/v1/stickers/store?premium=true")
        |> json_response(200)

      assert length(response["packs"]) == 1
      assert hd(response["packs"])["is_premium"] == true
    end

    test "supports pagination params", %{authed_conn: conn} do
      for _ <- 1..5, do: insert(:sticker_pack)

      response =
        conn
        |> get(~p"/api/v1/stickers/store?page=2&per_page=2")
        |> json_response(200)

      assert length(response["packs"]) == 2
      assert response["pagination"]["page"] == 2
      assert response["pagination"]["per_page"] == 2
      assert response["pagination"]["total"] == 5
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/search
  # ============================================================================

  describe "GET /api/v1/stickers/search" do
    test "returns matching packs", %{authed_conn: conn} do
      insert(:sticker_pack, name: "happy_cats", title: "Happy Cats")
      insert(:sticker_pack, name: "angry_dogs", title: "Angry Dogs")

      response =
        conn
        |> get(~p"/api/v1/stickers/search?q=cats")
        |> json_response(200)

      assert length(response["packs"]) == 1
      assert hd(response["packs"])["name"] == "happy_cats"
    end

    test "returns 400 without query param", %{authed_conn: conn} do
      response =
        conn
        |> get(~p"/api/v1/stickers/search")
        |> json_response(400)

      assert response["error"] =~ "required"
    end

    test "returns empty list for no matches", %{authed_conn: conn} do
      response =
        conn
        |> get(~p"/api/v1/stickers/search?q=zzzznonexistent")
        |> json_response(200)

      assert response["packs"] == []
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/categories
  # ============================================================================

  describe "GET /api/v1/stickers/categories" do
    test "returns list of categories", %{authed_conn: conn} do
      response =
        conn
        |> get(~p"/api/v1/stickers/categories")
        |> json_response(200)

      assert is_list(response["categories"])
      assert "animals" in response["categories"]
      assert "emotions" in response["categories"]
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/trending
  # ============================================================================

  describe "GET /api/v1/stickers/trending" do
    test "returns packs ordered by downloads", %{authed_conn: conn} do
      insert(:sticker_pack, download_count: 10)
      insert(:sticker_pack, download_count: 500)
      insert(:sticker_pack, download_count: 100)

      response =
        conn
        |> get(~p"/api/v1/stickers/trending")
        |> json_response(200)

      counts = Enum.map(response["packs"], & &1["download_count"])
      assert counts == Enum.sort(counts, :desc)
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/my-packs
  # ============================================================================

  describe "GET /api/v1/stickers/my-packs" do
    test "returns user's installed packs", %{authed_conn: conn, user: user} do
      pack1 = insert(:sticker_pack)
      pack2 = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack1)
      insert(:user_sticker_pack, user: user, sticker_pack: pack2)

      response =
        conn
        |> get(~p"/api/v1/stickers/my-packs")
        |> json_response(200)

      ids = Enum.map(response["packs"], & &1["id"]) |> MapSet.new()
      assert MapSet.member?(ids, pack1.id)
      assert MapSet.member?(ids, pack2.id)
    end

    test "returns empty list when user has no packs", %{authed_conn: conn} do
      response =
        conn
        |> get(~p"/api/v1/stickers/my-packs")
        |> json_response(200)

      assert response["packs"] == []
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/recent
  # ============================================================================

  describe "GET /api/v1/stickers/recent" do
    test "returns empty list when no recent sticker messages", %{authed_conn: conn} do
      response =
        conn
        |> get(~p"/api/v1/stickers/recent")
        |> json_response(200)

      assert response["stickers"] == []
    end
  end

  # ============================================================================
  # GET /api/v1/stickers/packs/:id
  # ============================================================================

  describe "GET /api/v1/stickers/packs/:id" do
    test "returns pack with all stickers", %{authed_conn: conn} do
      pack = insert(:sticker_pack)
      s1 = insert(:sticker, sticker_pack: pack, sort_order: 1)
      s2 = insert(:sticker, sticker_pack: pack, sort_order: 2)

      response =
        conn
        |> get(~p"/api/v1/stickers/packs/#{pack.id}")
        |> json_response(200)

      assert response["pack"]["id"] == pack.id
      assert response["pack"]["name"] == pack.name
      sticker_ids = Enum.map(response["pack"]["stickers"], & &1["id"]) |> MapSet.new()
      assert MapSet.member?(sticker_ids, s1.id)
      assert MapSet.member?(sticker_ids, s2.id)
    end

    test "returns 404 for nonexistent pack", %{authed_conn: conn} do
      response =
        conn
        |> get(~p"/api/v1/stickers/packs/#{Ecto.UUID.generate()}")
        |> json_response(404)

      assert response["error"] =~ "not found"
    end
  end

  # ============================================================================
  # POST /api/v1/stickers/packs/:id/add
  # ============================================================================

  describe "POST /api/v1/stickers/packs/:id/add" do
    test "adds free pack to collection", %{authed_conn: conn} do
      pack = insert(:sticker_pack, coin_price: 0)

      response =
        conn
        |> post(~p"/api/v1/stickers/packs/#{pack.id}/add")
        |> json_response(201)

      assert response["message"] =~ "added"
      assert response["pack"]["id"] == pack.id
    end

    test "adds premium pack and deducts coins", %{authed_conn: conn, user: user} do
      pack = insert(:sticker_pack, is_premium: true, coin_price: 100)

      response =
        conn
        |> post(~p"/api/v1/stickers/packs/#{pack.id}/add")
        |> json_response(201)

      assert response["pack"]["id"] == pack.id

      updated_user = CGraph.Repo.get!(CGraph.Accounts.User, user.id)
      assert updated_user.coins == 400
    end

    test "returns 402 when user has insufficient coins", %{conn: conn} do
      poor_user = insert(:user, coins: 5)
      authed_conn = log_in_user(conn, poor_user)
      pack = insert(:sticker_pack, is_premium: true, coin_price: 100)

      response =
        authed_conn
        |> post(~p"/api/v1/stickers/packs/#{pack.id}/add")
        |> json_response(402)

      assert response["error"] =~ "coins"
    end

    test "returns 409 when pack already added", %{authed_conn: conn, user: user} do
      pack = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack)

      response =
        conn
        |> post(~p"/api/v1/stickers/packs/#{pack.id}/add")
        |> json_response(409)

      assert response["error"] =~ "already"
    end

    test "returns 404 for nonexistent pack", %{authed_conn: conn} do
      response =
        conn
        |> post(~p"/api/v1/stickers/packs/#{Ecto.UUID.generate()}/add")
        |> json_response(404)

      assert response["error"] =~ "not found"
    end
  end

  # ============================================================================
  # DELETE /api/v1/stickers/packs/:id/remove
  # ============================================================================

  describe "DELETE /api/v1/stickers/packs/:id/remove" do
    test "removes pack from collection", %{authed_conn: conn, user: user} do
      pack = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack)

      response =
        conn
        |> delete(~p"/api/v1/stickers/packs/#{pack.id}/remove")
        |> json_response(200)

      assert response["message"] =~ "removed"
    end

    test "returns 404 when pack not in collection", %{authed_conn: conn} do
      pack = insert(:sticker_pack)

      response =
        conn
        |> delete(~p"/api/v1/stickers/packs/#{pack.id}/remove")
        |> json_response(404)

      assert response["error"] =~ "not in your collection"
    end
  end
end
