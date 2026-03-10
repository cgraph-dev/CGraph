defmodule CGraph.StickersTest do
  @moduledoc """
  Tests for the CGraph.Stickers context.

  All sticker packs are official/shared — no user-uploaded custom stickers.
  """
  use CGraph.DataCase, async: true
  import CGraph.Factory

  alias CGraph.Stickers
  alias CGraph.Stickers.{StickerPack, Sticker, UserStickerPack}

  # ============================================================================
  # Helpers
  # ============================================================================

  defp create_pack_with_stickers(pack_attrs \\ %{}, sticker_count \\ 3) do
    pack = insert(:sticker_pack, pack_attrs)

    stickers =
      for i <- 1..sticker_count do
        insert(:sticker, sticker_pack: pack, sort_order: i)
      end

    {pack, stickers}
  end

  # ============================================================================
  # Store Browsing
  # ============================================================================

  describe "list_store_packs/1" do
    test "returns published packs with pagination" do
      for _ <- 1..5, do: insert(:sticker_pack, published: true)
      insert(:sticker_pack, published: false)

      result = Stickers.list_store_packs(page: 1, per_page: 3)

      assert length(result.packs) == 3
      assert result.total == 5
    end

    test "filters by category" do
      insert(:sticker_pack, category: "animals")
      insert(:sticker_pack, category: "emotions")
      insert(:sticker_pack, category: "animals")

      result = Stickers.list_store_packs(category: "animals")

      assert result.total == 2
      assert Enum.all?(result.packs, &(&1.category == "animals"))
    end

    test "filters by sticker_type" do
      insert(:sticker_pack, sticker_type: "static")
      insert(:sticker_pack, sticker_type: "animated")

      result = Stickers.list_store_packs(sticker_type: "animated")

      assert result.total == 1
      assert hd(result.packs).sticker_type == "animated"
    end

    test "filters by is_premium" do
      insert(:sticker_pack, is_premium: false)
      insert(:sticker_pack, is_premium: true, coin_price: 100)

      result = Stickers.list_store_packs(is_premium: true)

      assert result.total == 1
      assert hd(result.packs).is_premium == true
    end

    test "preloads up to 5 preview stickers" do
      {pack, _stickers} = create_pack_with_stickers(%{}, 8)

      result = Stickers.list_store_packs()
      returned_pack = Enum.find(result.packs, &(&1.id == pack.id))

      assert length(returned_pack.stickers) == 5
    end

    test "excludes unpublished packs" do
      insert(:sticker_pack, published: true)
      insert(:sticker_pack, published: false)

      result = Stickers.list_store_packs()

      assert result.total == 1
    end

    test "paginates correctly across pages" do
      for i <- 1..5, do: insert(:sticker_pack, sort_order: i)

      page1 = Stickers.list_store_packs(page: 1, per_page: 2)
      page2 = Stickers.list_store_packs(page: 2, per_page: 2)
      page3 = Stickers.list_store_packs(page: 3, per_page: 2)

      assert length(page1.packs) == 2
      assert length(page2.packs) == 2
      assert length(page3.packs) == 1
      assert page1.total == 5

      ids = Enum.map(page1.packs ++ page2.packs ++ page3.packs, & &1.id)
      assert length(Enum.uniq(ids)) == 5
    end
  end

  describe "get_pack/1" do
    test "returns pack with all stickers" do
      {pack, stickers} = create_pack_with_stickers(%{}, 4)

      assert {:ok, fetched} = Stickers.get_pack(pack.id)
      assert fetched.id == pack.id
      assert length(fetched.stickers) == 4
      fetched_ids = Enum.map(fetched.stickers, & &1.id) |> MapSet.new()
      assert Enum.all?(stickers, &MapSet.member?(fetched_ids, &1.id))
    end

    test "returns :not_found for missing pack" do
      assert {:error, :not_found} = Stickers.get_pack(Ecto.UUID.generate())
    end
  end

  describe "get_sticker/1" do
    test "returns sticker with pack info" do
      sticker = insert(:sticker)

      assert {:ok, fetched} = Stickers.get_sticker(sticker.id)
      assert fetched.id == sticker.id
      assert fetched.sticker_pack.id == sticker.sticker_pack_id
    end

    test "returns :not_found for missing sticker" do
      assert {:error, :not_found} = Stickers.get_sticker(Ecto.UUID.generate())
    end
  end

  describe "search_packs/2" do
    test "searches by pack name" do
      insert(:sticker_pack, name: "happy_cats", title: "Happy Cats")
      insert(:sticker_pack, name: "angry_dogs", title: "Angry Dogs")

      results = Stickers.search_packs("cats")

      assert length(results) == 1
      assert hd(results).name == "happy_cats"
    end

    test "searches by pack title" do
      insert(:sticker_pack, name: "pack_a", title: "Funny Memes Collection")

      results = Stickers.search_packs("Funny Memes")

      assert length(results) == 1
    end

    test "searches by sticker emoji shortcode" do
      {pack, _} = create_pack_with_stickers()
      sticker = insert(:sticker, sticker_pack: pack, emoji_shortcode: ":thumbsup:")

      results = Stickers.search_packs("thumbsup")

      pack_ids = Enum.map(results, & &1.id)
      assert pack.id in pack_ids
    end

    test "returns empty list for no matches" do
      insert(:sticker_pack, name: "test_pack", title: "Test Pack")

      results = Stickers.search_packs("nonexistent_xyz")

      assert results == []
    end

    test "only returns published packs" do
      insert(:sticker_pack, name: "visible_pack", published: true)
      insert(:sticker_pack, name: "hidden_pack", published: false)

      results = Stickers.search_packs("pack")

      names = Enum.map(results, & &1.name)
      assert "visible_pack" in names
      refute "hidden_pack" in names
    end

    test "respects limit option" do
      for i <- 1..5, do: insert(:sticker_pack, name: "cat_pack_#{i}", title: "Cat #{i}")

      results = Stickers.search_packs("cat", limit: 2)

      assert length(results) == 2
    end
  end

  describe "trending_packs/1" do
    test "returns packs ordered by download count" do
      p1 = insert(:sticker_pack, download_count: 100)
      p2 = insert(:sticker_pack, download_count: 500)
      p3 = insert(:sticker_pack, download_count: 200)

      results = Stickers.trending_packs(10)
      ids = Enum.map(results, & &1.id)

      assert ids == [p2.id, p3.id, p1.id]
    end

    test "respects limit" do
      for i <- 1..5, do: insert(:sticker_pack, download_count: i * 10)

      results = Stickers.trending_packs(3)

      assert length(results) == 3
    end

    test "excludes unpublished packs" do
      insert(:sticker_pack, download_count: 1000, published: false)
      insert(:sticker_pack, download_count: 10, published: true)

      results = Stickers.trending_packs(10)

      assert length(results) == 1
      assert hd(results).published == true
    end
  end

  describe "list_categories/0" do
    test "returns all valid categories" do
      categories = Stickers.list_categories()

      assert is_list(categories)
      assert "animals" in categories
      assert "emotions" in categories
      assert "memes" in categories
      assert length(categories) == 10
    end
  end

  # ============================================================================
  # User Collection
  # ============================================================================

  describe "add_pack/2" do
    test "adds free pack to user collection" do
      user = insert(:user)
      pack = insert(:sticker_pack, coin_price: 0)

      assert {:ok, usp} = Stickers.add_pack(user, pack.id)
      assert usp.user_id == user.id
      assert usp.sticker_pack_id == pack.id
      assert usp.sticker_pack.id == pack.id
    end

    test "adds premium pack and deducts coins" do
      user = insert(:user, coins: 500)
      pack = insert(:sticker_pack, is_premium: true, coin_price: 100)

      assert {:ok, usp} = Stickers.add_pack(user, pack.id)
      assert usp.sticker_pack_id == pack.id

      updated_user = CGraph.Repo.get!(CGraph.Accounts.User, user.id)
      assert updated_user.coins == 400
    end

    test "returns :insufficient_nodes when user lacks nodes" do
      user = insert(:user, coins: 10)
      pack = insert(:sticker_pack, is_premium: true, coin_price: 100)

      assert {:error, :insufficient_nodes} = Stickers.add_pack(user, pack.id)

      # Coins unchanged
      updated_user = CGraph.Repo.get!(CGraph.Accounts.User, user.id)
      assert updated_user.coins == 10
    end

    test "returns :already_added if pack already in collection" do
      user = insert(:user)
      pack = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack)

      assert {:error, :already_added} = Stickers.add_pack(user, pack.id)
    end

    test "returns :not_found for nonexistent pack" do
      user = insert(:user)

      assert {:error, :not_found} = Stickers.add_pack(user, Ecto.UUID.generate())
    end

    test "increments download count" do
      user = insert(:user)
      pack = insert(:sticker_pack, download_count: 5)

      assert {:ok, _usp} = Stickers.add_pack(user, pack.id)

      updated_pack = CGraph.Repo.get!(StickerPack, pack.id)
      assert updated_pack.download_count == 6
    end
  end

  describe "remove_pack/2" do
    test "removes pack from user collection" do
      user = insert(:user)
      pack = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack)

      assert {:ok, _deleted} = Stickers.remove_pack(user, pack.id)
      refute Stickers.user_has_pack?(user.id, pack.id)
    end

    test "returns :not_found when pack not in collection" do
      user = insert(:user)
      pack = insert(:sticker_pack)

      assert {:error, :not_found} = Stickers.remove_pack(user, pack.id)
    end
  end

  describe "list_user_packs/1" do
    test "returns packs in user's collection" do
      user = insert(:user)
      pack1 = insert(:sticker_pack)
      pack2 = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack1)
      insert(:user_sticker_pack, user: user, sticker_pack: pack2)

      packs = Stickers.list_user_packs(user.id)

      pack_ids = Enum.map(packs, & &1.id) |> MapSet.new()
      assert MapSet.member?(pack_ids, pack1.id)
      assert MapSet.member?(pack_ids, pack2.id)
    end

    test "returns empty list for user with no packs" do
      user = insert(:user)

      assert Stickers.list_user_packs(user.id) == []
    end

    test "does not return other users' packs" do
      user1 = insert(:user)
      user2 = insert(:user)
      pack = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user1, sticker_pack: pack)

      assert Stickers.list_user_packs(user2.id) == []
    end
  end

  describe "user_has_pack?/2" do
    test "returns true when user has the pack" do
      user = insert(:user)
      pack = insert(:sticker_pack)
      insert(:user_sticker_pack, user: user, sticker_pack: pack)

      assert Stickers.user_has_pack?(user.id, pack.id) == true
    end

    test "returns false when user does not have the pack" do
      user = insert(:user)
      pack = insert(:sticker_pack)

      assert Stickers.user_has_pack?(user.id, pack.id) == false
    end
  end

  # ============================================================================
  # Admin / Seed Helpers
  # ============================================================================

  describe "create_pack/1" do
    test "creates a valid sticker pack" do
      attrs = %{
        name: "cool_cats",
        title: "Cool Cats",
        thumbnail_url: "https://cdn.example.com/cool_cats.webp",
        category: "animals",
        sticker_type: "static"
      }

      assert {:ok, %StickerPack{} = pack} = Stickers.create_pack(attrs)
      assert pack.name == "cool_cats"
      assert pack.title == "Cool Cats"
      assert pack.category == "animals"
      assert pack.published == true
    end

    test "rejects invalid category" do
      attrs = %{
        name: "bad_pack",
        title: "Bad Pack",
        thumbnail_url: "https://cdn.example.com/bad.webp",
        category: "invalid_category"
      }

      assert {:error, changeset} = Stickers.create_pack(attrs)
      assert %{category: _} = errors_on(changeset)
    end

    test "rejects duplicate names" do
      insert(:sticker_pack, name: "unique_pack")

      attrs = %{
        name: "unique_pack",
        title: "Different Title",
        thumbnail_url: "https://cdn.example.com/dupe.webp",
        category: "animals"
      }

      assert {:error, changeset} = Stickers.create_pack(attrs)
      assert %{name: _} = errors_on(changeset)
    end
  end

  describe "add_sticker_to_pack/2" do
    test "adds a sticker to a pack and updates sticker_count" do
      pack = insert(:sticker_pack)

      attrs = %{
        file_url: "https://cdn.example.com/new_sticker.webp",
        emoji_shortcode: ":wave:",
        file_type: "webp"
      }

      assert {:ok, %Sticker{} = sticker} = Stickers.add_sticker_to_pack(pack, attrs)
      assert sticker.sticker_pack_id == pack.id
      assert sticker.emoji_shortcode == ":wave:"

      updated_pack = CGraph.Repo.get!(StickerPack, pack.id)
      assert updated_pack.sticker_count == 1
    end
  end
end
