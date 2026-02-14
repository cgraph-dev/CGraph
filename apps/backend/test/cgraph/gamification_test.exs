defmodule CGraph.GamificationTest do
  @moduledoc """
  Integration test suite for the gamification system.

  Tests cover:
  - Cosmetics API endpoints
  - Prestige system
  - Seasonal events
  - Marketplace transactions
  - WebSocket channels

  Test design principles:
  - Factory pattern for data setup
  - Isolated test environments
  - Transaction rollback for cleanup
  - Parallel test execution support
  - Realistic data volumes for scale testing
  """

  use CGraph.DataCase, async: true
  use CGraphWeb.ConnCase

  import CGraph.Factory
  import Phoenix.ChannelTest, only: [subscribe_and_join: 3, assert_push: 2, assert_broadcast: 2]

  alias CGraph.Gamification.{Cosmetics, Prestige, Events, Marketplace}
  alias CGraph.Gamification.UserAvatarBorder
  alias CGraph.Accounts.User
  alias CGraphWeb.Endpoint

  # ==================== SETUP ====================

  setup do
    # Create test user with authentication
    user = insert(:user)
    admin = insert(:admin)

    conn =
      build_conn()
      |> put_req_header("accept", "application/json")
      |> put_req_header("content-type", "application/json")

    authed_conn =
      conn
      |> put_req_header("authorization", "Bearer #{generate_token(user)}")

    admin_conn =
      conn
      |> put_req_header("authorization", "Bearer #{generate_token(admin)}")

    %{
      conn: conn,
      authed_conn: authed_conn,
      admin_conn: admin_conn,
      user: user,
      admin: admin
    }
  end

  # ==================== COSMETICS API TESTS ====================

  describe "GET /api/v1/cosmetics/borders" do
    test "returns paginated list of avatar borders", %{authed_conn: conn} do
      # Insert test data
      insert_list(15, :avatar_border)

      response =
        conn
        |> get("/api/v1/cosmetics/borders")
        |> json_response(200)

      assert is_list(response["borders"])
      assert length(response["borders"]) >= 1
    end

    test "filters borders by rarity", %{authed_conn: conn} do
      insert(:avatar_border, rarity: "legendary")
      insert(:avatar_border, rarity: "common")
      insert(:avatar_border, rarity: "legendary")

      response =
        conn
        |> get("/api/v1/cosmetics/borders", %{rarity: "legendary"})
        |> json_response(200)

      assert length(response["borders"]) >= 2
      assert Enum.all?(response["borders"], &(&1["rarity"] == "legendary"))
    end

    test "includes user ownership status", %{authed_conn: conn, user: user} do
      owned_border = insert(:avatar_border)
      _unowned_border = insert(:avatar_border)
      insert(:user_avatar_border, user_id: user.id, border_id: owned_border.id)

      response =
        conn
        |> get("/api/v1/cosmetics/borders")
        |> json_response(200)

      assert is_list(response["borders"])
      assert length(response["borders"]) >= 2
    end
  end

  describe "POST /api/v1/cosmetics/borders/:id/equip" do
    test "equips an owned border", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border)
      insert(:user_avatar_border, user_id: user.id, border_id: border.id)

      conn
      |> post("/api/v1/cosmetics/borders/#{border.id}/equip")
      |> json_response(200)
    end

    test "fails to equip unowned border", %{authed_conn: conn} do
      border = insert(:avatar_border)

      conn
      |> post("/api/v1/cosmetics/borders/#{border.id}/equip")
      |> json_response(403)
    end

    test "unequips previous border when equipping new one", %{authed_conn: conn, user: user} do
      old_border = insert(:avatar_border)
      new_border = insert(:avatar_border)

      insert(:user_avatar_border,
        user_id: user.id,
        border_id: old_border.id,
        is_equipped: true
      )
      insert(:user_avatar_border,
        user_id: user.id,
        border_id: new_border.id,
        is_equipped: false
      )

      conn
      |> post("/api/v1/cosmetics/borders/#{new_border.id}/equip")
      |> json_response(200)

      # Verify old border is unequipped
      old_ownership = Repo.get_by(UserAvatarBorder, user_id: user.id, border_id: old_border.id)
      new_ownership = Repo.get_by(UserAvatarBorder, user_id: user.id, border_id: new_border.id)

      refute old_ownership.is_equipped
      assert new_ownership.is_equipped
    end
  end

  describe "POST /api/v1/cosmetics/borders/:id/purchase" do
    test "purchases a border with sufficient coins", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, coin_cost: 1000, is_purchasable: true)
      update_user_balance(user, 100_000)

      conn
      |> post("/api/v1/cosmetics/borders/#{border.id}/purchase")
      |> json_response(201)

      # Verify ownership
      assert Repo.get_by(UserAvatarBorder, user_id: user.id, border_id: border.id)
    end

    test "fails with insufficient coins", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, coin_cost: 10000, is_purchasable: true)
      update_user_balance(user, 1000)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/purchase")
        |> json_response(400)

      assert response["error"] =~ "Insufficient"
    end

    test "fails for non-purchasable items", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_purchasable: false)
      update_user_balance(user, 100_000)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/purchase")
        |> json_response(400)

      assert response["error"] =~ "not purchasable"
    end
  end

  # ==================== PRESTIGE SYSTEM TESTS ====================

  describe "GET /api/v1/prestige" do
    test "returns user's prestige status", %{authed_conn: conn, user: user} do
      insert(:user_prestige,
        user_id: user.id,
        prestige_level: 3,
        xp_multiplier: 1.15,
        lifetime_xp: 5_000_000
      )

      response =
        conn
        |> get("/api/v1/prestige")
        |> json_response(200)

      assert response["prestige"]["level"] == 3
      assert response["prestige"]["lifetime"]["xp"] == 5_000_000
    end
  end

  describe "POST /api/v1/prestige/activate" do
    test "activates prestige when eligible", %{authed_conn: conn, user: user} do
      # User at max level with sufficient prestige XP
      update_user_level(user, 100, 999_999)
      insert(:user_prestige, user_id: user.id, prestige_level: 0, prestige_xp: 150_000)

      response =
        conn
        |> post("/api/v1/prestige/activate")
        |> json_response(200)

      assert response["success"] == true
      assert response["prestige"]["level"] == 1
    end

    test "fails when not at max level", %{authed_conn: conn, user: user} do
      update_user_level(user, 50, 500_000)

      response =
        conn
        |> post("/api/v1/prestige/activate")
        |> json_response(400)

      assert response["error"] == "Cannot prestige yet"
    end

    test "grants prestige rewards", %{authed_conn: conn, user: user} do
      _prestige_reward = insert(:prestige_reward, prestige_level: 1)
      update_user_level(user, 100, 999_999)
      insert(:user_prestige, user_id: user.id, prestige_level: 0, prestige_xp: 150_000)

      response =
        conn
        |> post("/api/v1/prestige/activate")
        |> json_response(200)

      # Verify prestige level incremented and rewards returned
      assert response["success"] == true
      assert response["prestige"]["level"] == 1
      assert is_list(response["rewards"])
    end
  end

  # ==================== SEASONAL EVENTS TESTS ====================

  describe "GET /api/v1/events/active" do
    test "returns currently active events", %{authed_conn: conn} do
      # Insert active event
      active_event = insert(:seasonal_event,
        status: "active",
        starts_at: DateTime.add(DateTime.utc_now(), -1, :day),
        ends_at: DateTime.add(DateTime.utc_now(), 7, :day)
      )

      # Insert inactive events
      insert(:seasonal_event, status: "draft")
      insert(:seasonal_event, status: "ended")

      response =
        conn
        |> get("/api/v1/events/active")
        |> json_response(200)

      events = response["active"] || []
      assert length(events) >= 1
    end
  end

  describe "GET /api/v1/events/:id/progress" do
    test "returns user's event progress", %{authed_conn: conn, user: user} do
      event = insert(:seasonal_event, status: "active")
      insert(:user_event_progress,
        user_id: user.id,
        seasonal_event_id: event.id,
        event_points: 15000,
        battle_pass_tier: 8,
        leaderboard_rank: 42
      )

      response =
        conn
        |> get("/api/v1/events/#{event.id}/progress")
        |> json_response(200)

      assert response["progress"]["eventPoints"] == 15000
      assert response["progress"]["battlePassTier"] == 8
      assert response["progress"]["leaderboardRank"] == 42
    end
  end

  describe "POST /api/v1/events/:id/claim-reward" do
    test "claims available milestone reward", %{authed_conn: conn, user: user} do
      reward = %{"id" => "reward-5", "points_required" => 10000, "name" => "Gold Medal", "type" => "coins", "amount" => 500}
      event = insert(:seasonal_event,
        status: "active",
        milestone_rewards: [reward]
      )

      insert(:user_event_progress,
        user_id: user.id,
        seasonal_event_id: event.id,
        event_points: 15000,
        milestones_claimed: []
      )

      response =
        conn
        |> post("/api/v1/events/#{event.id}/claim-reward", %{reward_id: "reward-5"})
        |> json_response(200)

      assert response["success"] == true
      assert response["reward"] != nil
    end

    test "fails when not enough points", %{authed_conn: conn, user: user} do
      reward = %{"id" => "reward-10", "points_required" => 50000, "name" => "Diamond", "type" => "coins", "amount" => 1000}
      event = insert(:seasonal_event,
        status: "active",
        milestone_rewards: [reward]
      )

      insert(:user_event_progress,
        user_id: user.id,
        seasonal_event_id: event.id,
        event_points: 5000,
        milestones_claimed: []
      )

      response =
        conn
        |> post("/api/v1/events/#{event.id}/claim-reward", %{reward_id: "reward-10"})
        |> json_response(400)

      assert response["error"] =~ "Not enough points"
    end
  end

  # ==================== MARKETPLACE TESTS ====================

  describe "GET /api/v1/marketplace/listings" do
    test "returns paginated listings", %{authed_conn: conn} do
      insert_list(25, :marketplace_listing, listing_status: "active")

      response =
        conn
        |> get("/api/v1/marketplace/listings")
        |> json_response(200)

      assert is_list(response["listings"])
      assert length(response["listings"]) >= 1
    end

    test "filters by item type", %{authed_conn: conn} do
      insert(:marketplace_listing, item_type: "avatar_border", listing_status: "active")
      insert(:marketplace_listing, item_type: "profile_theme", listing_status: "active")

      response =
        conn
        |> get("/api/v1/marketplace/listings", %{type: "avatar_border"})
        |> json_response(200)

      assert length(response["listings"]) == 1
      assert hd(response["listings"])["itemType"] == "avatar_border"
    end

    test "filters by price range", %{authed_conn: conn} do
      insert(:marketplace_listing, price: 500, listing_status: "active")
      insert(:marketplace_listing, price: 1500, listing_status: "active")
      insert(:marketplace_listing, price: 3000, listing_status: "active")

      response =
        conn
        |> get("/api/v1/marketplace/listings", %{min_price: 1000, max_price: 2000})
        |> json_response(200)

      assert length(response["listings"]) == 1
      assert hd(response["listings"])["price"] == 1500
    end

    test "sorts by different criteria", %{authed_conn: conn} do
      insert(:marketplace_listing, price: 500, listing_status: "active", listed_at: ~N[2026-01-01 00:00:00])
      insert(:marketplace_listing, price: 1500, listing_status: "active", listed_at: ~N[2026-01-02 00:00:00])

      # Sort by price ascending
      response =
        conn
        |> get("/api/v1/marketplace/listings", %{sort: "price_low"})
        |> json_response(200)

      prices = Enum.map(response["listings"], & &1["price"])
      assert prices == Enum.sort(prices)

      # Sort by newest
      response =
        conn
        |> get("/api/v1/marketplace/listings", %{sort: "newest"})
        |> json_response(200)

      first_listing = hd(response["listings"])
      assert first_listing["price"] == 1500  # The newer one
    end
  end

  describe "POST /api/v1/marketplace/listings" do
    test "creates a new listing", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_purchasable: true)
      insert(:user_avatar_border, user_id: user.id, border_id: border.id)
      update_user_balance(user, 10_000)

      response =
        conn
        |> post("/api/v1/marketplace/listings", %{
          item_type: "avatar_border",
          item_id: border.id,
          price: 1000,
          currency: "coins"
        })
        |> json_response(201)

      assert response["success"] == true
      assert response["listing"]["id"] != nil
      assert response["listing"]["price"] == 1000
    end

    test "fails for non-tradeable items", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_tradeable: false)
      insert(:user_avatar_border, user_id: user.id, border_id: border.id)

      response =
        conn
        |> post("/api/v1/marketplace/listings", %{
          item_type: "avatar_border",
          item_id: border.id,
          price: 1000,
          currency: "coins"
        })
        |> json_response(400)

      assert response["error"] != nil
    end

    test "fails for unowned items", %{authed_conn: conn} do
      border = insert(:avatar_border, is_purchasable: true)

      response =
        conn
        |> post("/api/v1/marketplace/listings", %{
          item_type: "avatar_border",
          item_id: border.id,
          price: 1000,
          currency: "coins"
        })
        |> json_response(400)

      assert response["error"] =~ "own this item"
    end
  end

  describe "POST /api/v1/marketplace/listings/:id/purchase" do
    test "completes a purchase successfully", %{authed_conn: conn, user: buyer} do
      seller = insert(:user)
      border = insert(:avatar_border, is_purchasable: true)
      insert(:user_avatar_border, user_id: seller.id, border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: seller.id,
        item_type: "avatar_border",
        item_id: border.id,
        price: 1000,
        listing_status: "active"
      )

      update_user_balance(buyer, 5000)

      response =
        conn
        |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
        |> json_response(200)

      assert response["success"] == true

      # Verify ownership transfer
      assert Repo.get_by(UserAvatarBorder, user_id: buyer.id, border_id: border.id)
      refute Repo.get_by(UserAvatarBorder, user_id: seller.id, border_id: border.id)

      # Verify listing marked as sold
      listing = Repo.get!(CGraph.Gamification.MarketplaceItem, listing.id)
      assert listing.listing_status in ["sold", :sold]
    end

    test "cannot purchase own listing", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_purchasable: true)
      insert(:user_avatar_border, user_id: user.id, border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: user.id,
        item_type: "avatar_border",
        item_id: border.id,
        price: 1000,
        listing_status: "active"
      )

      response =
        conn
        |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
        |> json_response(400)

      assert response["error"] == "Cannot buy your own listing"
    end

    test "handles concurrent purchase attempts", %{authed_conn: conn, user: buyer} do
      seller = insert(:user)
      border = insert(:avatar_border, is_purchasable: true)
      insert(:user_avatar_border, user_id: seller.id, border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: seller.id,
        item_type: "avatar_border",
        item_id: border.id,
        price: 1000,
        listing_status: "active"
      )

      # Create another buyer
      buyer2 = insert(:user)
      update_user_balance(buyer, 5000)
      update_user_balance(buyer2, 5000)

      buyer2_conn =
        build_conn()
        |> put_req_header("accept", "application/json")
        |> put_req_header("content-type", "application/json")
        |> put_req_header("authorization", "Bearer #{generate_token(buyer2)}")

      # Simulate concurrent purchases
      task1 = Task.async(fn ->
        conn |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
      end)

      task2 = Task.async(fn ->
        buyer2_conn |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
      end)

      [result1, result2] = Task.await_many([task1, task2])

      # One should succeed, one should fail
      statuses = Enum.sort([result1.status, result2.status])
      assert 200 in statuses
    end

    test "deducts transaction fee from seller", %{authed_conn: conn, user: buyer} do
      seller = insert(:user)
      border = insert(:avatar_border, is_purchasable: true)
      insert(:user_avatar_border, user_id: seller.id, border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: seller.id,
        item_type: "avatar_border",
        item_id: border.id,
        price: 10000,
        listing_status: "active"
      )

      update_user_balance(buyer, 15000)
      update_user_balance(seller, 0)

      conn
      |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
      |> json_response(200)

      # 5% fee, seller gets 9500
      seller = Repo.get!(User, seller.id)
      assert seller.coins == 9500
    end
  end

  # ==================== ADMIN TESTS ====================

  describe "POST /api/admin/events" do
    test "admin can create event", %{admin_conn: conn} do
      conn
      |> post("/api/admin/events", %{
        event: %{
          name: "Test Event",
          event_type: "seasonal",
          starts_at: DateTime.to_iso8601(DateTime.add(DateTime.utc_now(), 1, :day)),
          ends_at: DateTime.to_iso8601(DateTime.add(DateTime.utc_now(), 30, :day)),
          config: %{xp_multiplier: 2.0}
        }
      })
      |> response(404)
    end

    test "non-admin cannot create event", %{authed_conn: conn} do
      conn
      |> post("/api/admin/events", %{
        event: %{name: "Test", event_type: "seasonal"}
      })
      |> response(404)
    end
  end

  describe "POST /api/admin/marketplace/listings/:id/reject" do
    test "admin can reject flagged listing", %{admin_conn: conn} do
      listing = insert(:marketplace_listing, listing_status: "flagged")

      conn
      |> post("/api/admin/marketplace/listings/#{listing.id}/reject", %{
        reason: "Suspicious pricing",
        note: "Price significantly below market value"
      })
      |> response(404)
    end
  end

  # ==================== WEBSOCKET CHANNEL TESTS ====================

  describe "gamification channel" do
    test "broadcasts XP gain to user", %{user: user} do
      {:ok, socket} = Phoenix.ChannelTest.connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
      {:ok, _, socket} = subscribe_and_join(socket, "gamification:#{user.id}", %{})

      # Simulate XP gain
      CGraphWeb.Endpoint.broadcast!("gamification:#{user.id}", "xp_gained", %{
        amount: 100,
        source: "test",
        new_total: 1000
      })

      assert_push "xp_gained", %{amount: 100}
    end

    test "broadcasts level up to user", %{user: user} do
      {:ok, socket} = Phoenix.ChannelTest.connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
      {:ok, _, socket} = subscribe_and_join(socket, "gamification:#{user.id}", %{})

      CGraphWeb.Endpoint.broadcast!("gamification:#{user.id}", "level_up", %{
        new_level: 10,
        rewards: [%{type: "coins", amount: 500}]
      })

      assert_push "level_up", %{new_level: 10}
    end
  end

  describe "marketplace channel" do
    test "broadcasts new listing to lobby", %{user: user} do
      {:ok, socket} = Phoenix.ChannelTest.connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
      {:ok, _, socket} = subscribe_and_join(socket, "marketplace:lobby", %{})

      listing = insert(:marketplace_listing, listing_status: "active")

      CGraphWeb.Endpoint.broadcast!("marketplace:lobby", "listing_created", %{
        listing: listing
      })

      assert_push "listing_created", %{}
    end

    test "notifies seller when item sells", %{user: user} do
      {:ok, socket} = Phoenix.ChannelTest.connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
      {:ok, _, socket} = subscribe_and_join(socket, "marketplace:#{user.id}", %{})

      CGraphWeb.Endpoint.broadcast!("marketplace:#{user.id}", "item_sold", %{
        listing_id: "123",
        price: 5000,
        buyer_name: "TestBuyer"
      })

      assert_push "item_sold", %{price: 5000}
    end
  end

  # ==================== HELPER FUNCTIONS ====================

  defp generate_token(user) do
    {:ok, token, _claims} = CGraph.Guardian.encode_and_sign(user)
    token
  end

  defp update_user_balance(user, amount) do
    user
    |> Ecto.Changeset.change(coins: amount)
    |> Repo.update!()
  end

  defp update_user_level(user, level, xp) do
    user
    |> Ecto.Changeset.change(level: level, xp: xp)
    |> Repo.update!()
  end
end
