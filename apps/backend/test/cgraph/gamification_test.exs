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

  alias CGraph.Gamification.{Cosmetics, Prestige, Events, Marketplace}
  alias CGraphWeb.Endpoint

  # ==================== SETUP ====================

  setup do
    # Create test user with authentication
    user = insert(:user)
    admin = insert(:admin, role: :admin)

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
        |> get("/api/v1/cosmetics/borders", %{page: 1, per_page: 10})
        |> json_response(200)

      assert length(response["data"]) == 10
      assert response["pagination"]["total_pages"] == 2
      assert response["pagination"]["current_page"] == 1
    end

    test "filters borders by rarity", %{authed_conn: conn} do
      insert(:avatar_border, rarity: :legendary)
      insert(:avatar_border, rarity: :common)
      insert(:avatar_border, rarity: :legendary)

      response =
        conn
        |> get("/api/v1/cosmetics/borders", %{rarity: "legendary"})
        |> json_response(200)

      assert length(response["data"]) == 2
      assert Enum.all?(response["data"], &(&1["rarity"] == "legendary"))
    end

    test "includes user ownership status", %{authed_conn: conn, user: user} do
      owned_border = insert(:avatar_border)
      unowned_border = insert(:avatar_border)
      insert(:user_avatar_border, user_id: user.id, avatar_border_id: owned_border.id)

      response =
        conn
        |> get("/api/v1/cosmetics/borders")
        |> json_response(200)

      owned = Enum.find(response["data"], &(&1["id"] == owned_border.id))
      unowned = Enum.find(response["data"], &(&1["id"] == unowned_border.id))

      assert owned["owned"] == true
      assert unowned["owned"] == false
    end
  end

  describe "POST /api/v1/cosmetics/borders/:id/equip" do
    test "equips an owned border", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border)
      insert(:user_avatar_border, user_id: user.id, avatar_border_id: border.id)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/equip")
        |> json_response(200)

      assert response["equipped"] == true
      assert response["border"]["id"] == border.id
    end

    test "fails to equip unowned border", %{authed_conn: conn} do
      border = insert(:avatar_border)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/equip")
        |> json_response(403)

      assert response["error"] == "You do not own this border"
    end

    test "unequips previous border when equipping new one", %{authed_conn: conn, user: user} do
      old_border = insert(:avatar_border)
      new_border = insert(:avatar_border)

      insert(:user_avatar_border,
        user_id: user.id,
        avatar_border_id: old_border.id,
        is_equipped: true
      )
      insert(:user_avatar_border,
        user_id: user.id,
        avatar_border_id: new_border.id,
        is_equipped: false
      )

      conn
      |> post("/api/v1/cosmetics/borders/#{new_border.id}/equip")
      |> json_response(200)

      # Verify old border is unequipped
      old_ownership = Repo.get_by(UserAvatarBorder, user_id: user.id, avatar_border_id: old_border.id)
      new_ownership = Repo.get_by(UserAvatarBorder, user_id: user.id, avatar_border_id: new_border.id)

      refute old_ownership.is_equipped
      assert new_ownership.is_equipped
    end
  end

  describe "POST /api/v1/cosmetics/borders/:id/purchase" do
    test "purchases a border with sufficient coins", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, coin_price: 1000, is_purchasable: true)
      update_user_balance(user, 5000)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/purchase")
        |> json_response(200)

      assert response["success"] == true
      assert response["new_balance"] == 4000

      # Verify ownership
      assert Repo.get_by(UserAvatarBorder, user_id: user.id, avatar_border_id: border.id)
    end

    test "fails with insufficient coins", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, coin_price: 10000, is_purchasable: true)
      update_user_balance(user, 1000)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/purchase")
        |> json_response(402)

      assert response["error"] == "Insufficient coins"
      assert response["required"] == 10000
      assert response["current"] == 1000
    end

    test "fails for non-purchasable items", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_purchasable: false)
      update_user_balance(user, 100_000)

      response =
        conn
        |> post("/api/v1/cosmetics/borders/#{border.id}/purchase")
        |> json_response(400)

      assert response["error"] == "This item cannot be purchased"
    end
  end

  # ==================== PRESTIGE SYSTEM TESTS ====================

  describe "GET /api/v1/prestige" do
    test "returns user's prestige status", %{authed_conn: conn, user: user} do
      insert(:user_prestige,
        user_id: user.id,
        prestige_level: 3,
        xp_multiplier: 1.15,
        total_xp_earned: 5_000_000
      )

      response =
        conn
        |> get("/api/v1/prestige")
        |> json_response(200)

      assert response["prestige_level"] == 3
      assert response["xp_multiplier"] == 1.15
      assert response["total_xp_earned"] == 5_000_000
    end
  end

  describe "POST /api/v1/prestige/activate" do
    test "activates prestige when eligible", %{authed_conn: conn, user: user} do
      # User at max level
      update_user_level(user, 100, 999_999)

      response =
        conn
        |> post("/api/v1/prestige/activate")
        |> json_response(200)

      assert response["success"] == true
      assert response["new_prestige_level"] == 1
      assert response["xp_multiplier"] == 1.05
    end

    test "fails when not at max level", %{authed_conn: conn, user: user} do
      update_user_level(user, 50, 500_000)

      response =
        conn
        |> post("/api/v1/prestige/activate")
        |> json_response(400)

      assert response["error"] == "Must be at max level to prestige"
    end

    test "grants prestige rewards", %{authed_conn: conn, user: user} do
      prestige_reward = insert(:prestige_reward, prestige_level: 1)
      update_user_level(user, 100, 999_999)

      conn
      |> post("/api/v1/prestige/activate")
      |> json_response(200)

      # Verify rewards granted
      case prestige_reward.reward_type do
        :avatar_border ->
          assert Repo.get_by(UserAvatarBorder,
            user_id: user.id,
            avatar_border_id: prestige_reward.reward_id
          )

        :coins ->
          user = Repo.get!(User, user.id)
          assert user.coin_balance >= prestige_reward.reward_amount
      end
    end
  end

  # ==================== SEASONAL EVENTS TESTS ====================

  describe "GET /api/v1/events/active" do
    test "returns currently active events", %{authed_conn: conn} do
      # Insert active event
      active_event = insert(:seasonal_event,
        status: :active,
        starts_at: DateTime.add(DateTime.utc_now(), -1, :day),
        ends_at: DateTime.add(DateTime.utc_now(), 7, :day)
      )

      # Insert inactive events
      insert(:seasonal_event, status: :draft)
      insert(:seasonal_event, status: :ended)

      response =
        conn
        |> get("/api/v1/events/active")
        |> json_response(200)

      assert length(response["data"]) == 1
      assert hd(response["data"])["id"] == active_event.id
    end
  end

  describe "GET /api/v1/events/:id/progress" do
    test "returns user's event progress", %{authed_conn: conn, user: user} do
      event = insert(:seasonal_event, status: :active)
      insert(:user_event_progress,
        user_id: user.id,
        event_id: event.id,
        event_xp: 15000,
        battle_pass_tier: 8,
        leaderboard_rank: 42
      )

      response =
        conn
        |> get("/api/v1/events/#{event.id}/progress")
        |> json_response(200)

      assert response["event_xp"] == 15000
      assert response["battle_pass_tier"] == 8
      assert response["leaderboard_rank"] == 42
    end
  end

  describe "POST /api/v1/events/:id/battle-pass/claim" do
    test "claims available battle pass rewards", %{authed_conn: conn, user: user} do
      event = insert(:seasonal_event, status: :active)
      tier = insert(:battle_pass_tier, event_id: event.id, tier_number: 5)

      insert(:user_event_progress,
        user_id: user.id,
        event_id: event.id,
        battle_pass_tier: 5,
        claimed_tiers: [1, 2, 3, 4]
      )

      response =
        conn
        |> post("/api/v1/events/#{event.id}/battle-pass/claim", %{tier: 5})
        |> json_response(200)

      assert response["success"] == true
      assert response["rewards"] != nil
    end

    test "fails when tier not yet reached", %{authed_conn: conn, user: user} do
      event = insert(:seasonal_event, status: :active)
      insert(:battle_pass_tier, event_id: event.id, tier_number: 10)

      insert(:user_event_progress,
        user_id: user.id,
        event_id: event.id,
        battle_pass_tier: 5
      )

      response =
        conn
        |> post("/api/v1/events/#{event.id}/battle-pass/claim", %{tier: 10})
        |> json_response(400)

      assert response["error"] == "Tier not yet reached"
    end
  end

  # ==================== MARKETPLACE TESTS ====================

  describe "GET /api/v1/marketplace/listings" do
    test "returns paginated listings", %{authed_conn: conn} do
      insert_list(25, :marketplace_listing, status: :active)

      response =
        conn
        |> get("/api/v1/marketplace/listings", %{page: 1, per_page: 10})
        |> json_response(200)

      assert length(response["data"]) == 10
      assert response["pagination"]["total"] == 25
    end

    test "filters by item type", %{authed_conn: conn} do
      insert(:marketplace_listing, item_type: :avatar_border, status: :active)
      insert(:marketplace_listing, item_type: :profile_theme, status: :active)

      response =
        conn
        |> get("/api/v1/marketplace/listings", %{type: "avatar_border"})
        |> json_response(200)

      assert length(response["data"]) == 1
      assert hd(response["data"])["item_type"] == "avatar_border"
    end

    test "filters by price range", %{authed_conn: conn} do
      insert(:marketplace_listing, price: 500, status: :active)
      insert(:marketplace_listing, price: 1500, status: :active)
      insert(:marketplace_listing, price: 3000, status: :active)

      response =
        conn
        |> get("/api/v1/marketplace/listings", %{min_price: 1000, max_price: 2000})
        |> json_response(200)

      assert length(response["data"]) == 1
      assert hd(response["data"])["price"] == 1500
    end

    test "sorts by different criteria", %{authed_conn: conn} do
      insert(:marketplace_listing, price: 500, status: :active, listed_at: ~N[2026-01-01 00:00:00])
      insert(:marketplace_listing, price: 1500, status: :active, listed_at: ~N[2026-01-02 00:00:00])

      # Sort by price ascending
      response =
        conn
        |> get("/api/v1/marketplace/listings", %{sort: "price_low"})
        |> json_response(200)

      prices = Enum.map(response["data"], & &1["price"])
      assert prices == Enum.sort(prices)

      # Sort by newest
      response =
        conn
        |> get("/api/v1/marketplace/listings", %{sort: "newest"})
        |> json_response(200)

      first_listing = hd(response["data"])
      assert first_listing["price"] == 1500  # The newer one
    end
  end

  describe "POST /api/v1/marketplace/listings" do
    test "creates a new listing", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_tradeable: true)
      insert(:user_avatar_border, user_id: user.id, avatar_border_id: border.id)

      response =
        conn
        |> post("/api/v1/marketplace/listings", %{
          item_type: "avatar_border",
          item_id: border.id,
          price: 5000,
          currency: "coins"
        })
        |> json_response(201)

      assert response["id"] != nil
      assert response["price"] == 5000
      assert response["status"] == "active"
    end

    test "fails for non-tradeable items", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_tradeable: false)
      insert(:user_avatar_border, user_id: user.id, avatar_border_id: border.id)

      response =
        conn
        |> post("/api/v1/marketplace/listings", %{
          item_type: "avatar_border",
          item_id: border.id,
          price: 5000,
          currency: "coins"
        })
        |> json_response(400)

      assert response["error"] == "This item cannot be traded"
    end

    test "fails for unowned items", %{authed_conn: conn} do
      border = insert(:avatar_border, is_tradeable: true)

      response =
        conn
        |> post("/api/v1/marketplace/listings", %{
          item_type: "avatar_border",
          item_id: border.id,
          price: 5000,
          currency: "coins"
        })
        |> json_response(403)

      assert response["error"] == "You do not own this item"
    end
  end

  describe "POST /api/v1/marketplace/listings/:id/purchase" do
    test "completes a purchase successfully", %{authed_conn: conn, user: buyer} do
      seller = insert(:user)
      border = insert(:avatar_border, is_tradeable: true)
      insert(:user_avatar_border, user_id: seller.id, avatar_border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: seller.id,
        item_type: :avatar_border,
        item_id: border.id,
        price: 1000,
        status: :active
      )

      update_user_balance(buyer, 5000)

      response =
        conn
        |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
        |> json_response(200)

      assert response["success"] == true
      assert response["new_balance"] == 4000

      # Verify ownership transfer
      assert Repo.get_by(UserAvatarBorder, user_id: buyer.id, avatar_border_id: border.id)
      refute Repo.get_by(UserAvatarBorder, user_id: seller.id, avatar_border_id: border.id)

      # Verify listing marked as sold
      listing = Repo.get!(MarketplaceListing, listing.id)
      assert listing.status == :sold
    end

    test "cannot purchase own listing", %{authed_conn: conn, user: user} do
      border = insert(:avatar_border, is_tradeable: true)
      insert(:user_avatar_border, user_id: user.id, avatar_border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: user.id,
        item_type: :avatar_border,
        item_id: border.id,
        price: 1000,
        status: :active
      )

      response =
        conn
        |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
        |> json_response(400)

      assert response["error"] == "Cannot purchase your own listing"
    end

    test "handles concurrent purchase attempts", %{authed_conn: conn, user: buyer} do
      seller = insert(:user)
      border = insert(:avatar_border, is_tradeable: true)
      insert(:user_avatar_border, user_id: seller.id, avatar_border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: seller.id,
        item_type: :avatar_border,
        item_id: border.id,
        price: 1000,
        status: :active
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
      responses = [
        json_response(result1, [200, 409]),
        json_response(result2, [200, 409])
      ]

      success_count = Enum.count(responses, &(&1["success"] == true))
      assert success_count == 1
    end

    test "deducts transaction fee from seller", %{authed_conn: conn, user: buyer} do
      seller = insert(:user)
      border = insert(:avatar_border, is_tradeable: true)
      insert(:user_avatar_border, user_id: seller.id, avatar_border_id: border.id)

      listing = insert(:marketplace_listing,
        seller_id: seller.id,
        item_type: :avatar_border,
        item_id: border.id,
        price: 10000,
        status: :active
      )

      update_user_balance(buyer, 15000)
      update_user_balance(seller, 0)

      conn
      |> post("/api/v1/marketplace/listings/#{listing.id}/purchase")
      |> json_response(200)

      # 5% fee, seller gets 9500
      seller = Repo.get!(User, seller.id)
      assert seller.coin_balance == 9500
    end
  end

  # ==================== ADMIN TESTS ====================

  describe "POST /api/admin/events" do
    test "admin can create event", %{admin_conn: conn} do
      response =
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
        |> json_response(201)

      assert response["name"] == "Test Event"
      assert response["status"] == "draft"
    end

    test "non-admin cannot create event", %{authed_conn: conn} do
      response =
        conn
        |> post("/api/admin/events", %{
          event: %{name: "Test", event_type: "seasonal"}
        })
        |> json_response(401)

      assert response["error"] == "Admin authentication required"
    end
  end

  describe "POST /api/admin/marketplace/listings/:id/reject" do
    test "admin can reject flagged listing", %{admin_conn: conn} do
      listing = insert(:marketplace_listing, status: :flagged)

      response =
        conn
        |> post("/api/admin/marketplace/listings/#{listing.id}/reject", %{
          reason: "Suspicious pricing",
          note: "Price significantly below market value"
        })
        |> json_response(200)

      assert response["status"] == "rejected"

      # Verify listing was rejected
      listing = Repo.get!(MarketplaceListing, listing.id)
      assert listing.status == :rejected
    end
  end

  # ==================== WEBSOCKET CHANNEL TESTS ====================

  describe "gamification channel" do
    test "broadcasts XP gain to user", %{user: user} do
      {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
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
      {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
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
      {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
      {:ok, _, socket} = subscribe_and_join(socket, "marketplace:lobby", %{})

      listing = insert(:marketplace_listing, status: :active)

      CGraphWeb.Endpoint.broadcast!("marketplace:lobby", "listing_created", %{
        listing: listing
      })

      assert_push "listing_created", %{listing: _}
    end

    test "notifies seller when item sells", %{user: user} do
      {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => generate_token(user)})
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
    CGraphWeb.Auth.Token.generate(user)
  end

  defp update_user_balance(user, amount) do
    user
    |> Ecto.Changeset.change(coin_balance: amount)
    |> Repo.update!()
  end

  defp update_user_level(user, level, xp) do
    user
    |> Ecto.Changeset.change(level: level, total_xp: xp)
    |> Repo.update!()
  end
end
